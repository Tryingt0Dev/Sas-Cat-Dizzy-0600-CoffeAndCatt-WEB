import crypto from "crypto";
import { prisma } from "@/lib/db";

const TOKEN_TTL_MINUTES = Number(process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES || "60");

export class TokenError extends Error {}
export class TokenNotFoundError extends TokenError {}
export class TokenExpiredError extends TokenError {}
export class TokenConsumedError extends TokenError {}

export async function generateEmailVerificationToken(userId: string, requestIp?: string) {
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");

  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  // Optionally mark previous tokens as consumed to avoid multiple active tokens
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash: hash,
      expiresAt,
      requestIp
    }
  });

  return raw;
}

export async function verifyEmailToken(rawToken: string) {
  const hash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const token = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: hash } });
  if (!token) throw new TokenNotFoundError("Token inválido o ya usado");

  if (token.consumedAt) throw new TokenConsumedError("Token ya fue usado");
  if (token.expiresAt < new Date()) throw new TokenExpiredError("Token expirado");

  // Mark consumed and set user's emailVerifiedAt in a transaction
  await prisma.$transaction([
    prisma.emailVerificationToken.update({ where: { id: token.id }, data: { consumedAt: new Date() } }),
    prisma.user.update({ where: { id: token.userId }, data: { emailVerifiedAt: new Date() } })
  ]);

  return { ok: true, userId: token.userId };
}

export default { generateEmailVerificationToken, verifyEmailToken };
