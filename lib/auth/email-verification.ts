import { prisma } from "@/lib/db";
import sendEmail from "@/lib/email";
import { generateEmailVerificationToken, verifyEmailToken as verifyRawToken, TokenExpiredError, TokenConsumedError, TokenNotFoundError } from "@/lib/emailVerification";
import { getStaticAppUrl } from "@/lib/url-utils";

function resolveAppUrl(explicitUrl?: string | null): string {
  if (explicitUrl) return explicitUrl.replace(/\/$/, "");
  return getStaticAppUrl().replace(/\/$/, "");
}

export async function createEmailVerificationToken(userId: string, requestIp?: string) {
  await invalidatePreviousTokens(userId);
  const token = await generateEmailVerificationToken(userId, requestIp);
  return { token };
}

export async function sendVerificationEmail({ email, name, token, appUrl }: { email: string; name?: string; token: string; appUrl?: string | null }) {
  const base = resolveAppUrl(appUrl);
  const verificationUrl = `${base}/verify-email?token=${encodeURIComponent(token)}`;
  return sendEmail({ to: email, verificationUrl, name });
}

export async function verifyEmailToken(rawToken: string) {
  try {
    const res = await verifyRawToken(rawToken);
    return { ok: true, userId: res.userId };
  } catch (err) {
    if (err instanceof TokenExpiredError) return { ok: false, reason: "expired" };
    if (err instanceof TokenConsumedError) return { ok: false, reason: "consumed" };
    if (err instanceof TokenNotFoundError) return { ok: false, reason: "invalid" };
    return { ok: false, reason: "error" };
  }
}

export async function invalidatePreviousTokens(userId: string) {
  await prisma.emailVerificationToken.updateMany({ where: { userId, consumedAt: null }, data: { consumedAt: new Date() } });
}

export default { createEmailVerificationToken, sendVerificationEmail, verifyEmailToken };
