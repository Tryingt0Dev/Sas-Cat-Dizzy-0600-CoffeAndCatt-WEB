"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { GLOBAL_ADMIN_ROLES, requirePlatformAdmin } from "@/lib/auth";
import { UserRole } from "@/lib/enums";
import { STORE_ROLE_OPTIONS, USER_GLOBAL_ROLE_OPTIONS, canAssignGlobalRole, isSuperAdmin, normalizeStoreRole } from "@/lib/auth/permissions";
import { PlanAccessError, canInviteMember } from "@/services/plan-guard";
import { writeAuditLog } from "@/services/audit-log";

const businessStatusSchema = z.object({
  id: z.string().trim().min(1),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true")
});

const assignableUserRoleSchema = z.enum(USER_GLOBAL_ROLE_OPTIONS);
const storeRoleSchema = z.enum(STORE_ROLE_OPTIONS);

const userRoleSchema = z.object({
  id: z.string().trim().min(1),
  role: assignableUserRoleSchema
});

const memberSchema = z.object({
  businessId: z.string().trim().min(1),
  userEmail: z.string().trim().toLowerCase().email(),
  role: storeRoleSchema
});

const memberUpdateSchema = z.object({
  membershipId: z.string().trim().min(1),
  role: storeRoleSchema
});

const memberRemoveSchema = z.object({
  membershipId: z.string().trim().min(1)
});

function adminRedirect(path: string, message: string, type: "success" | "error" = "success"): never {
  redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

export async function toggleBusinessActiveAction(formData: FormData) {
  const user = await requirePlatformAdmin();
  const parsed = businessStatusSchema.safeParse({
    id: formData.get("id"),
    isActive: formData.get("isActive")
  });
  if (!parsed.success) adminRedirect("/admin", "Tienda invalida", "error");

  const { id, isActive } = parsed.data;
  const business = await prisma.business.findUnique({
    where: { id },
    select: { id: true, name: true, isActive: true }
  });

  if (!business) adminRedirect("/admin", "Tienda no encontrada", "error");

  await prisma.business.update({
    where: { id },
    data: { isActive }
  });
  await writeAuditLog({
    userId: user.id,
    businessId: id,
    action: isActive ? "business.reactivate" : "business.suspend",
    resourceType: "Business",
    resourceId: id,
    metadata: { name: business.name, from: business.isActive, to: isActive }
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/stores/${id}`);
  adminRedirect("/admin", "Tienda actualizada");
}

export async function updateUserRoleAction(formData: FormData) {
  const actor = await requirePlatformAdmin();
  const parsed = userRoleSchema.safeParse({
    id: formData.get("id"),
    role: formData.get("role")
  });
  if (!parsed.success) adminRedirect("/admin", "Rol invalido", "error");

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, email: true, role: true }
  });
  if (!target) adminRedirect("/admin", "Usuario no encontrado", "error");

  const permission = canAssignGlobalRole(actor, target, parsed.data.role);
  if (!permission.allowed) {
    adminRedirect("/admin", permission.reason ?? "No tienes permisos para cambiar ese rol", "error");
  }

  const remainingSuperAdminCount = await prisma.user.count({
    where: { id: { not: target.id }, role: UserRole.SUPER_ADMIN }
  });
  if (target.role === UserRole.SUPER_ADMIN && parsed.data.role !== UserRole.SUPER_ADMIN && remainingSuperAdminCount === 0) {
    adminRedirect("/admin", "Debe quedar al menos un SUPER_ADMIN", "error");
  }

  const remainingAdminCount = await prisma.user.count({
    where: { id: { not: target.id }, role: { in: Array.from(GLOBAL_ADMIN_ROLES) } }
  });
  if (GLOBAL_ADMIN_ROLES.has(target.role) && !GLOBAL_ADMIN_ROLES.has(parsed.data.role) && remainingAdminCount === 0) {
    adminRedirect("/admin", "Debe quedar al menos un administrador global activo", "error");
  }

  await prisma.user.update({
    where: { id: target.id },
    data: { role: parsed.data.role }
  });
  await writeAuditLog({
    userId: actor.id,
    action: "user.role.update",
    resourceType: "User",
    resourceId: target.id,
    metadata: { email: target.email, from: target.role, to: parsed.data.role }
  });

  revalidatePath("/admin");
  adminRedirect("/admin", "Rol de usuario actualizado");
}

export async function addStoreMemberAction(formData: FormData) {
  const actor = await requirePlatformAdmin();
  const parsed = memberSchema.safeParse({
    businessId: formData.get("businessId"),
    userEmail: formData.get("userEmail"),
    role: formData.get("role")
  });
  if (!parsed.success) adminRedirect("/admin", "Datos de miembro invalidos", "error");

  const business = await prisma.business.findUnique({
    where: { id: parsed.data.businessId },
    select: { id: true, name: true, ownerId: true }
  });
  if (!business) adminRedirect("/admin", "Tienda no encontrada", "error");

  const targetUser = await prisma.user.findUnique({
    where: { email: parsed.data.userEmail },
    select: { id: true, email: true, name: true }
  });
  if (!targetUser) adminRedirect(`/admin/stores/${business.id}`, "El usuario debe existir antes de agregarlo como miembro", "error");
  if (targetUser.id === business.ownerId) adminRedirect(`/admin/stores/${business.id}`, "El dueno ya tiene acceso total a la tienda", "error");

  const existingMembership = await prisma.membership.findUnique({
    where: { userId_businessId: { userId: targetUser.id, businessId: business.id } },
    select: { id: true }
  });

  if (!existingMembership) {
    try {
      await canInviteMember(business.id);
    } catch (error) {
      if (error instanceof PlanAccessError) adminRedirect(`/admin/stores/${business.id}`, error.message, "error");
      throw error;
    }
  }

  const membership = await prisma.membership.upsert({
    where: { userId_businessId: { userId: targetUser.id, businessId: business.id } },
    update: { role: normalizeStoreRole(parsed.data.role) },
    create: { userId: targetUser.id, businessId: business.id, role: normalizeStoreRole(parsed.data.role) }
  });

  await writeAuditLog({
    userId: actor.id,
    businessId: business.id,
    action: "membership.upsert",
    resourceType: "Membership",
    resourceId: membership.id,
    metadata: { userEmail: targetUser.email, role: membership.role }
  });

  revalidatePath(`/admin/stores/${business.id}`);
  adminRedirect(`/admin/stores/${business.id}`, "Miembro actualizado");
}

export async function updateStoreMemberRoleAction(formData: FormData) {
  const actor = await requirePlatformAdmin();
  const parsed = memberUpdateSchema.safeParse({
    membershipId: formData.get("membershipId"),
    role: formData.get("role")
  });
  if (!parsed.success) adminRedirect("/admin", "Rol de tienda invalido", "error");

  const membership = await prisma.membership.findUnique({
    where: { id: parsed.data.membershipId },
    include: {
      user: { select: { id: true, email: true } },
      business: { select: { id: true, name: true, ownerId: true } }
    }
  });
  if (!membership) adminRedirect("/admin", "Miembro no encontrado", "error");
  if (membership.userId === membership.business.ownerId && !isSuperAdmin(actor)) {
    adminRedirect(`/admin/stores/${membership.businessId}`, "Solo SUPER_ADMIN puede modificar el rol del dueno", "error");
  }

  const nextRole = normalizeStoreRole(parsed.data.role);
  await prisma.membership.update({
    where: { id: membership.id },
    data: { role: nextRole }
  });

  await writeAuditLog({
    userId: actor.id,
    businessId: membership.businessId,
    action: "membership.role.update",
    resourceType: "Membership",
    resourceId: membership.id,
    metadata: { userEmail: membership.user.email, from: membership.role, to: nextRole }
  });

  revalidatePath(`/admin/stores/${membership.businessId}`);
  adminRedirect(`/admin/stores/${membership.businessId}`, "Rol de miembro actualizado");
}

export async function removeStoreMemberAction(formData: FormData) {
  const actor = await requirePlatformAdmin();
  const parsed = memberRemoveSchema.safeParse({ membershipId: formData.get("membershipId") });
  if (!parsed.success) adminRedirect("/admin", "Miembro invalido", "error");

  const membership = await prisma.membership.findUnique({
    where: { id: parsed.data.membershipId },
    include: {
      user: { select: { id: true, email: true } },
      business: { select: { id: true, ownerId: true } }
    }
  });
  if (!membership) adminRedirect("/admin", "Miembro no encontrado", "error");
  if (membership.userId === membership.business.ownerId) {
    adminRedirect(`/admin/stores/${membership.businessId}`, "No se puede quitar la membresia del dueno principal", "error");
  }

  await prisma.membership.delete({ where: { id: membership.id } });
  await writeAuditLog({
    userId: actor.id,
    businessId: membership.businessId,
    action: "membership.remove",
    resourceType: "Membership",
    resourceId: membership.id,
    metadata: { userEmail: membership.user.email, role: membership.role }
  });

  revalidatePath(`/admin/stores/${membership.businessId}`);
  adminRedirect(`/admin/stores/${membership.businessId}`, "Miembro removido");
}
