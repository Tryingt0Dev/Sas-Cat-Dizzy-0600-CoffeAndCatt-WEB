import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentBusiness } from "@/lib/auth";
import { Card } from "@/components/Card";
import { Select } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { StatusAlert } from "@/components/StatusAlert";
import { formatCLP } from "@/lib/format";
import { OrderStatus, QuoteStatus } from "@/lib/enums";
import { createOrderFromQuoteAction } from "@/app/dashboard/quotes/actions";
import { updateOrderStatusAction } from "./actions";

export default async function OrdersPage({ searchParams }: { searchParams?: Promise<{ success?: string; error?: string } | undefined> }) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const business = await getCurrentBusiness();
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

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <h2 className="text-xl font-black">Crear desde cotización aceptada</h2>
          <form action={createOrderFromQuoteAction} className="mt-5 space-y-3">
            <Select name="quoteId" required>
              <option value="">Selecciona cotización</option>
              {acceptedQuotes.map((quote) => (
                <option key={quote.id} value={quote.id}>
                  #{quote.id.slice(-6).toUpperCase()} · {quote.customer?.name ?? quote.customer?.phone ?? "Cliente"} · {formatCLP(quote.total)}
                </option>
              ))}
            </Select>
            <button className="w-full rounded-2xl bg-black px-4 py-3 font-bold text-white">Crear pedido y descontar stock</button>
          </form>
          {acceptedQuotes.length === 0 && <p className="mt-4 text-sm text-gray-500">No hay cotizaciones aceptadas pendientes.</p>}
        </Card>

        <div className="space-y-4">
          {orders.map((order) => (
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
                  <Select name="status" defaultValue={order.status} className="w-44">
                    {Object.values(OrderStatus).map((status) => <option key={status} value={status}>{status}</option>)}
                  </Select>
                  <button className="rounded-2xl bg-black px-4 py-2 text-sm font-bold text-white">Guardar</button>
                </form>
                <Link href={`/dashboard/orders/${order.id}`} className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold">Ver detalle</Link>
              </div>
            </Card>
          ))}
          {orders.length === 0 && <Card><p className="text-gray-500">Aún no hay pedidos.</p></Card>}
        </div>
      </div>
    </div>
  );
}
