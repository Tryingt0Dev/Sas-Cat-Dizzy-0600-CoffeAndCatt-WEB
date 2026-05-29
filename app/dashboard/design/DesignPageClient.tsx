"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saasThemes } from "@/lib/themes/saas-themes";
import { catalogPalettes } from "@/lib/themes/catalog-palettes";
import { getCatalogPaletteBySlug, getSaasThemeBySlug } from "@/lib/themes/theme-utils";
import { SaaSThemeSelector } from "@/components/theme/SaaSThemeSelector";
import { CatalogPaletteBar } from "@/components/theme/CatalogPaletteBar";
import { CatalogPaletteSelector } from "@/components/theme/CatalogPaletteSelector";
import { CatalogTemplateSelector } from "@/components/theme/CatalogTemplateSelector";
import { CatalogPreview } from "@/components/theme/CatalogPreview";
import { saveDesignChangesAction } from "./actions";
import { DesignAdvancedColors } from "./DesignAdvancedColors";

type StoreInfo = {
  id: string;
  name: string;
  publicSlug: string;
  catalogTemplate: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  buttonRadius: number | null;
};

export function DesignPageClient({
  initialSaaSTheme,
  initialPalette,
  initialTemplate,
  store,
  stores,
  allowedTemplates,
  canUseAdvancedBranding
}: {
  initialSaaSTheme: string;
  initialPalette: string;
  initialTemplate: string;
  store: StoreInfo;
  stores: { id: string; name: string }[];
  allowedTemplates: string[];
  canUseAdvancedBranding: boolean;
}) {
  const [pendingSaaSTheme, setPendingSaaSTheme] = useState(initialSaaSTheme);
  const [pendingPalette, setPendingPalette] = useState(initialPalette);
  const [pendingTemplate, setPendingTemplate] = useState(initialTemplate);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [, startTransition] = useTransition();
  const router = useRouter();

  const hasChanges =
    pendingSaaSTheme !== initialSaaSTheme ||
    pendingPalette !== initialPalette ||
    pendingTemplate !== initialTemplate;

  function handleSave() {
    if (!hasChanges) return;
    setSaveStatus("saving");
    setSaveMessage("");

    const formData = new FormData();
    formData.set("storeId", store.id);
    if (pendingSaaSTheme !== initialSaaSTheme) formData.set("saasTheme", pendingSaaSTheme);
    if (pendingPalette !== initialPalette) formData.set("paletteSlug", pendingPalette);
    if (pendingTemplate !== initialTemplate) formData.set("template", pendingTemplate);

    startTransition(async () => {
      try {
        const result = await saveDesignChangesAction(null, formData);
        if (result.ok) {
          setSaveStatus("saved");
          setSaveMessage(result.message);
          router.refresh();
        } else {
          setSaveStatus("error");
          setSaveMessage(result.message);
        }
      } catch {
        setSaveStatus("error");
        setSaveMessage("Error de red al guardar los cambios.");
      }
    });
  }

  const currentPalette = getCatalogPaletteBySlug(pendingPalette);

  return (
    <>
      {/* SaaS Theme Section */}
      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--app-primary)]">Diseño del panel</p>
              <h2 className="mt-2 text-xl font-black text-[var(--app-text)]">Tema del dashboard</h2>
              <p className="mt-1 text-sm text-[var(--app-text-muted)]">Selecciona un estilo moderno para las pantallas internas, botones, cards y formularios.</p>
            </div>
            <SaaSThemeSelector
              themes={saasThemes}
              selectedSlug={pendingSaaSTheme}
              selectedActionLabel="Seleccionado"
              disableSelected
              onSelect={setPendingSaaSTheme}
            />
          </div>
          <div className="space-y-3 rounded-2xl border border-[var(--app-border)] bg-gradient-to-br from-[var(--app-surface)] to-[var(--app-surface-muted)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--app-primary)]">Estado actual</p>
            <div className="rounded-2xl bg-[var(--app-surface-muted)] p-3 text-sm text-[var(--app-text-muted)]">
              <p className="font-black text-[var(--app-text)]">Tema SaaS</p>
              <p className="mt-1">{getSaasThemeBySlug(pendingSaaSTheme).name}</p>
            </div>
            <div className="rounded-2xl bg-[var(--app-surface-muted)] p-3 text-sm text-[var(--app-text-muted)]">
              <p className="font-black text-[var(--app-text)]">Paleta del catálogo</p>
              <p className="mt-1">{getCatalogPaletteBySlug(pendingPalette).name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Appearance Section */}
      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--app-primary)]">Catálogo público</p>
              <h2 className="mt-2 text-xl font-black text-[var(--app-text)]">Apariencia del catálogo</h2>
              <p className="mt-1 text-sm text-[var(--app-text-muted)]">Elige la plantilla, paleta de colores y ajustes que verán tus clientes.</p>
            </div>
            {stores.length > 1 ? (
              <form className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3" method="get">
                <label className="text-sm font-semibold text-[var(--app-text-muted)]" htmlFor="storeId">Tienda</label>
                <select name="storeId" id="storeId" defaultValue={store.id} className="h-9 rounded-2xl border border-[var(--app-border)] bg-[var(--app-input-bg,var(--app-surface))] px-3 text-sm text-[var(--app-text)] shadow-sm focus:border-[var(--app-primary)] focus:outline-none">
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <button type="submit" className="h-9 rounded-2xl bg-[var(--app-primary)] px-3 text-sm font-black text-[var(--app-button-text)]">Ver</button>
              </form>
            ) : null}
          </div>

          {/* Template Selector */}
          <div>
            <h3 className="text-sm font-black text-[var(--app-text)]">Plantilla del catálogo</h3>
            <p className="mt-1 mb-3 text-xs text-[var(--app-text-muted)]">Define la estructura visual y experiencia de navegación de tu tienda pública.</p>
            <CatalogTemplateSelector
              selectedTemplate={pendingTemplate}
              allowedTemplates={allowedTemplates}
              onTemplateChange={setPendingTemplate}
            />
          </div>

          {/* Palette Selector */}
          <div>
            <h3 className="text-sm font-black text-[var(--app-text)]">Paleta de colores</h3>
            <p className="mt-1 mb-3 text-xs text-[var(--app-text-muted)]">{store.name} — /store/{store.publicSlug}</p>
            <CatalogPaletteBar
              palettes={catalogPalettes}
              selectedSlug={pendingPalette}
              onPaletteChange={setPendingPalette}
            />
            <div className="mt-4">
              <CatalogPaletteSelector
                palettes={catalogPalettes}
                selectedSlug={pendingPalette}
                selectedActionLabel="Seleccionada"
                disableSelected
                onPaletteChange={setPendingPalette}
              />
            </div>
          </div>

          {/* Live Preview */}
          <div>
            <h3 className="text-sm font-black text-[var(--app-text)]">Vista previa en vivo</h3>
            <p className="mt-1 mb-3 text-xs text-[var(--app-text-muted)]">Así se verá tu catálogo público con la paleta seleccionada.</p>
            <CatalogPreview palette={currentPalette} buttonRadius={store.buttonRadius ?? 18} />
          </div>

          {/* Advanced Colors (collapsible) */}
          <DesignAdvancedColors
            storeId={store.id}
            canUseAdvancedBranding={canUseAdvancedBranding}
            initialPrimary={store.primaryColor ?? "#111827"}
            initialSecondary={store.secondaryColor ?? "#F9FAFB"}
            initialAccent={store.accentColor ?? "#E11D48"}
            initialBackground={store.backgroundColor ?? "#F8FAFC"}
            initialText={store.textColor ?? "#111827"}
            initialButtonRadius={store.buttonRadius ?? 18}
          />
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 z-40 mt-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {saveStatus === "idle" && (
              <p className="text-sm text-[var(--app-text-muted)]">
                {hasChanges ? "Tienes cambios sin guardar en la apariencia del catálogo." : "Sin cambios pendientes."}
              </p>
            )}
            {saveStatus === "saving" && (
              <p className="text-sm font-semibold text-[var(--app-primary)]">Guardando cambios...</p>
            )}
            {saveStatus === "saved" && (
              <p className="text-sm font-semibold text-emerald-600">{saveMessage}</p>
            )}
            {saveStatus === "error" && (
              <p className="text-sm font-semibold text-red-600">{saveMessage}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || saveStatus === "saving"}
            className="rounded-xl bg-[var(--app-primary)] px-5 py-2.5 text-sm font-black text-[var(--app-button-text)] shadow-sm transition hover:bg-[var(--app-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saveStatus === "saving" ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </>
  );
}
