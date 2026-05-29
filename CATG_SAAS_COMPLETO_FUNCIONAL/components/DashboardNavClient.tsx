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
  const navGroups = [
    {
      title: "General",
      items: [
        { label: "Inicio", href: "/dashboard", icon: "H" },
        { label: "Tienda", href: `/store/${business.publicSlug}`, icon: "T", external: true },
        { label: "Apariencia", href: "/dashboard/design", icon: "A" }
      ]
    },
    {
      title: "Operación",
      items: [
        { label: "Productos", href: "/dashboard/products", icon: "P" },
        { label: "Categorías", href: "/dashboard/categories", icon: "C" },
        { label: "Pedidos", href: "/dashboard/orders", icon: "O" },
        { label: "Clientes", href: "/dashboard/customers", icon: "U" }
      ]
    },
    {
      title: "Crecimiento",
      items: [
        { label: "IA", href: "/dashboard/conversations", icon: "I" },
        { label: "Cotizaciones", href: "/dashboard/quotes", icon: "Q" },
        { label: "Guía", href: "/dashboard/learning", icon: "G" }
      ]
    },
    {
      title: "Sistema",
      items: [
        { label: "Configuración", href: "/dashboard/settings", icon: "S" },
        { label: "Plan", href: "/settings/billing", icon: "$" }
      ]
    }
  ];

  function isActive(href: string) {
    if (href.startsWith("/store/")) return false;
    if (href === "/dashboard") return pathname === href;
    return pathname === href || pathname?.startsWith(`${href}/`);
  }

  return (
    <aside className="min-w-0 w-full max-w-[260px] border-r border-[var(--app-border)] bg-[var(--app-sidebar-bg)] p-2.5 shadow-sm lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
      <div className="mb-3 overflow-hidden rounded-xl bg-[var(--app-sidebar-hover)] p-3 ring-1 ring-[var(--app-border)]">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--app-primary)] text-xs font-black text-[var(--app-button-text)] shadow-sm">
            {business.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[var(--app-sidebar-text-muted)]">Tienda</p>
            <h1 className="truncate text-sm font-black text-[var(--app-sidebar-text)]">{displayName}</h1>
          </div>
        </div>
        <p className="mt-2 truncate text-xs text-[var(--app-sidebar-text-muted)]">{user.email}</p>
        <span className="mt-2 inline-flex rounded-full bg-[var(--app-primary)] px-2 py-0.5 text-[0.6rem] font-black text-[var(--app-button-text)] shadow-sm">{planLabel}</span>
      </div>

      <nav className="space-y-3">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-1 px-2 text-[0.6rem] font-black uppercase tracking-[0.18em] text-[var(--app-sidebar-text-muted)]">{group.title}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noreferrer" : undefined}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-bold transition duration-200 ${
                      active
                        ? "bg-[var(--app-sidebar-active)] text-[var(--app-sidebar-active-text)] shadow-sm"
                        : "text-[var(--app-sidebar-text)] hover:bg-[var(--app-sidebar-hover)]"
                    }`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[0.62rem] font-black ${active ? "bg-white/20" : "bg-[var(--app-sidebar-hover)]"}`}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {isPlatformAdmin && (
        <Link
          href="/admin"
          className="mt-3 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[var(--app-sidebar-text)] transition hover:bg-red-500/20 hover:text-red-500"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-red-500/15 text-[0.62rem] font-black">A</span>
          Administración
        </Link>
      )}

      <div className="mt-4 rounded-lg bg-[var(--app-sidebar-hover)] p-3 ring-1 ring-[var(--app-border)]">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[var(--app-sidebar-text-muted)]">Tu tienda</p>
        <p className="mt-1 truncate text-xs font-mono text-[var(--app-sidebar-text)]">{business.publicSlug}</p>
        <div className="mt-3 flex flex-col gap-2">
          <Link
            href={`/store/${business.publicSlug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center rounded-lg bg-[var(--app-primary)] px-3 py-1.5 text-xs font-bold text-[var(--app-button-text)] shadow-sm transition duration-200 hover:bg-[var(--app-primary-hover)]"
          >
            Ver catálogo
          </Link>
          <CopyButton
            text={shareUrl}
            label="Copiar enlace"
            className="inline-flex w-full items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-xs font-bold text-[var(--app-text)] transition duration-200 hover:bg-[var(--app-surface-muted)]"
          />
        </div>
      </div>

      <form action={logoutAction} className="mt-4">
        <button className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-xs font-bold text-[var(--app-text-muted)] transition duration-200 hover:bg-[var(--app-surface-muted)]">
          Cerrar sesión
        </button>
      </form>
    </aside>
  );
}
