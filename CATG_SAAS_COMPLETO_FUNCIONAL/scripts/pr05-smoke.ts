import crypto from "node:crypto";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db";
import { StoreRole, UserRole } from "@/lib/enums";
import { requireAdminPanelUser } from "@/lib/auth";
import {
  canManageBusiness,
  canManageUploads,
  canManageUsers,
  canViewDashboard,
  normalizeStoreRole
} from "@/lib/auth/permissions";
import {
  AuthenticationError,
  AuthorizationError,
  getStoreAccess,
  requireBusinessPermission,
  requireBusinessRole
} from "@/services/authorization";
import { POST as uploadPost, DELETE as uploadDelete } from "@/app/api/uploads/image/route";

const runId = `pr05-${Date.now()}`;
const BASE_URL = process.env.BASE_URL || "http://localhost";
const emails = {
  superAdmin: `${runId}-super@example.com`,
  ownerA: `${runId}-owner-a@example.com`,
  adminA: `${runId}-admin-a@example.com`,
  viewerA: `${runId}-viewer-a@example.com`,
  outsider: `${runId}-outsider@example.com`,
  ownerB: `${runId}-owner-b@example.com`
};
const allEmails = Object.values(emails);
const pngBytes = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);

function fail(message: string): never {
  throw new Error(message);
}

async function cleanup() {
  const users = await prisma.user.findMany({ where: { email: { in: allEmails } }, select: { id: true } });
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

function requestWithSession(token: string) {
  return new Request(`${BASE_URL}/test`, {
    headers: { cookie: `catg_session=${token}` }
  });
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

function uploadRequest(token: string, formData: FormData, ip: string, selectedBusinessId?: string) {
  const selectedCookie = selectedBusinessId ? `; catg_selected_business=${selectedBusinessId}` : "";
  return new Request(`${BASE_URL}/api/uploads/image`, {
    method: "POST",
    headers: {
      "x-forwarded-for": ip,
      cookie: `catg_session=${token}${selectedCookie}`
    },
    body: formData
  });
}

function deleteRequest(token: string, body: unknown, ip: string) {
  return new Request(`${BASE_URL}/api/uploads/image`, {
    method: "DELETE",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
      cookie: `catg_session=${token}`
    },
    body: JSON.stringify(body)
  });
}

async function responseJson(response: Response) {
  return response.json().catch(() => ({}));
}

async function assertThrows<T extends Error>(fn: () => Promise<unknown>, expectedClass: new (...args: never[]) => T, label: string) {
  try {
    await fn();
  } catch (error) {
    assert(error instanceof expectedClass, `${label}: expected ${expectedClass.name}, got ${error instanceof Error ? error.constructor.name : String(error)}`);
    return;
  }
  fail(`${label}: expected ${expectedClass.name}`);
}

async function assertRedirects(fn: () => Promise<unknown>, label: string) {
  try {
    await fn();
  } catch (error) {
    const digest = error instanceof Error ? String((error as Error & { digest?: unknown }).digest ?? error.message) : String(error);
    assert(digest.includes("NEXT_REDIRECT"), `${label}: expected NEXT_REDIRECT, got ${digest}`);
    return;
  }
  fail(`${label}: expected redirect`);
}

async function seed() {
  const normalPlan = await prisma.plan.upsert({
    where: { type: "normal" },
    update: {
      name: "Normal",
      description: "Plan normal para pruebas PR-05",
      maxProducts: 50,
      maxImages: 100,
      maxCategories: 20,
      maxAiConversationsMonthly: 100,
      maxUsers: 5,
      maxMembers: 5,
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
      description: "Plan normal para pruebas PR-05",
      maxProducts: 50,
      maxImages: 100,
      maxCategories: 20,
      maxAiConversationsMonthly: 100,
      maxUsers: 5,
      maxMembers: 5,
      maxStores: 1,
      maxTemplates: 4,
      aiEnabled: true,
      advancedBranding: true,
      quotesAndOrders: true,
      customDomain: false
    }
  });

  const users = await prisma.$transaction([
    prisma.user.create({
      data: { email: emails.superAdmin, name: "PR05 Super", passwordHash: "not-used", role: UserRole.SUPER_ADMIN }
    }),
    prisma.user.create({
      data: { email: emails.ownerA, name: "PR05 Owner A", passwordHash: "not-used", role: UserRole.USER }
    }),
    prisma.user.create({
      data: { email: emails.adminA, name: "PR05 Admin A", passwordHash: "not-used", role: UserRole.USER }
    }),
    prisma.user.create({
      data: { email: emails.viewerA, name: "PR05 Viewer A", passwordHash: "not-used", role: UserRole.USER }
    }),
    prisma.user.create({
      data: { email: emails.outsider, name: "PR05 Outsider", passwordHash: "not-used", role: UserRole.USER }
    }),
    prisma.user.create({
      data: { email: emails.ownerB, name: "PR05 Owner B", passwordHash: "not-used", role: UserRole.USER }
    })
  ]);

  const [superAdmin, ownerA, adminA, viewerA, outsider, ownerB] = users;

  const [businessA, businessB] = await Promise.all([
    prisma.business.create({
      data: {
        ownerId: ownerA.id,
        planId: normalPlan.id,
        planType: "normal",
        name: `${runId} A`,
        slug: `${runId}-a`,
        publicSlug: `${runId}-a`,
        memberships: {
          create: [
            { userId: ownerA.id, role: StoreRole.STORE_OWNER },
            { userId: adminA.id, role: StoreRole.STORE_ADMIN },
            { userId: viewerA.id, role: StoreRole.VIEWER }
          ]
        }
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
        memberships: { create: { userId: ownerB.id, role: StoreRole.STORE_OWNER } }
      }
    })
  ]);

  const tokens = {
    superAdmin: await createSessionToken(superAdmin.id),
    ownerA: await createSessionToken(ownerA.id),
    adminA: await createSessionToken(adminA.id),
    viewerA: await createSessionToken(viewerA.id),
    outsider: await createSessionToken(outsider.id),
    ownerB: await createSessionToken(ownerB.id)
  };

  return { users: { superAdmin, ownerA, adminA, viewerA, outsider, ownerB }, businessA, businessB, tokens };
}

async function main() {
  await cleanup();
  const { businessA, businessB, tokens } = await seed();

  const superAdmin = await requireAdminPanelUser(requestWithSession(tokens.superAdmin));
  assert.strictEqual(superAdmin.role, UserRole.SUPER_ADMIN, "SUPER_ADMIN must access global admin");

  await assertRedirects(
    () => requireAdminPanelUser(requestWithSession(tokens.outsider)),
    "plain USER cannot access global admin"
  );
  await assertRedirects(
    () => requireAdminPanelUser(requestWithSession(tokens.ownerA)),
    "store OWNER membership cannot access global admin"
  );

  assert.strictEqual(normalizeStoreRole(StoreRole.OWNER), StoreRole.STORE_OWNER, "legacy OWNER store role must normalize");
  assert(canViewDashboard(StoreRole.VIEWER), "VIEWER can view dashboard");
  assert(canManageBusiness(StoreRole.STORE_OWNER), "OWNER can manage business");
  assert(canManageUsers(StoreRole.STORE_OWNER), "OWNER can manage users");
  assert(canManageUploads(StoreRole.STORE_MANAGER), "MANAGER can manage uploads");
  assert(!canManageUploads(StoreRole.VIEWER), "VIEWER cannot manage uploads");

  const ownerSettings = await requireBusinessPermission(businessA.id, "manage_settings", requestWithSession(tokens.ownerA));
  assert.strictEqual(ownerSettings.storeRole, StoreRole.STORE_OWNER, "OWNER can change settings");

  const adminProducts = await requireBusinessPermission(businessA.id, "manage_products", requestWithSession(tokens.adminA));
  assert.strictEqual(adminProducts.storeRole, StoreRole.STORE_ADMIN, "ADMIN can manage products");

  const adminExactRole = await requireBusinessRole(businessA.id, [StoreRole.STORE_OWNER, StoreRole.STORE_ADMIN], requestWithSession(tokens.adminA));
  assert.strictEqual(adminExactRole.storeRole, StoreRole.STORE_ADMIN, "ADMIN satisfies explicit business role guard");

  await assertThrows(
    () => requireBusinessPermission(businessA.id, "manage_products", requestWithSession(tokens.viewerA)),
    AuthorizationError,
    "VIEWER cannot manage products"
  );
  await assertThrows(
    () => requireBusinessPermission(businessA.id, "manage_uploads", requestWithSession(tokens.viewerA)),
    AuthorizationError,
    "VIEWER cannot manage uploads"
  );
  await assertThrows(
    () => requireBusinessPermission(businessA.id, "manage_settings", requestWithSession(tokens.viewerA)),
    AuthorizationError,
    "VIEWER cannot manage settings"
  );
  await assertThrows(
    () => requireBusinessPermission(businessB.id, "view_dashboard", requestWithSession(tokens.adminA)),
    AuthorizationError,
    "user from store A cannot access store B"
  );
  await assertThrows(
    () => requireBusinessPermission(businessA.id, "view_dashboard", requestWithSession(tokens.outsider)),
    AuthorizationError,
    "user without membership cannot access store"
  );
  await assertThrows(
    () => getStoreAccess({ request: requestWithSession(tokens.adminA), permission: "view_dashboard", requireExplicitBusiness: true }),
    AuthorizationError,
    "sensitive guard requires explicit businessId"
  );
  await assertThrows(
    () => getStoreAccess({ request: new Request(`${BASE_URL}/test`), businessId: businessA.id, permission: "view_dashboard", requireExplicitBusiness: true }),
    AuthenticationError,
    "business guard requires auth"
  );

  const uploadResponse = await uploadPost(
    uploadRequest(tokens.adminA, uploadForm(businessA.id, makeFile("pr05.png", "image/png", pngBytes)), "203.0.113.51")
  );
  const uploadPayload = await responseJson(uploadResponse);
  assert.strictEqual(uploadResponse.status, 200, `ADMIN upload should work: ${JSON.stringify(uploadPayload)}`);
  assert.match(String(uploadPayload.url), new RegExp(`^/uploads/businesses/${businessA.id}/images/`));

  const viewerUploadResponse = await uploadPost(
    uploadRequest(tokens.viewerA, uploadForm(businessA.id, makeFile("viewer.png", "image/png", pngBytes)), "203.0.113.52")
  );
  assert.strictEqual(viewerUploadResponse.status, 403, "VIEWER upload must fail");

  const implicitUploadResponse = await uploadPost(
    uploadRequest(tokens.adminA, uploadForm(null, makeFile("implicit.png", "image/png", pngBytes)), "203.0.113.53", businessA.id)
  );
  assert.strictEqual(implicitUploadResponse.status, 400, "upload must require explicit businessId even with selected business cookie");

  const deleteResponse = await uploadDelete(
    deleteRequest(tokens.adminA, { businessId: businessA.id, url: uploadPayload.url }, "203.0.113.54")
  );
  assert.strictEqual(deleteResponse.status, 200, "ADMIN can delete own store upload");

  console.log("PR-05 smoke tests passed");
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
