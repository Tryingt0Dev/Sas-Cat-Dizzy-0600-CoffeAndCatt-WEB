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

  return (
    <form
      className={compact ? "grid gap-2 sm:grid-cols-1 md:grid-cols-[minmax(0,1fr)_160px_160px_auto_auto]" : "grid gap-3 rounded-[var(--catalog-radius)] border border-[var(--catalog-border)] bg-[var(--catalog-surface)]/95 p-3 shadow-sm sm:grid-cols-1 md:grid-cols-[minmax(0,1fr)_200px_200px_auto_auto]"}
      action=""
      method="get"
    >
      <input
        name="q"
        defaultValue={searchState.q}
        placeholder="Buscar productos"
        aria-label="Buscar productos"
        className="min-h-10 w-full rounded-[var(--catalog-radius)] border border-[var(--catalog-border)] bg-[var(--catalog-bg)] px-3 py-2 text-sm text-[var(--catalog-text)]"
      />
      <select
        name="category"
        defaultValue={searchState.category}
        aria-label="Categoria"
        className="min-h-10 w-full rounded-[var(--catalog-radius)] border border-[var(--catalog-border)] bg-[var(--catalog-bg)] px-3 py-2 text-sm text-[var(--catalog-text)]"
      >
        <option value="">Todas las categorias</option>
        {categories.map((category) => (
          <option key={category.id} value={category.slug}>
            {category.name}
          </option>
        ))}
      </select>
      <select
        name="sort"
        defaultValue={searchState.sort}
        aria-label="Ordenar"
        className="min-h-10 w-full rounded-[var(--catalog-radius)] border border-[var(--catalog-border)] bg-[var(--catalog-bg)] px-3 py-2 text-sm text-[var(--catalog-text)]"
      >
        <option value="featured">Destacados</option>
        <option value="price_asc">Menor precio</option>
        <option value="price_desc">Mayor precio</option>
        <option value="recent">Mas recientes</option>
        <option value="discount">Mayor descuento</option>
      </select>
      <button className="w-full min-h-10 rounded-[var(--catalog-radius)] bg-[var(--catalog-primary)] px-4 text-sm font-black text-[var(--catalog-button-text)] sm:w-auto">
        Filtrar
      </button>
      {hasFilters && (
        <a className="inline-flex w-full min-h-11 items-center justify-center rounded-[var(--catalog-radius)] border border-[var(--catalog-border)] bg-[var(--catalog-surface)] px-5 text-sm font-black text-[var(--catalog-text)] sm:w-auto" href="?">
          Limpiar
        </a>
      )}
    </form>
  );
}
