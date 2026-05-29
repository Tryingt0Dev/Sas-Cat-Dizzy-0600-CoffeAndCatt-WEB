import crypto from "node:crypto";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db";
import { POST as uploadPost, DELETE as uploadDelete } from "@/app/api/uploads/image/route";

const runId = `pr04-${Date.now()}`;
const BASE_URL = process.env.BASE_URL || "http://localhost";
const ownerAEmail = `${runId}-owner-a@example.com`;
const ownerBEmail = `${runId}-owner-b@example.com`;
const emails = [ownerAEmail, ownerBEmail];
const pngBytes = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
const jpgBytes = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0xff, 0xd9]);
const svgBytes = Uint8Array.from(Buffer.from("<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>"));
const pdfBytes = Uint8Array.from(Buffer.from("%PDF-1.7"));

type TestStore = {
  id: string;
  ownerId: string;
};

function fail(message: string): never {
  throw new Error(message);
}

async function cleanup() {
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

function makeFile(name: string, type: string, bytes: Uint8Array) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return new File([buffer], name, { type });
}

function uploadForm(businessId: string | null, file?: File) {
  const formData = new FormData();
  if (businessId) formData.set("businessId", businessId);
  if (file) formData.set("file", file);
  return formData;
}

function uploadRequest(cookie: string | null, formData: FormData, ip: string) {
  return new Request(`${BASE_URL}/api/uploads/image`, {
    method: "POST",
    headers: {
      "x-forwarded-for": ip,
      ...(cookie ? { cookie: `catg_session=${cookie}` } : {})
    },
    body: formData
  });
}

function deleteRequest(cookie: string, body: unknown, ip: string) {
  return new Request(`${BASE_URL}/api/uploads/image`, {
    method: "DELETE",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
      cookie: `catg_session=${cookie}`
    },
    body: JSON.stringify(body)
  });
}

async function responseJson(response: Response) {
  return response.json().catch(() => ({}));
}

function assertSafeResponse(responseBody: unknown) {
  const serialized = JSON.stringify(responseBody);
  assert(!serialized.includes(process.cwd()), "response must not expose absolute cwd");
  assert(!serialized.includes("C:\\"), "response must not expose Windows absolute paths");
  assert(!serialized.includes("Error:"), "response must not expose stack error names");
  assert(!/\bat\s+/.test(serialized), "response must not expose stack traces");
}

async function expectStatus(label: string, response: Response, status: number) {
  const payload = await responseJson(response);
  assert.strictEqual(response.status, status, `${label}: expected ${status}, got ${response.status} with ${JSON.stringify(payload)}`);
  assertSafeResponse(payload);
  return payload;
}

async function seedStores() {
  const normalPlan = await prisma.plan.upsert({
    where: { type: "normal" },
    update: {
      name: "Normal",
      description: "Plan normal para pruebas PR-04",
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
      description: "Plan normal para pruebas PR-04",
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

  const [ownerA, ownerB] = await Promise.all(
    emails.map((email, index) =>
      prisma.user.create({
        data: {
          email,
          name: `PR04 Owner ${index + 1}`,
          passwordHash: "not-used",
          role: "USER"
        }
      })
    )
  );

  const [businessA, businessB] = await Promise.all([
    prisma.business.create({
      data: {
        ownerId: ownerA.id,
        planId: normalPlan.id,
        planType: "normal",
        name: `${runId} A`,
        slug: `${runId}-a`,
        publicSlug: `${runId}-a`,
        memberships: { create: { userId: ownerA.id, role: "STORE_OWNER" } }
      }
    }),
    prisma.business.create({
      data: {
        ownerId: ownerB.id,
        planId: normalPlan.id,
        planType: "normal",
        name: `${runId} B`,
        slug: `${runId}-b`,
        publicSlug: `${runId}-b`,
        memberships: { create: { userId: ownerB.id, role: "STORE_OWNER" } }
      }
    })
  ]);

  return {
    storeA: { id: businessA.id, ownerId: ownerA.id },
    storeB: { id: businessB.id, ownerId: ownerB.id }
  };
}

async function uploadValidImage(store: TestStore, token: string, fileName: string, ip: string) {
  const response = await uploadPost(uploadRequest(token, uploadForm(store.id, makeFile(fileName, "image/png", pngBytes)), ip));
  const payload = await expectStatus(`upload valido ${store.id}`, response, 200);
  assert.strictEqual(payload.ok, true, "valid upload must return ok");
  assert.match(String(payload.url), new RegExp(`^/uploads/businesses/${store.id}/images/[a-f0-9-]+\\.png$`));
  return String(payload.url);
}

async function main() {
  await cleanup();
  const { storeA, storeB } = await seedStores();
  const [tokenA, tokenB] = await Promise.all([createSessionToken(storeA.ownerId), createSessionToken(storeB.ownerId)]);

  await expectStatus(
    "subida sin sesion",
    await uploadPost(uploadRequest(null, uploadForm(storeA.id, makeFile("valid.png", "image/png", pngBytes)), "198.51.100.1")),
    401
  );

  const uploadedAUrl = await uploadValidImage(storeA, tokenA, "valid-a.png", "198.51.100.2");

  await expectStatus(
    "usuario A no sube a tienda B",
    await uploadPost(uploadRequest(tokenA, uploadForm(storeB.id, makeFile("valid-b.png", "image/png", pngBytes)), "198.51.100.3")),
    403
  );

  await expectStatus(
    "sin businessId explicito aunque exista cookie selected business",
    await uploadPost(
      new Request(`${BASE_URL}/api/uploads/image`, {
        method: "POST",
        headers: {
          "x-forwarded-for": "198.51.100.4",
          cookie: `catg_session=${tokenA}; catg_selected_business=${storeA.id}`
        },
        body: uploadForm(null, makeFile("valid.png", "image/png", pngBytes))
      })
    ),
    400
  );

  const tooLargeBytes = new Uint8Array(5 * 1024 * 1024 + 1);
  tooLargeBytes.set(pngBytes, 0);
  await expectStatus(
    "archivo demasiado grande",
    await uploadPost(uploadRequest(tokenA, uploadForm(storeA.id, makeFile("large.png", "image/png", tooLargeBytes)), "198.51.100.5")),
    413
  );

  await expectStatus(
    "mime no permitido",
    await uploadPost(uploadRequest(tokenA, uploadForm(storeA.id, makeFile("file.pdf", "application/pdf", pdfBytes)), "198.51.100.6")),
    400
  );

  await expectStatus(
    "svg rechazado",
    await uploadPost(uploadRequest(tokenA, uploadForm(storeA.id, makeFile("vector.svg", "image/svg+xml", svgBytes)), "198.51.100.7")),
    400
  );

  await expectStatus(
    "doble extension peligrosa",
    await uploadPost(uploadRequest(tokenA, uploadForm(storeA.id, makeFile("avatar.php.jpg", "image/jpeg", jpgBytes)), "198.51.100.8")),
    400
  );

  await expectStatus(
    "path traversal en nombre",
    await uploadPost(uploadRequest(tokenA, uploadForm(storeA.id, makeFile("../avatar.png", "image/png", pngBytes)), "198.51.100.9")),
    400
  );

  const uploadedBUrl = await uploadValidImage(storeB, tokenB, "valid-b.png", "198.51.100.10");

  await expectStatus(
    "usuario A no borra imagen de tienda B con businessId A",
    await uploadDelete(deleteRequest(tokenA, { businessId: storeA.id, url: uploadedBUrl }, "198.51.100.11")),
    403
  );

  await expectStatus(
    "delete sin businessId explicito falla",
    await uploadDelete(deleteRequest(tokenA, { url: uploadedAUrl }, "198.51.100.12")),
    400
  );

  let lastStatus = 0;
  for (let index = 0; index <= 30; index += 1) {
    const response = await uploadPost(uploadRequest(tokenA, uploadForm(storeA.id), "198.51.100.13"));
    lastStatus = response.status;
    if (index < 30 && response.status !== 400) {
      fail(`rate limit warmup ${index + 1} expected 400, got ${response.status}`);
    }
  }
  assert.strictEqual(lastStatus, 429, "rate limit must return 429 after the limit");

  await expectStatus(
    "cleanup delete A",
    await uploadDelete(deleteRequest(tokenA, { businessId: storeA.id, url: uploadedAUrl }, "198.51.100.14")),
    200
  );
  await expectStatus(
    "cleanup delete B",
    await uploadDelete(deleteRequest(tokenB, { businessId: storeB.id, url: uploadedBUrl }, "198.51.100.15")),
    200
  );

  console.log("PR-04 smoke tests passed");
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
