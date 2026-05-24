import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStoreAccess } from "@/services/authorization";
import { Card } from "@/components/Card";
import { Input, Select, Textarea } from "@/components/Input";
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
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/customers" className="text-sm font-bold text-gray-500">Volver a clientes</Link>
          <h1 className="mt-2 text-4xl font-black">{customer.name ?? customer.phone ?? "Cliente web"}</h1>
          <p className="mt-2 text-gray-500">{customer.email ?? "Sin email"} · {customer.phone ?? "Sin teléfono"}</p>
        </div>
        <span className="rounded-full bg-gray-900 px-4 py-2 text-sm font-black text-white">Score {customer.leadScore}</span>
      </div>
      {resolvedSearchParams?.success && <div className="mb-4 rounded-2xl bg-green-50 p-3 text-sm font-bold text-green-700">{resolvedSearchParams.success}</div>}

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <h2 className="text-xl font-black">Ficha CRM</h2>
          <form action={updateCustomerAction} className="mt-5 space-y-3">
            <input type="hidden" name="id" value={customer.id} />
            <Input name="name" defaultValue={customer.name ?? ""} placeholder="Nombre" />
            <Input name="phone" defaultValue={customer.phone ?? ""} placeholder="Teléfono" />
            <Input name="email" type="email" defaultValue={customer.email ?? ""} placeholder="Email" />
            <Select name="status" defaultValue={customer.status}>
              {Object.values(CustomerStatus).map((status) => <option key={status} value={status}>{status}</option>)}
            </Select>
            <Input name="leadScore" type="number" min={0} max={100} defaultValue={customer.leadScore} />
            <Textarea name="notes" defaultValue={customer.notes ?? ""} placeholder="Notas internas" rows={6} />
            <button className="w-full rounded-2xl bg-black px-4 py-3 font-bold text-white">Guardar cliente</button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-black">Conversaciones</h2>
            <div className="mt-4 space-y-3">
              {customer.conversations.map((conversation) => (
                <div key={conversation.id} className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm font-black">{conversation.channel} · {conversation.status} · {conversation.createdAt.toLocaleDateString("es-CL")}</p>
                  <div className="mt-3 space-y-2">
                    {conversation.messages.map((message) => (
                      <p key={message.id} className="text-sm text-gray-600"><strong>{message.senderType}:</strong> {message.content}</p>
                    ))}
                  </div>
                </div>
              ))}
              {customer.conversations.length === 0 && <p className="text-sm text-gray-500">Sin conversaciones.</p>}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-black">Cotizaciones</h2>
            <div className="mt-4 space-y-3">
              {customer.quotes.map((quote) => (
                <Link key={quote.id} href={`/dashboard/quotes/${quote.id}`} className="flex justify-between rounded-2xl bg-gray-50 p-4 text-sm">
                  <span className="font-bold">#{quote.id.slice(-6).toUpperCase()} · {quote.status}</span>
                  <span className="font-black">{formatCLP(quote.total)}</span>
                </Link>
              ))}
              {customer.quotes.length === 0 && <p className="text-sm text-gray-500">Sin cotizaciones.</p>}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-black">Pedidos</h2>
            <div className="mt-4 space-y-3">
              {customer.orders.map((order) => (
                <Link key={order.id} href={`/dashboard/orders/${order.id}`} className="flex justify-between rounded-2xl bg-gray-50 p-4 text-sm">
                  <span className="font-bold">#{order.id.slice(-6).toUpperCase()} · {order.status}</span>
                  <span className="font-black">{formatCLP(order.total)}</span>
                </Link>
              ))}
              {customer.orders.length === 0 && <p className="text-sm text-gray-500">Sin pedidos.</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
