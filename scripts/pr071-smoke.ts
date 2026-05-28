import crypto from "node:crypto";
import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { ensureDefaultPlans, getPlanByType, getPlanEntitlements, limitToNumber } from "@/lib/plans";
import { POST as uploadPost } from "@/app/api/uploads/image/route";
import {
  PlanAccessError,
  getPlanLimitsForBusiness,
  requireAdvancedCustomTheme,
  requireAdvancedSettings,
  requireMaxImages,
  requireMaxProducts,
  requireMaxUsers
} from "@/services/plan-guard";

const runId = `pr071-${Date.now()}`;
const BASE_URL = process.env.BASE_URL || "http://localhost";
const emails = ["normal", "premium", "business", "fallback"].map((label) => `${runId}-${label}@example.com`);
const pngBytes = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);

type StoreSeed = {
  user: { id: string };
  business: { id: string; slug: string; publicSlug: string };
  token: string;
};

function parseMetadata(value: string | null) {
  return value ? JSON.parse(value) as Record<string, unknown> : {};
}

function uploadStorageRoot(businessId: string) {
  return path.resolve(process.cwd(), "public", "uploads", "businesses", businessId, "images");
}

async function cleanup() {
  const businesses = await prisma.business.findMany({
    where: { slug: { startsWith: runId } },
    select: { id: true }
  });
  for (const business of businesses) {
    const root = path.resolve(process.cwd(), "public", "uploads", "businesses", business.id);
    if (root.startsWith(path.resolve(process.cwd(), "public", "uploads", "businesses") + path.sep)) {
      await rm(root, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  const businessIds = businesses.map((business) => business.id);
  if (businessIds.length > 0) {
    await prisma.auditLog.deleteMany({ where: { businessId: { in: businessIds } } });
  }

  const users = await prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true } });
  const userIds = users.map((user) => user.id);
  if (userIds.length > 0) {
    await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
}

async function createSessionToken(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    }
  });
  return token;
}

async function createStore(planType: "normal" | "premium" | "business" | "fallback"): Promise<StoreSeed> {
  const user = await prisma.user.create({
    data: {
      email: `${runId}-${planType}@example.com`,
      name: `PR071 ${planType}`,
      passwordHash: "not-used",
      role: "USER"
    }
  });

  const plan = planType === "fallback" ? null : await getPlanByType(planType);
  const business = await prisma.business.create({
    data: {
      ownerId: user.id,
      planId: plan?.id ?? null,
      planType: planType === "fallback" ? "normal" : planType,
      name: `${runId} ${planType}`,
      slug: `${runId}-${planType}`,
      publicSlug: `${runId}-${planType}`,
      memberships: { create: { userId: user.id, role: "STORE_OWNER" } },
      ...(plan
        ? {
            subscription: {
              create: { planId: plan.id, status: "active" }
            }
          }
        : {})
    }
  });

  return { user, business, token: await createSessionToken(user.id) };
}

function makeFile(name: string, type: string, bytes: Uint8Array) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return new File([buffer], name, { type });
}

function uploadForm(businessId: string, file: File) {
  const formData = new FormData();
  formData.set("businessId", businessId);
  formData.set("file", file);
  return formData;
}

function uploadRequest(token: string, businessId: string, ip: string) {
  return new Request(`${BASE_URL}/api/uploads/image`, {
    method: "POST",
    headers: {
      cookie: `catg_session=${token}`,
      "x-forwarded-for": ip,
      "user-agent": `${runId}-agent`
    },
    body: uploadForm(businessId, makeFile("valid.png", "image/png", pngBytes))
  });
}

async function expectPlanError(fn: () => Promise<unknown>, label: string) {
  let error: unknown;
  try {
    await fn();
  } catch (caught) {
    error = caught;
  }

  assert(error instanceof PlanAccessError, `${label} debe fallar con PlanAccessError`);
  const message = error.message;
  assert(!message.includes(process.cwd()), `${label} no debe exponer rutas absolutas`);
  assert(!message.includes("Prisma"), `${label} no debe exponer detalles Prisma`);
  assert(!message.includes("Error:"), `${label} no debe exponer stack traces`);
  return message;
}

async function seedStoredImages(businessId: string, count: number) {
  const root = uploadStorageRoot(businessId);
  await mkdir(root, { recursive: true });
  await Promise.all(
    Array.from({ length: count }, (_, index) => writeFile(path.join(root, `${runId}-${index}.png`), pngBytes))
  );
}

async function assertAuditLog(input: {
  businessId: string;
  action: string;
  expectedPlan?: string;
  expectedLimit?: unknown;
}) {
  const log = await prisma.auditLog.findFirst({
    where: { businessId: input.businessId, action: input.action },
    orderBy: { createdAt: "desc" }
  });
  assert(log, `${input.action} debe generar AuditLog`);
  const metadata = parseMetadata(log.metadata);
  if (input.expectedPlan) assert.strictEqual(metadata.plan, input.expectedPlan, `${input.action} debe guardar plan`);
  if (input.expectedLimit !== undefined) assert.strictEqual(metadata.limit, input.expectedLimit, `${input.action} debe guardar limite`);
  const serialized = JSON.stringify(metadata);
  assert(!serialized.includes(process.cwd()), `${input.action} no debe guardar rutas absolutas`);
  assert(!serialized.includes("catg_session"), `${input.action} no debe guardar cookies`);
  assert(!serialized.includes("token"), `${input.action} no debe guardar tokens`);
}

async function main() {
  await cleanup();
  await ensureDefaultPlans();

  const normalEntitlements = getPlanEntitlements("normal");
  const premiumEntitlements = getPlanEntitlements("premium");
  const businessEntitlements = getPlanEntitlements("business");

  assert(limitToNumber(premiumEntitlements.maxProducts) > limitToNumber(normalEntitlements.maxProducts), "PREMIUM debe superar NORMAL en productos");
  assert(limitToNumber(businessEntitlements.maxProducts) > limitToNumber(premiumEntitlements.maxProducts), "BUSINESS debe superar PREMIUM en productos");

  const normal = await createStore("normal");
  const premium = await createStore("premium");
  const business = await createStore("business");
  const fallback = await createStore("fallback");

  const fallbackPlan = await getPlanLimitsForBusiness(fallback.business.id);
  assert.strictEqual(fallbackPlan.type, "normal", "Negocio sin plan formal debe usar NORMAL");

  const productMessage = await expectPlanError(
    () => requireMaxProducts(normal.business.id, Number(normalEntitlements.maxProducts)),
    "limite de productos NORMAL"
  );
  assert.strictEqual(productMessage, "Tu plan actual alcanzó el límite de productos.");
  await requireMaxProducts(premium.business.id, Number(normalEntitlements.maxProducts));
  await requireMaxProducts(business.business.id, Number(premiumEntitlements.maxProducts));
  await assertAuditLog({
    businessId: normal.business.id,
    action: "product_plan_limit_blocked",
    expectedPlan: "normal",
    expectedLimit: normalEntitlements.maxProducts
  });

  await expectPlanError(
    () => requireMaxUsers(normal.business.id),
    "limite de usuarios NORMAL"
  );
  await assertAuditLog({
    businessId: normal.business.id,
    action: "user_plan_limit_blocked",
    expectedPlan: "normal",
    expectedLimit: normalEntitlements.maxUsersPerStore
  });

  await seedStoredImages(normal.business.id, Number(normalEntitlements.maxImages));
  await expectPlanError(
    () => requireMaxImages(normal.business.id, Number(normalEntitlements.maxImages)),
    "limite de imagenes NORMAL"
  );
  const uploadResponse = await uploadPost(uploadRequest(normal.token, normal.business.id, "198.51.100.171"));
  const uploadPayload = await uploadResponse.json().catch(() => ({}));
  assert.strictEqual(uploadResponse.status, 402, `upload debe bloquear por plan: ${JSON.stringify(uploadPayload)}`);
  assert(!JSON.stringify(uploadPayload).includes(process.cwd()), "upload bloqueado no debe exponer rutas absolutas");
  await assertAuditLog({
    businessId: normal.business.id,
    action: "upload_plan_limit_blocked",
    expectedPlan: "normal",
    expectedLimit: normalEntitlements.maxImages
  });

  await expectPlanError(
    () => requireAdvancedCustomTheme(normal.business.id, { userId: normal.user.id, attemptedAction: "update_catalog_palette" }),
    "customTheme advanced en NORMAL"
  );
  await requireAdvancedCustomTheme(premium.business.id, { userId: premium.user.id, attemptedAction: "update_catalog_palette" });
  await assertAuditLog({
    businessId: normal.business.id,
    action: "appearance_plan_limit_blocked",
    expectedPlan: "normal",
    expectedLimit: "advanced"
  });

  await expectPlanError(
    () => requireAdvancedSettings(normal.business.id, { userId: normal.user.id, attemptedAction: "update_business_settings" }),
    "advancedSettings en NORMAL"
  );
  await expectPlanError(
    () => requireAdvancedSettings(premium.business.id, { userId: premium.user.id, attemptedAction: "update_business_settings" }),
    "advancedSettings en PREMIUM"
  );
  await requireAdvancedSettings(business.business.id, { userId: business.user.id, attemptedAction: "update_business_settings" });
  await assertAuditLog({
    businessId: normal.business.id,
    action: "settings_plan_limit_blocked",
    expectedPlan: "normal",
    expectedLimit: true
  });

  console.log("PR-07.1 smoke tests passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await cleanup();
    await prisma.$disconnect();
  });
