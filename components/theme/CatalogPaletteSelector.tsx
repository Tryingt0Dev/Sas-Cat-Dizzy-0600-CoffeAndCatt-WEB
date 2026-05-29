"use client";

import type { CatalogPalette } from "@/lib/themes/catalog-palettes";
import { CatalogPaletteCard } from "./CatalogPaletteCard";

export function CatalogPaletteSelector({
  palettes,
  selectedSlug,
  selectedActionLabel,
  disableSelected,
  onPaletteChange
}: {
  palettes: CatalogPalette[];
  selectedSlug: string;
  selectedActionLabel?: string;
  disableSelected?: boolean;
  onPaletteChange?: (slug: string) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {palettes.map((palette) => (
        <CatalogPaletteCard
          key={palette.slug}
          palette={palette}
          selected={palette.slug === selectedSlug}
          actionLabel="Guardar paleta"
          selectedActionLabel={selectedActionLabel}
          disableSelected={disableSelected}
          onSelect={() => onPaletteChange?.(palette.slug)}
        />
      ))}
    </div>
  );
}
