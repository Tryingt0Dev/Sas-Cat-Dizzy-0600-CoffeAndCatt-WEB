import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getAccessibleBusinesses } from "@/services/authorization";
import { saasThemes } from "@/lib/themes/saas-themes";
import { catalogPalettes } from "@/lib/themes/catalog-palettes";
import { getSaasThemeBySlug, getCatalogPaletteBySlug, defaultCatalogPaletteSlug } from "@/lib/themes/theme-utils";
import { updateSaaSThemeAction, updateStoreCatalogPaletteAction } from "@/app/settings/appearance/actions";
import { SaaSThemeSelector } from "@/components/theme/SaaSThemeSelector";
import { CatalogPaletteSelector } from "@/components/theme/CatalogPaletteSelector";
import { CatalogPaletteBar } from "@/components/theme/CatalogPaletteBar";
import { CatalogPreview } from "@/components/theme/CatalogPreview";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { StatusAlert } from "@/components/StatusAlert";

export default async function DashboardDesignPage({ searchParams }: { searchParams?: Promise<{ success?: string; error?: string; storeId?: string } | undefined> }) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const user = await requireUser();
  const stores = await getAccessibleBusinesses();
  const selectedStoreId = resolvedSearchParams?.storeId ? String(resolvedSearchParams.storeId).trim() : stores[0]?.id;
  const selectedStore = stores.find((store) => store.id === selectedStoreId) ?? stores[0] ?? null;
  const selectedPalette = selectedStore?.catalogPalette ?? defaultCatalogPaletteSlug;

  return (
    <main className="min-h-screen bg-[var(--app-bg)] px-3 py-6 text-[var(--app-text)] sm:px-5 lg:px-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <PageHeader
          eyebrow="Diseño"
          title="Diseño"
          description="Personaliza los colores del panel interno y del catálogo público de tu tienda."
          actions={
            <Link href="/dashboard" className="inline-flex h-9 items-center rounded-2xl bg-[var(--app-surface)] px-3 text-sm font-black text-[var(--app-text)] shadow-sm hover:bg-[var(--app-surface-muted)]">
              Volver al panel
            </Link>
          }
        />

        <StatusAlert success={resolvedSearchParams?.success} error={resolvedSearchParams?.error} />

        <Card>
          <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--app-primary)]">Diseño del panel</p>
                <h2 className="mt-2 text-xl font-black text-[var(--app-text)]">Tema del dashboard</h2>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">Selecciona un estilo moderno para las pantallas internas, botones, cards y formularios.</p>
              </div>
              <SaaSThemeSelector themes={saasThemes} selectedSlug={user.saasTheme ?? "violet-premium"} action={updateSaaSThemeAction} selectedActionLabel="Diseño activo" disableSelected />
            </div>
            <div className="space-y-3 rounded-2xl border border-[var(--app-border)] bg-gradient-to-br from-[var(--app-surface)] to-[var(--app-surface-muted)] p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--app-primary)]">Estado actual</p>
              <div className="rounded-2xl bg-[var(--app-surface-muted)] p-3 text-sm text-[var(--app-text-muted)]">
                <p className="font-black text-[var(--app-text)]">Tema SaaS</p>
                <p className="mt-1">{getSaasThemeBySlug(user.saasTheme ?? "violet-premium").name}</p>
              </div>
              <div className="rounded-2xl bg-[var(--app-surface-muted)] p-3 text-sm text-[var(--app-text-muted)]">
                <p className="font-black text-[var(--app-text)]">Paleta del catálogo</p>
                <p className="mt-1">{selectedStore ? getCatalogPaletteBySlug(selectedPalette).name : "Sin tienda seleccionada"}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="grid gap-5">
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--app-primary)]">Catálogo público</p>
                <h2 className="mt-2 text-xl font-black text-[var(--app-text)]">Paleta del catálogo</h2>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">Elige los colores que verán tus clientes en la página pública de tu tienda.</p>
              </div>
              {stores.length > 1 ? (
                <form className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3" method="get">
                  <label className="text-sm font-semibold text-[var(--app-text-muted)]" htmlFor="storeId">
                    Seleccionar tienda
                  </label>
                  <select name="storeId" id="storeId" defaultValue={selectedStore?.id} className="h-9 rounded-2xl border border-[var(--app-border)] bg-[var(--app-input-bg,var(--app-surface))] px-3 text-sm text-[var(--app-text)] shadow-sm focus:border-[var(--app-primary)] focus:outline-none">
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>
                  <button type="submit" className="h-9 rounded-2xl bg-[var(--app-primary)] px-3 text-sm font-black text-[var(--app-button-text)]">Ver</button>
                </form>
              ) : null}
            </div>

            {selectedStore ? (
              <div className="min-w-0 space-y-4">
                <CatalogPaletteBar palettes={catalogPalettes} selectedSlug={selectedPalette} action={updateStoreCatalogPaletteAction} hiddenStoreId={selectedStore.id} />
                <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 text-sm text-[var(--app-text-muted)]">
                  <p className="font-black text-[var(--app-text)]">Tienda seleccionada</p>
                  <p className="mt-1">{selectedStore.name}</p>
                  <p className="mt-1 text-xs">URL pública: <span className="font-semibold">/store/{selectedStore.publicSlug}</span></p>
                </div>
                <CatalogPaletteSelector palettes={catalogPalettes} selectedSlug={selectedPalette} action={updateStoreCatalogPaletteAction} hiddenStoreId={selectedStore.id} selectedActionLabel="Paleta activa" disableSelected />
                <div className="min-w-0 space-y-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
                  <div className="rounded-2xl bg-[var(--app-surface-muted)] p-3 text-sm text-[var(--app-text-muted)]">
                    <p className="font-black text-[var(--app-text)]">Vista previa del catálogo</p>
                    <p>Esta paleta afecta solo tu catálogo público. No cambia el diseño del panel interno.</p>
                  </div>
                  <CatalogPreview palette={getCatalogPaletteBySlug(selectedPalette)} />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 text-sm text-[var(--app-text-muted)]">
                <p className="font-black text-[var(--app-text)]">No se encontró una tienda para personalizar</p>
                <p className="mt-2">Asegúrate de contar con permisos de tienda o selecciona una tienda disponible.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
