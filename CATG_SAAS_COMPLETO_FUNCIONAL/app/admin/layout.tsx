import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";
import { requireAdminPanelUser } from "@/lib/auth";

const adminLinks = [
  ["Resumen", "/admin#resumen"],
  ["Tiendas", "/admin#tiendas"],
  ["Usuarios", "/admin#usuarios"],
  ["Productos", "/admin#productos"],
  ["Diagnostico", "/admin#diagnostico"],
  ["Auditoria", "/admin#auditoria"],
  ["Configuracion", "/admin#configuracion"]
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPanelUser();

  return (
    <main className="grid min-h-screen bg-gray-50 lg:grid-cols-[280px_1fr]">
      <aside className="border-r border-gray-200 bg-white p-5 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">CATG SaaS</p>
          <h1 className="mt-2 text-2xl font-black text-gray-950">Admin global</h1>
          <p className="mt-2 truncate text-sm text-gray-500">{user.email}</p>
          <span className="mt-3 inline-flex rounded-full bg-gray-950 px-3 py-1 text-xs font-black text-white">{user.role}</span>
        </div>
        <nav className="space-y-2">
          {adminLinks.map(([label, href]) => (
            <Link key={href} href={href} className="block rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100">
              {label}
            </Link>
          ))}
          <Link href="/dashboard" className="block rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100">
            Volver al dashboard
          </Link>
        </nav>
        <div className="mt-8 rounded-3xl bg-gray-50 p-4 text-sm text-gray-600">
          <p className="font-bold text-gray-900">Acceso protegido</p>
          <p className="mt-2 leading-6">Todas las consultas globales pasan por rol de plataforma en servidor.</p>
        </div>
        <form action={logoutAction} className="mt-6">
          <button className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50">Cerrar sesion</button>
        </form>
      </aside>
      <section className="min-w-0 p-5 lg:p-8">{children}</section>
    </main>
  );
}
