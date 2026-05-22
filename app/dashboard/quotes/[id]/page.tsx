import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentBusiness } from "@/lib/auth";
import { PrintButton } from "@/components/PrintButton";
import { formatCLP } from "@/lib/format";

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const business = await getCurrentBusiness();
  const quote = await prisma.quote.findFirst({
    where: { id, businessId: business.id },
    include: { customer: true, items: true }
  });

  if (!quote) notFound();

  return (
    <main className="mx-auto max-w-3xl bg-white p-8 print:p-0">
      <div className="mb-6 flex justify-between gap-4 print:hidden">
        <Link href="/dashboard/quotes" className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-bold">Volver</Link>
        <PrintButton className="rounded-2xl bg-black px-4 py-2 text-sm font-bold text-white" />
      </div>
      <section className="border-b pb-6">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-gray-400">Cotización</p>
        <h1 className="mt-2 text-4xl font-black">{business.name}</h1>
        <p className="mt-2 text-gray-500">#{quote.id.slice(-6).toUpperCase()} · {quote.createdAt.toLocaleDateString("es-CL")} · {quote.status}</p>
      </section>

      <section className="grid gap-6 border-b py-6 md:grid-cols-2">
        <div>
          <p className="text-sm font-black text-gray-500">Cliente</p>
          <p className="mt-1 font-bold">{quote.customer?.name ?? quote.customer?.phone ?? "Cliente sin datos"}</p>
          <p className="text-sm text-gray-500">{quote.customer?.email ?? ""}</p>
        </div>
        <div>
          <p className="text-sm font-black text-gray-500">Validez</p>
          <p className="mt-1 font-bold">{quote.validUntil ? quote.validUntil.toLocaleDateString("es-CL") : "No definida"}</p>
        </div>
      </section>

      <section className="py-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-gray-500">
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
      {quote.notes && <p className="mt-8 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">{quote.notes}</p>}
    </main>
  );
}
