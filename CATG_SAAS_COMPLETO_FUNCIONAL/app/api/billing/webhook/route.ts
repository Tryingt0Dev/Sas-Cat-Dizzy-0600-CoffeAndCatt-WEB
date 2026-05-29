import { NextResponse } from "next/server";
import { getBillingProvider, verifyStripeWebhookSignature } from "@/lib/billing";
import { assertRateLimit, getClientIp, rateLimitKey, RateLimitError } from "@/lib/rate-limit";
import { writeAuditLog } from "@/services/audit-log";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const ip = await getClientIp(req);
    try {
      await assertRateLimit(rateLimitKey({ endpoint: "billing:webhook", ip }), 120, 15 * 60 * 1000);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json({ ok: false, error: error.message, retryAfterSeconds: error.retryAfterSeconds }, { status: 429 });
      }
      throw error;
    }

    const provider = getBillingProvider();
    const rawBody = await req.text();

    if (provider !== "stripe") {
      await writeAuditLog({
        action: "billing.webhook.rejected",
        resourceType: "BillingWebhook",
        metadata: { reason: "provider_not_configured", provider }
      });
      return NextResponse.json({ ok: false, error: "Proveedor de billing no configurado" }, { status: 503 });
    }

    const isValidStripeSignature = verifyStripeWebhookSignature(
      rawBody,
      req.headers.get("stripe-signature"),
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (!isValidStripeSignature) {
      await writeAuditLog({
        action: "billing.webhook.rejected",
        resourceType: "BillingWebhook",
        metadata: { reason: "invalid_signature", provider }
      });
      return NextResponse.json({ ok: false, error: "Firma de webhook invalida" }, { status: 400 });
    }

    await writeAuditLog({
      action: "billing.webhook.received",
      resourceType: "BillingWebhook",
      metadata: { provider, bytes: rawBody.length }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo procesar webhook de billing" }, { status: 500 });
  }
}
