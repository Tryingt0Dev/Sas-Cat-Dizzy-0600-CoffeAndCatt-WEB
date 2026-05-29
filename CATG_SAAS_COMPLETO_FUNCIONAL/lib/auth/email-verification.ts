import { prisma } from "@/lib/db";
import sendEmail from "@/lib/email";
import { generateEmailVerificationToken, verifyEmailToken as verifyRawToken, TokenExpiredError, TokenConsumedError, TokenNotFoundError } from "@/lib/emailVerification";

const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function createEmailVerificationToken(userId: string, requestIp?: string) {
  // Invalidate previous unconsumed tokens to avoid multiple active tokens
  await invalidatePreviousTokens(userId);
  const token = await generateEmailVerificationToken(userId, requestIp);
  return { token };
}

export async function sendVerificationEmail({ email, name, token }: { email: string; name?: string; token: string }) {
  const verificationUrl = `${APP_URL.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(token)}`;
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
