import assert from "node:assert/strict";
import { prisma } from "@/lib/db";
import { ProductStatus } from "@/lib/enums";
import { POST as aiPost } from "@/app/api/ai/sales-assistant/route";

const runId = `pr03-${Date.now()}`;
const BASE_URL = process.env.BASE_URL || "http://localhost";
const ownerAEmail = `${runId}-owner-a@example.com`;
const ownerBEmail = `${runId}-owner-b@example.com`;
const emails = [ownerAEmail, ownerBEmail];

type TestStore = {
  business: { id: string; publicSlug: string };
  product: { id: string; name: string };
};

function aiRequest(body: unknown, ip: string, cookie?: string, method = "POST") {
  const bodyAllowed = method !== "GET" && method !== "HEAD";
  return new Request(`${BASE_URL}/api/ai/sales-assistant`, {
    method,
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
      ...(cookie ? { cookie } : {})
    },
    body: bodyAllowed ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined
  });
}

async function responseJson(response: Response) {
  return response.json().catch(() => ({}));
}

async function expectStatus(label: string, request: Request, status: number) {
  const response = await aiPost(request);
  assert.strictEqual(response.status, status, `${label}: expected ${status}, got ${response.status}`);
  return response;
}

async function cleanup() {
  const users = await prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true } });
  const userIds = users.map((user) => user.id);
  if (userIds.length > 0) {
    await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
}

async function seedStores() {
  const normalPlan = await prisma.plan.upsert({
    where: { type: "normal" },
    update: {
      name: "Normal",
      description: "Plan normal para pruebas PR-03",
      maxProducts: 50,
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
      description: "Plan normal para pruebas PR-03",
      maxProducts: 50,
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
          name: `PR03 Owner ${index + 1}`,
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
        name: `${runId} Tienda A`,
        slug: `${runId}-a`,
        publicSlug: `${runId}-a`,
        description: "Descripcion publica tienda A",
        aiSettings: {
          create: {
            allowAutoLead: false,
            humanHandoffEnabled: false,
            fallbackMessage: "No tengo esa informacion exacta en el catalogo."
          }
        },
        memberships: { create: { userId: ownerA.id, role: "STORE_OWNER" } }
      }
    }),
    prisma.business.create({
      data: {
        ownerId: ownerB.id,
        planId: normalPlan.id,
        planType: "normal",
        name: `${runId} Tienda B`,
        slug: `${runId}-b`,
        publicSlug: `${runId}-b`,
        description: "Descripcion publica tienda B",
        aiSettings: {
          create: {
            allowAutoLead: false,
            humanHandoffEnabled: false,
            fallbackMessage: "No tengo esa informacion exacta en el catalogo."
          }
        },
        memberships: { create: { userId: ownerB.id, role: "STORE_OWNER" } }
      }
    })
  ]);

  const [categoryA, categoryB] = await Promise.all([
    prisma.category.create({ data: { businessId: businessA.id, name: "Publica A", slug: "publica-a" } }),
    prisma.category.create({ data: { businessId: businessB.id, name: "Publica B", slug: "publica-b" } })
  ]);

  const [productA, productB] = await Promise.all([
    prisma.product.create({
      data: {
        businessId: businessA.id,
        categoryId: categoryA.id,
        name: `${runId} Luminaria A`,
        slug: `${runId}-luminaria-a`,
        sku: `${runId}-SKU-A`,
        description: "Producto publico de tienda A",
        price: 12990,
        costPrice: 100,
        discountPercent: 10,
        stock: 7,
        status: ProductStatus.ACTIVE,
        tags: "interno-a"
      }
    }),
    prisma.product.create({
      data: {
        businessId: businessB.id,
        categoryId: categoryB.id,
        name: `${runId} Caja Privada B`,
        slug: `${runId}-caja-privada-b`,
        sku: `${runId}-SKU-B`,
        description: "Producto publico de tienda B",
        price: 99990,
        costPrice: 1,
        discountPercent: 0,
        stock: 3,
        status: ProductStatus.ACTIVE,
        tags: "interno-b"
      }
    })
  ]);

  return {
    storeA: { business: businessA, product: productA },
    storeB: { business: businessB, product: productB }
  };
}

async function assertValidStoreAWorks(storeA: TestStore) {
  const response = await expectStatus(
    "request valido tienda A",
    aiRequest(
      {
        businessSlug: ` ${storeA.business.publicSlug.toUpperCase()} `,
        message: `Hola, quiero ${storeA.product.name}`,
        visitorId: `${runId}-valid-visitor`
      },
      "203.0.113.10"
    ),
    200
  );
  const payload = await responseJson(response);
  assert.strictEqual(payload.ok, true, "valid response must be ok");
  assert.match(String(payload.answer), new RegExp(storeA.product.name), "valid response must mention product A");
  return payload;
}

async function main() {
  const previousDeepSeekKey = process.env.DEEPSEEK_API_KEY;
  process.env.DEEPSEEK_API_KEY = "";
  await cleanup();

  const { storeA, storeB } = await seedStores();

  await expectStatus("businessSlug vacio", aiRequest({ businessSlug: "   ", message: "Hola" }, "203.0.113.1"), 400);
  await expectStatus("mensaje vacio", aiRequest({ businessSlug: storeA.business.publicSlug, message: "   " }, "203.0.113.2"), 400);
  await expectStatus(
    "mensaje demasiado largo",
    aiRequest({ businessSlug: storeA.business.publicSlug, message: "x".repeat(1201) }, "203.0.113.3"),
    400
  );
  await expectStatus("json invalido", aiRequest("{", "203.0.113.4"), 400);
  await expectStatus("metodo no POST", aiRequest({ businessSlug: storeA.business.publicSlug, message: "Hola" }, "203.0.113.5", undefined, "GET"), 405);
  await expectStatus("tienda inexistente", aiRequest({ businessSlug: `${runId}-missing`, message: "Hola" }, "203.0.113.6"), 404);

  await expectStatus(
    "producto B no pertenece a tienda A",
    aiRequest({ businessSlug: storeA.business.publicSlug, message: "Consulta producto cruzado", productId: storeB.product.id }, "203.0.113.7"),
    404
  );

  const cookieResponse = await expectStatus(
    "cookie selected business no decide tenant",
    aiRequest(
      {
        businessSlug: storeA.business.publicSlug,
        message: `Tienes ${storeB.product.name}?`,
        visitorId: `${runId}-cookie-visitor`
      },
      "203.0.113.8",
      `catg_selected_business=${storeB.business.id}`
    ),
    200
  );
  const cookiePayload = await responseJson(cookieResponse);
  assert(!JSON.stringify(cookiePayload).includes(storeB.product.name), "response must not include product B when businessSlug is A");

  const validPayload = await assertValidStoreAWorks(storeA);
  const serializedValidPayload = JSON.stringify(validPayload);
  for (const forbidden of ["costPrice", "margin", "owner", ownerAEmail, ownerBEmail, "passwordHash", "token", "secret", storeB.product.name]) {
    assert(!serializedValidPayload.includes(forbidden), `valid response leaked forbidden field/value: ${forbidden}`);
  }

  let lastStatus = 0;
  for (let index = 0; index <= 10; index += 1) {
    const response = await aiPost(
      aiRequest(
        {
          businessSlug: storeA.business.publicSlug,
          message: `Consulta rate limit ${index}`,
          visitorId: `${runId}-rate-visitor`
        },
        "203.0.113.20"
      )
    );
    lastStatus = response.status;
    if (index < 10) {
      assert.strictEqual(response.status, 200, `rate limit warmup ${index + 1} should pass`);
    }
  }
  assert.strictEqual(lastStatus, 429, "rate limit must return 429 after the limit");

  process.env.DEEPSEEK_API_KEY = previousDeepSeekKey;
  console.log("PR-03 smoke tests passed");
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
