import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, hasPlatformAccess, SELECTED_BUSINESS_COOKIE } from "@/lib/auth";
import { StoreRole } from "@/lib/enums";
import { businessRoleHasPermission, normalizeStoreRole, type BusinessPermission } from "@/lib/auth/permissions";
import { effectivePlanLimits } from "@/services/plan-guard";

export class AuthenticationError extends Error {
  constructor(message = "No autenticado") {
    super(message);
  }
}

export class AuthorizationError extends Error {
  constructor(message = "No autorizado") {
    super(message);
  }
}

export class StoreSelectionRequiredError extends Error {
  constructor(message = "Selecciona una tienda para continuar") {
    super(message);
  }
}

export type StorePermission = BusinessPermission;

type StoreAccessOptions = {
  businessId?: string;
  businessSlug?: string;
  permission?: StorePermission;
  activeOnly?: boolean;
  request?: Request;
  requireExplicitBusiness?: boolean;
  skipEmailVerification?: boolean;
};

function roleCan(role: StoreRole, permission: StorePermission) {
  return businessRoleHasPermission(role, permission);
}

function getCookieFromRequest(req: Request, name: string) {
  const cookieHeader = req.headers.get("cookie") ?? "";
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

async function selectedBusinessIdFromCookie(req?: Request) {
  if (req) return getCookieFromRequest(req, SELECTED_BUSINESS_COOKIE);
  return (await cookies()).get(SELECTED_BUSINESS_COOKIE)?.value;
}

function accessWhere(userId: string, isPlatformAdmin: boolean) {
  return isPlatformAdmin
    ? {}
    : {
        OR: [
          { ownerId: userId },
          { memberships: { some: { userId } } }
        ]
      };
}

async function businessIdFromSlug(businessSlug: string, activeOnly: boolean) {
  const business = await prisma.business.findFirst({
    where: {
      OR: [{ slug: businessSlug }, { publicSlug: businessSlug }],
      ...(activeOnly ? { isActive: true } : {})
    },
    select: { id: true }
  });
  return business?.id ?? null;
}

export async function requireAuth(req?: Request) {
  const user = await getCurrentUser(req);
  if (!user) throw new AuthenticationError();
  return user;
}

export async function getCurrentUserAccess(req?: Request) {
  const user = await requireAuth(req);
  const isPlatformAdmin = hasPlatformAccess(user);
  return {
    user,
    isPlatformAdmin,
    isPlatformOwner: isPlatformAdmin
  };
}

export async function requirePlatformAdminAccess(req?: Request) {
  const access = await getCurrentUserAccess(req);
  if (!access.isPlatformAdmin) redirect("/dashboard");
  return access;
}

export async function getAccessibleBusinesses(options?: { request?: Request; activeOnly?: boolean }) {
  const { user, isPlatformAdmin } = await getCurrentUserAccess(options?.request);
  const activeOnly = options?.activeOnly ?? true;
  return prisma.business.findMany({
    where: {
      ...(activeOnly ? { isActive: true } : {}),
      ...accessWhere(user.id, isPlatformAdmin)
    },
    include: {
      owner: true,
      plan: true,
      memberships: { where: { userId: user.id }, take: 1 }
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "asc" }]
  });
}

export async function getStoreAccess(options?: StoreAccessOptions) {
  const { user, isPlatformAdmin } = await getCurrentUserAccess(options?.request);

  // Require email verification for normal UI routes, but allow API access and platform admins.
  if (!options?.skipEmailVerification && !isPlatformAdmin && !user.emailVerifiedAt) {
    if (!options?.request) {
      redirect("/verify-email-prompt");
    }
  }

  const activeOnly = options?.activeOnly ?? true;
  const explicitBusinessId = options?.businessId?.trim() || null;
  const explicitBusinessSlug = options?.businessSlug?.trim() || null;
  const requireExplicitBusiness = options?.requireExplicitBusiness === true;
  const cookieBusinessId = requireExplicitBusiness ? null : await selectedBusinessIdFromCookie(options?.request);
  const explicitSlugBusinessId = explicitBusinessSlug ? await businessIdFromSlug(explicitBusinessSlug, activeOnly) : null;
  if (explicitBusinessSlug && !explicitSlugBusinessId) {
    throw new AuthorizationError("Tienda no encontrada");
  }
  const businessId = explicitBusinessId
    ?? explicitSlugBusinessId
    ?? cookieBusinessId
    ?? null;

  if (!businessId && requireExplicitBusiness) {
    throw new AuthorizationError("Tienda obligatoria");
  }

  let business = businessId
    ? await prisma.business.findFirst({
        where: {
          id: businessId,
          ...(activeOnly ? { isActive: true } : {}),
          ...accessWhere(user.id, isPlatformAdmin)
        },
        include: {
          owner: true,
          plan: true,
          memberships: { where: { userId: user.id }, take: 1 }
        }
      })
    : null;

  if (!business && (explicitBusinessId || explicitBusinessSlug)) {
    throw new AuthorizationError("No tienes acceso a esta tienda o esta suspendida");
  }

  if (!business) {
    const businesses = await getAccessibleBusinesses({ request: options?.request, activeOnly });
    if (businesses.length === 0) throw new AuthorizationError("No tienes una tienda activa o tu tienda esta suspendida");
    if (businesses.length > 1) throw new StoreSelectionRequiredError();
    business = businesses[0];
  }

  const storeRole = isPlatformAdmin
      ? StoreRole.STORE_OWNER
      : business.ownerId === user.id
        ? StoreRole.STORE_OWNER
        : normalizeStoreRole(business.memberships[0]?.role);

  if (options?.permission && !isPlatformAdmin && !roleCan(storeRole, options.permission)) {
    throw new AuthorizationError("No tienes permisos para esta operacion");
  }

  return {
    user,
    business,
    storeRole,
    isPlatformAdmin,
    plan: effectivePlanLimits(business.plan, user)
  };
}

export async function requireStoreAccess(options?: StoreAccessOptions) {
  try {
    return await getStoreAccess(options);
  } catch (error) {
    if (error instanceof AuthenticationError) redirect("/login");
    if (error instanceof StoreSelectionRequiredError) redirect("/select-store");
    if (error instanceof AuthorizationError) redirect(`/dashboard?error=${error.message}`);
    throw error;
  }
}

export async function requireBusinessAccess(businessId: string, request?: Request) {
  return getStoreAccess({
    request,
    businessId,
    permission: "view_dashboard",
    requireExplicitBusiness: true
  });
}

export async function requireBusinessPermission(businessId: string, permission: StorePermission, request?: Request) {
  return getStoreAccess({
    request,
    businessId,
    permission,
    requireExplicitBusiness: true
  });
}

export async function requireBusinessRole(businessId: string, roles: string[], request?: Request) {
  const access = await getStoreAccess({
    request,
    businessId,
    permission: "view_dashboard",
    requireExplicitBusiness: true
  });

  if (access.isPlatformAdmin) return access;

  const allowedRoles = new Set(roles.map((role) => normalizeStoreRole(role)));
  const allowed = allowedRoles.has(access.storeRole);
  if (!allowed) {
    throw new AuthorizationError("No tienes permisos para esta operacion");
  }

  return access;
}

export function assertCanManageProducts(access: Awaited<ReturnType<typeof requireStoreAccess>>) {
  if (!access.isPlatformAdmin && !roleCan(access.storeRole, "manage_products")) {
    throw new AuthorizationError("No tienes permisos para administrar productos");
  }
}

export function assertCanManageUploads(access: Awaited<ReturnType<typeof requireStoreAccess>>) {
  if (!access.isPlatformAdmin && !roleCan(access.storeRole, "manage_uploads")) {
    throw new AuthorizationError("No tienes permisos para administrar imagenes");
  }
}

export function assertCanManageUsers(access: Awaited<ReturnType<typeof requireStoreAccess>>) {
  if (!access.isPlatformAdmin && !roleCan(access.storeRole, "manage_users")) {
    throw new AuthorizationError("No tienes permisos para administrar usuarios de la tienda");
  }
}

export function assertCanManageOrders(access: Awaited<ReturnType<typeof requireStoreAccess>>) {
  if (!access.isPlatformAdmin && !roleCan(access.storeRole, "manage_quotes_orders")) {
    throw new AuthorizationError("No tienes permisos para administrar cotizaciones y pedidos");
  }
}

export function assertCanManageSettings(access: Awaited<ReturnType<typeof requireStoreAccess>>) {
  if (!access.isPlatformAdmin && !roleCan(access.storeRole, "manage_settings")) {
    throw new AuthorizationError("No tienes permisos para actualizar ajustes");
  }
}

export function assertCanUseAI(access: Awaited<ReturnType<typeof requireStoreAccess>>) {
  if (!access.isPlatformAdmin && !roleCan(access.storeRole, "use_ai")) {
    throw new AuthorizationError("No tienes permisos para usar IA");
  }
}
