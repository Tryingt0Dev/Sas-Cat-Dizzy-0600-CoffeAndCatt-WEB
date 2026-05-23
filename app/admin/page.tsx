import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/auth";
import { Card } from "@/components/Card";
import { planDisplayName } from "@/services/plan-guard";
import { toggleBusinessActiveAction } from "./actions";

export default async function AdminPage({ searchParams }: { searchParams?: Promise<{ success?: string; error?: string } | undefined> }) {
  await requirePlatformAdmin();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [businesses, users] = await Promise.all([
    prisma.business.findMany({
      include: {
        owner: true,
        plan: true,
        _count: { select: { products: true, conversations: true } }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.user.findMany({
      include: { _count: { select: { businesses: true } } },
      orderBy: { createdAt: "desc" },
      take: 100
    })
  ]);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-gray-400">Superadmin</p>
          <h1 className="mt-2 text-4xl font-black">Plataforma CATG</h1>
          <p className="mt-2 text-gray-500">Control comercial de tiendas, usuarios, planes y estado operativo.</p>
        </div>
        {resolvedSearchParams?.success && <div className="mb-4 rounded-2xl bg-green-50 p-3 text-sm font-bold text-green-700">{resolvedSearchParams.success}</div>}
        {resolvedSearchParams?.error && <div className="mb-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{resolvedSearchParams.error}</div>}

        <div className="grid gap-4 md:grid-cols-3">
          <Card><p className="text-sm text-gray-500">Tiendas</p><p className="mt-2 text-3xl font-black">{businesses.length}</p></Card>
          <Card><p className="text-sm text-gray-500">Usuarios</p><p className="mt-2 text-3xl font-black">{users.length}</p></Card>
          <Card><p className="text-sm text-gray-500">Activas</p><p className="mt-2 text-3xl font-black">{businesses.filter((business) => business.isActive).length}</p></Card>
        </div>

        <Card className="mt-6">
          <h2 className="text-xl font-black">Tiendas registradas</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-3">Tienda</th>
                  <th>Dueño</th>
                  <th>Plan</th>
                  <th>Estado</th>
                  <th>Productos</th>
                  <th>Conversaciones</th>
                  <th>Creada</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((business) => (
                  <tr key={business.id} className="border-b border-gray-100">
                    <td className="py-4 font-semibold">{business.name}<br /><span className="text-xs text-gray-400">/{business.slug}</span></td>
                    <td>{business.owner.email}</td>
                    <td>{planDisplayName(business.plan, business.owner)}</td>
                    <td>{business.isActive ? "Activa" : "Suspendida"}</td>
                    <td>{business._count.products}</td>
                    <td>{business._count.conversations}</td>
                    <td>{business.createdAt.toLocaleDateString("es-CL")}</td>
                    <td className="text-right">
                      <form action={toggleBusinessActiveAction}>
                        <input type="hidden" name="id" value={business.id} />
                        <input type="hidden" name="isActive" value={business.isActive ? "false" : "true"} />
                        <button className={business.isActive ? "rounded-2xl bg-red-600 px-4 py-2 text-sm font-bold text-white" : "rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white"}>
                          {business.isActive ? "Suspender" : "Reactivar"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="mt-6">
          <h2 className="text-xl font-black">Usuarios</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-3">Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Tiendas</th>
                  <th>Creado</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100">
                    <td className="py-4 font-semibold">{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user._count.businesses}</td>
                    <td>{user.createdAt.toLocaleDateString("es-CL")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </main>
  );
}
