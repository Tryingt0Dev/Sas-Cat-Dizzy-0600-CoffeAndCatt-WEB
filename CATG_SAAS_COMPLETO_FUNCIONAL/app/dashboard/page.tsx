import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStoreAccess } from "@/services/authorization";
import { Card } from "@/components/Card";
import { LearningLink } from "@/components/LearningLink";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { PageHeader } from "@/components/PageHeader";
import { QuickActions } from "@/components/QuickActions";
import { ConversationStatus, CustomerStatus, OrderStatus, ProductStatus } from "@/lib/enums";
import { parseJsonRecord } from "@/lib/safe-json";

function parseIntent(metadata: string | null) {
  const parsed = parseJsonRecord(metadata);
  const intent = parsed?.intent;
  return typeof intent === "string" ? intent : null;
}

export default async function DashboardPage() {
  const { business } = await requireStoreAccess({ permission: "view_dashboard" });
  const [
    activeProducts,
    newLeads,
    openConversations,
    pendingOrders,
    categoryCount,
    products,
    topConsultedProducts,
    aiMessages
  ] = await Promise.all([
    prisma.product.count({ where: { businessId: business.id, status: ProductStatus.ACTIVE } }),
    prisma.customer.count({ where: { businessId: business.id, status: CustomerStatus.NEW } }),
    prisma.conversation.count({ where: { businessId: business.id, status: { in: [ConversationStatus.OPEN, ConversationStatus.WAITING_HUMAN] } } }),
    prisma.order.count({ where: { businessId: business.id, status: OrderStatus.PENDING } }),
    prisma.category.count({ where: { businessId: business.id } }),
    prisma.product.findMany({
      where: { businessId: business.id },
      select: {
        id: true,
        name: true,
        status: true,
        price: true,
        stock: true,
        minStock: true,
        productViewCount: true,
        whatsappClickCount: true
      }
    }),
    prisma.product.findMany({
      where: { businessId: business.id, aiConsultCount: { gt: 0 } },
      orderBy: { aiConsultCount: "desc" },
      take: 5
    }),
    prisma.message.findMany({
      where: { conversation: { businessId: business.id }, senderType: "AI" },
      orderBy: { createdAt: "desc" },
      take: 100
    })
  ]);

  const totalProducts = products.length;
  const totalProductViews = products.reduce((acc, product) => acc + product.productViewCount, 0);
  const totalWhatsappClicks = products.reduce((acc, product) => acc + product.whatsappClickCount, 0);
  const lowStockProducts = products
    .filter((product) => product.status === ProductStatus.ACTIVE && product.stock <= Math.max(product.minStock, 3))
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6);
  const purchaseIntentCount = aiMessages.filter((message) => parseIntent(message.metadata) === "purchase_interest").length;
  const purchaseIntentRate = aiMessages.length > 0 ? Math.round((purchaseIntentCount / aiMessages.length) * 100) : 0;

  const metricCards = [
    { label: "Productos", value: totalProducts },
    { label: "Categorías", value: categoryCount },
    { label: "Activos", value: activeProducts },
    { label: "Stock bajo", value: lowStockProducts.length },
    { label: "Leads nuevos", value: newLeads },
    { label: "Chats abiertos", value: openConversations },
    { label: "Pedidos pendientes", value: pendingOrders }
  ];
  const storeIsEmpty = totalProducts === 0 && categoryCount === 0;
  const onboardingItems = [
    {
      label: "Crear primera categoría",
      description: "Organiza tu catálogo con categorías.",
      href: "/dashboard/categories",
      done: categoryCount > 0
    },
    {
      label: "Crear primer producto",
      description: "Crea tu primer producto para comenzar a vender.",
      href: "/dashboard/products?create=1",
      done: totalProducts > 0
    },
    {
      label: "Personalizar apariencia",
      description: "Ajusta colores, logo y mensaje público.",
      href: "/dashboard/design",
      done: Boolean(business.logoUrl || business.bannerUrl || business.dashboardTitle)
    },
    {
      label: "Ver catálogo público",
      description: "Revisa cómo lo verá tu cliente.",
      href: `/store/${business.publicSlug}`,
      done: activeProducts > 0
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
    { id: "create-product", label: "Crear producto", href: "/dashboard/products?create=1", variant: "primary" as const },
    { id: "create-category", label: "Crear categoría", href: "/dashboard/categories" },
    { id: "catalog", label: "Ver catálogo", href: `/store/${business.publicSlug}`, external: true },
    { id: "design", label: "Personalizar tienda", href: "/dashboard/design" },
    { id: "ai", label: "Consultar IA", href: `/store/${business.publicSlug}#store-ai-chat`, external: true },
    { id: "discount", label: "Agregar descuento", href: "/dashboard/products" }
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Dashboard"
        title={dashboardTitle}
        description={dashboardDescription}
        actions={
          <>
            <Link
              href={`/store/${business.publicSlug}`}
              target="_blank"
              className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-black text-[var(--app-text)] shadow-sm transition duration-200 hover:bg-[var(--app-surface-muted)]"
            >
              Ver catálogo
            </Link>
            <Link
              href="/dashboard/design"
              className="rounded-xl bg-[var(--app-primary)] px-3 py-2 text-xs font-black text-[var(--app-button-text)] shadow-sm transition duration-200 hover:bg-[var(--app-primary-hover)]"
            >
              Personalizar
            </Link>
            <LearningLink
              href="/dashboard/learning"
              className="rounded-xl bg-[var(--app-surface)] px-3 py-2 text-xs font-black text-[var(--app-text)] shadow-sm transition duration-200 hover:bg-[var(--app-surface-muted)]"
            >
              Ver guía
            </LearningLink>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {metricCards.map((metric) => (
          <Card key={metric.label} className="p-3">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]">{metric.label}</p>
            <p className="mt-1 text-xl font-black text-[var(--app-text)]">{metric.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="p-3">
          <div className="mb-3">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-[var(--app-primary)]">Acciones rápidas</p>
            <h2 className="mt-1 text-base font-black">Centro de control</h2>
          </div>
          <QuickActions actions={quickActions} columns={3} compact />
        </Card>

        <Card className="p-3">
          <p className="mb-2 text-[0.65rem] font-black uppercase tracking-[0.16em] text-[var(--app-text-muted)]">Estado de tienda</p>
          <div className="space-y-2">
            {healthItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2 rounded-xl bg-[var(--app-surface-muted)] p-2">
                <span className={item.done ? "h-2 w-2 rounded-full bg-emerald-500" : "h-2 w-2 rounded-full bg-amber-400"} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[var(--app-text)]">{item.label}</p>
                  <p className="line-clamp-1 text-[0.7rem] text-[var(--app-text-muted)]">{item.hint}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {storeIsEmpty ? <OnboardingChecklist items={onboardingItems} /> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-3">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-black text-[var(--app-text)]">Stock bajo ({lowStockProducts.length})</h3>
            <Link href="/dashboard/products" className="text-xs font-bold text-[var(--app-primary)]">Ver</Link>
          </div>
          <div className="space-y-1">
            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-[var(--app-text-muted)]">Sin alertas</p>
            ) : (
              lowStockProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between gap-2 rounded-lg bg-[var(--app-surface-muted)] p-2">
                  <span className="truncate text-xs font-semibold text-[var(--app-text)]">{product.name}</span>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[0.65rem] font-bold text-red-700">S: {product.stock}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-black text-[var(--app-text)]">Top consultados ({topConsultedProducts.length})</h3>
            <Link href="/dashboard/conversations" className="text-xs font-bold text-[var(--app-primary)]">Ver</Link>
          </div>
          <div className="space-y-1">
            {topConsultedProducts.length === 0 ? (
              <p className="text-xs text-[var(--app-text-muted)]">Prueba la IA</p>
            ) : (
              topConsultedProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between gap-2 rounded-lg bg-[var(--app-surface-muted)] p-2">
                  <span className="truncate text-xs font-semibold text-[var(--app-text)]">{product.name}</span>
                  <span className="rounded-full bg-[var(--app-primary)] px-2 py-0.5 text-[0.65rem] font-bold text-[var(--app-button-text)]">{product.aiConsultCount}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="p-3">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]">Catálogo público</p>
            <p className="mt-1 text-sm font-bold text-[var(--app-text)]">{totalProductViews} vistas de producto</p>
          </div>
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]">WhatsApp</p>
            <p className="mt-1 text-sm font-bold text-[var(--app-text)]">{totalWhatsappClicks} clicks registrados</p>
          </div>
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]">IA</p>
            <p className="mt-1 text-sm font-bold text-[var(--app-text)]">{purchaseIntentRate}% consultas con intención de compra</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
