import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentBusiness } from "@/lib/auth";
import { Card } from "@/components/Card";
import { Input, Select } from "@/components/Input";
import { CustomerStatus, enumValues, type CustomerStatus as CustomerStatusValue } from "@/lib/enums";

type CustomerSearchParams = {
  q?: string;
  status?: string;
  error?: string;
};

export default async function CustomersPage({ searchParams }: { searchParams?: Promise<CustomerSearchParams | undefined> }) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const business = await getCurrentBusiness();
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
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-gray-400">CRM</p>
        <h1 className="mt-2 text-4xl font-black">Clientes y leads</h1>
        <p className="mt-2 text-gray-500">Busca por nombre, teléfono o email y revisa historial comercial.</p>
      </div>
      {resolvedSearchParams?.error && <div className="mb-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{resolvedSearchParams.error}</div>}
      <Card className="mb-5">
        <form className="grid gap-3 md:grid-cols-[1fr_220px_auto]" action="/dashboard/customers">
          <Input name="q" defaultValue={q} placeholder="Buscar teléfono, email o nombre" />
          <Select name="status" defaultValue={validStatus ?? ""}>
            <option value="">Todos los estados</option>
            {Object.values(CustomerStatus).map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
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
                <th>Estado</th>
                <th>Score</th>
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
          {customers.length === 0 && <p className="py-8 text-center text-gray-500">No hay clientes con esos filtros.</p>}
        </div>
      </Card>
    </div>
  );
}
