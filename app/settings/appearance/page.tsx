import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getAccessibleBusinesses } from "@/services/authorization";
import { saasThemes } from "@/lib/themes/saas-themes";
import { catalogPalettes } from "@/lib/themes/catalog-palettes";
import { getSaasThemeBySlug, getCatalogPaletteBySlug, defaultCatalogPaletteSlug } from "@/lib/themes/theme-utils";
import { updateSaaSThemeAction, updateStoreCatalogPaletteAction } from "./actions";
import { SaaSThemeSelector } from "@/components/theme/SaaSThemeSelector";
import { CatalogPaletteSelector } from "@/components/theme/CatalogPaletteSelector";
import { CatalogPaletteBar } from "@/components/theme/CatalogPaletteBar";
import { CatalogPreview } from '@/components/theme/CatalogPreview';
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { StatusAlert } from "@/components/StatusAlert";

export default async function AppearanceSettingsPage({ searchParams }: { searchParams?: Promise<{ success?: string; error?: string; storeId?: string } | undefined> }) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const user = await requireUser();
  const stores = await getAccessibleBusinesses();
  const selectedStoreId = resolvedSearchParams?.storeId ? String(resolvedSearchParams.storeId).trim() : stores[0]?.id;
  const selectedStore = stores.find((store) => store.id === selectedStoreId) ?? stores[0] ?? null;
  const selectedPalette = selectedStore?.catalogPalette ?? defaultCatalogPaletteSlug;

  return (
    <main className="min-h-screen bg-[var(--app-bg)] py-12 px-4 text-[var(--app-text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <PageHeader
          eyebrow="Apariencia"
          title="Personaliza tu panel y el catálogo público"
          description="Elige tu tema del SaaS y define la paleta del catálogo de tu tienda sin mezclar ambos sistemas."
          actions={
            <Link href="/dashboard/settings" className="rounded-2xl bg-[var(--app-surface)] px-4 py-2 text-sm font-black text-[var(--app-text)] shadow-sm hover:bg-[var(--app-surface-muted)]">
              Volver a configuración general
            </Link>
          }
        />
        <StatusAlert success={resolvedSearchParams?.success} error={resolvedSearchParams?.error} />

        <Card>
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--app-primary)]">Tema SaaS</p>
                <h2 className="mt-3 text-2xl font-black text-[var(--app-text)]">Diseño del panel interno</h2>
                <p className="mt-2 text-sm text-[var(--app-text-muted)]">Este tema se aplica a tu dashboard, login, onboarding y todas las páginas internas del SaaS.</p>
              </div>
              <SaaSThemeSelector themes={saasThemes} selectedSlug={user.saasTheme ?? "violet-premium"} action={updateSaaSThemeAction} selectedActionLabel="Diseño activo" disableSelected />
            </div>
            <div className="space-y-4 rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--app-primary)]">Estado actual</p>
              <div className="rounded-3xl bg-[var(--app-surface-muted)] p-5 text-sm text-[var(--app-text-muted)]">
                <p className="font-black text-[var(--app-text)]">Tema SaaS</p>
                <p className="mt-2">{getSaasThemeBySlug(user.saasTheme ?? "violet-premium").name}</p>
              </div>
              <div className="rounded-3xl bg-[var(--app-surface-muted)] p-5 text-sm text-[var(--app-text-muted)]">
                <p className="font-black text-[var(--app-text)]">Paleta del catálogo</p>
                <p className="mt-2">{selectedStore ? getCatalogPaletteBySlug(selectedPalette).name : "Sin tienda seleccionada"}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="grid gap-8">
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--app-primary)]">Catálogo público</p>
                <h2 className="mt-3 text-2xl font-black text-[var(--app-text)]">Paleta por tienda</h2>
                <p className="mt-2 text-sm text-[var(--app-text-muted)]">Cada tienda puede usar una paleta distinta y solo se aplicará al catálogo público.</p>
              </div>
              {stores.length > 1 ? (
                <form className="flex items-center gap-3 rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4" method="get">
                  <label className="text-sm font-semibold text-[var(--app-text-muted)]" htmlFor="storeId">
                    Seleccionar tienda
                  </label>
                  <select name="storeId" id="storeId" defaultValue={selectedStore?.id} className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-input-bg,var(--app-surface))] px-4 py-3 text-sm text-[var(--app-text)] shadow-sm focus:border-[var(--app-primary)] focus:outline-none">
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>
                  <button type="submit" className="rounded-2xl bg-[var(--app-primary)] px-4 py-3 text-sm font-black text-white">Ver</button>
                </form>
              ) : null}
            </div>

            {selectedStore ? (
              <div className="space-y-6">
                  <CatalogPaletteBar palettes={catalogPalettes} selectedSlug={selectedPalette} action={updateStoreCatalogPaletteAction} hiddenStoreId={selectedStore.id} />
                <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-5 text-sm text-[var(--app-text-muted)]">
                  <p className="font-black text-[var(--app-text)]">Tienda seleccionada</p>
                  <p className="mt-2">{selectedStore.name}</p>
                  <p className="mt-1 text-xs">URL pública: <span className="font-semibold">/store/{selectedStore.publicSlug}</span></p>
                </div>
                <CatalogPaletteSelector palettes={catalogPalettes} selectedSlug={selectedPalette} action={updateStoreCatalogPaletteAction} hiddenStoreId={selectedStore.id} selectedActionLabel="Paleta activa" disableSelected />
                <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
                  <CatalogPreview palette={getCatalogPaletteBySlug(selectedPalette)} />
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-6 text-sm text-[var(--app-text-muted)]">
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
