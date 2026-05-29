import type { CatalogPalette } from "@/lib/themes/catalog-palettes";
import { getCatalogPaletteCssVariables } from "@/lib/themes/theme-utils";

export function CatalogPreview({ palette, buttonRadius }: { palette: CatalogPalette; buttonRadius?: number }) {
  const style = getCatalogPaletteCssVariables(palette, buttonRadius);

  return (
    <div className="rounded-2xl border border-[var(--catalog-border)] bg-[var(--catalog-bg)] p-4 shadow-sm" style={style as React.CSSProperties}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="rounded-[var(--catalog-radius)] bg-[var(--catalog-surface)] p-4 shadow-sm">
          <div className="overflow-hidden rounded-[var(--catalog-radius)] bg-[var(--catalog-banner)] p-4">
            <span className="inline-flex rounded-full bg-[var(--catalog-primary)] px-2.5 py-1 text-xs font-black uppercase tracking-[0.18em] text-[var(--catalog-button-text)]">Vista previa</span>
            <h3 className="mt-3 text-xl font-black text-[var(--catalog-text)]">Tu catálogo, listo para brillar</h3>
            <p className="mt-2 max-w-xl text-sm leading-5 text-[var(--catalog-text-muted)]">Comparte una experiencia fresca, ordenada y profesional con tus clientes.</p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr]">
            <div className="rounded-[var(--catalog-radius)] bg-[var(--catalog-surface)] p-3 shadow-inner">
              <div className="h-24 rounded-[var(--catalog-radius)] bg-[var(--catalog-muted)]" />
              <div className="mt-3 space-y-2">
                <div className="h-2.5 w-20 rounded-full bg-[var(--catalog-primary)]" />
                <div className="h-1.5 w-3/4 rounded-full bg-[var(--catalog-text-muted)]" />
                <div className="h-8 rounded-[var(--catalog-radius)] bg-[var(--catalog-secondary)]" />
              </div>
            </div>
            <div className="rounded-[var(--catalog-radius)] bg-[var(--catalog-surface)] p-3 shadow-inner">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[var(--catalog-secondary)] px-2.5 py-1 text-xs font-black text-[var(--catalog-text)]">Nuevo</span>
                <span className="rounded-full bg-[var(--catalog-accent)] px-2.5 py-1 text-xs font-black text-[var(--catalog-button-text)]">Oferta</span>
                <span className="rounded-full bg-[var(--catalog-primary)] px-2.5 py-1 text-xs font-black text-[var(--catalog-button-text)]">Top</span>
              </div>
              <div className="mt-3 h-16 rounded-[var(--catalog-radius)] bg-[var(--catalog-muted)]" />
              <p className="mt-3 text-xs leading-5 text-[var(--catalog-text-muted)]">Botones suaves, contrastes limpios y secciones bien definidas ayudan a que tu catálogo luzca premium.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="h-9 rounded-2xl bg-[var(--catalog-primary)] px-3 text-sm font-black text-[var(--catalog-button-text)]">Ver productos</button>
                <button className="h-9 rounded-2xl border border-[var(--catalog-border)] bg-[var(--catalog-surface)] px-3 text-sm font-black text-[var(--catalog-text)]">Contactar</button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[var(--catalog-radius)] bg-[var(--app-surface)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--app-primary)]">Colores en acción</p>
          <div className="mt-3 grid gap-2.5">
            <div className="rounded-2xl border border-[var(--catalog-border)] bg-[var(--catalog-surface)] p-3">
              <p className="text-sm font-black text-[var(--catalog-text)]">Botón principal</p>
              <div className="mt-2 h-8 w-full rounded-[var(--catalog-radius)] bg-[var(--catalog-primary)]" />
            </div>
            <div className="rounded-2xl border border-[var(--catalog-border)] bg-[var(--catalog-surface)] p-3">
              <p className="text-sm font-black text-[var(--catalog-text)]">Etiquetas y tarjetas</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-[var(--catalog-secondary)] px-2.5 py-1 text-xs font-black text-[var(--catalog-text)]">Categoria</span>
                <span className="rounded-full bg-[var(--catalog-accent)] px-2.5 py-1 text-xs font-black text-[var(--catalog-button-text)]">Oferta</span>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--catalog-border)] bg-[var(--catalog-surface)] p-3">
              <p className="text-sm font-black text-[var(--catalog-text)]">Paleta</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                <span className="h-7 rounded-xl bg-[var(--catalog-primary)]" />
                <span className="h-7 rounded-xl bg-[var(--catalog-secondary)]" />
                <span className="h-7 rounded-xl bg-[var(--catalog-accent)]" />
                <span className="h-7 rounded-xl border border-[var(--catalog-border)] bg-[var(--catalog-muted)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
