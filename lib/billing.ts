import crypto from "crypto";

export type BillingProvider = "stripe" | "mercadopago" | "manual" | "disabled";

export function getBillingProvider(): BillingProvider {
  const provider = (process.env.BILLING_PROVIDER ?? "disabled").trim().toLowerCase();
  if (provider === "stripe" || provider === "mercadopago" || provider === "manual") return provider;
  return "disabled";
}

export function isBillingProviderConfigured() {
  const provider = getBillingProvider();
  if (provider === "stripe") {
    return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
  }
  if (provider === "mercadopago") {
    return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
  }
  return provider === "manual";
}

function safeCompareHex(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyStripeWebhookSignature(payload: string, signatureHeader: string | null, secret: string | undefined) {
  if (!signatureHeader || !secret) return false;

  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) return false;

  const timestampMs = Number(timestamp) * 1000;
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  return signatures.some((signature) => safeCompareHex(signature, expected));
}
