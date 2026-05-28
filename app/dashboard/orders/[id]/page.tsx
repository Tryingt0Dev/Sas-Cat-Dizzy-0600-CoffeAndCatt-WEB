import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStoreAccess } from "@/services/authorization";
import { HelpTooltip } from "@/components/HelpTooltip";
import { LearningLink } from "@/components/LearningLink";
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
    <main className="mx-auto max-w-3xl bg-[var(--app-surface)] p-6 print:p-0">
      <div className="mb-6 flex flex-col gap-4 print:hidden">
        <div className="flex items-center justify-between gap-4">
          <Link href="/dashboard/orders" className="rounded-2xl border border-[var(--app-border)] px-4 py-2 text-sm font-bold">Volver</Link>
          <div className="flex flex-wrap items-center gap-2">
            <PrintButton className="rounded-2xl border border-[var(--app-border)] px-4 py-2 text-sm font-bold" />
            <LearningLink href="/dashboard/learning#ventas">Cómo gestionar pedidos</LearningLink>
          </div>
        </div>
        <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm text-[var(--app-text-muted)]">
          <p className="font-semibold text-[var(--app-text)]">Consejo:</p>
          <p className="mt-2">Actualiza el estado del pedido cuando confirmes preparación, envío o entrega. Esto ayuda a tu equipo a saber qué sigue.</p>
        </div>
      </div>
      <section className="border-b pb-6">
        <div className="flex items-center gap-2">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--app-text-muted)]">Pedido</p>
          <HelpTooltip description="Este pedido se creó desde una cotización aceptada. Mantén el estado actualizado para el equipo de despacho." />
        </div>
        <h1 className="mt-2 text-4xl font-black">{business.name}</h1>
        <p className="mt-2 text-[var(--app-text-muted)]">#{order.id.slice(-6).toUpperCase()} · {order.createdAt.toLocaleDateString("es-CL")} · {order.status}</p>
      </section>
      <section className="border-b py-6">
        <p className="text-sm font-black text-[var(--app-text-muted)]">Cliente</p>
        <p className="mt-1 font-bold">{order.customer?.name ?? order.customer?.phone ?? "Cliente sin datos"}</p>
        {order.quote && <p className="text-sm text-[var(--app-text-muted)]">Desde cotización #{order.quote.id.slice(-6).toUpperCase()}</p>}
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
