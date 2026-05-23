import { prisma } from "@/lib/db";
import { PlanType } from "@/lib/enums";

export const planDefinitions = {
  FREE: {
    type: PlanType.FREE,
    name: "Free",
    maxProducts: 25,
    maxAiConversationsMonthly: 100,
    maxUsers: 1,
    maxTemplates: 1,
    advancedBranding: false,
    quotesAndOrders: false
  },
  STARTER: {
    type: PlanType.STARTER,
    name: "Starter",
    maxProducts: 150,
    maxAiConversationsMonthly: 1000,
    maxUsers: 2,
    maxTemplates: 2,
    advancedBranding: true,
    quotesAndOrders: true
  },
  PRO: {
    type: PlanType.PRO,
    name: "Pro",
    maxProducts: 1000,
    maxAiConversationsMonthly: 5000,
    maxUsers: 5,
    maxTemplates: 4,
    advancedBranding: true,
    quotesAndOrders: true
  },
  BUSINESS: {
    type: PlanType.BUSINESS,
    name: "Business",
    maxProducts: 5000,
    maxAiConversationsMonthly: 25000,
    maxUsers: 20,
    maxTemplates: 4,
    advancedBranding: true,
    quotesAndOrders: true
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
