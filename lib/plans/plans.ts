import { prisma } from "@/lib/db";
import { PLAN_ENTITLEMENTS } from "@/lib/plans/entitlements";
import { normalizePlanSlug, PLAN_SLUGS, UNLIMITED, type PlanDefinition, type PlanSlug } from "@/lib/plans/plan-types";

export const commercialPlans: Record<PlanSlug, PlanDefinition> = {
  normal: {
    slug: "normal",
    type: "normal",
    name: "Normal",
    description: "Plan base para tiendas pequenas o usuarios que recien comienzan."
  },
  premium: {
    slug: "premium",
    type: "premium",
    name: "Premium",
    description: "Plan avanzado para tiendas en crecimiento con mas personalizacion, IA y reportes."
  },
  business: {
    slug: "business",
    type: "business",
    name: "Business",
    description: "Plan profesional para negocios con mayor volumen, equipo, automatizaciones e integraciones."
  }
};

function dbLimit(value: number | typeof UNLIMITED) {
  return value === UNLIMITED ? -1 : value;
}

export const planDefinitions = {
  normal: {
    type: "normal",
    name: commercialPlans.normal.name,
    description: commercialPlans.normal.description,
    maxProducts: dbLimit(PLAN_ENTITLEMENTS.normal.maxProducts),
    maxImages: dbLimit(PLAN_ENTITLEMENTS.normal.maxImages),
    maxCategories: dbLimit(PLAN_ENTITLEMENTS.normal.maxCategories),
    maxAiConversationsMonthly: dbLimit(PLAN_ENTITLEMENTS.normal.maxAiConversationsMonthly),
    maxUsers: dbLimit(PLAN_ENTITLEMENTS.normal.maxUsersPerStore),
    maxMembers: dbLimit(PLAN_ENTITLEMENTS.normal.maxUsersPerStore),
    maxStores: dbLimit(PLAN_ENTITLEMENTS.normal.maxStores),
    maxTemplates: 4,
    aiEnabled: true,
    advancedBranding: PLAN_ENTITLEMENTS.normal.advancedBranding,
    advancedSeoEnabled: false,
    analyticsEnabled: false,
    pageBuilderEnabled: false,
    advancedAttributesEnabled: PLAN_ENTITLEMENTS.normal.inventoryAdvanced,
    quotesAndOrders: PLAN_ENTITLEMENTS.normal.quotesAndOrders,
    customDomain: PLAN_ENTITLEMENTS.normal.customDomain,
    supportLevel: "standard"
  },
  premium: {
    type: "premium",
    name: commercialPlans.premium.name,
    description: commercialPlans.premium.description,
    maxProducts: dbLimit(PLAN_ENTITLEMENTS.premium.maxProducts),
    maxImages: dbLimit(PLAN_ENTITLEMENTS.premium.maxImages),
    maxCategories: dbLimit(PLAN_ENTITLEMENTS.premium.maxCategories),
    maxAiConversationsMonthly: dbLimit(PLAN_ENTITLEMENTS.premium.maxAiConversationsMonthly),
    maxUsers: dbLimit(PLAN_ENTITLEMENTS.premium.maxUsersPerStore),
    maxMembers: dbLimit(PLAN_ENTITLEMENTS.premium.maxUsersPerStore),
    maxStores: dbLimit(PLAN_ENTITLEMENTS.premium.maxStores),
    maxTemplates: 4,
    aiEnabled: true,
    advancedBranding: PLAN_ENTITLEMENTS.premium.advancedBranding,
    advancedSeoEnabled: true,
    analyticsEnabled: true,
    pageBuilderEnabled: false,
    advancedAttributesEnabled: PLAN_ENTITLEMENTS.premium.inventoryAdvanced,
    quotesAndOrders: PLAN_ENTITLEMENTS.premium.quotesAndOrders,
    customDomain: PLAN_ENTITLEMENTS.premium.customDomain,
    supportLevel: "priority"
  },
  business: {
    type: "business",
    name: commercialPlans.business.name,
    description: commercialPlans.business.description,
    maxProducts: dbLimit(PLAN_ENTITLEMENTS.business.maxProducts),
    maxImages: dbLimit(PLAN_ENTITLEMENTS.business.maxImages),
    maxCategories: dbLimit(PLAN_ENTITLEMENTS.business.maxCategories),
    maxAiConversationsMonthly: dbLimit(PLAN_ENTITLEMENTS.business.maxAiConversationsMonthly),
    maxUsers: dbLimit(PLAN_ENTITLEMENTS.business.maxUsersPerStore),
    maxMembers: dbLimit(PLAN_ENTITLEMENTS.business.maxUsersPerStore),
    maxStores: dbLimit(PLAN_ENTITLEMENTS.business.maxStores),
    maxTemplates: 4,
    aiEnabled: true,
    advancedBranding: PLAN_ENTITLEMENTS.business.advancedBranding,
    advancedSeoEnabled: true,
    analyticsEnabled: true,
    pageBuilderEnabled: true,
    advancedAttributesEnabled: PLAN_ENTITLEMENTS.business.inventoryAdvanced,
    quotesAndOrders: PLAN_ENTITLEMENTS.business.quotesAndOrders,
    customDomain: PLAN_ENTITLEMENTS.business.customDomain,
    supportLevel: "priority"
  }
} as const;

export const planList = PLAN_SLUGS.map((slug) => commercialPlans[slug]);

export async function ensureDefaultPlans() {
  const plans = await Promise.all(
    PLAN_SLUGS.map((slug) => {
      const plan = planDefinitions[slug];
      return prisma.plan.upsert({
        where: { type: plan.type },
        update: plan,
        create: plan
      });
    })
  );

  return plans;
}

export async function getNormalPlan() {
  return getPlanByType("normal");
}

export async function getFreePlan() {
  return getNormalPlan();
}

export async function getPlanByType(type: PlanSlug | string) {
  const slug = normalizePlanSlug(type);
  const definition = planDefinitions[slug];
  return prisma.plan.upsert({
    where: { type: slug },
    update: definition,
    create: definition
  });
}
