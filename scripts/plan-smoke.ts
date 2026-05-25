import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { POST as checkoutPost } from "../app/api/billing/checkout/route";
import {
  FEATURE_KEYS,
  canUseFeature,
  ensureDefaultPlans,
  getPlanByType,
  getPlanEntitlements,
  isWithinPlanLimit,
  normalizePlanSlug
} from "../lib/plans";
import { PlanAccessError, assertWithinPlanLimit, effectivePlanLimits, requireFeature } from "../services/plan-guard";

const prisma = new PrismaClient();
const runId = `plan-${Date.now()}`;
const emails = [`${runId}-normal@example.com`, `${runId}-premium@example.com`, `${runId}-business@example.com`];
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

async function cleanup() {
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
}

async function createSessionCookie(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    }
  });
  return `catg_session=${token}`;
}

async function createStore(label: "normal" | "premium" | "business") {
  const plan = await getPlanByType(label);
  const user = await prisma.user.create({
    data: {
      email: `${runId}-${label}@example.com`,
      name: `Plan ${label}`,
      passwordHash: "not-used",
      role: "USER"
    }
  });
  const business = await prisma.business.create({
    data: {
      ownerId: user.id,
      planId: plan.id,
      planType: label,
      name: `${runId} ${label}`,
      slug: `${runId}-${label}`,
      publicSlug: `${runId}-${label}`,
      memberships: { create: { userId: user.id, role: "STORE_OWNER" } },
      subscription: { create: { planId: plan.id, status: "active" } },
      aiSettings: { create: {} }
    }
  });
  return { user, business };
}

async function expectPlanLimitError(fn: () => Promise<unknown>, message: string) {
  let rejected = false;
  try {
    await fn();
  } catch (error) {
    rejected = error instanceof PlanAccessError;
  }
  assert(rejected, message);
}

async function main() {
  await cleanup();
  await ensureDefaultPlans();

  assert(normalizePlanSlug(null) === "normal", "Plan por defecto debe ser normal");
  assert(effectivePlanLimits(null).type === "normal", "effectivePlanLimits sin plan debe usar normal");

  const normal = getPlanEntitlements("normal");
  const premium = getPlanEntitlements("premium");
  const business = getPlanEntitlements("business");
  assert(normal.maxProducts === 50, "Normal debe permitir 50 productos");
  assert(premium.maxProducts === 500, "Premium debe permitir 500 productos");
  assert(business.maxProducts === "unlimited", "Business debe ser ilimitado en productos");
  assert(canUseFeature("normal", FEATURE_KEYS.saasThemeChange), "Tema SaaS debe estar disponible en Normal");
  assert(canUseFeature("premium", FEATURE_KEYS.catalogPaletteChange), "Paletas deben estar disponibles en Premium");
  assert(canUseFeature("business", FEATURE_KEYS.catalogPaletteChange), "Paletas deben estar disponibles en Business");
  assert(!canUseFeature("normal", FEATURE_KEYS.automationsUse), "Normal no debe usar automatizaciones");
  assert(canUseFeature("premium", FEATURE_KEYS.automationsUse), "Premium debe usar automatizaciones");
  assert(canUseFeature("business", FEATURE_KEYS.customDomainUse), "Business debe usar dominio custom");

  assert(isWithinPlanLimit("normal", "maxProducts", 49), "Normal debe aceptar producto 50");
  assert(!isWithinPlanLimit("normal", "maxProducts", 50), "Normal debe bloquear producto 51");
  assert(isWithinPlanLimit("premium", "maxProducts", 499), "Premium debe aceptar producto 500");
  assert(!isWithinPlanLimit("premium", "maxProducts", 500), "Premium debe bloquear producto 501");
  assert(isWithinPlanLimit("business", "maxProducts", 100000), "Business no debe bloquear productos");

  const normalStore = await createStore("normal");
  const premiumStore = await createStore("premium");
  const businessStore = await createStore("business");

  await assertWithinPlanLimit(normalStore.business.id, "products", 49);
  await expectPlanLimitError(
    () => assertWithinPlanLimit(normalStore.business.id, "products", 50),
    "Servidor debe bloquear creacion de producto sobre limite normal"
  );
  await assertWithinPlanLimit(premiumStore.business.id, "products", 499);
  await expectPlanLimitError(
    () => assertWithinPlanLimit(premiumStore.business.id, "products", 500),
    "Servidor debe bloquear creacion de producto sobre limite premium"
  );
  await assertWithinPlanLimit(businessStore.business.id, "products", 100000);

  await expectPlanLimitError(
    () => requireFeature(normalStore.business.id, FEATURE_KEYS.automationsUse),
    "Feature bloqueada por plan debe rechazarse en servidor"
  );

  const cookie = await createSessionCookie(normalStore.user.id);
  const checkoutRes = await checkoutPost(new Request(`${BASE_URL}/api/billing/checkout`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ businessId: normalStore.business.id, planType: "business" })
  }));
  assert([501, 503].includes(checkoutRes.status), "Checkout sin proveedor debe quedar preparado sin conceder plan");
  const unchangedStore = await prisma.business.findUnique({ where: { id: normalStore.business.id }, select: { planType: true } });
  assert(unchangedStore?.planType === "normal", "Usuario comun no puede autoconcederse Business via checkout");

  await cleanup();
  console.log("Plan smoke checks passed");
}

main()
  .catch(async (error) => {
    await cleanup().catch(() => undefined);
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
