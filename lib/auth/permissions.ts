import { StoreRole, UserRole } from "@/lib/enums";

export type UserAccessIdentity = {
  id?: string;
  email: string;
  role: string;
};

export const SUPER_ADMIN_ROLES = new Set<string>([UserRole.SUPER_ADMIN]);

export const PLATFORM_ADMIN_ROLES = new Set<string>([
  UserRole.SUPER_ADMIN,
  UserRole.PLATFORM_ADMIN,
  UserRole.ADMIN_GLOBAL,
  UserRole.OWNER
]);

export const ADMIN_PANEL_ROLES = new Set<string>([
  ...Array.from(PLATFORM_ADMIN_ROLES),
  UserRole.DEVELOPER,
  UserRole.SUPPORT
]);

export const GLOBAL_ADMIN_ROLES = PLATFORM_ADMIN_ROLES;

export const USER_GLOBAL_ROLE_OPTIONS = [
  UserRole.USER,
  UserRole.SUPPORT,
  UserRole.DEVELOPER,
  UserRole.PLATFORM_ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN_GLOBAL,
  UserRole.OWNER
] as const;

export const STORE_ROLE_OPTIONS = [
  StoreRole.STORE_OWNER,
  StoreRole.STORE_ADMIN,
  StoreRole.STORE_MANAGER,
  StoreRole.STORE_STAFF,
  StoreRole.VIEWER
] as const;

const globalRoleRank: Record<string, number> = {
  [UserRole.USER]: 1,
  [UserRole.SUPPORT]: 2,
  [UserRole.DEVELOPER]: 3,
  [UserRole.PLATFORM_ADMIN]: 4,
  [UserRole.ADMIN_GLOBAL]: 4,
  [UserRole.OWNER]: 4,
  [UserRole.SUPER_ADMIN]: 5
};

const platformAssignableRoles: string[] = [UserRole.USER, UserRole.SUPPORT, UserRole.DEVELOPER];

const storeRoleRank: Record<string, number> = {
  [StoreRole.VIEWER]: 1,
  [StoreRole.STORE_STAFF]: 2,
  [StoreRole.STAFF]: 2,
  [StoreRole.STORE_MANAGER]: 3,
  [StoreRole.MANAGER]: 3,
  [StoreRole.STORE_ADMIN]: 4,
  [StoreRole.ADMIN]: 4,
  [StoreRole.STORE_OWNER]: 5,
  [StoreRole.OWNER]: 5
};

export function hasGlobalRole(user: UserAccessIdentity | null | undefined, roles: Iterable<string>) {
  if (!user) return false;
  return new Set(roles).has(user.role);
}

export function isSuperAdmin(user: UserAccessIdentity | null | undefined) {
  return hasGlobalRole(user, SUPER_ADMIN_ROLES);
}

export function isPlatformAdmin(user: UserAccessIdentity | null | undefined) {
  return hasGlobalRole(user, PLATFORM_ADMIN_ROLES);
}

export function canAccessAdminPanel(user: UserAccessIdentity | null | undefined) {
  return hasGlobalRole(user, ADMIN_PANEL_ROLES);
}

export function canManagePlatform(user: UserAccessIdentity | null | undefined) {
  return isPlatformAdmin(user);
}

export function canViewTechnicalDiagnostics(user: UserAccessIdentity | null | undefined) {
  return canAccessAdminPanel(user);
}

export function globalRoleLevel(role: string | null | undefined) {
  return role ? globalRoleRank[role] ?? 0 : 0;
}

export function canAssignGlobalRole(actor: UserAccessIdentity, target: UserAccessIdentity, nextRole: string) {
  if (target.id && actor.id === target.id && globalRoleLevel(nextRole) > globalRoleLevel(target.role)) {
    return { allowed: false, reason: "No puedes elevar tus propios permisos" };
  }

  if (nextRole === UserRole.SUPER_ADMIN && !isSuperAdmin(actor)) {
    return { allowed: false, reason: "Solo un SUPER_ADMIN puede asignar otro SUPER_ADMIN" };
  }

  if (isSuperAdmin(actor)) return { allowed: true, reason: null };

  if (actor.role === UserRole.PLATFORM_ADMIN || actor.role === UserRole.ADMIN_GLOBAL || actor.role === UserRole.OWNER) {
    if (platformAssignableRoles.includes(nextRole)) {
      return { allowed: true, reason: null };
    }
    return { allowed: false, reason: "Este rol solo puede ser asignado por un SUPER_ADMIN" };
  }

  return { allowed: false, reason: "No tienes permisos para cambiar roles globales" };
}

export function normalizeStoreRole(role: string | null | undefined): StoreRole {
  if (role === StoreRole.OWNER || role === StoreRole.STORE_OWNER) return StoreRole.STORE_OWNER;
  if (role === StoreRole.ADMIN || role === StoreRole.STORE_ADMIN) return StoreRole.STORE_ADMIN;
  if (role === StoreRole.MANAGER || role === StoreRole.STORE_MANAGER) return StoreRole.STORE_MANAGER;
  if (role === StoreRole.STAFF || role === StoreRole.STORE_STAFF) return StoreRole.STORE_STAFF;
  return StoreRole.VIEWER;
}

export function storeRoleLevel(role: string | null | undefined) {
  return storeRoleRank[normalizeStoreRole(role)] ?? 0;
}

export function storeRoleCan(role: string | null | undefined, minimumRole: string) {
  return storeRoleLevel(role) >= storeRoleLevel(minimumRole);
}
