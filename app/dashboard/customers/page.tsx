import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStoreAccess } from "@/services/authorization";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { HelpTooltip } from "@/components/HelpTooltip";
import { Input, Select } from "@/components/Input";
import { LearningLink } from "@/components/LearningLink";
import { PageHeader } from "@/components/PageHeader";
import { SectionGuide } from "@/components/SectionGuide";
import { StatusAlert } from "@/components/StatusAlert";
import { CustomerStatus, enumValues, type CustomerStatus as CustomerStatusValue } from "@/lib/enums";

type CustomerSearchParams = {
  q?: string;
  status?: string;
  error?: string;
};

export default async function CustomersPage({ searchParams }: { searchParams?: Promise<CustomerSearchParams | undefined> }) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const { business } = await requireStoreAccess({ permission: "manage_customers" });
  const q = String(resolvedSearchParams?.q ?? "").trim();
  const status = String(resolvedSearchParams?.status ?? "").trim();
  const validStatus = enumValues(CustomerStatus).includes(status as CustomerStatusValue) ? status : undefined;

  const customers = await prisma.customer.findMany({
    where: {
      businessId: business.id,
      ...(validStatus ? { status: validStatus } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { phone: { contains: q } },
              { email: { contains: q } }
            ]
          }
        : {})
    },
    include: {
      _count: { select: { conversations: true, quotes: true, orders: true } }
    },
    orderBy: { updatedAt: "desc" },
    take: 100
  });

  return (
    <div>
      <PageHeader eyebrow="CRM" title="Clientes y leads" description="Busca por nombre, teléfono o email y revisa historial comercial." />
      <SectionGuide
        eyebrow="Clientes"
        title="Controla tus clientes y oportunidades"
        description="Revisa el historial, el estado de cada lead y los resultados de cotizaciones y pedidos para cada cliente." 
        help="Usa los filtros para encontrar clientes activos, lead recientes o personas que ya recibieron cotizaciones." 
        actions={<LearningLink href="/dashboard/learning#clientes">Ver guía de clientes</LearningLink>}
      />
      <StatusAlert error={resolvedSearchParams?.error} />
      <Card className="mb-5">
        <form className="grid gap-3 md:grid-cols-[1fr_220px_auto]" action="/dashboard/customers">
          <label className="relative block">
            <Input name="q" defaultValue={q} placeholder="Buscar teléfono, email o nombre" />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">Buscar</span>
          </label>
          <label className="block text-sm font-semibold text-gray-900">
            Estado
            <div className="mt-1 flex items-center gap-2">
              <Select name="status" defaultValue={validStatus ?? ""}>
                <option value="">Todos los estados</option>
                {Object.values(CustomerStatus).map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
              <HelpTooltip description="Filtra clientes por su estado comercial para priorizar seguimiento." />
            </div>
          </label>
          <button className="rounded-2xl bg-black px-4 py-2 text-sm font-bold text-white">Filtrar</button>
        </form>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-3">Nombre</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>
                  <div className="flex items-center gap-2">
                    Estado
                    <HelpTooltip description="El estado indica si el cliente es nuevo, activo, pendiente o cerrado." />
                  </div>
                </th>
                <th>
                  <div className="flex items-center gap-2">
                    Score
                    <HelpTooltip description="El score ayuda a priorizar clientes según su actividad y potencial de compra." />
                  </div>
                </th>
                <th>Historial</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-gray-100">
                  <td className="py-4 font-semibold">{customer.name ?? "Cliente web"}</td>
                  <td>{customer.phone ?? "-"}</td>
                  <td>{customer.email ?? "-"}</td>
                  <td><span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black">{customer.status}</span></td>
                  <td>{customer.leadScore}</td>
                  <td>{customer._count.conversations} conv. · {customer._count.quotes} cot. · {customer._count.orders} ped.</td>
                  <td className="text-right">
                    <Link href={`/dashboard/customers/${customer.id}`} className="font-bold text-black">Ver detalle</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {customers.length === 0 && (
            <EmptyState
              title="No hay clientes con esos filtros"
              description="Ajusta el filtro o busca por nombre, teléfono o email para encontrar el contacto correcto." 
              action={<LearningLink href="/dashboard/learning#clientes">Ver cómo trabajar con clientes</LearningLink>}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
