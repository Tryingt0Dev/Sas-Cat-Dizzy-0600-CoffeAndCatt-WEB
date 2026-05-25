import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { POST as aiPost } from "../app/api/ai/sales-assistant/route";
import { POST as trackPost } from "../app/api/catalog/track/route";
import { GET as slugRedirectGet } from "../app/api/store-slug-redirect/route";
import { POST as uploadPost } from "../app/api/uploads/image/route";
import { hasPlatformAccess, resolvePublicRegistrationRole } from "../lib/auth";
import { effectivePlanLimits } from "../services/plan-guard";

const prisma = new PrismaClient();
const runId = `sec-${Date.now()}`;
const emails = [`${runId}-a@example.com`, `${runId}-b@example.com`];

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function normalizePublicSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

async function cleanup() {
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
}

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

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

async function main() {
  await cleanup();

  process.env.PLATFORM_OWNER_EMAILS = emails[0];
  process.env.PLATFORM_OWNER_EMAILS_DEV_UNLOCK = "false";
  assert(resolvePublicRegistrationRole({}) === "USER", "Public signup without bootstrap must create USER");
  assert(!hasPlatformAccess({ email: emails[0], role: "USER" }), "PLATFORM_OWNER_EMAILS must not grant admin access");

  process.env.ADMIN_BOOTSTRAP_SECRET = "x".repeat(32);
  assert(
    resolvePublicRegistrationRole({ adminBootstrapSecret: process.env.ADMIN_BOOTSTRAP_SECRET }) === "SUPER_ADMIN",
    "Valid ADMIN_BOOTSTRAP_SECRET must create SUPER_ADMIN"
  );
  assert(
    effectivePlanLimits(null, { email: `${runId}-admin@example.com`, role: "PLATFORM_ADMIN" }).maxProducts === 999999,
    "PLATFORM_ADMIN must receive full effective plan limits"
  );

  const freePlan = await prisma.plan.upsert({
    where: { type: "FREE" },
    update: {
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
    create: {
      type: "FREE",
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
    }
  });

  const [userA, userB] = await Promise.all(
    emails.map((email, index) =>
      prisma.user.create({
        data: {
          email,
          name: `Security User ${index + 1}`,
          passwordHash: "not-used",
          role: "USER"
        }
      })
    )
  );

  assert(!hasPlatformAccess(userA), "Normal store owner must not access /admin");

  const businessA = await prisma.business.create({
    data: {
      ownerId: userA.id,
      planId: freePlan.id,
      planType: "FREE",
      name: `${runId} A`,
      slug: `${runId}-a`,
      publicSlug: `${runId}-a`,
      description: "Security smoke store A",
      memberships: { create: { userId: userA.id, role: "STORE_OWNER" } },
      aiSettings: { create: {} }
    }
  });
  const businessB = await prisma.business.create({
    data: {
      ownerId: userB.id,
      planId: freePlan.id,
      planType: "FREE",
      name: `${runId} B`,
      slug: `${runId}-b`,
      publicSlug: `${runId}-b`,
      description: "Security smoke store B",
      memberships: { create: { userId: userB.id, role: "STORE_OWNER" } },
      aiSettings: { create: {} }
    }
  });

  const categoryB = await prisma.category.create({
    data: { businessId: businessB.id, name: "Tenant B private category", slug: "tenant-b-private-category" }
  });
  const productB = await prisma.product.create({
    data: {
      businessId: businessB.id,
      categoryId: categoryB.id,
      name: "Tenant B private product",
      slug: "tenant-b-private-product",
      price: 1000,
      stock: 1,
      status: "ACTIVE"
    }
  });
  const customerB = await prisma.customer.create({
    data: { businessId: businessB.id, name: "Tenant B customer", phone: "+56900000000" }
  });
  const conversationB = await prisma.conversation.create({
    data: {
      businessId: businessB.id,
      customerId: customerB.id,
      visitorId: `${runId}-visitor-b`,
      messages: { create: [{ senderType: "CUSTOMER", content: "private B" }] }
    },
    include: { messages: true }
  });
  const quoteB = await prisma.quote.create({
    data: {
      businessId: businessB.id,
      customerId: customerB.id,
      status: "ACCEPTED",
      subtotal: productB.price,
      total: productB.price,
      items: { create: [{ productId: productB.id, name: productB.name, quantity: 1, unitPrice: productB.price, subtotal: productB.price }] }
    },
    include: { items: true }
  });
  const orderB = await prisma.order.create({
    data: {
      businessId: businessB.id,
      customerId: customerB.id,
      quoteId: quoteB.id,
      status: "PENDING",
      subtotal: productB.price,
      total: productB.price,
      items: { create: [{ productId: productB.id, name: productB.name, quantity: 1, unitPrice: productB.price, subtotal: productB.price }] }
    },
    include: { items: true }
  });

  assert(!(await prisma.product.findFirst({ where: { id: productB.id, businessId: businessA.id } })), "User A must not read products from B");
  assert(!(await prisma.customer.findFirst({ where: { id: customerB.id, businessId: businessA.id } })), "User A must not read customers from B");
  assert(!(await prisma.conversation.findFirst({ where: { id: conversationB.id, businessId: businessA.id } })), "User A must not read conversations from B");
  assert(!(await prisma.quote.findFirst({ where: { id: quoteB.id, businessId: businessA.id } })), "User A must not read quotes from B");
  assert(!(await prisma.order.findFirst({ where: { id: orderB.id, businessId: businessA.id } })), "User A must not read orders from B");
  assert(
    !(await prisma.message.findFirst({ where: { id: conversationB.messages[0].id, conversation: { businessId: businessA.id } } })),
    "User A must not read messages from B through conversation relation"
  );
  assert(
    !(await prisma.quoteItem.findFirst({ where: { id: quoteB.items[0].id, quote: { businessId: businessA.id } } })),
    "User A must not read quote items from B through quote relation"
  );
  assert(
    !(await prisma.orderItem.findFirst({ where: { id: orderB.items[0].id, order: { businessId: businessA.id } } })),
    "User A must not read order items from B through order relation"
  );

  for (const result of await Promise.all([
    prisma.product.updateMany({ where: { id: productB.id, businessId: businessA.id }, data: { name: "Compromised" } }),
    prisma.customer.updateMany({ where: { id: customerB.id, businessId: businessA.id }, data: { name: "Compromised" } }),
    prisma.quote.updateMany({ where: { id: quoteB.id, businessId: businessA.id }, data: { status: "REJECTED" } }),
    prisma.order.updateMany({ where: { id: orderB.id, businessId: businessA.id }, data: { status: "CANCELLED" } })
  ])) {
    assert(result.count === 0, "Cross-tenant update must affect 0 rows");
  }

  const aiRes = await aiPost(new Request(`${BASE_URL}/api/ai/sales-assistant`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      businessSlug: businessA.publicSlug,
      productId: productB.id,
      message: "Quiero consultar este producto de otra tienda"
    })
  }));
  assert(aiRes.status === 404, "AI API must reject productId from another store");

  const trackRes = await trackPost(new Request(`${BASE_URL}/api/catalog/track`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ businessSlug: businessA.publicSlug, productId: productB.id, event: "product_view" })
  }));
  assert(trackRes.status === 404, "Tracking API must reject productId from another store");

  const cookieA = await createSessionCookie(userA.id);
  const uploadForm = new FormData();
  uploadForm.set("businessId", businessB.id);
  const uploadRes = await uploadPost(new Request(`${BASE_URL}/api/uploads/image`, {
    method: "POST",
    headers: { cookie: cookieA },
    body: uploadForm
  }));
  assert(uploadRes.status === 403, "Upload API must reject businessId from another store");

  assert(normalizePublicSlug("Ropa Felipe Ñandú!") === "ropa-felipe-nandu", "Slug normalization failed");

  let duplicateRejected = false;
  try {
    await prisma.business.create({
      data: {
        ownerId: userB.id,
        planId: freePlan.id,
        planType: "FREE",
        name: "Duplicate slug",
        slug: `${runId}-duplicate`,
        publicSlug: businessA.publicSlug
      }
    });
  } catch {
    duplicateRejected = true;
  }
  assert(duplicateRejected, "Duplicate publicSlug must be rejected");

  const oldSlug = `${runId}-old`;
  await prisma.business.update({ where: { id: businessA.id }, data: { publicSlug: `${runId}-a-new` } });
  await prisma.businessSlugHistory.create({ data: { businessId: businessA.id, slug: oldSlug } });
  const slugRedirectRes = await slugRedirectGet(new Request(`${BASE_URL}/api/store-slug-redirect?slug=${oldSlug}`));
  const slugRedirect = (await slugRedirectRes.json()) as { redirectTo?: string | null };
  assert(slugRedirect.redirectTo === `${runId}-a-new`, "Old slug must resolve for 301 middleware redirect");

  await prisma.business.update({ where: { id: businessB.id }, data: { isActive: false } });
  const publicInactive = await prisma.business.findFirst({
    where: { publicSlug: businessB.publicSlug, isActive: true }
  });
  assert(!publicInactive, "Inactive stores must not resolve as public stores");

  await cleanup();
  console.log("Security smoke checks passed");
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
