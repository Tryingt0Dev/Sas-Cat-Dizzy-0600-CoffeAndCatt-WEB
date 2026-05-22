import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentBusiness } from "@/lib/auth";
import { Card } from "@/components/Card";
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
  const business = await getCurrentBusiness();
  const [
    activeProducts,
    newLeads,
    openConversations,
    sentQuotes,
    pendingOrders,
    products,
    topConsultedProducts,
    latestConversations,
    aiMessages
  ] = await Promise.all([
    prisma.product.count({ where: { businessId: business.id, status: ProductStatus.ACTIVE } }),
    prisma.customer.count({ where: { businessId: business.id, status: CustomerStatus.NEW } }),
    prisma.conversation.count({ where: { businessId: business.id, status: { in: [ConversationStatus.OPEN, ConversationStatus.WAITING_HUMAN] } } }),
    prisma.quote.count({ where: { businessId: business.id, status: QuoteStatus.SENT } }),
    prisma.order.count({ where: { businessId: business.id, status: OrderStatus.PENDING } }),
    prisma.product.findMany({ where: { businessId: business.id } }),
    prisma.product.findMany({
      where: { businessId: business.id, aiConsultCount: { gt: 0 } },
      orderBy: { aiConsultCount: "desc" },
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
    ["Stock bajo", lowStockProducts.length]
  ];

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-gray-400">Dashboard</p>
        <h1 className="mt-2 text-4xl font-black">Gestión de {business.name}</h1>
        <p className="mt-2 text-gray-500">Métricas reales separadas por tienda mediante businessId.</p>
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
