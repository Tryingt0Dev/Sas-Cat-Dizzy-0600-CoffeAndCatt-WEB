import type { CatalogPalette } from "@/lib/themes/catalog-palettes";
import { CatalogPaletteCard } from "./CatalogPaletteCard";

type PaletteSelectionAction = (formData: FormData) => void | Promise<void>;

export function CatalogPaletteSelector({
  palettes,
  selectedSlug,
  action,
  hiddenStoreId,
  selectedActionLabel,
  disableSelected
}: {
  palettes: CatalogPalette[];
  selectedSlug: string;
  action: PaletteSelectionAction;
  hiddenStoreId?: string;
  selectedActionLabel?: string;
  disableSelected?: boolean;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
      {palettes.map((palette) => (
        <form key={palette.slug} className="min-h-full" action={action}>
          {hiddenStoreId ? <input type="hidden" name="storeId" value={hiddenStoreId} /> : null}
          <input type="hidden" name="paletteSlug" value={palette.slug} />
          <CatalogPaletteCard
            palette={palette}
            selected={palette.slug === selectedSlug}
            actionLabel="Seleccionar paleta"
            selectedActionLabel={selectedActionLabel}
            disableSelected={disableSelected}
            onSelectName="paletteSlug"
            value={palette.slug}
          />
        </form>
      ))}
    </div>
  );
}
