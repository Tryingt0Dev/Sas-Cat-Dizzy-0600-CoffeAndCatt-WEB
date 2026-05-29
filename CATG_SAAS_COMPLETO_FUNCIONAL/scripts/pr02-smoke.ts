import crypto from "crypto";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db";
import { AuthenticationError, AuthorizationError, getStoreAccess } from "@/services/authorization";
import { requireExplicitStoreAccess } from "@/lib/auth/guards";
import { POST as uploadPost, DELETE as uploadDelete } from "@/app/api/uploads/image/route";
import { POST as billingPortalPost } from "@/app/api/billing/portal/route";
import { POST as billingCheckoutPost } from "@/app/api/billing/checkout/route";

const runId = `pr02-${Date.now()}`;
const emails = [`${runId}-user-a@example.com`, `${runId}-owner-a@example.com`, `${runId}-user-b@example.com`];
const BASE_URL = process.env.BASE_URL || "http://localhost";

function fail(message: string): never {
  throw new Error(message);
}

function assertThrows<T extends Error>(fn: () => Promise<unknown>, expectedClass: new (...args: any[]) => T, expectedMessage?: string) {
  return fn()
    .then(() => fail(`Expected ${expectedClass.name} to be thrown`))
    .catch((error) => {
      if (!(error instanceof Error)) {
        throw new Error(`Expected exception instance, received ${String(error)}`);
      }
      assert(error instanceof expectedClass, `Expected ${expectedClass.name}, got ${error.constructor.name}`);
      if (expectedMessage !== undefined) {
        assert.strictEqual(error.message, expectedMessage, `Expected message '${expectedMessage}', got '${error.message}'`);
      }
    });
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

async function main() {
  await cleanup();

  const normalPlan = await prisma.plan.upsert({
    where: { type: "normal" },
    update: {
      name: "Normal",
      description: "Plan normal para pruebas de aislamiento multi-tenant",
      maxProducts: 50,
      maxCategories: 20,
      maxAiConversationsMonthly: 100,
      maxUsers: 1,
      maxMembers: 1,
      maxStores: 1,
      maxTemplates: 4,
      advancedBranding: true,
      quotesAndOrders: true,
      customDomain: false
    },
    create: {
      type: "normal",
      name: "Normal",
      description: "Plan normal para pruebas de aislamiento multi-tenant",
      maxProducts: 50,
      maxCategories: 20,
      maxAiConversationsMonthly: 100,
      maxUsers: 1,
      maxMembers: 1,
      maxStores: 1,
      maxTemplates: 4,
      advancedBranding: true,
      quotesAndOrders: true,
      customDomain: false
    }
  });

  const [userA, userOwnerA, userB] = await Promise.all(
    emails.map((email, index) =>
      prisma.user.create({
        data: {
          email,
          name: `PR02 User ${index + 1}`,
          passwordHash: "not-used",
          role: "USER"
        }
      })
    )
  );

  const [businessA, businessB] = await Promise.all([
    prisma.business.create({
      data: {
        ownerId: userOwnerA.id,
        planId: normalPlan.id,
        planType: "normal",
        name: `${runId} A`,
        slug: `${runId}-a`,
        publicSlug: `${runId}-a`,
        description: "PR02 store A",
        memberships: {
          create: [
            { userId: userOwnerA.id, role: "STORE_OWNER" },
            { userId: userA.id, role: "STORE_STAFF" }
          ]
        }
      }
    }),
    prisma.business.create({
      data: {
        ownerId: userB.id,
        planId: normalPlan.id,
        planType: "normal",
        name: `${runId} B`,
        slug: `${runId}-b`,
        publicSlug: `${runId}-b`,
        description: "PR02 store B",
        memberships: { create: { userId: userB.id, role: "STORE_OWNER" } }
      }
    })
  ]);

  const tokenA = await createSessionToken(userA.id);
  const tokenOwnerA = await createSessionToken(userOwnerA.id);

  const requestAWithCookie = new Request(`${BASE_URL}/api/test`, {
    headers: {
      cookie: `catg_session=${tokenA}; catg_selected_business=${businessA.id}`
    }
  });

  const requestInvalidSession = new Request(`${BASE_URL}/api/test`, {
    headers: {
      cookie: `catg_session=invalid; catg_selected_business=${businessA.id}`
    }
  });

  const accessA = await getStoreAccess({
    request: requestAWithCookie,
    businessId: businessA.id,
    permission: "view_dashboard",
    requireExplicitBusiness: true
  });

  assert.strictEqual(accessA.business.id, businessA.id, "User A should access explicit Business A");
  assert.strictEqual(accessA.storeRole, "STORE_STAFF", "User A should be STORE_STAFF in Business A");

  const explicitA = await requireExplicitStoreAccess(businessA.id, "view_dashboard", requestAWithCookie);
  assert.strictEqual(explicitA.business.id, businessA.id, "requireExplicitStoreAccess must allow explicit Business A");

  await assertThrows(
    () => getStoreAccess({ request: requestInvalidSession, businessId: businessA.id, permission: "view_dashboard", requireExplicitBusiness: true }),
    AuthenticationError
  );

  await assertThrows(
    () => getStoreAccess({ request: requestAWithCookie, permission: "view_dashboard", requireExplicitBusiness: true }),
    AuthorizationError,
    "Tienda obligatoria"
  );

  await assertThrows(
    () => getStoreAccess({ request: requestAWithCookie, businessId: businessB.id, permission: "view_dashboard", requireExplicitBusiness: true }),
    AuthorizationError
  );

  await assertThrows(
    () => getStoreAccess({ request: requestAWithCookie, businessId: businessA.id, permission: "manage_settings", requireExplicitBusiness: true }),
    AuthorizationError
  );

  const uploaderFormA = new FormData();
  uploaderFormA.set("businessId", businessA.id);

  const uploadResponseA = await uploadPost(
    new Request(`${BASE_URL}/api/uploads/image`, {
      method: "POST",
      headers: { cookie: `catg_session=${tokenOwnerA}` },
      body: uploaderFormA
    })
  );
  assert.strictEqual(uploadResponseA.status, 400, "Upload API must authorize explicit business A and then fail on missing file");

  const uploaderFormWrong = new FormData();
  uploaderFormWrong.set("businessId", businessB.id);

  const uploadResponseWrong = await uploadPost(
    new Request(`${BASE_URL}/api/uploads/image`, {
      method: "POST",
      headers: { cookie: `catg_session=${tokenA}` },
      body: uploaderFormWrong
    })
  );
  assert.strictEqual(uploadResponseWrong.status, 403, "Upload API must reject explicit business B for User A");

  const deleteResponseA = await uploadDelete(
    new Request(`${BASE_URL}/api/uploads/image`, {
      method: "DELETE",
      headers: {
        cookie: `catg_session=${tokenOwnerA}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ businessId: businessA.id, url: `/uploads/${businessA.id}/file.jpg` })
    })
  );
  assert.strictEqual(deleteResponseA.status, 200, "Delete API must authorize explicit business A for owner");

  const deleteResponseWrong = await uploadDelete(
    new Request(`${BASE_URL}/api/uploads/image`, {
      method: "DELETE",
      headers: {
        cookie: `catg_session=${tokenA}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ businessId: businessB.id, url: `/uploads/${businessB.id}/file.jpg` })
    })
  );
  assert.strictEqual(deleteResponseWrong.status, 403, "Delete API must reject explicit business B for User A");

  const portalResponseA = await billingPortalPost(
    new Request(`${BASE_URL}/api/billing/portal`, {
      method: "POST",
      headers: {
        cookie: `catg_session=${tokenOwnerA}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ businessId: businessA.id })
    })
  );
  assert.strictEqual(portalResponseA.status, 501, "Billing portal must authorize explicit business A and reach provider stub");

  const portalResponseWrong = await billingPortalPost(
    new Request(`${BASE_URL}/api/billing/portal`, {
      method: "POST",
      headers: {
        cookie: `catg_session=${tokenA}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ businessId: businessB.id })
    })
  );
  assert.strictEqual(portalResponseWrong.status, 403, "Billing portal must reject explicit business B for User A");

  const checkoutResponseA = await billingCheckoutPost(
    new Request(`${BASE_URL}/api/billing/checkout`, {
      method: "POST",
      headers: {
        cookie: `catg_session=${tokenOwnerA}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ businessId: businessA.id, planType: "normal" })
    })
  );
  assert.strictEqual(checkoutResponseA.status, 501, "Billing checkout must authorize explicit business A and reach provider stub");

  const checkoutResponseWrong = await billingCheckoutPost(
    new Request(`${BASE_URL}/api/billing/checkout`, {
      method: "POST",
      headers: {
        cookie: `catg_session=${tokenA}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ businessId: businessB.id, planType: "normal" })
    })
  );
  assert.strictEqual(checkoutResponseWrong.status, 403, "Billing checkout must reject explicit business B for User A");

  console.log("PR-02 smoke tests passed");
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
