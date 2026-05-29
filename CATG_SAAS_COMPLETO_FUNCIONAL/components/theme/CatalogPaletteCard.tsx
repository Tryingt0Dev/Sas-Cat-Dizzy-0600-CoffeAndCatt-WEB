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
    borderColor: selected ? palette.colors.accent : "var(--app-border)"
  };
  const previewStyle = {
    "--catalog-primary": palette.colors.primary,
    "--catalog-secondary": palette.colors.secondary,
    "--catalog-accent": palette.colors.accent,
    "--catalog-bg": palette.colors.background,
    "--catalog-surface": palette.colors.surface,
    "--catalog-text": palette.colors.text,
    "--catalog-text-muted": palette.colors.textMuted,
    "--catalog-muted": palette.colors.muted,
    "--catalog-border": palette.colors.border,
    "--catalog-price": palette.colors.price,
    "--catalog-radius": "14px"
  } as CSSProperties;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-[var(--app-surface)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={paletteCardStyle}>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-base font-black text-[var(--app-text)]">{palette.name}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--app-text-muted)]">{palette.description}</p>
          </div>
          {selected ? (
            <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-black text-[var(--catalog-button-text)]" style={{ backgroundColor: palette.colors.primary }}>
              Actual
            </span>
          ) : null}
        </div>

        <div className="rounded-2xl border p-2 shadow-inner" style={{ ...previewStyle, backgroundColor: palette.colors.background, borderColor: palette.colors.border }}>
          <div className="overflow-hidden rounded-2xl border shadow-sm" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.colors.text }}>
            <div className="h-16 p-3" style={{ backgroundImage: `linear-gradient(135deg, ${palette.colors.banner} 0%, ${palette.colors.primary} 100%)` }}>
              <span className="block h-2.5 w-24 max-w-full rounded-full bg-white/80" />
              <span className="mt-2 block h-1.5 w-2/3 rounded-full bg-white/60" />
            </div>
            <div className="grid gap-2 p-3 sm:grid-cols-[1fr_0.9fr]">
              <div className="rounded-2xl bg-[var(--catalog-muted)] p-3">
                <div className="h-14 rounded-[var(--catalog-radius)] bg-[var(--catalog-secondary)]" />
                <div className="mt-3 space-y-1.5">
                  <span className="block h-2.5 w-16 rounded-full bg-[var(--catalog-text)]" />
                  <span className="block h-1.5 w-2/3 rounded-full bg-[var(--catalog-text-muted)]" />
                </div>
              </div>
              <div className="min-w-0 space-y-2">
                <span className="block h-2.5 w-20 rounded-full bg-[var(--catalog-text)]" />
                <span className="block h-1.5 w-3/5 rounded-full bg-[var(--catalog-text-muted)]" />
                <span className="block h-3 w-20 rounded-full bg-[var(--catalog-price)]" />
                <span className="block h-8 rounded-[var(--catalog-radius)] bg-[var(--catalog-primary)]" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="line-clamp-1 text-xs font-semibold text-[var(--app-text)]">{palette.idealFor}</p>
          <ColorSwatches colors={palette.preview} />
        </div>
      </div>

      <div className="border-t border-[var(--app-border)] bg-[var(--app-surface)] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-[var(--app-text-muted)]">{selected ? "Aplicada al catálogo" : "Disponible"}</p>
          <button
            type="submit"
            name={onSelectName}
            value={value}
            disabled={selected && disableSelected}
            className="inline-flex h-9 items-center rounded-2xl px-3 text-sm font-black text-[var(--catalog-button-text)] transition disabled:cursor-default disabled:bg-[var(--app-surface-muted)] disabled:text-[var(--app-text-muted)]"
            style={selected && disableSelected ? undefined : { backgroundColor: palette.colors.primary }}
          >
            {selected ? selectedActionLabel : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
