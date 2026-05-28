import Link from "next/link";
import { getCurrentPlatformAdminAccess } from "@/lib/platform-admin";

const menuLinks = [
  ["Panel global", "/platform-admin"],
  ["Suscripciones", "/platform-admin#suscripciones"],
  ["Tiendas", "/platform-admin#tiendas"],
  ["Usuarios", "/platform-admin#usuarios"],
  ["Planes y límites", "/platform-admin#planes"],
  ["Accesos admin", "/platform-admin#accesos"],
  ["Auditoría", "/platform-admin#auditoria"]
] as const;

export async function FloatingPlatformAdminButton() {
  const current = await getCurrentPlatformAdminAccess();
  if (!current?.access.enabled) return null;

  return (
    <div className="group fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <div className="pointer-events-none translate-y-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-2 text-[var(--app-text)] opacity-0 shadow-xl transition duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <div className="mb-1 px-2 py-1">
          <p className="text-xs font-black">Admin plataforma</p>
          <p className="text-[0.68rem] text-[var(--app-text-muted)]">{current.access.role}</p>
        </div>
        <nav className="grid min-w-44 gap-1">
          {menuLinks.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-xl px-3 py-2 text-xs font-bold text-[var(--app-text)] transition hover:bg-[var(--app-surface-muted)]">
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <Link
        href="/platform-admin"
        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-primary)] text-sm font-black text-[var(--app-button-text)] shadow-xl transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[var(--app-ring)]"
        title="Admin plataforma"
        aria-label="Admin plataforma"
      >
        PA
      </Link>
    </div>
  );
}
