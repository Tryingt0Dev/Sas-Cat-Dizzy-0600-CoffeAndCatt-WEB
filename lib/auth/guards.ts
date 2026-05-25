import { redirect } from "next/navigation";
import {
  getCurrentUser,
  requireAdminPanelUser,
  requirePlatformAdmin,
  requireSuperAdmin,
  requireUser
} from "@/lib/auth";
import { hasGlobalRole } from "@/lib/auth/permissions";
import { UserRole } from "@/lib/enums";
import { requireStoreAccess, type StorePermission } from "@/services/authorization";

export { getCurrentUser, requireAdminPanelUser, requirePlatformAdmin, requireStoreAccess, requireSuperAdmin, requireUser };

export async function requireAuth(req?: Request) {
  return requireUser(req);
}

export async function requireGlobalRole(roles: string[], req?: Request) {
  const user = await requireUser(req);
  if (!hasGlobalRole(user, roles)) redirect("/dashboard");
  return user;
}

export async function requireDeveloperOrAdmin(req?: Request) {
  return requireGlobalRole([UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.ADMIN_GLOBAL, UserRole.OWNER, UserRole.DEVELOPER], req);
}

export async function requireStoreRole(businessId: string, permission: StorePermission, req?: Request) {
  return requireStoreAccess({ businessId, permission, request: req });
}

export async function assertCanManageStore(businessId: string, req?: Request) {
  return requireStoreAccess({ businessId, permission: "manage_settings", request: req });
}

export async function assertTenantAccess(businessId: string, req?: Request) {
  return requireStoreAccess({ businessId, permission: "view_dashboard", request: req });
}

export async function getSafeStoreForUser(businessId: string, req?: Request) {
  const access = await requireStoreAccess({ businessId, permission: "view_dashboard", request: req });
  return access.business;
}
