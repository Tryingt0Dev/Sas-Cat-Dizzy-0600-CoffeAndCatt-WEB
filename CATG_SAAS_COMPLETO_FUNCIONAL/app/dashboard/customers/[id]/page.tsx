import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStoreAccess } from "@/services/authorization";
import { Card } from "@/components/Card";
import { HelpTooltip } from "@/components/HelpTooltip";
import { Input, Select, Textarea } from "@/components/Input";
import { LearningLink } from "@/components/LearningLink";
import { PageHeader } from "@/components/PageHeader";
import { SectionGuide } from "@/components/SectionGuide";
import { formatCLP } from "@/lib/format";
import { CustomerStatus } from "@/lib/enums";
import { updateCustomerAction } from "@/app/dashboard/customers/actions";

export default async function CustomerDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ success?: string } | undefined>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const { business } = await requireStoreAccess({ permission: "manage_customers" });
  const customer = await prisma.customer.findFirst({
    where: { id, businessId: business.id },
    include: {
      conversations: { include: { messages: { orderBy: { createdAt: "asc" }, take: 8 } }, orderBy: { updatedAt: "desc" } },
      quotes: { include: { items: true }, orderBy: { createdAt: "desc" } },
      orders: { include: { items: true }, orderBy: { createdAt: "desc" } }
    }
  });

  if (!customer) notFound();

  return (
    <div>
      <PageHeader eyebrow="CRM" title="Ficha del cliente" description="Revisa detalles, historial y acciones para cada cliente o lead." />
      <SectionGuide
        eyebrow="Cliente"
        title="Conoce el estado de tu lead"
        description="Actualiza datos de contacto, estado y score para priorizar el seguimiento correcto." 
        help="Un cliente con score alto y conversaciones recientes merece atención rápida." 
        actions={<LearningLink href="/dashboard/learning#clientes">Ver guía de clientes</LearningLink>}
      />
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/customers" className="text-sm font-bold text-[var(--app-text-muted)]">Volver a clientes</Link>
          <h1 className="mt-2 text-4xl font-black">{customer.name ?? customer.phone ?? "Cliente web"}</h1>
          <p className="mt-2 text-[var(--app-text-muted)]">{customer.email ?? "Sin email"} · {customer.phone ?? "Sin teléfono"}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-[var(--app-primary)] px-4 py-2 text-sm font-black text-[var(--app-button-text)]">
          <span>Score {customer.leadScore}</span>
          <HelpTooltip description="El score muestra la prioridad del cliente según su actividad y potencial de compra." />
        </div>
      </div>
      {resolvedSearchParams?.success && <div className="mb-4 rounded-2xl bg-green-50 p-3 text-sm font-bold text-green-700">{resolvedSearchParams.success}</div>}

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black">Ficha CRM</h2>
            <HelpTooltip description="Edita la información de contacto y el estado del cliente para mejorar el seguimiento." />
          </div>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">Guarda los datos del cliente y registra notas internas útiles para el equipo.</p>
          <form action={updateCustomerAction} className="mt-5 space-y-4">
            <input type="hidden" name="id" value={customer.id} />
            <label className="block text-sm font-semibold text-[var(--app-text)]">
              Nombre
              <Input name="name" defaultValue={customer.name ?? ""} placeholder="Nombre" />
            </label>
            <label className="block text-sm font-semibold text-[var(--app-text)]">
              Teléfono
              <Input name="phone" defaultValue={customer.phone ?? ""} placeholder="Teléfono" />
            </label>
            <label className="block text-sm font-semibold text-[var(--app-text)]">
              Email
              <Input name="email" type="email" defaultValue={customer.email ?? ""} placeholder="Email" />
            </label>
            <label className="block text-sm font-semibold text-[var(--app-text)]">
              Estado
              <div className="mt-1 flex items-center gap-2">
                <Select name="status" defaultValue={customer.status}>
                  {Object.values(CustomerStatus).map((status) => <option key={status} value={status}>{status}</option>)}
                </Select>
                <HelpTooltip description="Actualiza si el cliente está en seguimiento, interesado o cerrado." />
              </div>
            </label>
            <label className="block text-sm font-semibold text-[var(--app-text)]">
              Lead score
              <span className="mt-1 block text-xs text-[var(--app-text-muted)]">Valor de 0 a 100 para priorizar este cliente.</span>
              <Input name="leadScore" type="number" min={0} max={100} defaultValue={customer.leadScore} />
            </label>
            <label className="block text-sm font-semibold text-[var(--app-text)]">
              Notas internas
              <span className="mt-1 block text-xs text-[var(--app-text-muted)]">Registra detalles que tu equipo debe conocer sobre este cliente.</span>
              <Textarea name="notes" defaultValue={customer.notes ?? ""} placeholder="Notas internas" rows={6} />
            </label>
            <button className="w-full rounded-2xl bg-[var(--app-primary)] px-4 py-3 font-bold text-[var(--app-button-text)]">Guardar cliente</button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-black">Conversaciones</h2>
            <div className="mt-4 space-y-3">
              {customer.conversations.map((conversation) => (
                <div key={conversation.id} className="rounded-2xl bg-[var(--app-surface-muted)] p-3">
                  <p className="text-sm font-black">{conversation.channel} · {conversation.status} · {conversation.createdAt.toLocaleDateString("es-CL")}</p>
                  <div className="mt-3 space-y-2">
                    {conversation.messages.map((message) => (
                      <p key={message.id} className="text-sm text-[var(--app-text-muted)]"><strong>{message.senderType}:</strong> {message.content}</p>
                    ))}
                  </div>
                </div>
              ))}
              {customer.conversations.length === 0 && <p className="text-sm text-[var(--app-text-muted)]">Sin conversaciones.</p>}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-black">Cotizaciones</h2>
            <div className="mt-4 space-y-3">
              {customer.quotes.map((quote) => (
                <Link key={quote.id} href={`/dashboard/quotes/${quote.id}`} className="flex justify-between rounded-2xl bg-[var(--app-surface-muted)] p-3 text-sm">
                  <span className="font-bold">#{quote.id.slice(-6).toUpperCase()} · {quote.status}</span>
                  <span className="font-black">{formatCLP(quote.total)}</span>
                </Link>
              ))}
              {customer.quotes.length === 0 && <p className="text-sm text-[var(--app-text-muted)]">Sin cotizaciones.</p>}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-black">Pedidos</h2>
            <div className="mt-4 space-y-3">
              {customer.orders.map((order) => (
                <Link key={order.id} href={`/dashboard/orders/${order.id}`} className="flex justify-between rounded-2xl bg-[var(--app-surface-muted)] p-3 text-sm">
                  <span className="font-bold">#{order.id.slice(-6).toUpperCase()} · {order.status}</span>
                  <span className="font-black">{formatCLP(order.total)}</span>
                </Link>
              ))}
              {customer.orders.length === 0 && <p className="text-sm text-[var(--app-text-muted)]">Sin pedidos.</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
