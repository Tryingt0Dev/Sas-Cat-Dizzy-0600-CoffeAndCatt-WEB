import type { CSSProperties } from "react";
import type { CatalogPalette } from "@/lib/themes/catalog-palettes";
import { ColorSwatches } from "./ColorSwatches";

export function CatalogPaletteCard({
  palette,
  selected,
  actionLabel,
  selectedActionLabel = "Usar esta paleta",
  disableSelected,
  onSelectName,
  value
}: {
  palette: CatalogPalette;
  selected?: boolean;
  actionLabel: string;
  selectedActionLabel?: string;
  disableSelected?: boolean;
  onSelectName: string;
  value: string;
}) {
  const paletteCardStyle: CSSProperties = {
    borderColor: selected ? palette.colors.primary : "var(--app-border)"
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border bg-[var(--app-surface)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg" style={paletteCardStyle}>
      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-lg font-black text-[var(--app-text)]">{palette.name}</p>
            <p className="mt-2 text-sm text-[var(--app-text-muted)]">{palette.description}</p>
          </div>
          {selected ? <span className="shrink-0 rounded-full px-3 py-1 text-xs font-black text-white" style={{ backgroundColor: palette.colors.primary }}>Activa</span> : null}
        </div>

        <div className="rounded-3xl border p-3 shadow-inner" style={{ backgroundColor: palette.colors.background, borderColor: palette.colors.border }}>
          <div className="overflow-hidden rounded-2xl border shadow-sm" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.colors.text }}>
            <div className="h-20 p-4" style={{ backgroundColor: palette.colors.banner }}>
              <span className="block h-3 w-28 max-w-full rounded-full" style={{ backgroundColor: palette.colors.primary }} />
              <span className="mt-3 block h-2 w-3/4 rounded-full opacity-70" style={{ backgroundColor: palette.colors.accent }} />
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-[1fr_0.8fr]">
              <div className="rounded-2xl p-4" style={{ backgroundColor: palette.colors.muted }}>
                <span className="block h-20 rounded-2xl" style={{ backgroundColor: palette.colors.secondary }} />
              </div>
              <div className="min-w-0 space-y-3">
                <span className="block h-3 w-24 max-w-full rounded-full" style={{ backgroundColor: palette.colors.text }} />
                <span className="block h-2 w-2/3 rounded-full" style={{ backgroundColor: palette.colors.textMuted }} />
                <span className="block h-4 w-20 rounded-full" style={{ backgroundColor: palette.colors.price }} />
                <span className="block h-9 rounded-2xl" style={{ backgroundColor: palette.colors.primary }} />
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--app-text)]">{palette.idealFor}</p>
          <ColorSwatches colors={palette.preview} />
        </div>
      </div>
      <div className="border-t border-[var(--app-border)] bg-[var(--app-surface)] p-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-[var(--app-text-muted)]">{selected ? "Aplicada al catálogo" : "Disponible"}</p>
          <button
            type="submit"
            name={onSelectName}
            value={value}
            disabled={selected && disableSelected}
            className="rounded-2xl px-4 py-2 text-sm font-black text-white transition disabled:cursor-default disabled:bg-[var(--app-surface-muted)] disabled:text-[var(--app-text-muted)]"
            style={selected && disableSelected ? undefined : { backgroundColor: palette.colors.primary }}
          >
            {selected ? selectedActionLabel : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
