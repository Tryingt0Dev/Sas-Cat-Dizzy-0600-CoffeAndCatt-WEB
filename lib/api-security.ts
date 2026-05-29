import { NextResponse } from "next/server";
import { assertRateLimit, getClientIp, rateLimitKey, RateLimitError } from "@/lib/rate-limit";
import { requestHasAllowedOrigin } from "@/lib/request-security";
import {
  canManagePlatformAccess,
  canManagePlatformBilling,
  canManagePlatformStores,
  getCurrentPlatformAdminAccess
} from "@/lib/platform-admin";
import { auditBlocked } from "@/services/audit-log";

type PlatformApiPermission = "access" | "billing" | "stores";
type CurrentPlatformAdmin = NonNullable<Awaited<ReturnType<typeof getCurrentPlatformAdminAccess>>>;

type PlatformApiAccessOptions = {
  permission: PlatformApiPermission;
  action: string;
  requireAllowedOrigin?: boolean;
  rateLimit?: {
    endpoint: string;
    limit: number;
    windowMs: number;
  };
};

type PlatformApiAccessResult =
  | ({ ok: true } & CurrentPlatformAdmin)
  | { ok: false; response: NextResponse };

function platformPermissionAllows(access: CurrentPlatformAdmin["access"], permission: PlatformApiPermission) {
  if (permission === "access") return canManagePlatformAccess(access);
  if (permission === "billing") return canManagePlatformBilling(access);
  return canManagePlatformStores(access);
}

function forbidden(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function requirePlatformApiAccess(req: Request, options: PlatformApiAccessOptions): Promise<PlatformApiAccessResult> {
  const current = await getCurrentPlatformAdminAccess(req);
  if (!current?.access.enabled) {
    await auditBlocked({
      request: req,
      userId: current?.user.id ?? null,
      action: `${options.action}.unauthorized`,
      entityType: "PlatformAdmin",
      metadata: { reason: current?.user ? "missing_platform_access" : "authentication_required" }
    });
    return {
      ok: false,
      response: forbidden("No tienes permisos para acceder a esta seccion.", current?.user ? 403 : 401)
    };
  }

  if (!platformPermissionAllows(current.access, options.permission)) {
    await auditBlocked({
      request: req,
      userId: current.user.id,
      action: `${options.action}.forbidden`,
      entityType: "PlatformAdmin",
      metadata: { reason: "insufficient_platform_role", role: current.access.role, permission: options.permission }
    });
    return { ok: false, response: forbidden("Tu rol no permite realizar esta operacion.", 403) };
  }

  if (options.requireAllowedOrigin && !requestHasAllowedOrigin(req)) {
    await auditBlocked({
      request: req,
      userId: current.user.id,
      action: `${options.action}.origin_blocked`,
      entityType: "PlatformAdmin",
      metadata: { reason: "origin_not_allowed", role: current.access.role }
    });
    return { ok: false, response: forbidden("Origen no permitido.", 403) };
  }

  if (options.rateLimit) {
    const ip = await getClientIp(req);
    try {
      await assertRateLimit(
        rateLimitKey({ endpoint: options.rateLimit.endpoint, userId: current.user.id, ip }),
        options.rateLimit.limit,
        options.rateLimit.windowMs
      );
    } catch (error) {
      if (error instanceof RateLimitError) {
        await auditBlocked({
          request: req,
          userId: current.user.id,
          action: `${options.action}.rate_limited`,
          entityType: "PlatformAdmin",
          metadata: { reason: "rate_limited", retryAfterSeconds: error.retryAfterSeconds }
        });
        return {
          ok: false,
          response: NextResponse.json(
            { ok: false, error: "Demasiados intentos. Intenta nuevamente mas tarde.", retryAfterSeconds: error.retryAfterSeconds },
            { status: 429 }
          )
        };
      }

      await auditBlocked({
        request: req,
        userId: current.user.id,
        action: `${options.action}.rate_limit_unavailable`,
        entityType: "PlatformAdmin",
        metadata: { reason: "rate_limit_backend_error" }
      });
      return { ok: false, response: forbidden("No se pudo validar el limite de solicitudes.", 503) };
    }
  }

  return { ok: true, ...current };
}

