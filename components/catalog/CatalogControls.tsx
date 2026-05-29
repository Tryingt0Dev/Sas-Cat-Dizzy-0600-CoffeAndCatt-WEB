import type { CatalogCategory, CatalogSearchState } from "@/lib/catalog";

export function CatalogControls({
  categories,
  searchState,
  compact = false
}: {
  categories: CatalogCategory[];
  searchState: CatalogSearchState;
  compact?: boolean;
}) {
  const hasFilters = Boolean(searchState.q || searchState.category || (searchState.sort && searchState.sort !== "featured"));
  const inputClass = "min-h-9 w-full rounded-[var(--catalog-radius)] border border-[var(--catalog-border)] bg-[var(--catalog-bg)] px-3 py-2 text-xs font-semibold text-[var(--catalog-text)] placeholder:text-[var(--catalog-text-muted)] focus:border-[var(--catalog-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--catalog-accent)] transition";

  return (
    <form
      className={compact
        ? "grid gap-2 grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-[minmax(0,1fr)_140px_140px_auto]"
        : "grid gap-2 rounded-[var(--catalog-radius)] border border-[var(--catalog-border)] bg-[var(--catalog-surface)]/95 p-3 shadow-sm grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-[minmax(0,1fr)_150px_150px_auto]"}
      action=""
      method="get"
    >
      <input
        name="q"
        defaultValue={searchState.q}
        placeholder="Buscar productos..."
        aria-label="Buscar productos"
        className={inputClass}
      />
      <select name="category" defaultValue={searchState.category} aria-label="Categoria" className={inputClass}>
        <option value="">Todas las categorias</option>
        {categories.map((category) => (
          <option key={category.id} value={category.slug}>{category.name}</option>
        ))}
      </select>
      <select name="sort" defaultValue={searchState.sort} aria-label="Ordenar" className={inputClass}>
        <option value="featured">Destacados</option>
        <option value="price_asc">Menor precio</option>
        <option value="price_desc">Mayor precio</option>
        <option value="recent">Mas recientes</option>
        <option value="discount">Mayor descuento</option>
      </select>
      <div className="flex gap-2">
        <button className="flex-1 min-h-9 rounded-[var(--catalog-radius)] bg-[var(--catalog-primary)] px-4 text-xs font-black text-[var(--catalog-button-text)] transition hover:brightness-110">
          Filtrar
        </button>
        {hasFilters && (
          <a href="?" className="inline-flex items-center justify-center rounded-[var(--catalog-radius)] border border-[var(--catalog-border)] bg-[var(--catalog-surface)] px-3 text-xs font-black text-[var(--catalog-text)] transition hover:bg-[var(--catalog-muted)]">
            Limpiar
          </a>
        )}
      </div>
    </form>
  );
}
