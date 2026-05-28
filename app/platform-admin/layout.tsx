import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/platform-admin";

const links = [
  ["Resumen", "/platform-admin#resumen"],
  ["Tiendas", "/platform-admin#tiendas"],
  ["Suscripciones", "/platform-admin#suscripciones"],
  ["Planes", "/platform-admin#planes"],
  ["Usuarios", "/platform-admin#usuarios"],
  ["Accesos", "/platform-admin#accesos"],
  ["Auditoría", "/platform-admin#auditoria"]
] as const;

export default async function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, access } = await requirePlatformAdmin();

  return (
    <main className="grid min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="border-r border-[var(--app-border)] bg-[var(--app-surface)] p-3 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-[var(--app-text-muted)]">CATG Omniventas</p>
          <h1 className="mt-1 text-lg font-black">Admin plataforma</h1>
          <p className="mt-2 truncate text-xs text-[var(--app-text-muted)]">{user.email}</p>
          <span className="mt-2 inline-flex rounded-full bg-[var(--app-primary)] px-2 py-0.5 text-[0.65rem] font-black text-[var(--app-button-text)]">
            {access.role}
          </span>
        </div>
        <nav className="mt-4 space-y-1">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="block rounded-xl px-3 py-2 text-xs font-black text-[var(--app-text)] transition hover:bg-[var(--app-surface-muted)]">
              {label}
            </Link>
          ))}
          <Link href="/dashboard" className="mt-3 block rounded-xl border border-[var(--app-border)] px-3 py-2 text-xs font-black text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)]">
            Volver al dashboard
          </Link>
        </nav>
        <div className="mt-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-xs leading-5 text-[var(--app-text-muted)]">
          Solo el dueño de la plataforma y correos autorizados pueden entrar aquí. El botón flotante es solo un acceso visual.
        </div>
      </aside>
      <section className="min-w-0 p-4 sm:p-5 lg:p-6">{children}</section>
    </main>
  );
}
