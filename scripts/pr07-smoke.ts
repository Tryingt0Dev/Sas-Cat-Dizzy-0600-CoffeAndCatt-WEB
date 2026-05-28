import assert from "node:assert/strict";
import { prisma } from "@/lib/db";
import { ProductStatus } from "@/lib/enums";
import { ensureDefaultPlans, getPlanEntitlements, limitToNumber } from "@/lib/plans";
import { POST as aiPost } from "@/app/api/ai/sales-assistant/route";
import {
  PlanAccessError,
  aiRequestsPerMinuteForPlan,
  assertWithinPlanLimit,
  canUploadImage,
  getPlanLimitsForBusiness
} from "@/services/plan-guard";

const runId = `pr07-${Date.now()}`;
const BASE_URL = process.env.BASE_URL || "http://localhost";
const ownerEmail = `${runId}-owner@example.com`;

function parseMetadata(value: string | null) {
  return value ? JSON.parse(value) as Record<string, unknown> : {};
}

async function cleanup() {
  const businesses = await prisma.business.findMany({
    where: { slug: { startsWith: runId } },
    select: { id: true }
  });
  const businessIds = businesses.map((business) => business.id);
  if (businessIds.length > 0) {
    await prisma.auditLog.deleteMany({ where: { businessId: { in: businessIds } } });
  }

  const users = await prisma.user.findMany({ where: { email: ownerEmail }, select: { id: true } });
  const userIds = users.map((user) => user.id);
  if (userIds.length > 0) {
    await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
}

async function responseJson(response: Response) {
  return response.json().catch(() => ({}));
}

function aiRequest(businessSlug: string, message: string, ip: string, visitorId: string) {
  return new Request(`${BASE_URL}/api/ai/sales-assistant`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
      "user-agent": `${runId}-agent`
    },
    body: JSON.stringify({ businessSlug, message, visitorId })
  });
}

async function expectPlanError(fn: () => Promise<unknown>, label: string) {
  let errorMessage = "";
  try {
    await fn();
  } catch (error) {
    assert(error instanceof PlanAccessError, `${label} debe fallar con PlanAccessError`);
    errorMessage = error.message;
  }
  assert(errorMessage, `${label} debe fallar`);
  assert(!errorMessage.includes(process.cwd()), `${label} no debe exponer rutas absolutas`);
  assert(!errorMessage.includes("Prisma"), `${label} no debe exponer errores internos`);
  assert(!errorMessage.includes("Error:"), `${label} no debe exponer stack traces`);
}

async function seedStoreWithoutPlan() {
  const user = await prisma.user.create({
    data: {
      email: ownerEmail,
      name: "PR07 Owner",
      passwordHash: "not-used",
      role: "USER"
    }
  });

  const business = await prisma.business.create({
    data: {
      ownerId: user.id,
      name: `${runId} Store`,
      slug: `${runId}-store`,
      publicSlug: `${runId}-store`,
      description: "PR07 public store",
      memberships: { create: { userId: user.id, role: "STORE_OWNER" } },
      aiSettings: {
        create: {
          allowAutoLead: false,
          humanHandoffEnabled: false,
          fallbackMessage: "No tengo esa informacion exacta en el catalogo."
        }
      }
    }
  });

  const category = await prisma.category.create({
    data: { businessId: business.id, name: "PR07 Categoria", slug: "pr07-categoria" }
  });

  await prisma.product.create({
    data: {
      businessId: business.id,
      categoryId: category.id,
      name: `${runId} Producto`,
      slug: `${runId}-producto`,
      description: "Producto publico PR07",
      price: 1000,
      stock: 5,
      status: ProductStatus.ACTIVE
    }
  });

  return { user, business };
}

async function main() {
  const previousDeepSeekKey = process.env.DEEPSEEK_API_KEY;
  process.env.DEEPSEEK_API_KEY = "";
  await cleanup();
  await ensureDefaultPlans();

  const normal = getPlanEntitlements("normal");
  const premium = getPlanEntitlements("premium");
  const businessPlan = getPlanEntitlements("business");

  assert.strictEqual(normal.maxProducts, 50, "NORMAL debe definir maxProducts 50");
  assert.strictEqual(normal.maxImages, 100, "NORMAL debe definir maxImages 100");
  assert.strictEqual(normal.aiRequestsPerMinute, 10, "NORMAL debe definir 10 requests IA/min");
  assert.strictEqual(normal.maxUsersPerStore, 1, "NORMAL debe definir maxUsers 1");
  assert.strictEqual(normal.customTheme, "basic", "NORMAL debe definir customTheme basic");

  assert(limitToNumber(premium.maxProducts) > limitToNumber(normal.maxProducts), "PREMIUM debe superar NORMAL en productos");
  assert(limitToNumber(premium.maxImages) > limitToNumber(normal.maxImages), "PREMIUM debe superar NORMAL en imagenes");
  assert(premium.aiRequestsPerMinute > normal.aiRequestsPerMinute, "PREMIUM debe superar NORMAL en IA/min");
  assert(limitToNumber(premium.maxUsersPerStore) > limitToNumber(normal.maxUsersPerStore), "PREMIUM debe superar NORMAL en usuarios");
  assert.strictEqual(premium.customTheme, "advanced", "PREMIUM debe permitir customTheme advanced");

  assert(limitToNumber(businessPlan.maxProducts) > limitToNumber(premium.maxProducts), "BUSINESS debe superar PREMIUM en productos");
  assert(limitToNumber(businessPlan.maxImages) > limitToNumber(premium.maxImages), "BUSINESS debe superar PREMIUM en imagenes");
  assert(businessPlan.aiRequestsPerMinute > premium.aiRequestsPerMinute, "BUSINESS debe superar PREMIUM en IA/min");
  assert(limitToNumber(businessPlan.maxUsersPerStore) > limitToNumber(premium.maxUsersPerStore), "BUSINESS debe superar PREMIUM en usuarios");
  assert.strictEqual(businessPlan.auditLogs, true, "BUSINESS debe habilitar auditLog");
  assert.strictEqual(businessPlan.advancedSettings, true, "BUSINESS debe habilitar advancedSettings");

  const { business } = await seedStoreWithoutPlan();
  const fallbackPlan = await getPlanLimitsForBusiness(business.id);
  assert.strictEqual(fallbackPlan.type, "normal", "Negocio sin plan formal debe usar NORMAL");
  assert.strictEqual(aiRequestsPerMinuteForPlan(fallbackPlan), 10, "Fallback NORMAL debe usar 10 requests IA/min");

  await expectPlanError(
    () => assertWithinPlanLimit(business.id, "products", Number(normal.maxProducts)),
    "limite de productos"
  );
  await expectPlanError(
    () => canUploadImage(business.id, Number(normal.maxImages)),
    "limite de imagenes"
  );

  const productPlanLog = await prisma.auditLog.findFirst({
    where: { businessId: business.id, action: "product_plan_limit_blocked" },
    orderBy: { createdAt: "desc" }
  });
  assert(productPlanLog, "Bloqueo de producto debe generar AuditLog");
  assert.strictEqual(parseMetadata(productPlanLog.metadata).limit, normal.maxProducts, "AuditLog producto debe guardar limite");

  const uploadPlanLog = await prisma.auditLog.findFirst({
    where: { businessId: business.id, action: "upload_plan_limit_blocked" },
    orderBy: { createdAt: "desc" }
  });
  assert(uploadPlanLog, "Bloqueo de upload debe generar AuditLog");
  assert.strictEqual(parseMetadata(uploadPlanLog.metadata).limit, normal.maxImages, "AuditLog upload debe guardar limite");

  let lastAiStatus = 0;
  for (let index = 0; index <= normal.aiRequestsPerMinute; index += 1) {
    const response = await aiPost(
      aiRequest(
        business.publicSlug,
        `Consulta PR07 ${index} ${runId} Producto`,
        "203.0.113.77",
        `${runId}-visitor-rate`
      )
    );
    lastAiStatus = response.status;
    if (index < normal.aiRequestsPerMinute) {
      const payload = await responseJson(response);
      assert.strictEqual(response.status, 200, `IA request ${index + 1} debe pasar: ${JSON.stringify(payload)}`);
    }
  }
  assert.strictEqual(lastAiStatus, 429, "IA debe aplicar rate limit NORMAL por plan");

  const aiPlanLog = await prisma.auditLog.findFirst({
    where: { businessId: business.id, action: "ai_plan_limit_blocked" },
    orderBy: { createdAt: "desc" }
  });
  assert(aiPlanLog, "Rate limit IA por plan debe generar AuditLog");
  const aiMetadata = parseMetadata(aiPlanLog.metadata);
  assert.strictEqual(aiMetadata.plan, "normal", "AuditLog IA debe guardar plan normal");
  assert.strictEqual(aiMetadata.limit, normal.aiRequestsPerMinute, "AuditLog IA debe guardar limite por minuto");
  assert(!JSON.stringify(aiMetadata).includes("Consulta PR07"), "AuditLog IA no debe guardar prompt completo");

  process.env.DEEPSEEK_API_KEY = previousDeepSeekKey;
  console.log("PR-07 smoke tests passed");
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
