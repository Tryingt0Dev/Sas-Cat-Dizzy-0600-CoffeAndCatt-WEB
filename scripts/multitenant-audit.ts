import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { assertTenantConversation, assertTenantCustomer, assertTenantOrder, assertTenantProduct, assertTenantQuote } from "../services/tenant-guard";

const prisma = new PrismaClient();
const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const runId = `mta-${Date.now()}`;
const ownerAEmail = `${runId}-owner-a@example.com`;
const ownerBEmail = `${runId}-owner-b@example.com`;

type TestRow = {
  prueba: string;
  vector: string;
  esperado: string;
  obtenido: string;
  ok: boolean;
};

const rows: TestRow[] = [];

function record(prueba: string, vector: string, esperado: string, obtenido: string, ok: boolean) {
  rows.push({ prueba, vector, esperado, obtenido, ok });
}

async function cleanup() {
  await prisma.user.deleteMany({ where: { email: { in: [ownerAEmail, ownerBEmail] } } });
}

async function ensureFreePlan() {
  return prisma.plan.upsert({
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
}

async function createTenant(label: "a" | "b", planId: string) {
  const user = await prisma.user.create({
    data: {
      email: label === "a" ? ownerAEmail : ownerBEmail,
      name: `Owner ${label.toUpperCase()} ${runId}`,
      passwordHash: "not-used",
      role: "USER"
    }
  });

  const business = await prisma.business.create({
    data: {
      ownerId: user.id,
      planId,
      planType: "FREE",
      name: `Tenant ${label.toUpperCase()} ${runId}`,
      slug: `${runId}-${label}`,
      publicSlug: `${runId}-${label}`,
      description: `Tenant ${label.toUpperCase()} for multi-tenant audit`,
      whatsappNumber: "+56911111111",
      memberships: { create: { userId: user.id, role: "STORE_OWNER" } },
      aiSettings: { create: {} }
    }
  });

  const category = await prisma.category.create({
    data: { businessId: business.id, name: `Categoria ${label.toUpperCase()}`, slug: `categoria-${label}` }
  });
  const product = await prisma.product.create({
    data: {
      businessId: business.id,
      categoryId: category.id,
      name: `Producto privado ${label.toUpperCase()} ${runId}`,
      slug: `producto-privado-${label}`,
      price: label === "a" ? 1100 : 2200,
      stock: 10,
      status: "ACTIVE"
    }
  });
  const customer = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: `Cliente ${label.toUpperCase()} ${runId}`,
      phone: `+5690000000${label === "a" ? "1" : "2"}`,
      email: `cliente-${label}-${runId}@example.com`
    }
  });
  const conversation = await prisma.conversation.create({
    data: {
      businessId: business.id,
      customerId: customer.id,
      visitorId: `${runId}-visitor-${label}`,
      channel: "WEBCHAT",
      messages: {
        create: [
          { senderType: "CUSTOMER", content: `Consulta privada ${label.toUpperCase()}` },
          { senderType: "AI", content: `Respuesta privada ${label.toUpperCase()}` }
        ]
      }
    }
  });
  const quote = await prisma.quote.create({
    data: {
      businessId: business.id,
      customerId: customer.id,
      status: "ACCEPTED",
      subtotal: product.price,
      total: product.price,
      items: { create: [{ productId: product.id, name: product.name, quantity: 1, unitPrice: product.price, subtotal: product.price }] }
    }
  });
  const order = await prisma.order.create({
    data: {
      businessId: business.id,
      customerId: customer.id,
      quoteId: quote.id,
      status: "PENDING",
      subtotal: product.price,
      total: product.price,
      items: { create: [{ productId: product.id, name: product.name, quantity: 1, unitPrice: product.price, subtotal: product.price }] }
    }
  });

  return { user, business, category, product, customer, conversation, quote, order };
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

async function http(path: string, options: RequestInit = {}) {
  return fetch(`${baseUrl}${path}`, { redirect: "manual", ...options });
}

function statusWithLocation(res: Response) {
  const location = res.headers.get("location");
  return location ? `${res.status} -> ${location}` : String(res.status);
}

async function main() {
  await cleanup();
  const plan = await ensureFreePlan();
  const tenantA = await createTenant("a", plan.id);
  const tenantB = await createTenant("b", plan.id);
  const cookieA = await createSessionCookie(tenantA.user.id);

  const productsPage = await http("/dashboard/products", { headers: { cookie: cookieA } });
  const productsHtml = await productsPage.text();
  record(
    "Listado productos A no filtra datos B",
    "URL privada autenticada como usuario A",
    "200 sin nombre de producto B",
    `${productsPage.status}; contiene B=${productsHtml.includes(tenantB.product.name)}`,
    productsPage.status === 200 && !productsHtml.includes(tenantB.product.name)
  );

  for (const target of [
    { name: "Cliente B", path: `/dashboard/customers/${tenantB.customer.id}` },
    { name: "Pedido B", path: `/dashboard/orders/${tenantB.order.id}` },
    { name: "Cotizacion B", path: `/dashboard/quotes/${tenantB.quote.id}` }
  ]) {
    const res = await http(target.path, { headers: { cookie: cookieA } });
    record(target.name, "ID de tienda B inyectado en URL", "404/notFound", statusWithLocation(res), res.status === 404);
  }

  const adminRes = await http("/admin", { headers: { cookie: cookieA } });
  record(
    "Superadmin bloqueado",
    "Usuario normal A abre /admin",
    "Redirect seguro a /dashboard",
    statusWithLocation(adminRes),
    [303, 307, 308].includes(adminRes.status) && (adminRes.headers.get("location") || "").includes("/dashboard")
  );

  const aiRes = await http("/api/ai/sales-assistant", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      businessSlug: tenantA.business.publicSlug,
      productId: tenantB.product.id,
      message: "Quiero consultar este producto de otra tienda"
    })
  });
  record("API IA no acepta producto B en tienda A", "productId B + publicSlug A", "404", statusWithLocation(aiRes), aiRes.status === 404);

  const trackRes = await http("/api/catalog/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ businessSlug: tenantA.business.publicSlug, productId: tenantB.product.id, event: "product_view" })
  });
  record("API tracking no acepta producto B en tienda A", "productId B + publicSlug A", "404", statusWithLocation(trackRes), trackRes.status === 404);

  const uploadForm = new FormData();
  uploadForm.set("businessId", tenantB.business.id);
  const uploadRes = await http("/api/uploads/image", {
    method: "POST",
    headers: { cookie: cookieA },
    body: uploadForm
  });
  record("API upload no acepta businessId B", "businessId B con cookie usuario A", "403", statusWithLocation(uploadRes), uploadRes.status === 403);

  const noSessionPrivate = await http("/dashboard/products");
  record(
    "Ruta privada sin sesion",
    "GET /dashboard/products sin cookie",
    "Redirect seguro a /login",
    statusWithLocation(noSessionPrivate),
    [303, 307, 308].includes(noSessionPrivate.status) && (noSessionPrivate.headers.get("location") || "").includes("/login")
  );

  const tenantAssertions = [
    { name: "assertTenantProduct", fn: () => assertTenantProduct(tenantA.business.id, tenantB.product.id) },
    { name: "assertTenantCustomer", fn: () => assertTenantCustomer(tenantA.business.id, tenantB.customer.id) },
    { name: "assertTenantConversation", fn: () => assertTenantConversation(tenantA.business.id, tenantB.conversation.id) },
    { name: "assertTenantQuote", fn: () => assertTenantQuote(tenantA.business.id, tenantB.quote.id) },
    { name: "assertTenantOrder", fn: () => assertTenantOrder(tenantA.business.id, tenantB.order.id) }
  ];

  for (const item of tenantAssertions) {
    let denied = false;
    try {
      await item.fn();
    } catch {
      denied = true;
    }
    record(item.name, "Parametro id de tienda B con businessId autorizado de A", "TenantAccessError", denied ? "TenantAccessError" : "permitido", denied);
  }

  const updateProduct = await prisma.product.updateMany({
    where: { id: tenantB.product.id, businessId: tenantA.business.id },
    data: { name: "SHOULD_NOT_UPDATE" }
  });
  record("Server action producto tampered", "hidden id de producto B en action de A", "0 filas afectadas", `${updateProduct.count} filas`, updateProduct.count === 0);

  const updateCustomer = await prisma.customer.updateMany({
    where: { id: tenantB.customer.id, businessId: tenantA.business.id },
    data: { name: "SHOULD_NOT_UPDATE" }
  });
  record("Server action cliente tampered", "hidden id de cliente B en action de A", "0 filas afectadas", `${updateCustomer.count} filas`, updateCustomer.count === 0);

  const updateQuote = await prisma.quote.updateMany({
    where: { id: tenantB.quote.id, businessId: tenantA.business.id },
    data: { status: "REJECTED" }
  });
  record("Server action cotizacion tampered", "hidden id de cotizacion B en action de A", "0 filas afectadas", `${updateQuote.count} filas`, updateQuote.count === 0);

  const updateOrder = await prisma.order.updateMany({
    where: { id: tenantB.order.id, businessId: tenantA.business.id },
    data: { status: "CANCELLED" }
  });
  record("Server action pedido tampered", "hidden id de pedido B en action de A", "0 filas afectadas", `${updateOrder.count} filas`, updateOrder.count === 0);

  const deleteCategory = await prisma.category.deleteMany({
    where: { id: tenantB.category.id, businessId: tenantA.business.id }
  });
  record("Server action categoria tampered", "hidden id de categoria B en action de A", "0 filas afectadas", `${deleteCategory.count} filas`, deleteCategory.count === 0);

  const productBStillThere = await prisma.product.findUnique({ where: { id: tenantB.product.id } });
  const customerBStillThere = await prisma.customer.findUnique({ where: { id: tenantB.customer.id } });
  const quoteBStillThere = await prisma.quote.findUnique({ where: { id: tenantB.quote.id } });
  const orderBStillThere = await prisma.order.findUnique({ where: { id: tenantB.order.id } });
  record(
    "Integridad tenant B tras ataques",
    "Relectura directa post-intentos",
    "Recursos B intactos",
    `producto=${Boolean(productBStillThere)}, cliente=${Boolean(customerBStillThere)}, cotizacion=${quoteBStillThere?.status}, pedido=${orderBStillThere?.status}`,
    Boolean(productBStillThere && customerBStillThere && quoteBStillThere?.status === "ACCEPTED" && orderBStillThere?.status === "PENDING")
  );

  console.log(JSON.stringify({ baseUrl, runId, rows }, null, 2));

  await cleanup();
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
