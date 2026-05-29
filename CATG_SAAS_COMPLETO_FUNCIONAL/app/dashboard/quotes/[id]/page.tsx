import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStoreAccess } from "@/services/authorization";
import { HelpTooltip } from "@/components/HelpTooltip";
import { LearningLink } from "@/components/LearningLink";
import { PrintButton } from "@/components/PrintButton";
import { formatCLP } from "@/lib/format";

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { business } = await requireStoreAccess({ permission: "manage_quotes_orders" });
  const quote = await prisma.quote.findFirst({
    where: { id, businessId: business.id },
    include: { customer: true, items: true }
  });

  if (!quote) notFound();

  return (
    <main className="mx-auto max-w-3xl bg-[var(--app-surface)] p-6 print:p-0">
      <div className="mb-6 flex flex-col gap-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/dashboard/quotes" className="rounded-2xl border border-[var(--app-border)] px-4 py-2 text-sm font-bold">Volver</Link>
          <PrintButton className="rounded-2xl bg-[var(--app-primary)] px-4 py-2 text-sm font-bold text-[var(--app-button-text)]" />
        </div>
        <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm text-[var(--app-text-muted)]">
          <p className="font-semibold text-[var(--app-text)]">Consejo:</p>
          <p className="mt-2">Imprime esta cotización o copia el texto para enviarla por WhatsApp. Verifica fecha de validez y estado antes de compartir.</p>
          <LearningLink href="/dashboard/learning#ventas">Ver guía de cotizaciones</LearningLink>
        </div>
      </div>
      <section className="border-b pb-6">
        <div className="flex items-center gap-2">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--app-text-muted)]">Cotización</p>
          <HelpTooltip description="Esta vista muestra los detalles que puedes imprimir o enviar al cliente junto a la fecha de validez." />
        </div>
        <h1 className="mt-2 text-4xl font-black">{business.name}</h1>
        <p className="mt-2 text-[var(--app-text-muted)]">#{quote.id.slice(-6).toUpperCase()} · {quote.createdAt.toLocaleDateString("es-CL")} · {quote.status}</p>
      </section>

      <section className="grid gap-6 border-b py-6 md:grid-cols-2">
        <div>
          <p className="text-sm font-black text-[var(--app-text-muted)]">Cliente</p>
          <p className="mt-1 font-bold">{quote.customer?.name ?? quote.customer?.phone ?? "Cliente sin datos"}</p>
          <p className="text-sm text-[var(--app-text-muted)]">{quote.customer?.email ?? ""}</p>
        </div>
        <div>
          <p className="text-sm font-black text-[var(--app-text-muted)]">Validez</p>
          <p className="mt-1 font-bold">{quote.validUntil ? quote.validUntil.toLocaleDateString("es-CL") : "No definida"}</p>
        </div>
      </section>

      <section className="py-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-[var(--app-text-muted)]">
              <th className="py-3">Producto</th>
              <th>Cantidad</th>
              <th>Unitario</th>
              <th className="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="py-3 font-semibold">{item.name}</td>
                <td>{item.quantity}</td>
                <td>{formatCLP(item.unitPrice)}</td>
                <td className="text-right font-bold">{formatCLP(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="ml-auto max-w-sm space-y-2 border-t pt-6">
        <div className="flex justify-between"><span>Subtotal</span><strong>{formatCLP(quote.subtotal)}</strong></div>
        <div className="flex justify-between"><span>Descuento</span><strong>{formatCLP(quote.discount)}</strong></div>
        <div className="flex justify-between text-2xl"><span>Total</span><strong>{formatCLP(quote.total)}</strong></div>
      </section>
      {quote.notes && <p className="mt-8 rounded-2xl bg-[var(--app-surface-muted)] p-3 text-sm text-[var(--app-text-muted)]">{quote.notes}</p>}
    </main>
  );
}
