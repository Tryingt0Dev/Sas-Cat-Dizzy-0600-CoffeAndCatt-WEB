import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStoreAccess } from "@/services/authorization";
import { Card } from "@/components/Card";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { PageHeader } from "@/components/PageHeader";
import { StoreShareCard } from "@/components/StoreShareCard";
import { formatCLP } from "@/lib/format";
import { ConversationStatus, CustomerStatus, OrderStatus, ProductStatus, QuoteStatus } from "@/lib/enums";

function parseIntent(metadata: string | null) {
  if (!metadata) return null;
  try {
    const parsed = JSON.parse(metadata) as { intent?: string };
    return parsed.intent ?? null;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const { business } = await requireStoreAccess({ permission: "view_dashboard" });
  const [
    activeProducts,
    newLeads,
    openConversations,
    sentQuotes,
    pendingOrders,
    categoryCount,
    featuredProductCount,
    products,
    topConsultedProducts,
    topViewedProducts,
    topWhatsappProducts,
    latestConversations,
    aiMessages
  ] = await Promise.all([
    prisma.product.count({ where: { businessId: business.id, status: ProductStatus.ACTIVE } }),
    prisma.customer.count({ where: { businessId: business.id, status: CustomerStatus.NEW } }),
    prisma.conversation.count({ where: { businessId: business.id, status: { in: [ConversationStatus.OPEN, ConversationStatus.WAITING_HUMAN] } } }),
    prisma.quote.count({ where: { businessId: business.id, status: QuoteStatus.SENT } }),
    prisma.order.count({ where: { businessId: business.id, status: OrderStatus.PENDING } }),
    prisma.category.count({ where: { businessId: business.id } }),
    prisma.product.count({ where: { businessId: business.id, featured: true } }),
    prisma.product.findMany({ where: { businessId: business.id } }),
    prisma.product.findMany({
      where: { businessId: business.id, aiConsultCount: { gt: 0 } },
      orderBy: { aiConsultCount: "desc" },
      take: 5
    }),
    prisma.product.findMany({
      where: { businessId: business.id, productViewCount: { gt: 0 } },
      orderBy: { productViewCount: "desc" },
      take: 5
    }),
    prisma.product.findMany({
      where: { businessId: business.id, whatsappClickCount: { gt: 0 } },
      orderBy: { whatsappClickCount: "desc" },
      take: 5
    }),
    prisma.conversation.findMany({
      where: { businessId: business.id },
      include: { customer: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
      take: 6
    }),
    prisma.message.findMany({
      where: { conversation: { businessId: business.id }, senderType: "AI" },
      orderBy: { createdAt: "desc" },
      take: 100
    })
  ]);

  const stockValue = products.reduce((acc, product) => acc + product.price * product.stock, 0);
  const totalProductViews = products.reduce((acc, product) => acc + product.productViewCount, 0);
  const totalWhatsappClicks = products.reduce((acc, product) => acc + product.whatsappClickCount, 0);
  const lowStockProducts = products
    .filter((product) => product.status === ProductStatus.ACTIVE && product.stock <= Math.max(product.minStock, 3))
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6);
  const purchaseIntentCount = aiMessages.filter((message) => parseIntent(message.metadata) === "purchase_interest").length;
  const purchaseIntentRate = aiMessages.length > 0 ? Math.round((purchaseIntentCount / aiMessages.length) * 100) : 0;

  const metricCards = [
    ["Productos activos", activeProducts],
    ["Leads nuevos", newLeads],
    ["Conversaciones abiertas", openConversations],
    ["Cotizaciones enviadas", sentQuotes],
    ["Pedidos pendientes", pendingOrders],
    ["Stock bajo", lowStockProducts.length],
    ["Vistas de productos", totalProductViews],
    ["Clicks WhatsApp", totalWhatsappClicks]
  ];
  const onboardingItems = [
    {
      label: "Configura WhatsApp",
      description: "Activa el canal principal de cierre comercial.",
      href: "/dashboard/settings",
      done: Boolean(business.whatsappNumber)
    },
    {
      label: "Sube logo o banner",
      description: "Haz que el catalogo se sienta propio y confiable.",
      href: "/dashboard/settings",
      done: Boolean(business.logoUrl || business.bannerUrl)
    },
    {
      label: "Crea productos",
      description: "Publica al menos un producto activo.",
      href: "/dashboard/products",
      done: activeProducts > 0
    },
    {
      label: "Crea categorias",
      description: "Ayuda al cliente a encontrar rapido lo que busca.",
      href: "/dashboard/categories",
      done: categoryCount > 0
    },
    {
      label: "Destaca un producto",
      description: "Muestra una oferta o producto recomendado primero.",
      href: "/dashboard/products",
      done: featuredProductCount > 0
    },
    {
      label: "Prueba el vendedor IA",
      description: "Envia una consulta desde el catalogo publico.",
      href: `/store/${business.publicSlug}`,
      done: aiMessages.length > 0 || openConversations > 0
    }
  ];
  const dashboardTitle = business.dashboardTitle || `Gestión de ${business.name}`;
  const dashboardDescription = business.dashboardSubtitle || "Métricas comerciales, acciones rápidas y señales de operación separadas por tienda.";
  const healthItems = [
    { label: "WhatsApp", done: Boolean(business.whatsappNumber), hint: business.whatsappNumber ? "Listo para cerrar ventas" : "Configúralo para recibir consultas" },
    { label: "Catálogo", done: activeProducts > 0, hint: activeProducts > 0 ? `${activeProducts} productos activos` : "Publica tu primer producto" },
    { label: "Branding", done: Boolean(business.logoUrl || business.bannerUrl), hint: business.logoUrl || business.bannerUrl ? "Identidad visual cargada" : "Sube logo o banner" },
    { label: "IA", done: aiMessages.length > 0, hint: aiMessages.length > 0 ? "Ya recibió consultas" : "Prueba el vendedor IA" }
  ];
  const quickActions = [
    { label: "Nuevo producto", description: "Agrega inventario con foto, precio y stock.", href: "/dashboard/products" },
    { label: "Ver catálogo", description: "Revisa la experiencia pública del cliente.", href: `/store/${business.publicSlug}`, external: true },
    { label: "Personalizar panel", description: "Cambia nombre interno, colores, logo e IA.", href: "/dashboard/settings" },
    { label: "Revisar leads", description: "Atiende clientes nuevos y conversaciones abiertas.", href: "/dashboard/customers" }
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Dashboard"
        title={dashboardTitle}
        description={dashboardDescription}
        actions={
          <>
            <Link href={`/store/${business.publicSlug}`} target="_blank" className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-black text-gray-700 shadow-sm">
              Ver catálogo
            </Link>
            <Link href="/dashboard/settings" className="rounded-2xl bg-black px-4 py-2 text-sm font-black text-white shadow-sm">
              Personalizar
            </Link>
          </>
        }
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-gray-400">Acciones rápidas</p>
              <h2 className="mt-1 text-xl font-black">Lo más usado para operar la tienda</h2>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-700">/{business.publicSlug}</span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                target={action.external ? "_blank" : undefined}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-4 transition hover:border-gray-300 hover:bg-white hover:shadow-sm"
              >
                <p className="font-black text-gray-950">{action.label}</p>
                <p className="mt-1 text-sm leading-5 text-gray-500">{action.description}</p>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-gray-400">Estado de tienda</p>
          <div className="mt-4 space-y-3">
            {healthItems.map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-2xl bg-gray-50 p-3">
                <span className={item.done ? "mt-1 h-3 w-3 rounded-full bg-emerald-500" : "mt-1 h-3 w-3 rounded-full bg-amber-400"} />
                <div>
                  <p className="text-sm font-black text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.hint}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <OnboardingChecklist items={onboardingItems} />
        <StoreShareCard businessName={business.name} storePath={`/store/${business.publicSlug}`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-2 text-3xl font-black">{value}</p>
          </Card>
        ))}
        <Card className="xl:col-span-2">
          <p className="text-sm text-gray-500">Valor de inventario</p>
          <p className="mt-2 text-3xl font-black">{formatCLP(stockValue)}</p>
        </Card>
        <Card className="xl:col-span-2">
          <p className="text-sm text-gray-500">Tasa intención de compra IA</p>
          <p className="mt-2 text-3xl font-black">{purchaseIntentRate}%</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-black">Productos con stock bajo</h2>
            <Link href="/dashboard/products" className="text-sm font-bold text-gray-500">Inventario</Link>
          </div>
          <div className="mt-4 space-y-3">
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-gray-500">Sin alertas críticas.</p>
            ) : (
              lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                  <span className="font-semibold">{product.name}</span>
                  <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-700">Stock {product.stock}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-black">Productos más consultados por IA</h2>
          <div className="mt-4 space-y-3">
            {topConsultedProducts.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no hay suficientes consultas.</p>
            ) : (
              topConsultedProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                  <span className="font-semibold">{product.name}</span>
                  <span className="rounded-full bg-gray-900 px-3 py-1 text-sm font-bold text-white">{product.aiConsultCount}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-black">Más clicks a WhatsApp</h2>
          <div className="mt-4 space-y-3">
            {topWhatsappProducts.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no hay clicks registrados.</p>
            ) : (
              topWhatsappProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                  <span className="font-semibold">{product.name}</span>
                  <span className="rounded-full bg-emerald-600 px-3 py-1 text-sm font-bold text-white">{product.whatsappClickCount}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-black">Productos más vistos</h2>
          <div className="mt-4 space-y-3">
            {topViewedProducts.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no hay vistas de fichas de producto.</p>
            ) : (
              topViewedProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                  <span className="font-semibold">{product.name}</span>
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-sm font-bold text-white">{product.productViewCount}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-black">Últimas conversaciones</h2>
          <Link href="/dashboard/conversations" className="text-sm font-bold text-gray-500">Ver todas</Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-3">Cliente</th>
                <th>Estado</th>
                <th>Último mensaje</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {latestConversations.map((conversation) => (
                <tr key={conversation.id} className="border-b border-gray-100">
                  <td className="py-4 font-semibold">{conversation.customer?.name ?? conversation.customer?.phone ?? "Visitante web"}</td>
                  <td>{conversation.status}</td>
                  <td className="max-w-md truncate">{conversation.messages[0]?.content ?? "-"}</td>
                  <td>{conversation.updatedAt.toLocaleString("es-CL")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {latestConversations.length === 0 && <p className="py-8 text-center text-gray-500">Aún no hay conversaciones.</p>}
        </div>
      </Card>
    </div>
  );
}
