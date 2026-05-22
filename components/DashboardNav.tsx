import Link from "next/link";
import { getCurrentBusiness, requireUser } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/actions";
import { UserRole } from "@/lib/enums";

const links = [
  ["Panel", "/dashboard"],
  ["Productos", "/dashboard/products"],
  ["Categorías", "/dashboard/categories"],
  ["Clientes", "/dashboard/customers"],
  ["Conversaciones", "/dashboard/conversations"],
  ["Cotizaciones", "/dashboard/quotes"],
  ["Pedidos", "/dashboard/orders"],
  ["Ajustes", "/dashboard/settings"]
];

export async function DashboardNav() {
  const user = await requireUser();
  const business = await getCurrentBusiness();
  return (
    <aside className="border-r border-gray-200 bg-white p-5 lg:sticky lg:top-0 lg:h-screen">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">CATG SaaS</p>
        <h1 className="mt-2 text-xl font-black">{business.name}</h1>
        <p className="text-sm text-gray-500">{user.email}</p>
      </div>
      <nav className="space-y-2">
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="block rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100">
            {label}
          </Link>
        ))}
        {user.role === UserRole.PLATFORM_ADMIN && (
          <Link href="/admin" className="block rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100">
            Superadmin
          </Link>
        )}
      </nav>
      <div className="mt-8 rounded-3xl bg-gray-50 p-4 text-sm text-gray-600">
        <p className="font-bold text-gray-900">Catálogo público</p>
        <Link className="mt-2 block text-pink-600" href={`/store/${business.slug}`} target="_blank">
          /store/{business.slug}
        </Link>
      </div>
      <form action={logoutAction} className="mt-6">
        <button className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50">Cerrar sesión</button>
      </form>
    </aside>
  );
}
