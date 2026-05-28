"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  PLATFORM_ADMIN_ROLES,
  PRIMARY_PLATFORM_OWNER_EMAIL,
  canManagePlatformAccess,
  canManagePlatformBilling,
  canManagePlatformStores,
  isPrimaryPlatformOwnerEmail,
  normalizePlatformAdminEmail,
  requirePlatformAdmin,
  requirePlatformOwner
} from "@/lib/platform-admin";
import { PLAN_SLUGS, SUBSCRIPTION_STATUSES, getPlanByType, normalizePlanSlug, normalizeSubscriptionStatus } from "@/lib/plans";
import { writeAuditLog } from "@/services/audit-log";

const accessSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(PLATFORM_ADMIN_ROLES),
  notes: z.string().trim().max(500).optional().transform((value) => value || null)
});

const accessUpdateSchema = accessSchema.extend({
  enabled: z.enum(["true", "false"]).transform((value) => value === "true")
});

const accessDeleteSchema = z.object({
  email: z.string().trim().toLowerCase().email()
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

export async function addPlatformAdminAccessAction(formData: FormData) {
  const { user, access } = await requirePlatformOwner();
  if (!canManagePlatformAccess(access)) adminRedirect("Solo el dueño de la plataforma puede gestionar accesos globales.", "error");

  const parsed = accessSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
    notes: formData.get("notes")
  });
  if (!parsed.success) adminRedirect("Revisa el correo y rol del acceso admin.", "error");

  const email = normalizePlatformAdminEmail(parsed.data.email);
  const role = isPrimaryPlatformOwnerEmail(email) ? "OWNER" : parsed.data.role;
  await assertAccessTableAvailable();

  try {
    await prisma.$executeRaw`
      INSERT INTO "PlatformAdminAccess" ("id", "email", "role", "enabled", "createdByEmail", "notes", "createdAt", "updatedAt")
      VALUES (${crypto.randomUUID()}, ${email}, ${role}, true, ${user.email}, ${parsed.data.notes}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("email") DO UPDATE SET
        "role" = ${role},
        "enabled" = true,
        "notes" = ${parsed.data.notes},
        "updatedAt" = CURRENT_TIMESTAMP
    `;
  } catch {
    adminRedirect("No se pudo guardar el acceso global.", "error");
  }

  await writeAuditLog({
    userId: user.id,
    action: "platform_admin.access.upsert",
    resourceType: "PlatformAdminAccess",
    resourceId: email,
    metadata: { email, role }
  });

  revalidatePath("/platform-admin");
  adminRedirect("Acceso admin actualizado.");
}

export async function updatePlatformAdminAccessAction(formData: FormData) {
  const { user, access } = await requirePlatformOwner();
  if (!canManagePlatformAccess(access)) adminRedirect("Solo el dueño de la plataforma puede gestionar accesos globales.", "error");

  const parsed = accessUpdateSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
    enabled: formData.get("enabled"),
    notes: formData.get("notes")
  });
  if (!parsed.success) adminRedirect("Acceso admin inválido.", "error");

  const email = normalizePlatformAdminEmail(parsed.data.email);
  if (isPrimaryPlatformOwnerEmail(email) && (!parsed.data.enabled || parsed.data.role !== "OWNER")) {
    adminRedirect(`No se puede desactivar ni degradar al dueño principal ${PRIMARY_PLATFORM_OWNER_EMAIL}.`, "error");
  }

  await assertAccessTableAvailable();
  await prisma.$executeRaw`
    UPDATE "PlatformAdminAccess"
    SET "role" = ${parsed.data.role}, "enabled" = ${parsed.data.enabled}, "notes" = ${parsed.data.notes}, "updatedAt" = CURRENT_TIMESTAMP
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

export async function deletePlatformAdminAccessAction(formData: FormData) {
  const { user } = await requirePlatformOwner();
  const parsed = accessDeleteSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) adminRedirect("Correo inválido.", "error");

  const email = normalizePlatformAdminEmail(parsed.data.email);
  if (isPrimaryPlatformOwnerEmail(email)) {
    adminRedirect(`No se puede eliminar al dueño principal ${PRIMARY_PLATFORM_OWNER_EMAIL}.`, "error");
  }

  await assertAccessTableAvailable();
  await prisma.$executeRaw`DELETE FROM "PlatformAdminAccess" WHERE LOWER("email") = ${email}`;
  await writeAuditLog({
    userId: user.id,
    action: "platform_admin.access.delete",
    resourceType: "PlatformAdminAccess",
    resourceId: email,
    metadata: { email }
  });

  revalidatePath("/platform-admin");
  adminRedirect("Acceso admin eliminado.");
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
