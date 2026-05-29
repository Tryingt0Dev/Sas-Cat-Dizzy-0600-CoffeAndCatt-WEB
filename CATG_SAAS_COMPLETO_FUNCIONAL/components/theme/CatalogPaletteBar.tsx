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
    <div className="w-full overflow-hidden pb-2">
      <div className="min-w-0 max-w-full overflow-x-auto">
        <div className="flex w-max gap-2.5 pr-1">
          {palettes.map((p) => (
            <form key={p.slug} action={action} className="min-w-0">
              {hiddenStoreId ? <input type="hidden" name="storeId" value={hiddenStoreId} /> : null}
              <input type="hidden" name="paletteSlug" value={p.slug} />
              <button
                type="submit"
                className={
                  "flex h-10 shrink-0 items-center gap-2 rounded-2xl border px-2.5 text-left transition duration-200 " +
                  (p.slug === selectedSlug
                    ? "border-[var(--catalog-accent)] bg-[var(--app-surface)] shadow-sm"
                    : "border-[var(--app-border)] bg-[var(--app-surface)] hover:-translate-y-0.5 hover:shadow-sm")
                }
              >
                <div className="flex h-7 w-16 overflow-hidden rounded-xl border border-[var(--app-border)]">
                  <span style={{ backgroundColor: p.colors.banner }} className="h-full w-1/3" />
                  <span style={{ backgroundColor: p.colors.primary }} className="h-full w-1/3" />
                  <span style={{ backgroundColor: p.colors.accent }} className="h-full w-1/3" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black text-[var(--app-text)]">{p.name}</span>
                  <span className="text-[.65rem] uppercase tracking-[0.2em] text-[var(--app-text-muted)]">Paleta</span>
                </div>
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
