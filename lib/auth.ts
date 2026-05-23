import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/enums";

const SESSION_COOKIE = "catg_session";
const PLATFORM_OWNER_EMAIL_KEYS = ["PLATFORM_OWNER_EMAILS", "PLATFORM_ADMIN_EMAILS", "OWNER_EMAILS", "ADMIN_EMAIL"] as const;

type UserAccessIdentity = {
  email: string;
  role: string;
};

function configuredPlatformOwnerEmails() {
  return PLATFORM_OWNER_EMAIL_KEYS.flatMap((key) => (process.env[key] ?? "").split(","))
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function hasPlatformAccess(user: UserAccessIdentity | null | undefined) {
  if (!user) return false;
  if (user.role === UserRole.PLATFORM_ADMIN) return true;
  return configuredPlatformOwnerEmails().includes(user.email.toLowerCase());
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);

  await prisma.session.create({
    data: { token, userId, expiresAt }
  });
  const ck = await cookies();
  ck.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  });
}

export async function destroySession() {
  const ck = await cookies();
  const token = ck.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  ck.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const ck = await cookies();
  const token = ck.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePlatformAdmin() {
  const user = await requireUser();
  if (!hasPlatformAccess(user)) redirect("/dashboard");
  return user;
}

export async function getCurrentBusinessContext() {
  const user = await requireUser();
  const business = await prisma.business.findFirst({
    where: { ownerId: user.id, isActive: true },
    orderBy: { createdAt: "asc" }
  });
  if (!business) redirect("/login?error=No tienes una tienda activa o tu tienda está suspendida");
  return { user, business };
}

export async function getCurrentBusiness() {
  const { business } = await getCurrentBusinessContext();
  return business;
}
