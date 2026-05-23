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
      className={compact ? "grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto_auto]" : "grid gap-3 rounded-[var(--catalog-radius)] border border-black/10 bg-white/90 p-3 shadow-sm md:grid-cols-[minmax(0,1fr)_200px_200px_auto_auto]"}
      action=""
      method="get"
    >
      <input
        name="q"
        defaultValue={searchState.q}
        placeholder="Buscar productos"
        aria-label="Buscar productos"
        className="min-h-11 w-full rounded-[var(--catalog-radius)] border border-black/10 bg-white px-4 text-sm text-gray-900"
      />
      <select
        name="category"
        defaultValue={searchState.category}
        aria-label="Categoria"
        className="min-h-11 w-full rounded-[var(--catalog-radius)] border border-black/10 bg-white px-4 text-sm text-gray-900"
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
        className="min-h-11 w-full rounded-[var(--catalog-radius)] border border-black/10 bg-white px-4 text-sm text-gray-900"
      >
        <option value="featured">Destacados</option>
        <option value="price_asc">Menor precio</option>
        <option value="price_desc">Mayor precio</option>
        <option value="recent">Mas recientes</option>
        <option value="discount">Mayor descuento</option>
      </select>
      <button className="min-h-11 rounded-[var(--catalog-radius)] bg-[var(--catalog-primary)] px-5 text-sm font-black text-white">
        Filtrar
      </button>
      {hasFilters && (
        <a className="inline-flex min-h-11 items-center justify-center rounded-[var(--catalog-radius)] border border-black/10 bg-white px-5 text-sm font-black text-gray-700" href="?">
          Limpiar
        </a>
      )}
    </form>
  );
}
