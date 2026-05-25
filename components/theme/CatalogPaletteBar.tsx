import type { CatalogPalette } from "@/lib/themes/catalog-palettes";

export function CatalogPaletteBar({
  palettes,
  selectedSlug,
  action,
  hiddenStoreId
}: {
  palettes: CatalogPalette[];
  selectedSlug: string;
  action: (formData: FormData) => void | Promise<void>;
  hiddenStoreId?: string;
}) {
  return (
    <div className="-mx-4 overflow-x-auto pb-3">
      <div className="flex gap-3 px-4">
        {palettes.map((p) => (
          <form key={p.slug} action={action} className="min-w-0">
            {hiddenStoreId ? <input type="hidden" name="storeId" value={hiddenStoreId} /> : null}
            <input type="hidden" name="paletteSlug" value={p.slug} />
            <button
              type="submit"
              className={
                "flex shrink-0 items-center gap-3 rounded-2xl border p-2 transition " +
                (p.slug === selectedSlug
                  ? "border-[var(--catalog-primary)] bg-[var(--app-surface)]"
                  : "border-[var(--app-border)] bg-[var(--app-surface)] hover:shadow-sm")
              }
            >
              <div className="flex flex-col items-start gap-1">
                <div className="flex h-8 w-24 overflow-hidden rounded-lg">
                  <span style={{ backgroundColor: p.colors.banner }} className="h-full w-1/3" />
                  <span style={{ backgroundColor: p.colors.primary }} className="h-full w-1/3" />
                  <span style={{ backgroundColor: p.colors.accent }} className="h-full w-1/3" />
                </div>
                <span className="text-xs font-semibold text-[var(--app-text)]">{p.name}</span>
              </div>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
