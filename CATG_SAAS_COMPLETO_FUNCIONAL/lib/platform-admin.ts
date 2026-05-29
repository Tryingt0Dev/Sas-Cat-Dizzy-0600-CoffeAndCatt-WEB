import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { auditBlocked } from "@/services/audit-log";

export const PRIMARY_PLATFORM_OWNER_EMAIL = "felipebustamante003@gmail.com";
export const PLATFORM_ADMIN_ROLES = ["OWNER", "ADMIN", "SUPPORT", "BILLING"] as const;
export type PlatformAdminRole = (typeof PLATFORM_ADMIN_ROLES)[number];

export type PlatformAdminAccess = {
  id: string;
  email: string;
  role: PlatformAdminRole;
  enabled: boolean;
  createdByEmail?: string | null;
  notes?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  source: "primary-owner" | "env" | "database";
};

type PlatformAdminAccessRow = Omit<PlatformAdminAccess, "source">;
let accessTableAvailable: boolean | null = null;

function envOwnerEmails() {
  const configuredEmails = (process.env.PLATFORM_OWNER_EMAILS ?? "")
    .split(",")
    .map(normalizePlatformAdminEmail)
    .filter(Boolean);

  return Array.from(new Set([PRIMARY_PLATFORM_OWNER_EMAIL, ...configuredEmails]));
}

function envAdminEmails() {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map(normalizePlatformAdminEmail)
    .filter(Boolean);
}

function normalizeRole(value: string | null | undefined): PlatformAdminRole {
  const normalized = value?.trim().toUpperCase();
  return PLATFORM_ADMIN_ROLES.includes(normalized as PlatformAdminRole) ? (normalized as PlatformAdminRole) : "ADMIN";
}

function accessFromEmail(email: string, role: PlatformAdminRole, source: PlatformAdminAccess["source"]): PlatformAdminAccess {
  return {
    id: `${source}-${email}`,
    email,
    role,
    enabled: true,
    createdByEmail: source === "database" ? null : "environment",
    notes: source === "primary-owner" ? "Dueño principal de la plataforma CATG Omniventas." : "Acceso configurado por entorno.",
    source
  };
}

export function normalizePlatformAdminEmail(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

export function isPrimaryPlatformOwnerEmail(email: string | null | undefined) {
  return normalizePlatformAdminEmail(email) === PRIMARY_PLATFORM_OWNER_EMAIL;
}

export function isPlatformAdminRole(value: string | null | undefined): value is PlatformAdminRole {
  const normalized = value?.trim().toUpperCase();
  return PLATFORM_ADMIN_ROLES.includes(normalized as PlatformAdminRole);
}

export function canManagePlatformAccess(access: PlatformAdminAccess | null | undefined) {
  return access?.enabled === true && access.role === "OWNER";
}

export function canManagePlatformStores(access: PlatformAdminAccess | null | undefined) {
  return access?.enabled === true && (access.role === "OWNER" || access.role === "ADMIN");
}

export function canManagePlatformBilling(access: PlatformAdminAccess | null | undefined) {
  return access?.enabled === true && (access.role === "OWNER" || access.role === "ADMIN" || access.role === "BILLING");
}

async function findDatabaseAccessByEmail(email: string) {
  if (!(await hasPlatformAccessTable())) return null;

  try {
    const rows = await prisma.$queryRaw<PlatformAdminAccessRow[]>`
      SELECT "id", "email", "role", "enabled", "createdByEmail", "notes", "createdAt", "updatedAt"
      FROM "PlatformAdminAccess"
      WHERE LOWER("email") = ${email}
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) return null;
    return {
      ...row,
      email: normalizePlatformAdminEmail(row.email),
      role: normalizeRole(row.role),
      enabled: Boolean(row.enabled),
      source: "database" as const
    };
  } catch {
    return null;
  }
}

async function hasPlatformAccessTable() {
  if (accessTableAvailable !== null) return accessTableAvailable;

  try {
    const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT (to_regclass('"PlatformAdminAccess"') IS NOT NULL) AS "exists"
    `;
    accessTableAvailable = Boolean(rows[0]?.exists);
    return accessTableAvailable;
  } catch {
    accessTableAvailable = false;
    return false;
  }
}

export async function getPlatformAdminAccessForEmail(emailInput: string | null | undefined) {
  const email = normalizePlatformAdminEmail(emailInput);
  if (!email) return null;

  if (isPrimaryPlatformOwnerEmail(email)) {
    return accessFromEmail(email, "OWNER", "primary-owner");
  }

  if (envOwnerEmails().includes(email)) {
    return accessFromEmail(email, "OWNER", "env");
  }

  const dbAccess = await findDatabaseAccessByEmail(email);
  if (dbAccess?.enabled) return dbAccess;

  if (envAdminEmails().includes(email)) {
    return accessFromEmail(email, "ADMIN", "env");
  }

  return null;
}

export async function isPlatformOwner(email: string | null | undefined) {
  const access = await getPlatformAdminAccessForEmail(email);
  return access?.enabled === true && access.role === "OWNER";
}

export async function isPlatformAdmin(email: string | null | undefined) {
  const access = await getPlatformAdminAccessForEmail(email);
  return access?.enabled === true;
}

export async function getCurrentPlatformAdminAccess(req?: Request) {
  const user = await getCurrentUser(req);
  if (!user) return null;

  const email = normalizePlatformAdminEmail(user.email);
  if (!email) return null;

  const access = await getPlatformAdminAccessForEmail(email);
  if (!access) return null;
  return { user, access };
}

export async function requirePlatformAdmin(req?: Request) {
  const user = await requireUser(req);
  const access = await getPlatformAdminAccessForEmail(user.email);
  if (!access?.enabled) {
    await auditBlocked({
      request: req,
      userId: user.id,
      action: "platform_admin.unauthorized_access",
      entityType: "PlatformAdmin",
      metadata: { email: user.email }
    });
    redirect("/dashboard?error=No tienes permisos para acceder a esta sección.");
  }
  return { user, access };
}

export async function requirePlatformOwner(req?: Request) {
  const current = await requirePlatformAdmin(req);
  if (!canManagePlatformAccess(current.access)) {
    await auditBlocked({
      request: req,
      userId: current.user.id,
      action: "platform_admin.owner_required",
      entityType: "PlatformAdmin",
      metadata: { email: current.user.email, role: current.access.role }
    });
    redirect("/platform-admin?error=Solo el dueño de la plataforma puede acceder a esta sección.");
  }
  return current;
}

export async function listPlatformAdminAccesses() {
  let rows: PlatformAdminAccessRow[] = [];
  if (await hasPlatformAccessTable()) {
    try {
      rows = await prisma.$queryRaw<PlatformAdminAccessRow[]>`
        SELECT "id", "email", "role", "enabled", "createdByEmail", "notes", "createdAt", "updatedAt"
        FROM "PlatformAdminAccess"
        ORDER BY "role" ASC, "email" ASC
      `;
    } catch {
      rows = [];
    }
  }

  const primary = accessFromEmail(PRIMARY_PLATFORM_OWNER_EMAIL, "OWNER", "primary-owner");
  const byEmail = new Map<string, PlatformAdminAccess>();
  byEmail.set(primary.email, primary);

  for (const email of envOwnerEmails()) {
    if (!byEmail.has(email)) byEmail.set(email, accessFromEmail(email, "OWNER", "env"));
  }
  for (const email of envAdminEmails()) {
    if (!byEmail.has(email)) byEmail.set(email, accessFromEmail(email, "ADMIN", "env"));
  }

  for (const row of rows) {
    const email = normalizePlatformAdminEmail(row.email);
    if (isPrimaryPlatformOwnerEmail(email)) continue;
    byEmail.set(email, {
      ...row,
      email,
      role: normalizeRole(row.role),
      enabled: Boolean(row.enabled),
      source: "database"
    });
  }

  return Array.from(byEmail.values()).sort((left, right) => {
    if (left.role === "OWNER" && right.role !== "OWNER") return -1;
    if (right.role === "OWNER" && left.role !== "OWNER") return 1;
    return left.email.localeCompare(right.email);
  });
}
