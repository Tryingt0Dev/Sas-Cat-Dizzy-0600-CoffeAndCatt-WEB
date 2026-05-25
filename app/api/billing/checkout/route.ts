import { NextResponse } from "next/server";
import { z } from "zod";
import { getBillingProvider, isBillingProviderConfigured } from "@/lib/billing";
import { PLAN_SLUGS } from "@/lib/plans";
import { requestHasAllowedOrigin } from "@/lib/request-security";
import { assertRateLimit, getClientIp, rateLimitKey, RateLimitError } from "@/lib/rate-limit";
import { AuthenticationError, AuthorizationError, getStoreAccess } from "@/services/authorization";
import { writeAuditLog } from "@/services/audit-log";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  businessId: z.string().trim().min(1),
  planType: z.enum(PLAN_SLUGS as unknown as [string, ...string[]])
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

    const payload = checkoutSchema.safeParse(await req.json().catch(() => null));
    if (!payload.success) {
      return NextResponse.json({ ok: false, error: "Solicitud de checkout invalida" }, { status: 400 });
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
        rateLimitKey({ endpoint: "billing:checkout", businessId: access.business.id, userId: access.user.id, ip }),
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
      action: "billing.checkout.requested",
      resourceType: "Billing",
      resourceId: payload.data.planType,
      metadata: { provider: getBillingProvider(), configured: isBillingProviderConfigured() }
    });

    if (!isBillingProviderConfigured()) {
      return NextResponse.json({ ok: false, error: "Billing aun no esta configurado para crear checkouts" }, { status: 501 });
    }

    return NextResponse.json({ ok: false, error: "Proveedor de pagos preparado, integracion de checkout pendiente" }, { status: 501 });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo iniciar checkout" }, { status: 500 });
  }
}
