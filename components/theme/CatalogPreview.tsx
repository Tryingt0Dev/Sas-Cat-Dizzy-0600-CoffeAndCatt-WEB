import type { CatalogPalette } from "@/lib/themes/catalog-palettes";
import { getCatalogPaletteCssVariables } from "@/lib/themes/theme-utils";

export function CatalogPreview({ palette, buttonRadius }: { palette: CatalogPalette; buttonRadius?: number }) {
  const style = getCatalogPaletteCssVariables(palette, buttonRadius);

  return (
    <div className="rounded-3xl border border-[var(--catalog-border)] bg-[var(--catalog-bg)] p-4" style={style as React.CSSProperties}>
      <div className="space-y-4">
        <div className="rounded-lg p-4" style={{ backgroundColor: palette.colors.banner }}>
          <h3 className="text-lg font-black text-[var(--catalog-text)]">Vista previa del catálogo</h3>
          <p className="text-sm text-[var(--catalog-text-muted)]">Esta paleta afecta solo la página pública de tu tienda</p>
        </div>

        <div className="flex flex-wrap items-start gap-4">
          <div className="w-56 rounded-lg p-3" style={{ backgroundColor: palette.colors.surface }}>
            <div className="h-36 w-full overflow-hidden rounded-md bg-[var(--catalog-muted)]" />
            <h4 className="mt-3 text-sm font-black text-[var(--catalog-text)]">Producto ejemplo</h4>
            <p className="text-sm text-[var(--catalog-text-muted)]">Descripción corta del producto</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-2xl font-black text-[var(--catalog-price)]">$9.990</span>
              <span className="text-sm line-through text-[var(--catalog-text-muted)]">$12.990</span>
            </div>
            <div className="mt-4">
              <button className="rounded-[var(--catalog-radius)] bg-[var(--catalog-primary)] px-4 py-2 text-sm font-black text-white">Comprar</button>
            </div>
          </div>

          <div className="flex-1 rounded-lg p-4" style={{ backgroundColor: palette.colors.surface }}>
            <div className="mb-3 flex gap-2">
              <span className="rounded-full bg-[var(--catalog-secondary)] px-3 py-1 text-xs font-black text-[var(--catalog-text)]">Categoría</span>
              <span className="rounded-full bg-[var(--catalog-accent)] px-3 py-1 text-xs font-black text-white">Oferta</span>
            </div>
            <div className="h-24 rounded-md bg-[var(--catalog-muted)]" />
            <p className="mt-3 text-sm text-[var(--catalog-text-muted)]">Banner y secciones públicas reflejan la paleta seleccionada.</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-3">
          <button className="rounded-2xl bg-[var(--app-surface)] px-4 py-2 text-sm font-semibold text-[var(--app-text)]">Cerrar vista</button>
          <button className="rounded-2xl bg-[var(--app-primary)] px-4 py-2 text-sm font-black text-[var(--app-button-text)]">Guardar paleta</button>
        </div>
      </div>
    </div>
  );
}
