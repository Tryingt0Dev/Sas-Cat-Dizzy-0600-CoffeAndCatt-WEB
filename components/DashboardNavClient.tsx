"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/(auth)/actions";
import { CopyButton } from "@/components/CopyButton";

type DashboardNavProps = {
  business: {
    name: string;
    dashboardTitle?: string | null;
    publicSlug: string;
  };
  user: {
    email: string;
  };
  isPlatformAdmin: boolean;
  plan: {
    name?: string | null;
    planType?: string | null;
  };
};

export function DashboardNavClient({ business, user, isPlatformAdmin, plan }: DashboardNavProps) {
  const pathname = usePathname();
  const [origin, setOrigin] = useState("");
  const displayName = business.dashboardTitle || business.name;
  const planLabel = plan.name ? `Plan ${plan.name}` : `Plan ${plan.planType ?? "Standard"}`;

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const shareUrl = origin ? `${origin}/store/${business.publicSlug}` : `/store/${business.publicSlug}`;

  const baseLink =
    "flex items-center gap-3 w-full rounded-2xl px-3 py-2 text-sm font-semibold transition duration-200";

  const activeLink = "bg-blue-500/15 text-white border border-blue-500/30 shadow-sm";
  const inactiveLink = "text-slate-300 hover:bg-white/10 hover:text-white";

  return (
    <aside className="min-w-0 w-full max-w-[320px] border-r border-[var(--app-border)] bg-[var(--app-sidebar-bg)] p-4 shadow-sm lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
      <div className="mb-5 overflow-hidden rounded-2xl bg-[var(--app-surface)] p-4 shadow-sm ring-1 ring-[var(--app-border)]">
        <div className="flex items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[var(--app-primary)] text-sm font-black text-[var(--app-button-text)] shadow-sm">
            {business.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">CATG SaaS</p>
            <h1 className="truncate text-xl font-black text-white">{displayName}</h1>
          </div>
        </div>
        <p className="mt-3 truncate text-sm text-slate-300">{user.email}</p>
        <span className="mt-4 inline-flex rounded-full bg-[var(--app-primary)] px-2.5 py-1 text-[0.65rem] font-black text-[var(--app-button-text)] shadow-sm">{planLabel}</span>
      </div>

      <nav className="space-y-2">
        {[
          ["Panel", "/dashboard"],
          ["Diseño", "/dashboard/design"],
          ["Productos", "/dashboard/products"],
          ["Categorías", "/dashboard/categories"],
          ["Clientes", "/dashboard/customers"],
          ["Conversaciones", "/dashboard/conversations"],
          ["Cotizaciones", "/dashboard/quotes"],
          ["Pedidos", "/dashboard/orders"],
          ["Guía", "/dashboard/learning"],
          ["Ajustes", "/dashboard/settings"],
          ["Plan", "/settings/billing"],
        ].map(([label, href]) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={
                `${baseLink} ` + (active ? `${activeLink}` : `${inactiveLink}`)
              }
              aria-current={active ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
        {isPlatformAdmin && (
          <Link
            href="/admin"
            className={`${baseLink} rounded-3xl px-4 py-3 ` + inactiveLink}
          >
            Superadmin
          </Link>
        )}
      </nav>

      <div className="mt-8 rounded-3xl bg-gradient-to-br from-[var(--app-surface)] to-[var(--app-surface-muted)] p-5 shadow-sm ring-1 ring-[var(--app-border)]">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">Catálogo público</p>
        <p className="mt-2 text-sm text-slate-100 truncate">/store/{business.publicSlug}</p>
        <div className="mt-4 flex flex-col gap-2">
          <Link
            href={`/store/${business.publicSlug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center rounded-2xl bg-[var(--app-primary)] px-3 py-2 text-sm font-black text-[var(--app-button-text)] shadow-sm transition duration-200 hover:bg-[var(--app-primary-hover)]"
          >
            Abrir catálogo
          </Link>
          <CopyButton
            text={shareUrl}
            label="Copiar enlace"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm font-black text-slate-200 transition duration-200 hover:bg-white/5"
          />
        </div>
      </div>

      <form action={logoutAction} className="mt-6">
        <button className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm font-semibold text-slate-300 transition duration-200 hover:bg-white/5">
          Cerrar sesión
        </button>
      </form>
    </aside>
  );
}
