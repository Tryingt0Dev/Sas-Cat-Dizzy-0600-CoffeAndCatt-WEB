import crypto from "crypto";
import { prisma } from "@/lib/db";

const EMAIL_VERIFICATION_TOKEN_BYTES = 32;
const EMAIL_VERIFICATION_EXPIRES_HOURS = 24;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createEmailVerificationToken(userId: string) {
  const token = crypto.randomBytes(EMAIL_VERIFICATION_TOKEN_BYTES).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRES_HOURS * 60 * 60 * 1000);

  await prisma.emailVerificationToken.deleteMany({
    where: { userId, usedAt: null }
  });

  await prisma.emailVerificationToken.create({
    data: { userId, tokenHash, expiresAt }
  });

  return { token, expiresAt };
}

export async function verifyEmailToken(token: string) {
  const tokenHash = hashToken(token);
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: true }
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { ok: false as const, userId: null };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() }
    }),
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() }
    })
  ]);

  return { ok: true as const, userId: record.userId };
}

export async function sendVerificationEmail(input: { email: string; name: string; token: string }) {
  if (process.env.EMAIL_PROVIDER_ENABLED !== "true") {
    if (process.env.NODE_ENV === "development") {
      console.info("Email verification pending provider", {
        email: input.email,
        name: input.name,
        verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/verify-email?token=${input.token}`
      });
    }
    return { sent: false, reason: "email_provider_not_configured" as const };
  }

  return { sent: false, reason: "email_provider_stub" as const };
}
