import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStoreAccess } from "@/services/authorization";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { HelpTooltip } from "@/components/HelpTooltip";
import { LearningLink } from "@/components/LearningLink";
import { Select } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { SectionGuide } from "@/components/SectionGuide";
import { StatusAlert } from "@/components/StatusAlert";
import { formatCLP } from "@/lib/format";
import { OrderStatus, QuoteStatus } from "@/lib/enums";
import { createOrderFromQuoteAction } from "@/app/dashboard/quotes/actions";
import { updateOrderStatusAction } from "./actions";

export default async function OrdersPage({ searchParams }: { searchParams?: Promise<{ success?: string; error?: string } | undefined> }) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const { business } = await requireStoreAccess({ permission: "manage_quotes_orders" });
  const [orders, acceptedQuotes] = await Promise.all([
    prisma.order.findMany({
      where: { businessId: business.id },
      include: { customer: true, quote: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 100
    }),
    prisma.quote.findMany({
      where: { businessId: business.id, status: QuoteStatus.ACCEPTED, order: { is: null } },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      take: 50
    })
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Operación"
        title="Pedidos"
        description="Confirma pedidos desde cotizaciones aceptadas y controla estados de preparación."
      />
      <StatusAlert success={resolvedSearchParams?.success} error={resolvedSearchParams?.error} />
      <SectionGuide
        eyebrow="Pedidos"
        title="Convierte cotizaciones y gestiona entregas"
        description="Transforma cotizaciones aceptadas en pedidos y actualiza su estado para mantener el control operativo." 
        help="Un pedido se crea solo cuando el cliente acepta la propuesta. Después, cambia su estado conforme avanza la entrega." 
        actions={<LearningLink href="/dashboard/learning#ventas">Ver guía de pedidos</LearningLink>}
      />

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black">Crear desde cotización aceptada</h2>
            <HelpTooltip description="Elige una cotización aceptada para generar un pedido real y descontar stock automáticamente." />
          </div>
          <p className="mt-1 text-sm text-gray-500">Solo convierte cotizaciones que el cliente ya aceptó para evitar crear pedidos innecesarios.</p>
          <form action={createOrderFromQuoteAction} className="mt-5 space-y-3">
            <label className="block text-sm font-semibold text-gray-900">
              Cotización aceptada
              <span className="mt-1 block text-xs text-gray-500">Selecciona la cotización que quieres transformar en pedido.</span>
              <Select name="quoteId" required>
                <option value="">Selecciona cotización</option>
                {acceptedQuotes.map((quote) => (
                  <option key={quote.id} value={quote.id}>
                    #{quote.id.slice(-6).toUpperCase()} · {quote.customer?.name ?? quote.customer?.phone ?? "Cliente"} · {formatCLP(quote.total)}
                  </option>
                ))}
              </Select>
            </label>
            <button className="w-full rounded-2xl bg-black px-4 py-3 font-bold text-white">Crear pedido y descontar stock</button>
          </form>
          {acceptedQuotes.length === 0 && <p className="mt-4 text-sm text-gray-500">No hay cotizaciones aceptadas pendientes. Una vez aceptada una cotización podrás crear el pedido aquí.</p>}
        </Card>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <EmptyState
              title="Aún no hay pedidos"
              description="Los pedidos aparecerán aquí cuando conviertas cotizaciones aceptadas o completes ventas en el sistema." 
              action={<LearningLink href="/dashboard/learning#ventas">Ver guía de pedidos</LearningLink>}
            />
          ) : (
            orders.map((order) => (
              <Card key={order.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">#{order.id.slice(-6).toUpperCase()}</p>
                    <h2 className="mt-1 text-xl font-black">{order.customer?.name ?? order.customer?.phone ?? "Cliente sin datos"}</h2>
                    <p className="mt-1 text-sm text-gray-500">{order.items.length} productos · {order.createdAt.toLocaleDateString("es-CL")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black">{formatCLP(order.total)}</p>
                    <p className="text-sm text-gray-500">Estado {order.status}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between rounded-2xl bg-gray-50 px-4 py-3 text-sm">
                      <span className="font-semibold">{item.quantity} x {item.name}</span>
                      <span className="font-bold">{formatCLP(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <form action={updateOrderStatusAction} className="flex gap-2">
                    <input type="hidden" name="id" value={order.id} />
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      Estado
                      <HelpTooltip description="Actualiza el estado del pedido según su progreso: preparación, envío o entregado." />
                    </label>
                    <Select name="status" defaultValue={order.status} className="w-44">
                      {Object.values(OrderStatus).map((status) => <option key={status} value={status}>{status}</option>)}
                    </Select>
                    <button className="rounded-2xl bg-black px-4 py-2 text-sm font-bold text-white">Guardar</button>
                  </form>
                  <Link href={`/dashboard/orders/${order.id}`} className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold">Ver detalle</Link>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
