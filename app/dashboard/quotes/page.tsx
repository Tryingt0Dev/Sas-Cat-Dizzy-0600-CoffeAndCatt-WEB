import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStoreAccess } from "@/services/authorization";
import { Card } from "@/components/Card";
import { CopyButton } from "@/components/CopyButton";
import { EmptyState } from "@/components/EmptyState";
import { HelpTooltip } from "@/components/HelpTooltip";
import { Input, Select, Textarea } from "@/components/Input";
import { LearningLink } from "@/components/LearningLink";
import { PageHeader } from "@/components/PageHeader";
import { SectionGuide } from "@/components/SectionGuide";
import { StatusAlert } from "@/components/StatusAlert";
import { formatCLP } from "@/lib/format";
import { ProductStatus, QuoteStatus } from "@/lib/enums";
import { createOrderFromQuoteAction, createQuoteAction, updateQuoteStatusAction } from "./actions";

function quoteWhatsappText(quote: {
  id: string;
  total: number;
  discount: number;
  items: { name: string; quantity: number; unitPrice: number; subtotal: number }[];
}) {
  const lines = quote.items.map((item) => `- ${item.quantity} x ${item.name}: ${formatCLP(item.subtotal)}`).join("\n");
  return `Hola, te comparto la cotizacion ${quote.id.slice(-6).toUpperCase()}:\n${lines}\nDescuento: ${formatCLP(quote.discount)}\nTotal: ${formatCLP(quote.total)}`;
}

export default async function QuotesPage({ searchParams }: { searchParams?: Promise<{ success?: string; error?: string } | undefined> }) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const { business } = await requireStoreAccess({ permission: "manage_quotes_orders" });
  const [quotes, customers, conversations, products] = await Promise.all([
    prisma.quote.findMany({
      where: { businessId: business.id },
      include: { customer: true, conversation: true, items: true, order: true },
      orderBy: { createdAt: "desc" },
      take: 80
    }),
    prisma.customer.findMany({ where: { businessId: business.id }, orderBy: { updatedAt: "desc" }, take: 100 }),
    prisma.conversation.findMany({ where: { businessId: business.id }, include: { customer: true }, orderBy: { updatedAt: "desc" }, take: 50 }),
    prisma.product.findMany({ where: { businessId: business.id, status: ProductStatus.ACTIVE }, orderBy: { name: "asc" } })
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Ventas"
        title="Cotizaciones"
        description="Crea propuestas desde clientes o conversaciones y conviértelas en pedidos aceptados."
      />
      <StatusAlert success={resolvedSearchParams?.success} error={resolvedSearchParams?.error} />
      <SectionGuide
        eyebrow="Cotizaciones"
        title="Envía propuestas claras y convierte más rápido"
        description="Asigna clientes, agrega productos y define condiciones para que cada cotización sea fácil de revisar." 
        help="Usa la descripción y el descuento para informar al cliente y agilizar la venta por WhatsApp o chat." 
        actions={<LearningLink href="/dashboard/learning#ventas">Ver guía de cotizaciones</LearningLink>}
      />

      <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
        <Card>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black">Nueva cotización</h2>
            <HelpTooltip description="Crea una cotización asignándola a un cliente o conversación y agrega los productos que desea comprar." />
          </div>
          <p className="mt-1 text-sm text-gray-500">Completa los datos del cliente y los productos para enviar una propuesta clara.</p>
          <form action={createQuoteAction} className="mt-5 space-y-4">
            <label className="block text-sm font-semibold text-gray-900">
              Cliente
              <span className="mt-1 block text-xs text-gray-500">Selecciona un cliente existente o deja vacío si es un contacto nuevo.</span>
              <Select name="customerId" defaultValue="">
                <option value="">Sin cliente asignado</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name ?? customer.phone ?? customer.email ?? "Cliente web"}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block text-sm font-semibold text-gray-900">
              Conversación
              <span className="mt-1 block text-xs text-gray-500">Relaciona la cotización con un chat para mantener seguimiento al cliente.</span>
              <Select name="conversationId" defaultValue="">
                <option value="">Sin conversación</option>
                {conversations.map((conversation) => (
                  <option key={conversation.id} value={conversation.id}>
                    {conversation.customer?.name ?? conversation.customer?.phone ?? "Conversación web"} · {conversation.createdAt.toLocaleDateString("es-CL")}
                  </option>
                ))}
              </Select>
            </label>
            <div className="space-y-2">
              {[0, 1, 2, 3, 4].map((index) => (
                <div key={index} className="grid grid-cols-[1fr_90px] gap-2">
                  <Select name="productId" defaultValue="">
                    <option value="">Producto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} · {formatCLP(product.price)}
                      </option>
                    ))}
                  </Select>
                  <Input name="quantity" type="number" min={0} defaultValue={index === 0 ? 1 : 0} placeholder="Cant." />
                </div>
              ))}
            </div>
            <label className="block text-sm font-semibold text-gray-900">
              Descuento total
              <span className="mt-1 block text-xs text-gray-500">Aplica un descuento general para reflejar una oferta o promoción.</span>
              <Input name="discount" type="number" min={0} placeholder="Descuento total" />
            </label>
            <label className="block text-sm font-semibold text-gray-900">
              Validez
              <span className="mt-1 block text-xs text-gray-500">Indica hasta cuándo es válida esta cotización.</span>
              <Input name="validUntil" type="date" />
            </label>
            <label className="block text-sm font-semibold text-gray-900">
              Notas internas
              <span className="mt-1 block text-xs text-gray-500">Agrega condiciones, delivery o detalles especiales para tu equipo.</span>
              <Textarea name="notes" placeholder="Notas internas o condiciones" rows={3} />
            </label>
            <button className="w-full rounded-2xl bg-black px-4 py-3 font-bold text-white">Crear cotización</button>
          </form>
        </Card>

        <div className="space-y-4">
          {quotes.length === 0 ? (
            <EmptyState
              title="Aún no hay cotizaciones"
              description="Crea una propuesta con productos, cliente y condiciones para comenzar a vender rápido." 
              action={<LearningLink href="/dashboard/learning#ventas">Aprender a crear cotizaciones</LearningLink>}
            />
          ) : (
            quotes.map((quote) => (
              <Card key={quote.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">#{quote.id.slice(-6).toUpperCase()}</p>
                    <h2 className="mt-1 text-xl font-black">{quote.customer?.name ?? quote.customer?.phone ?? "Cliente sin datos"}</h2>
                    <p className="mt-1 text-sm text-gray-500">{quote.items.length} productos · {quote.createdAt.toLocaleDateString("es-CL")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black">{formatCLP(quote.total)}</p>
                    <p className="text-sm text-gray-500">Estado {quote.status}</p>
                  </div>
                </div>
                <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100">
                  {quote.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-[1fr_80px_120px] gap-3 border-b border-gray-100 px-4 py-3 text-sm last:border-b-0">
                      <span className="font-semibold">{item.name}</span>
                      <span>{item.quantity} u.</span>
                      <span className="text-right font-bold">{formatCLP(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <form action={updateQuoteStatusAction} className="flex gap-2">
                    <input type="hidden" name="id" value={quote.id} />
                    <Select name="status" defaultValue={quote.status} className="w-44">
                      {Object.values(QuoteStatus).map((status) => <option key={status} value={status}>{status}</option>)}
                    </Select>
                    <button className="rounded-2xl bg-black px-4 py-2 text-sm font-bold text-white">Guardar</button>
                  </form>
                  <CopyButton text={quoteWhatsappText(quote)} className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold" />
                  <Link href={`/dashboard/quotes/${quote.id}`} className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold">Vista imprimible</Link>
                  {quote.status === QuoteStatus.ACCEPTED && !quote.order && (
                    <form action={createOrderFromQuoteAction}>
                      <input type="hidden" name="quoteId" value={quote.id} />
                      <button className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Crear pedido</button>
                    </form>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
