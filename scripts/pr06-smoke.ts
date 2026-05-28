import crypto from "node:crypto";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db";
import { auditBlocked, auditFailure, auditSuccess } from "@/lib/audit-log";
import { ProductStatus } from "@/lib/enums";
import { POST as uploadPost, DELETE as uploadDelete } from "@/app/api/uploads/image/route";
import { POST as aiPost } from "@/app/api/ai/sales-assistant/route";

const runId = `pr06-${Date.now()}`;
const BASE_URL = process.env.BASE_URL || "http://localhost";
const ownerEmail = `${runId}-owner@example.com`;
const pngBytes = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
const pdfBytes = Uint8Array.from(Buffer.from("%PDF-1.7"));
const directActions = [`${runId}_audit_success`, `${runId}_audit_failure`, `${runId}_audit_blocked`];

function makeFile(name: string, type: string, bytes: Uint8Array) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return new File([buffer], name, { type });
}

function parseMetadata(value: string | null) {
  return value ? JSON.parse(value) as Record<string, unknown> : {};
}

async function cleanup() {
  const businesses = await prisma.business.findMany({
    where: { slug: { startsWith: runId } },
    select: { id: true }
  });
  const businessIds = businesses.map((business) => business.id);
  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { action: { in: directActions } },
        { resourceId: { startsWith: runId } },
        ...(businessIds.length > 0 ? [{ businessId: { in: businessIds } }] : [])
      ]
    }
  });

  const users = await prisma.user.findMany({ where: { email: ownerEmail }, select: { id: true } });
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

function uploadForm(businessId: string, file: File) {
  const formData = new FormData();
  formData.set("businessId", businessId);
  formData.set("file", file);
  return formData;
}

function uploadRequest(token: string, businessId: string, file: File, ip: string) {
  return new Request(`${BASE_URL}/api/uploads/image`, {
    method: "POST",
    headers: {
      cookie: `catg_session=${token}; test_cookie=do-not-store-cookie-value`,
      "x-forwarded-for": ip,
      "user-agent": `${runId}-agent`
    },
    body: uploadForm(businessId, file)
  });
}

function deleteRequest(token: string, businessId: string, url: string, ip: string) {
  return new Request(`${BASE_URL}/api/uploads/image`, {
    method: "DELETE",
    headers: {
      cookie: `catg_session=${token}`,
      "content-type": "application/json",
      "x-forwarded-for": ip,
      "user-agent": `${runId}-agent`
    },
    body: JSON.stringify({ businessId, url })
  });
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

async function responseJson(response: Response) {
  return response.json().catch(() => ({}));
}

async function seed() {
  const normalPlan = await prisma.plan.upsert({
    where: { type: "normal" },
    update: {
      name: "Normal",
      description: "Plan normal para pruebas PR-06",
      maxProducts: 50,
      maxImages: 100,
      maxCategories: 20,
      maxAiConversationsMonthly: 100,
      maxUsers: 1,
      maxMembers: 1,
      maxStores: 1,
      maxTemplates: 4,
      aiEnabled: true,
      advancedBranding: true,
      quotesAndOrders: true,
      customDomain: false
    },
    create: {
      type: "normal",
      name: "Normal",
      description: "Plan normal para pruebas PR-06",
      maxProducts: 50,
      maxImages: 100,
      maxCategories: 20,
      maxAiConversationsMonthly: 100,
      maxUsers: 1,
      maxMembers: 1,
      maxStores: 1,
      maxTemplates: 4,
      aiEnabled: true,
      advancedBranding: true,
      quotesAndOrders: true,
      customDomain: false
    }
  });

  const user = await prisma.user.create({
    data: {
      email: ownerEmail,
      name: "PR06 Owner",
      passwordHash: "not-used",
      role: "USER"
    }
  });

  const business = await prisma.business.create({
    data: {
      ownerId: user.id,
      planId: normalPlan.id,
      planType: "normal",
      name: `${runId} Store`,
      slug: `${runId}-store`,
      publicSlug: `${runId}-store`,
      description: "PR06 public store",
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
    data: { businessId: business.id, name: "PR06 Categoria", slug: "pr06-categoria" }
  });

  await prisma.product.create({
    data: {
      businessId: business.id,
      categoryId: category.id,
      name: `${runId} Producto`,
      slug: `${runId}-producto`,
      description: "Producto publico PR06",
      price: 1000,
      stock: 5,
      status: ProductStatus.ACTIVE
    }
  });

  return { user, business, token: await createSessionToken(user.id) };
}

async function main() {
  const previousDeepSeekKey = process.env.DEEPSEEK_API_KEY;
  process.env.DEEPSEEK_API_KEY = "";
  await cleanup();
  const { user, business, token } = await seed();

  await auditSuccess({
    request: new Request(`${BASE_URL}/audit`, {
      headers: {
        "x-forwarded-for": "192.0.2.61",
        "user-agent": `${runId}-direct-agent`,
        authorization: "Bearer should-not-store"
      }
    }),
    userId: user.id,
    businessId: business.id,
    action: directActions[0],
    entityType: "DirectAudit",
    entityId: `${runId}-success`,
    metadata: {
      password: "super-secret-password",
      token: "super-secret-token",
      cookie: "cookie-value",
      authorization: "bearer-value",
      apiKey: "api-key-value",
      accessToken: "access-token-value",
      refreshToken: "refresh-token-value",
      longText: "x".repeat(900)
    }
  });
  await auditFailure({ action: directActions[1], entityType: "DirectAudit", entityId: `${runId}-failure`, metadata: { reason: "expected_failure" } });
  await auditBlocked({ action: directActions[2], entityType: "DirectAudit", entityId: `${runId}-blocked`, metadata: { reason: "expected_blocked" } });

  const directLogs = await prisma.auditLog.findMany({
    where: { action: { in: directActions } },
    orderBy: { createdAt: "asc" }
  });
  assert.strictEqual(directLogs.length, 3, "direct audit logs must be written");
  assert.strictEqual(parseMetadata(directLogs[0].metadata).result, "success", "success result must be stored in metadata");
  assert.strictEqual(parseMetadata(directLogs[1].metadata).result, "failure", "failure result must be stored in metadata");
  assert.strictEqual(parseMetadata(directLogs[2].metadata).result, "blocked", "blocked result must be stored in metadata");

  const sanitizedMetadata = directLogs[0].metadata ?? "";
  for (const forbidden of ["super-secret-password", "super-secret-token", "cookie-value", "bearer-value", "api-key-value", "access-token-value", "refresh-token-value"]) {
    assert(!sanitizedMetadata.includes(forbidden), `metadata leaked sensitive value: ${forbidden}`);
  }
  assert(sanitizedMetadata.includes("[REDACTED]"), "sensitive metadata should be redacted");
  assert(!sanitizedMetadata.includes("x".repeat(700)), "long strings should be truncated");

  const uploadResponse = await uploadPost(uploadRequest(token, business.id, makeFile("pr06.png", "image/png", pngBytes), "192.0.2.62"));
  const uploadPayload = await responseJson(uploadResponse);
  assert.strictEqual(uploadResponse.status, 200, `valid upload should pass: ${JSON.stringify(uploadPayload)}`);
  const uploadSuccess = await prisma.auditLog.findFirst({
    where: { action: "upload_image_success", businessId: business.id },
    orderBy: { createdAt: "desc" }
  });
  assert(uploadSuccess, "valid upload must create success audit log");
  assert.strictEqual(uploadSuccess.userId, user.id, "upload success must include userId");
  assert.strictEqual(parseMetadata(uploadSuccess.metadata).result, "success", "upload success result must be success");

  const blockedUploadResponse = await uploadPost(uploadRequest(token, business.id, makeFile("blocked.pdf", "application/pdf", pdfBytes), "192.0.2.63"));
  assert.strictEqual(blockedUploadResponse.status, 400, "blocked upload should return 400");
  const blockedUpload = await prisma.auditLog.findFirst({
    where: { action: "upload_image_blocked", businessId: business.id },
    orderBy: { createdAt: "desc" }
  });
  assert(blockedUpload, "blocked upload must create blocked audit log");
  assert.strictEqual(parseMetadata(blockedUpload.metadata).result, "blocked", "blocked upload result must be blocked");

  const aiMessage = `Hola, quiero consultar ${runId} Producto con clave privada no guardar`;
  const aiResponse = await aiPost(aiRequest(business.publicSlug, aiMessage, "192.0.2.64", `${runId}-visitor-ok`));
  assert.strictEqual(aiResponse.status, 200, "valid AI request should pass");
  const aiSuccess = await prisma.auditLog.findFirst({
    where: { action: "ai_sales_assistant_request", businessId: business.id },
    orderBy: { createdAt: "desc" }
  });
  assert(aiSuccess, "valid AI request must create audit log");
  assert.strictEqual(parseMetadata(aiSuccess.metadata).result, "success", "AI success result must be success");
  assert(!String(aiSuccess.metadata).includes(aiMessage), "AI audit metadata must not store full message");
  assert.strictEqual(typeof parseMetadata(aiSuccess.metadata).messageLength, "number", "AI audit metadata stores message length");

  let lastAiStatus = 0;
  for (let index = 0; index <= 20; index += 1) {
    const response = await aiPost(aiRequest(business.publicSlug, `rate limit ${index}`, "192.0.2.65", `${runId}-visitor-rate`));
    lastAiStatus = response.status;
  }
  assert.strictEqual(lastAiStatus, 429, "AI rate limit should return 429");
  const aiRateLimited = await prisma.auditLog.findFirst({
    where: { action: "ai_sales_assistant_rate_limited" },
    orderBy: { createdAt: "desc" }
  });
  assert(aiRateLimited, "AI rate limit must create audit log");
  assert.strictEqual(parseMetadata(aiRateLimited.metadata).result, "blocked", "AI rate limit result must be blocked");

  const allRelevantLogs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { action: { in: directActions } },
        { businessId: business.id },
        { action: "ai_sales_assistant_rate_limited" }
      ]
    },
    select: { metadata: true }
  });
  const allMetadata = JSON.stringify(allRelevantLogs.map((log) => log.metadata));
  for (const forbidden of ["super-secret", "cookie-value", "Bearer should-not-store", "do-not-store-cookie-value", aiMessage]) {
    assert(!allMetadata.includes(forbidden), `audit metadata leaked forbidden data: ${forbidden}`);
  }

  await uploadDelete(deleteRequest(token, business.id, String(uploadPayload.url), "192.0.2.66"));
  process.env.DEEPSEEK_API_KEY = previousDeepSeekKey;
  console.log("PR-06 smoke tests passed");
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
