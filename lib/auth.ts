import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { StoreRole, UserRole } from "@/lib/enums";
import {
  ADMIN_PANEL_ROLES,
  GLOBAL_ADMIN_ROLES,
  PLATFORM_ADMIN_ROLES,
  SUPER_ADMIN_ROLES,
  canAccessAdminPanel,
  hasGlobalRole
} from "@/lib/auth/permissions";

const SESSION_COOKIE = "catg_session";
export const SELECTED_BUSINESS_COOKIE = "catg_selected_business";
const PLATFORM_OWNER_EMAIL_KEYS = ["PLATFORM_OWNER_EMAILS", "PLATFORM_ADMIN_EMAILS", "OWNER_EMAILS", "ADMIN_EMAIL"] as const;
const ADMIN_BOOTSTRAP_SECRET_MIN_LENGTH = 32;

type UserAccessIdentity = {
  email: string;
  role: string;
};

export { ADMIN_PANEL_ROLES, GLOBAL_ADMIN_ROLES, PLATFORM_ADMIN_ROLES, SUPER_ADMIN_ROLES };

export class BootstrapSecretError extends Error {
  constructor(message = "Bootstrap de administrador invalido") {
    super(message);
  }
}

function configuredPlatformOwnerEmails() {
  return PLATFORM_OWNER_EMAIL_KEYS.flatMap((key) => (process.env[key] ?? "").split(","))
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function hasPlatformAccess(user: UserAccessIdentity | null | undefined) {
  return hasGlobalRole(user, PLATFORM_ADMIN_ROLES);
}

export function hasAdminPanelAccess(user: UserAccessIdentity | null | undefined) {
  return canAccessAdminPanel(user);
}

export function hasDeveloperPlanAccess(user: UserAccessIdentity | null | undefined) {
  if (!user || process.env.NODE_ENV === "production") return false;
  if (process.env.PLATFORM_OWNER_EMAILS_DEV_UNLOCK !== "true") return false;
  return configuredPlatformOwnerEmails().includes(user.email.toLowerCase());
}

export function hasFullPlanAccess(user: UserAccessIdentity | null | undefined) {
  return hasPlatformAccess(user) || hasDeveloperPlanAccess(user);
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function resolvePublicRegistrationRole(input: { adminBootstrapSecret?: string | null }) {
  const suppliedSecret = input.adminBootstrapSecret?.trim();
  if (!suppliedSecret) return UserRole.USER;

  const configuredSecret = process.env.ADMIN_BOOTSTRAP_SECRET?.trim();
  if (!configuredSecret || configuredSecret.length < ADMIN_BOOTSTRAP_SECRET_MIN_LENGTH) {
    throw new BootstrapSecretError("ADMIN_BOOTSTRAP_SECRET no esta configurado de forma segura");
  }

  if (!safeEqual(suppliedSecret, configuredSecret)) {
    throw new BootstrapSecretError("ADMIN_BOOTSTRAP_SECRET invalido");
  }

  return UserRole.SUPER_ADMIN;
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

function getCookieFromRequest(req: Request, name: string) {
  const cookieHeader = req.headers.get("cookie") ?? "";
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export async function getCurrentUser(req?: Request) {
  const token = req ? getCookieFromRequest(req, SESSION_COOKIE) : (await cookies()).get(SESSION_COOKIE)?.value;
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

export async function requireUser(req?: Request) {
  const user = await getCurrentUser(req);
  if (!user) redirect("/login");
  return user;
}

export async function requirePlatformAdmin(req?: Request) {
  const user = await requireUser(req);
  if (!hasPlatformAccess(user)) redirect("/dashboard");
  return user;
}

export async function requireSuperAdmin(req?: Request) {
  const user = await requireUser(req);
  if (!hasGlobalRole(user, SUPER_ADMIN_ROLES)) redirect("/dashboard");
  return user;
}

export async function requireAdminPanelUser(req?: Request) {
  const user = await requireUser(req);
  if (!hasAdminPanelAccess(user)) redirect("/dashboard");
  return user;
}

export async function requireDeveloperOrAdmin(req?: Request) {
  return requireAdminPanelUser(req);
}

export async function getCurrentBusinessContext() {
  const user = await requireUser();
  const ck = await cookies();
  const selectedBusinessId = ck.get(SELECTED_BUSINESS_COOKIE)?.value;
  const tenantWhere = hasPlatformAccess(user)
    ? {}
    : {
        OR: [
          { ownerId: user.id },
          { memberships: { some: { userId: user.id } } }
        ]
      };
  const where = {
    isActive: true,
    ...(selectedBusinessId ? { id: selectedBusinessId } : {}),
    ...tenantWhere
  };
  let business = await prisma.business.findFirst({
    where,
    include: { memberships: { where: { userId: user.id }, take: 1 } }
  });

  if (!business && !selectedBusinessId) {
    const businesses = await prisma.business.findMany({
      where: { isActive: true, ...tenantWhere },
      include: { memberships: { where: { userId: user.id }, take: 1 } },
      orderBy: { createdAt: "asc" },
      take: 2
    });
    if (businesses.length === 1) business = businesses[0];
    if (businesses.length > 1) redirect("/select-store");
  }

  if (!business) redirect("/login?error=No tienes una tienda activa o tu tienda está suspendida");
  const storeRole = hasPlatformAccess(user)
    ? StoreRole.STORE_OWNER
    : business.ownerId === user.id
      ? StoreRole.STORE_OWNER
      : ((business.memberships[0]?.role as StoreRole | undefined) ?? StoreRole.VIEWER);
  return { user, business, storeRole };
}

export async function getCurrentBusiness() {
  const { business } = await getCurrentBusinessContext();
  return business;
}
