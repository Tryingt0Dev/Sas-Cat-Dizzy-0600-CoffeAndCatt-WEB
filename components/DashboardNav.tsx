import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";
import { requireStoreAccess } from "@/services/authorization";

const links = [
  ["Panel", "/dashboard"],
  ["Productos", "/dashboard/products"],
  ["Categorías", "/dashboard/categories"],
  ["Clientes", "/dashboard/customers"],
  ["Conversaciones", "/dashboard/conversations"],
  ["Cotizaciones", "/dashboard/quotes"],
  ["Pedidos", "/dashboard/orders"],
  ["Guía", "/dashboard/learning"],
  ["Ajustes", "/dashboard/settings"],
  ["Plan", "/settings/billing"]
];

export async function DashboardNav() {
  const { user, business, isPlatformAdmin, plan } = await requireStoreAccess({ permission: "view_dashboard" });
  const displayName = business.dashboardTitle || business.name;
  const planLabel = plan.name ? `Plan ${plan.name}` : `Plan ${business.planType}`;

  return (
    <aside className="border-r border-[var(--app-border)] bg-[var(--app-surface)] p-5 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-primary)] text-sm font-black text-[var(--app-button-text)]">
            {business.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">CATG SaaS</p>
            <h1 className="truncate text-xl font-black">{displayName}</h1>
          </div>
        </div>
        <p className="text-sm text-[var(--app-text-muted)]">{user.email}</p>
        <span className="mt-3 inline-flex rounded-full bg-[var(--app-surface-muted)] px-3 py-1 text-xs font-black text-[var(--app-text-muted)]">{planLabel}</span>
      </div>
      <nav className="space-y-2">
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="block rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--app-text)] hover:bg-[var(--app-surface-muted)]">
            {label}
          </Link>
        ))}
        {isPlatformAdmin && (
          <Link href="/admin" className="block rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100">
            Superadmin
          </Link>
        )}
      </nav>
      <div className="mt-8 rounded-3xl bg-[var(--app-surface-muted)] p-4 text-sm text-[var(--app-text-muted)]">
        <p className="font-bold text-gray-900">Catálogo público</p>
        <Link className="mt-2 block text-pink-600" href={`/store/${business.publicSlug}`} target="_blank">
          /store/{business.publicSlug}
        </Link>
        <Link className="mt-3 inline-flex rounded-2xl bg-[var(--app-surface)] px-3 py-2 text-xs font-black text-[var(--app-text)] shadow-sm" href="/dashboard/settings">
          Personalizar panel
        </Link>
      </div>
      <form action={logoutAction} className="mt-6">
        <button className="rounded-2xl border border-[var(--app-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--app-surface-muted)]">Cerrar sesión</button>
      </form>
    </aside>
  );
}
