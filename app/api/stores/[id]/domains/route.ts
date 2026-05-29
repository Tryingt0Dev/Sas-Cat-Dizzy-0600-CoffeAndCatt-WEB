import crypto from "crypto";
import dns from "node:dns";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertRateLimit, getClientIp, rateLimitKey, RateLimitError } from "@/lib/rate-limit";
import { requestHasAllowedOrigin } from "@/lib/request-security";
import { auditBlocked, auditSuccess } from "@/services/audit-log";
import { AuthenticationError, AuthorizationError, getStoreAccess } from "@/services/authorization";
import { PlanAccessError, requireFeature } from "@/services/plan-guard";

export const runtime = "nodejs";

const dnsResolveTxt = dns.promises.resolveTxt;
const DOMAIN_RATE_LIMIT = 20;
const DOMAIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

type RouteContext = {
  params?: Promise<{ id: string }> | { id: string };
};

function jsonError(error: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error, ...(extra ?? {}) }, { status });
}

async function businessIdFromRequest(req: Request, context?: RouteContext) {
  const params = await context?.params;
  if (params?.id) return params.id;

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  return parts[2] ?? "";
}

function normalizeCustomDomain(value: unknown) {
  const domain = String(value ?? "").trim().toLowerCase().replace(/\.$/, "");
  if (!domain) return null;
  if (domain.length > 253) return null;
  if (domain.includes("://") || domain.includes("/") || domain.includes("\\") || domain.includes(":")) return null;
  if (domain === "localhost" || /^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) return null;
  if (!/^[a-z0-9.-]+$/.test(domain)) return null;

  const labels = domain.split(".");
  if (labels.length < 2) return null;
  if (labels.some((label) => label.length < 1 || label.length > 63)) return null;
  if (labels.some((label) => label.startsWith("-") || label.endsWith("-"))) return null;

  return domain;
}

async function authorizeDomainRequest(req: Request, businessId: string) {
  if (!businessId) {
    await auditBlocked({ request: req, action: "custom_domain.blocked", entityType: "Business", metadata: { reason: "missing_business_id" } });
    return { ok: false as const, response: jsonError("Tienda obligatoria", 400) };
  }

  if (!requestHasAllowedOrigin(req)) {
    await auditBlocked({ request: req, businessId, action: "custom_domain.origin_blocked", entityType: "Business", entityId: businessId });
    return { ok: false as const, response: jsonError("Origen no permitido", 403) };
  }

  let access: Awaited<ReturnType<typeof getStoreAccess>>;
  try {
    access = await getStoreAccess({
      request: req,
      businessId,
      permission: "manage_settings",
      requireExplicitBusiness: true
    });
  } catch (error) {
    await auditBlocked({
      request: req,
      businessId,
      action: "custom_domain.authorization_blocked",
      entityType: "Business",
      entityId: businessId,
      metadata: { reason: error instanceof AuthenticationError ? "authentication_required" : "authorization_failed" }
    });
    if (error instanceof AuthenticationError) return { ok: false as const, response: jsonError("No autenticado", 401) };
    if (error instanceof AuthorizationError) return { ok: false as const, response: jsonError("No autorizado", 403) };
    throw error;
  }

  const ip = await getClientIp(req);
  try {
    await assertRateLimit(
      rateLimitKey({ endpoint: "store:custom_domain", businessId: access.business.id, userId: access.user.id, ip }),
      DOMAIN_RATE_LIMIT,
      DOMAIN_RATE_LIMIT_WINDOW_MS
    );
  } catch (error) {
    if (error instanceof RateLimitError) {
      await auditBlocked({
        request: req,
        userId: access.user.id,
        businessId: access.business.id,
        action: "custom_domain.rate_limited",
        entityType: "Business",
        entityId: access.business.id,
        metadata: { retryAfterSeconds: error.retryAfterSeconds }
      });
      return {
        ok: false as const,
        response: jsonError("Demasiados intentos. Intenta nuevamente mas tarde.", 429, { retryAfterSeconds: error.retryAfterSeconds })
      };
    }
    throw error;
  }

  try {
    await requireFeature(access.business.id, "customDomain");
  } catch (error) {
    if (error instanceof PlanAccessError) {
      await auditBlocked({
        request: req,
        userId: access.user.id,
        businessId: access.business.id,
        action: "custom_domain.plan_blocked",
        entityType: "Business",
        entityId: access.business.id,
        metadata: { reason: "plan_feature_unavailable" }
      });
      return { ok: false as const, response: jsonError(error.message, 402) };
    }
    throw error;
  }

  return { ok: true as const, access };
}

function verificationKey(businessId: string) {
  return `domain-verify-${businessId}`;
}

export async function POST(req: Request, context?: RouteContext) {
  const businessId = await businessIdFromRequest(req, context);
  const authorized = await authorizeDomainRequest(req, businessId);
  if (!authorized.ok) return authorized.response;

  const body = (await req.json().catch(() => null)) as { action?: unknown; domain?: unknown } | null;
  if (!body || typeof body !== "object") return jsonError("Solicitud invalida", 400);

  const action = String(body.action || "start");
  const domain = normalizeCustomDomain(body.domain);
  if (!domain) return jsonError("Dominio invalido", 400);

  if (action === "start") {
    const existing = await prisma.business.findFirst({
      where: { customDomain: domain, NOT: { id: authorized.access.business.id } },
      select: { id: true }
    });
    if (existing) return jsonError("Este dominio ya esta asociado a otra tienda", 409);

    const token = `catg-domain-verify-${crypto.randomBytes(24).toString("hex")}`;
    await prisma.$transaction([
      prisma.business.update({
        where: { id: authorized.access.business.id },
        data: { customDomain: domain, customDomainVerified: false }
      }),
      prisma.platformSetting.upsert({
        where: { key: verificationKey(authorized.access.business.id) },
        update: { value: token },
        create: { key: verificationKey(authorized.access.business.id), value: token }
      })
    ]);

    await auditSuccess({
      request: req,
      userId: authorized.access.user.id,
      businessId: authorized.access.business.id,
      action: "custom_domain.verification_started",
      entityType: "Business",
      entityId: authorized.access.business.id,
      metadata: { domain }
    });

    return NextResponse.json({
      ok: true,
      message: "created",
      token,
      instruction: `Create a TXT record for _catg-verify.${domain} with value ${token}`
    });
  }

  if (action === "verify") {
    const currentBusiness = await prisma.business.findUnique({
      where: { id: authorized.access.business.id },
      select: { customDomain: true }
    });
    if (currentBusiness?.customDomain !== domain) {
      return jsonError("El dominio no coincide con la tienda", 400);
    }

    const setting = await prisma.platformSetting.findUnique({ where: { key: verificationKey(authorized.access.business.id) } });
    if (!setting) return jsonError("No existe token de verificacion", 400);

    try {
      const txts = await dnsResolveTxt(`_catg-verify.${domain}`);
      const flat = txts.flat().map(String);
      if (!flat.includes(setting.value)) {
        return NextResponse.json({ ok: true, verified: false, found: flat });
      }

      await prisma.business.update({
        where: { id: authorized.access.business.id },
        data: { customDomainVerified: true }
      });
      await auditSuccess({
        request: req,
        userId: authorized.access.user.id,
        businessId: authorized.access.business.id,
        action: "custom_domain.verified",
        entityType: "Business",
        entityId: authorized.access.business.id,
        metadata: { domain }
      });
      return NextResponse.json({ ok: true, verified: true });
    } catch (error) {
      const details = process.env.NODE_ENV === "development" ? { details: String(error) } : undefined;
      return jsonError("No se pudo consultar DNS para verificar el dominio", 502, details);
    }
  }

  return jsonError("Accion invalida", 400);
}
