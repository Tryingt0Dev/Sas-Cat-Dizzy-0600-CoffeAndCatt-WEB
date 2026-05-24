import { prisma } from "@/lib/db";
import { PlanType } from "@/lib/enums";

export const planDefinitions = {
  FREE: {
    type: PlanType.FREE,
    name: "Free",
    maxProducts: 25,
    maxCategories: 5,
    maxAiConversationsMonthly: 100,
    maxUsers: 1,
    maxStores: 1,
    maxTemplates: 1,
    advancedBranding: false,
    quotesAndOrders: false,
    customDomain: false
  },
  STARTER: {
    type: PlanType.STARTER,
    name: "Starter",
    maxProducts: 150,
    maxCategories: 20,
    maxAiConversationsMonthly: 1000,
    maxUsers: 2,
    maxStores: 1,
    maxTemplates: 2,
    advancedBranding: true,
    quotesAndOrders: true,
    customDomain: false
  },
  PRO: {
    type: PlanType.PRO,
    name: "Pro",
    maxProducts: 1000,
    maxCategories: 80,
    maxAiConversationsMonthly: 5000,
    maxUsers: 5,
    maxStores: 3,
    maxTemplates: 4,
    advancedBranding: true,
    quotesAndOrders: true,
    customDomain: false
  },
  BUSINESS: {
    type: PlanType.BUSINESS,
    name: "Business",
    maxProducts: 5000,
    maxCategories: 300,
    maxAiConversationsMonthly: 25000,
    maxUsers: 20,
    maxStores: 10,
    maxTemplates: 4,
    advancedBranding: true,
    quotesAndOrders: true,
    customDomain: true
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
