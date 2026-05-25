import { prisma } from "@/lib/db";
import { PlanType } from "@/lib/enums";

export const planDefinitions = {
  FREE: {
    type: PlanType.FREE,
    name: "Free",
    maxProducts: 20,
    maxImages: 40,
    maxCategories: 5,
    maxAiConversationsMonthly: 100,
    maxUsers: 1,
    maxMembers: 1,
    maxStores: 1,
    maxTemplates: 1,
    aiEnabled: true,
    advancedBranding: false,
    advancedSeoEnabled: false,
    analyticsEnabled: false,
    pageBuilderEnabled: false,
    advancedAttributesEnabled: false,
    quotesAndOrders: false,
    customDomain: false,
    supportLevel: "community"
  },
  STARTER: {
    type: PlanType.STARTER,
    name: "Starter",
    maxProducts: 150,
    maxImages: 300,
    maxCategories: 20,
    maxAiConversationsMonthly: 1000,
    maxUsers: 2,
    maxMembers: 2,
    maxStores: 1,
    maxTemplates: 2,
    aiEnabled: true,
    advancedBranding: true,
    advancedSeoEnabled: true,
    analyticsEnabled: false,
    pageBuilderEnabled: false,
    advancedAttributesEnabled: true,
    quotesAndOrders: true,
    customDomain: false,
    supportLevel: "email"
  },
  PRO: {
    type: PlanType.PRO,
    name: "Pro",
    maxProducts: 1000,
    maxImages: 2500,
    maxCategories: 80,
    maxAiConversationsMonthly: 5000,
    maxUsers: 5,
    maxMembers: 5,
    maxStores: 3,
    maxTemplates: 4,
    aiEnabled: true,
    advancedBranding: true,
    advancedSeoEnabled: true,
    analyticsEnabled: true,
    pageBuilderEnabled: false,
    advancedAttributesEnabled: true,
    quotesAndOrders: true,
    customDomain: false,
    supportLevel: "priority"
  },
  BUSINESS: {
    type: PlanType.BUSINESS,
    name: "Business",
    maxProducts: 5000,
    maxImages: 12000,
    maxCategories: 300,
    maxAiConversationsMonthly: 25000,
    maxUsers: 20,
    maxMembers: 20,
    maxStores: 10,
    maxTemplates: 4,
    aiEnabled: true,
    advancedBranding: true,
    advancedSeoEnabled: true,
    analyticsEnabled: true,
    pageBuilderEnabled: true,
    advancedAttributesEnabled: true,
    quotesAndOrders: true,
    customDomain: true,
    supportLevel: "priority"
  },
  ENTERPRISE: {
    type: PlanType.ENTERPRISE,
    name: "Enterprise",
    maxProducts: 50000,
    maxImages: 100000,
    maxCategories: 1000,
    maxAiConversationsMonthly: 250000,
    maxUsers: 100,
    maxMembers: 100,
    maxStores: 100,
    maxTemplates: 4,
    aiEnabled: true,
    advancedBranding: true,
    advancedSeoEnabled: true,
    analyticsEnabled: true,
    pageBuilderEnabled: true,
    advancedAttributesEnabled: true,
    quotesAndOrders: true,
    customDomain: true,
    supportLevel: "dedicated"
  }
} as const;

export async function ensureDefaultPlans() {
  const plans = await Promise.all(
    Object.values(planDefinitions).map((plan) =>
      prisma.plan.upsert({
        where: { type: plan.type },
        update: plan,
        create: plan
      })
    )
  );

  return plans;
}

export async function getFreePlan() {
  return prisma.plan.upsert({
    where: { type: PlanType.FREE },
    update: planDefinitions.FREE,
    create: planDefinitions.FREE
  });
}

export async function getPlanByType(type: PlanType) {
  const definition = planDefinitions[type];
  return prisma.plan.upsert({
    where: { type },
    update: definition,
    create: definition
  });
}
