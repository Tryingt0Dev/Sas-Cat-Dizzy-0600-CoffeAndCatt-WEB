import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStoreAccess } from "@/services/authorization";
import { PrintButton } from "@/components/PrintButton";
import { formatCLP } from "@/lib/format";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { business } = await requireStoreAccess({ permission: "manage_quotes_orders" });
  const order = await prisma.order.findFirst({
    where: { id, businessId: business.id },
    include: { customer: true, quote: true, items: true }
  });

  if (!order) notFound();

  return (
    <main className="mx-auto max-w-3xl bg-white p-8 print:p-0">
      <div className="mb-6 flex justify-between gap-4 print:hidden">
        <Link href="/dashboard/orders" className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-bold">Volver</Link>
        <PrintButton className="rounded-2xl bg-black px-4 py-2 text-sm font-bold text-white" />
      </div>
      <section className="border-b pb-6">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-gray-400">Pedido</p>
        <h1 className="mt-2 text-4xl font-black">{business.name}</h1>
        <p className="mt-2 text-gray-500">#{order.id.slice(-6).toUpperCase()} · {order.createdAt.toLocaleDateString("es-CL")} · {order.status}</p>
      </section>
      <section className="border-b py-6">
        <p className="text-sm font-black text-gray-500">Cliente</p>
        <p className="mt-1 font-bold">{order.customer?.name ?? order.customer?.phone ?? "Cliente sin datos"}</p>
        {order.quote && <p className="text-sm text-gray-500">Desde cotización #{order.quote.id.slice(-6).toUpperCase()}</p>}
      </section>
      <section className="py-6">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between border-b py-3 text-sm">
            <span className="font-semibold">{item.quantity} x {item.name}</span>
            <span className="font-bold">{formatCLP(item.subtotal)}</span>
          </div>
        ))}
      </section>
      <section className="ml-auto max-w-sm space-y-2 border-t pt-6">
        <div className="flex justify-between"><span>Subtotal</span><strong>{formatCLP(order.subtotal)}</strong></div>
        <div className="flex justify-between"><span>Descuento</span><strong>{formatCLP(order.discount)}</strong></div>
        <div className="flex justify-between text-2xl"><span>Total</span><strong>{formatCLP(order.total)}</strong></div>
      </section>
    </main>
  );
}
