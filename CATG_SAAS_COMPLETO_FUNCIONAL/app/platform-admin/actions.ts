"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  PLATFORM_ADMIN_ROLES,
  PRIMARY_PLATFORM_OWNER_EMAIL,
  canManagePlatformBilling,
  canManagePlatformStores,
  getPlatformAdminAccessForEmail,
  isPrimaryPlatformOwnerEmail,
  listPlatformAdminAccesses,
  normalizePlatformAdminEmail,
  requirePlatformAdmin,
  type PlatformAdminAccess,
  type PlatformAdminRole
} from "@/lib/platform-admin";
import { PLAN_SLUGS, SUBSCRIPTION_STATUSES, getPlanByType, normalizePlanSlug, normalizeSubscriptionStatus } from "@/lib/plans";
import { writeAuditLog } from "@/services/audit-log";

const accessNotesSchema = z.preprocess(
  (value) => (value == null ? "" : value),
  z.string().trim().max(500).transform((value) => value || null)
);

const accessSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(PLATFORM_ADMIN_ROLES),
  notes: accessNotesSchema.optional()
});

const accessUpdateSchema = accessSchema.extend({
  enabled: z.boolean()
});

const accessDeleteSchema = z.object({
  email: z.string().trim().toLowerCase().email()
});

const userSearchSchema = z.string().trim().max(80);

const existingUserGrantSchema = z.object({
  userId: z.string().trim().min(1).max(120),
  role: z.enum(PLATFORM_ADMIN_ROLES)
});

const businessStatusSchema = z.object({
  businessId: z.string().trim().min(1),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true"),
  reason: z.string().trim().max(300).optional().transform((value) => value || null)
});

const subscriptionSchema = z.object({
  businessId: z.string().trim().min(1),
  plan: z.enum(PLAN_SLUGS as unknown as [string, ...string[]]),
  status: z.enum(SUBSCRIPTION_STATUSES as unknown as [string, ...string[]]),
  currentPeriodEnd: z.string().trim().optional().transform((value) => value || null),
  reason: z.string().trim().max(300).optional().transform((value) => value || null)
});

const planLimitSchema = z.object({
  planId: z.string().trim().min(1),
  maxProducts: z.coerce.number().int().min(-1),
  maxImages: z.coerce.number().int().min(-1),
  maxCategories: z.coerce.number().int().min(-1),
  maxAiConversationsMonthly: z.coerce.number().int().min(-1),
  maxMembers: z.coerce.number().int().min(-1),
  maxStores: z.coerce.number().int().min(-1),
  supportLevel: z.string().trim().max(80).optional().transform((value) => value || "standard"),
  reason: z.string().trim().max(300).optional().transform((value) => value || null)
});

function adminRedirect(message: string, type: "success" | "error" = "success"): never {
  redirect(`/platform-admin?${type}=${encodeURIComponent(message)}`);
}

function dateFromInput(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T23:59:59.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function assertAccessTableAvailable() {
  try {
    await prisma.$queryRaw`SELECT 1 FROM "PlatformAdminAccess" LIMIT 1`;
  } catch {
    adminRedirect("Ejecuta las migraciones para habilitar la gestión de accesos globales.", "error");
  }
}

type StoredPlatformAdminAccess = Omit<PlatformAdminAccess, "source">;

export type PlatformAccessUserResult = {
  id: string;
  name: string;
  email: string;
  stores: Array<{ name: string; slug: string; role: string }>;
  access: { role: PlatformAdminRole; enabled: boolean; source: PlatformAdminAccess["source"] } | null;
};

function normalizeStoredRole(value: string | null | undefined): PlatformAdminRole {
  const normalized = value?.trim().toUpperCase();
  return PLATFORM_ADMIN_ROLES.includes(normalized as PlatformAdminRole) ? (normalized as PlatformAdminRole) : "ADMIN";
}

function storedAccessToPlatformAccess(row: StoredPlatformAdminAccess): PlatformAdminAccess {
  return {
    ...row,
    email: normalizePlatformAdminEmail(row.email),
    role: normalizeStoredRole(row.role),
    enabled: Boolean(row.enabled),
    source: "database"
  };
}

async function findStoredPlatformAccess(emailInput: string) {
  const email = normalizePlatformAdminEmail(emailInput);
  if (!email) return null;

  try {
    const rows = await prisma.$queryRaw<StoredPlatformAdminAccess[]>`
      SELECT "id", "email", "role", "enabled", "createdByEmail", "notes", "createdAt", "updatedAt"
      FROM "PlatformAdminAccess"
      WHERE LOWER("email") = ${email}
      LIMIT 1
    `;
    return rows[0] ? storedAccessToPlatformAccess(rows[0]) : null;
  } catch {
    return null;
  }
}

function actorCanGrantRole(actor: PlatformAdminAccess, role: PlatformAdminRole) {
  if (!actor.enabled) return false;
  if (actor.role === "OWNER") return true;
  return actor.role === "ADMIN" && role !== "OWNER";
}

function actorCanEditTarget(actor: PlatformAdminAccess, target: PlatformAdminAccess, nextRole: PlatformAdminRole) {
  if (!actor.enabled) return false;
  if (actor.role === "OWNER") return true;
  return actor.role === "ADMIN" && target.role !== "OWNER" && nextRole !== "OWNER";
}

function assertCanGrantRole(actor: PlatformAdminAccess, role: PlatformAdminRole) {
  if (actorCanGrantRole(actor, role)) return;
  adminRedirect("Tu rol no permite crear este tipo de acceso global.", "error");
}

function assertCanEditAccess(actor: PlatformAdminAccess, target: PlatformAdminAccess, nextRole: PlatformAdminRole) {
  if (isPrimaryPlatformOwnerEmail(target.email)) {
    adminRedirect(`No se puede modificar al dueño principal ${PRIMARY_PLATFORM_OWNER_EMAIL}.`, "error");
  }
  if (target.source !== "database") {
    adminRedirect("Este acceso viene de configuración de entorno y no se edita desde el panel.", "error");
  }
  if (!actorCanEditTarget(actor, target, nextRole)) {
    adminRedirect("Tu rol no permite modificar este acceso global.", "error");
  }
}

async function hasAnotherEnabledOwner(emailInput: string) {
  const email = normalizePlatformAdminEmail(emailInput);
  const accesses = await listPlatformAdminAccesses();
  return accesses.some((item) => item.enabled && item.role === "OWNER" && normalizePlatformAdminEmail(item.email) !== email);
}

async function assertSelfOwnerChangeKeepsOwner(actorEmail: string, target: PlatformAdminAccess, nextRole: PlatformAdminRole, nextEnabled: boolean) {
  const actorNormalizedEmail = normalizePlatformAdminEmail(actorEmail);
  const targetEmail = normalizePlatformAdminEmail(target.email);
  const removesOwnerFromSelf = actorNormalizedEmail === targetEmail && target.role === "OWNER" && (!nextEnabled || nextRole !== "OWNER");
  if (removesOwnerFromSelf && !(await hasAnotherEnabledOwner(targetEmail))) {
    adminRedirect("No puedes dejar la plataforma sin un OWNER activo.", "error");
  }
}

async function savePlatformAccess({
  actorUser,
  actorAccess,
  email,
  role,
  notes,
  auditAction
}: {
  actorUser: { id: string; email: string };
  actorAccess: PlatformAdminAccess;
  email: string;
  role: PlatformAdminRole;
  notes: string | null;
  auditAction: string;
}) {
  const normalizedEmail = normalizePlatformAdminEmail(email);
  if (isPrimaryPlatformOwnerEmail(normalizedEmail)) {
    adminRedirect(`${PRIMARY_PLATFORM_OWNER_EMAIL} ya conserva acceso OWNER como dueño principal.`, "error");
  }
  assertCanGrantRole(actorAccess, role);
  await assertAccessTableAvailable();

  const storedAccess = await findStoredPlatformAccess(normalizedEmail);
  const effectiveAccess = await getPlatformAdminAccessForEmail(normalizedEmail);
  if (effectiveAccess && effectiveAccess.source !== "database" && !storedAccess) {
    adminRedirect("Este correo ya tiene acceso global por configuración de entorno.", "error");
  }

  try {
    if (storedAccess) {
      assertCanEditAccess(actorAccess, storedAccess, role);
      await assertSelfOwnerChangeKeepsOwner(actorUser.email, storedAccess, role, true);
      await prisma.$executeRaw`
        UPDATE "PlatformAdminAccess"
        SET "role" = ${role}, "enabled" = true, "notes" = ${notes}, "updatedAt" = CURRENT_TIMESTAMP
        WHERE LOWER("email") = ${normalizedEmail}
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO "PlatformAdminAccess" ("id", "email", "role", "enabled", "createdByEmail", "notes", "createdAt", "updatedAt")
        VALUES (${crypto.randomUUID()}, ${normalizedEmail}, ${role}, true, ${actorUser.email}, ${notes}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
    }
  } catch {
    adminRedirect("No se pudo guardar el acceso global.", "error");
  }

  await writeAuditLog({
    userId: actorUser.id,
    action: auditAction,
    resourceType: "PlatformAdminAccess",
    resourceId: normalizedEmail,
    metadata: { email: normalizedEmail, role, source: storedAccess ? "updated_or_reactivated" : "created" }
  });

  revalidatePath("/platform-admin");
  adminRedirect(storedAccess ? "Acceso admin existente actualizado o reactivado." : "Acceso admin creado correctamente.");
}

export async function searchUsersForPlatformAccess(query: string): Promise<PlatformAccessUserResult[]> {
  const { access } = await requirePlatformAdmin();
  if (!actorCanGrantRole(access, "ADMIN")) adminRedirect("Tu rol no permite buscar usuarios para accesos globales.", "error");

  const parsed = userSearchSchema.safeParse(query);
  if (!parsed.success) return [];
  const term = parsed.data;
  if (term.length < 2) return [];

  const users = await prisma.user.findMany({
    where: {
      OR: [{ email: { contains: term } }, { name: { contains: term } }, { id: { contains: term } }]
    },
    select: {
      id: true,
      name: true,
      email: true,
      businesses: { select: { name: true, publicSlug: true }, take: 3 },
      memberships: { select: { role: true, business: { select: { name: true, publicSlug: true } } }, take: 3 }
    },
    orderBy: { createdAt: "desc" },
    take: 8
  });

  return Promise.all(
    users.map(async (user) => {
      const email = normalizePlatformAdminEmail(user.email);
      const storedAccess = await findStoredPlatformAccess(email);
      const effectiveAccess = storedAccess ?? (await getPlatformAdminAccessForEmail(email));
      const storeMap = new Map<string, { name: string; slug: string; role: string }>();

      for (const business of user.businesses) {
        storeMap.set(business.publicSlug, { name: business.name, slug: business.publicSlug, role: "Dueño" });
      }
      for (const membership of user.memberships) {
        storeMap.set(membership.business.publicSlug, {
          name: membership.business.name,
          slug: membership.business.publicSlug,
          role: membership.role
        });
      }

      return {
        id: user.id,
        name: user.name,
        email,
        stores: Array.from(storeMap.values()),
        access: effectiveAccess
          ? {
              role: effectiveAccess.role,
              enabled: effectiveAccess.enabled,
              source: effectiveAccess.source
            }
          : null
      };
    })
  );
}

export async function grantPlatformAccessToExistingUser(userId: string, role: PlatformAdminRole) {
  const { user: actorUser, access: actorAccess } = await requirePlatformAdmin();
  const parsed = existingUserGrantSchema.safeParse({ userId, role });
  if (!parsed.success) adminRedirect("Selecciona un usuario y rol válidos.", "error");
  assertCanGrantRole(actorAccess, parsed.data.role);

  const targetUser = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, name: true, email: true }
  });
  if (!targetUser) adminRedirect("Usuario no encontrado.", "error");

  await savePlatformAccess({
    actorUser,
    actorAccess,
    email: targetUser.email,
    role: parsed.data.role,
    notes: `Elevado desde usuario registrado: ${targetUser.name}`,
    auditAction: "platform_admin.access.grant_existing_user"
  });
}

export async function createPlatformAccessByEmail(email: string, role: PlatformAdminRole, notes?: string | null) {
  const { user: actorUser, access: actorAccess } = await requirePlatformAdmin();
  const parsed = accessSchema.safeParse({ email, role, notes });
  if (!parsed.success) adminRedirect("Revisa el correo y rol del acceso admin.", "error");

  await savePlatformAccess({
    actorUser,
    actorAccess,
    email: parsed.data.email,
    role: parsed.data.role,
    notes: parsed.data.notes ?? null,
    auditAction: "platform_admin.access.create_by_email"
  });
}

export async function updatePlatformAccess(input: { email: string; role: PlatformAdminRole; enabled: boolean; notes?: string | null }) {
  const { user, access } = await requirePlatformAdmin();
  const parsed = accessUpdateSchema.safeParse(input);
  if (!parsed.success) adminRedirect("Acceso admin inválido.", "error");

  const email = normalizePlatformAdminEmail(parsed.data.email);
  const targetAccess = await findStoredPlatformAccess(email);
  if (!targetAccess) {
    const effectiveAccess = await getPlatformAdminAccessForEmail(email);
    if (effectiveAccess) adminRedirect("Este acceso se controla por configuración y no se edita desde el panel.", "error");
    adminRedirect("No encontramos un acceso guardado para editar.", "error");
  }

  assertCanEditAccess(access, targetAccess, parsed.data.role);
  await assertSelfOwnerChangeKeepsOwner(user.email, targetAccess, parsed.data.role, parsed.data.enabled);
  await assertAccessTableAvailable();

  await prisma.$executeRaw`
    UPDATE "PlatformAdminAccess"
    SET "role" = ${parsed.data.role}, "enabled" = ${parsed.data.enabled}, "notes" = ${parsed.data.notes ?? null}, "updatedAt" = CURRENT_TIMESTAMP
    WHERE LOWER("email") = ${email}
  `;

  await writeAuditLog({
    userId: user.id,
    action: "platform_admin.access.update",
    resourceType: "PlatformAdminAccess",
    resourceId: email,
    metadata: { email, role: parsed.data.role, enabled: parsed.data.enabled }
  });

  revalidatePath("/platform-admin");
  adminRedirect("Acceso admin guardado.");
}

export async function deactivatePlatformAccess(emailInput: string) {
  const { user, access } = await requirePlatformAdmin();
  const parsed = accessDeleteSchema.safeParse({ email: emailInput });
  if (!parsed.success) adminRedirect("Correo inválido.", "error");

  const email = normalizePlatformAdminEmail(parsed.data.email);
  const targetAccess = await findStoredPlatformAccess(email);
  if (!targetAccess) adminRedirect("No encontramos un acceso guardado para desactivar.", "error");

  assertCanEditAccess(access, targetAccess, targetAccess.role);
  await assertSelfOwnerChangeKeepsOwner(user.email, targetAccess, targetAccess.role, false);
  await assertAccessTableAvailable();

  await prisma.$executeRaw`
    UPDATE "PlatformAdminAccess"
    SET "enabled" = false, "updatedAt" = CURRENT_TIMESTAMP
    WHERE LOWER("email") = ${email}
  `;

  await writeAuditLog({
    userId: user.id,
    action: "platform_admin.access.deactivate",
    resourceType: "PlatformAdminAccess",
    resourceId: email,
    metadata: { email, role: targetAccess.role }
  });

  revalidatePath("/platform-admin");
  adminRedirect("Acceso admin desactivado.");
}

export async function deletePlatformAccess(emailInput: string) {
  const { user, access } = await requirePlatformAdmin();
  const parsed = accessDeleteSchema.safeParse({ email: emailInput });
  if (!parsed.success) adminRedirect("Correo inválido.", "error");

  const email = normalizePlatformAdminEmail(parsed.data.email);
  const targetAccess = await findStoredPlatformAccess(email);
  if (!targetAccess) {
    const effectiveAccess = await getPlatformAdminAccessForEmail(email);
    if (effectiveAccess) adminRedirect("Este acceso se controla por configuración y no se puede eliminar desde el panel.", "error");
    adminRedirect("No encontramos un acceso guardado para eliminar.", "error");
  }

  assertCanEditAccess(access, targetAccess, targetAccess.role);
  await assertSelfOwnerChangeKeepsOwner(user.email, targetAccess, targetAccess.role, false);
  await assertAccessTableAvailable();

  await prisma.$executeRaw`DELETE FROM "PlatformAdminAccess" WHERE LOWER("email") = ${email}`;
  await writeAuditLog({
    userId: user.id,
    action: "platform_admin.access.delete",
    resourceType: "PlatformAdminAccess",
    resourceId: email,
    metadata: { email, role: targetAccess.role }
  });

  revalidatePath("/platform-admin");
  adminRedirect("Acceso admin eliminado.");
}

export async function addPlatformAdminAccessAction(formData: FormData) {
  await createPlatformAccessByEmail(
    String(formData.get("email") ?? ""),
    String(formData.get("role") ?? "ADMIN") as PlatformAdminRole,
    String(formData.get("notes") ?? "")
  );
}

export async function updatePlatformAdminAccessAction(formData: FormData) {
  await updatePlatformAccess({
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? "ADMIN") as PlatformAdminRole,
    enabled: formData.get("enabled") === "true",
    notes: String(formData.get("notes") ?? "")
  });
}

export async function deletePlatformAdminAccessAction(formData: FormData) {
  await deletePlatformAccess(String(formData.get("email") ?? ""));
}

export async function updateBusinessStatusPlatformAction(formData: FormData) {
  const { user, access } = await requirePlatformAdmin();
  if (!canManagePlatformStores(access)) adminRedirect("Tu rol no permite suspender o reactivar tiendas.", "error");

  const parsed = businessStatusSchema.safeParse({
    businessId: formData.get("businessId"),
    isActive: formData.get("isActive"),
    reason: formData.get("reason")
  });
  if (!parsed.success) adminRedirect("Datos de tienda inválidos.", "error");

  const business = await prisma.business.findUnique({
    where: { id: parsed.data.businessId },
    select: { id: true, name: true, isActive: true }
  });
  if (!business) adminRedirect("Tienda no encontrada.", "error");

  await prisma.business.update({
    where: { id: business.id },
    data: { isActive: parsed.data.isActive }
  });
  await writeAuditLog({
    userId: user.id,
    businessId: business.id,
    action: parsed.data.isActive ? "platform_admin.business.reactivate" : "platform_admin.business.suspend",
    resourceType: "Business",
    resourceId: business.id,
    metadata: { name: business.name, from: business.isActive, to: parsed.data.isActive, reason: parsed.data.reason }
  });

  revalidatePath("/platform-admin");
  adminRedirect(parsed.data.isActive ? "Tienda reactivada." : "Tienda suspendida.");
}

export async function updateBusinessSubscriptionPlatformAction(formData: FormData) {
  const { user, access } = await requirePlatformAdmin();
  if (!canManagePlatformBilling(access)) adminRedirect("Tu rol no permite gestionar suscripciones.", "error");

  const parsed = subscriptionSchema.safeParse({
    businessId: formData.get("businessId"),
    plan: formData.get("plan"),
    status: formData.get("status"),
    currentPeriodEnd: formData.get("currentPeriodEnd"),
    reason: formData.get("reason")
  });
  if (!parsed.success) adminRedirect("Datos de suscripción inválidos.", "error");

  const business = await prisma.business.findUnique({
    where: { id: parsed.data.businessId },
    include: { plan: true, subscription: { include: { plan: true } } }
  });
  if (!business) adminRedirect("Tienda no encontrada.", "error");

  const nextPlan = await getPlanByType(parsed.data.plan);
  const oldPlan = normalizePlanSlug(business.subscription?.plan.type ?? business.plan?.type ?? business.planType);
  const oldStatus = normalizeSubscriptionStatus(business.subscription?.status);
  const currentPeriodEnd = dateFromInput(parsed.data.currentPeriodEnd);

  const subscription = await prisma.$transaction(async (tx) => {
    await tx.business.update({
      where: { id: business.id },
      data: { planId: nextPlan.id, planType: parsed.data.plan }
    });

    return tx.subscription.upsert({
      where: { businessId: business.id },
      update: { planId: nextPlan.id, status: parsed.data.status, currentPeriodEnd },
      create: { businessId: business.id, planId: nextPlan.id, status: parsed.data.status, currentPeriodEnd }
    });
  });

  await writeAuditLog({
    userId: user.id,
    businessId: business.id,
    action: "platform_admin.subscription.manual_update",
    resourceType: "Subscription",
    resourceId: subscription.id,
    metadata: {
      oldPlan,
      newPlan: parsed.data.plan,
      oldStatus,
      newStatus: parsed.data.status,
      currentPeriodEnd,
      reason: parsed.data.reason
    }
  });

  revalidatePath("/platform-admin");
  adminRedirect("Suscripción actualizada.");
}

export async function updatePlanLimitsPlatformAction(formData: FormData) {
  const { user, access } = await requirePlatformAdmin();
  if (!canManagePlatformBilling(access)) adminRedirect("Tu rol no permite editar planes y límites.", "error");

  const parsed = planLimitSchema.safeParse({
    planId: formData.get("planId"),
    maxProducts: formData.get("maxProducts"),
    maxImages: formData.get("maxImages"),
    maxCategories: formData.get("maxCategories"),
    maxAiConversationsMonthly: formData.get("maxAiConversationsMonthly"),
    maxMembers: formData.get("maxMembers"),
    maxStores: formData.get("maxStores"),
    supportLevel: formData.get("supportLevel"),
    reason: formData.get("reason")
  });
  if (!parsed.success) adminRedirect("Revisa los límites del plan.", "error");

  const previousPlan = await prisma.plan.findUnique({ where: { id: parsed.data.planId } });
  if (!previousPlan) adminRedirect("Plan no encontrado.", "error");

  const nextPlan = await prisma.plan.update({
    where: { id: parsed.data.planId },
    data: {
      maxProducts: parsed.data.maxProducts,
      maxImages: parsed.data.maxImages,
      maxCategories: parsed.data.maxCategories,
      maxAiConversationsMonthly: parsed.data.maxAiConversationsMonthly,
      maxMembers: parsed.data.maxMembers,
      maxUsers: parsed.data.maxMembers,
      maxStores: parsed.data.maxStores,
      supportLevel: parsed.data.supportLevel,
      aiEnabled: formData.get("aiEnabled") === "on",
      advancedBranding: formData.get("advancedBranding") === "on",
      advancedSeoEnabled: formData.get("advancedSeoEnabled") === "on",
      analyticsEnabled: formData.get("analyticsEnabled") === "on",
      advancedAttributesEnabled: formData.get("advancedAttributesEnabled") === "on",
      quotesAndOrders: formData.get("quotesAndOrders") === "on",
      customDomain: formData.get("customDomain") === "on"
    }
  });

  await writeAuditLog({
    userId: user.id,
    action: "platform_admin.plan_limits.update",
    resourceType: "Plan",
    resourceId: nextPlan.id,
    metadata: {
      plan: nextPlan.type,
      from: previousPlan,
      to: nextPlan,
      reason: parsed.data.reason
    }
  });

  revalidatePath("/platform-admin");
  adminRedirect("Límites del plan actualizados.");
}
