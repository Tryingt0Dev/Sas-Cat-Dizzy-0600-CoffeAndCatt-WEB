import { NextResponse } from "next/server";
import { z } from "zod";
import { getBillingProvider, isBillingProviderConfigured } from "@/lib/billing";
import { requestHasAllowedOrigin } from "@/lib/request-security";
import { assertRateLimit, getClientIp, rateLimitKey, RateLimitError } from "@/lib/rate-limit";
import { AuthenticationError, AuthorizationError, getStoreAccess } from "@/services/authorization";
import { writeAuditLog } from "@/services/audit-log";

export const runtime = "nodejs";

const portalSchema = z.object({
  businessId: z.string().trim().min(1)
});

function accessErrorResponse(error: unknown) {
  if (error instanceof AuthenticationError) {
    return NextResponse.json({ ok: false, error: "Debes iniciar sesion para gestionar billing" }, { status: 401 });
  }
  if (error instanceof AuthorizationError) {
    return NextResponse.json({ ok: false, error: "No tienes permisos para gestionar billing de esta tienda" }, { status: 403 });
  }
  throw error;
}

export async function POST(req: Request) {
  try {
    if (!requestHasAllowedOrigin(req)) {
      return NextResponse.json({ ok: false, error: "Origen no permitido" }, { status: 403 });
    }

    const payload = portalSchema.safeParse(await req.json().catch(() => null));
    if (!payload.success) {
      return NextResponse.json({ ok: false, error: "Solicitud de portal invalida" }, { status: 400 });
    }

    let access: Awaited<ReturnType<typeof getStoreAccess>>;
    try {
      access = await getStoreAccess({ request: req, businessId: payload.data.businessId, permission: "manage_settings" });
    } catch (error) {
      return accessErrorResponse(error);
    }

    const ip = await getClientIp(req);
    try {
      await assertRateLimit(
        rateLimitKey({ endpoint: "billing:portal", businessId: access.business.id, userId: access.user.id, ip }),
        20,
        15 * 60 * 1000
      );
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json({ ok: false, error: error.message, retryAfterSeconds: error.retryAfterSeconds }, { status: 429 });
      }
      throw error;
    }

    await writeAuditLog({
      userId: access.user.id,
      businessId: access.business.id,
      action: "billing.portal.requested",
      resourceType: "Billing",
      resourceId: access.business.id,
      metadata: { provider: getBillingProvider(), configured: isBillingProviderConfigured() }
    });

    if (!isBillingProviderConfigured()) {
      return NextResponse.json({ ok: false, error: "Billing aun no esta configurado para abrir portal" }, { status: 501 });
    }

    return NextResponse.json({ ok: false, error: "Proveedor de pagos preparado, integracion de portal pendiente" }, { status: 501 });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo abrir portal de billing" }, { status: 500 });
  }
}
