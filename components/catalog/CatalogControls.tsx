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
    <form className={compact ? "grid gap-3 md:grid-cols-[1fr_180px_180px_auto_auto]" : "grid gap-3 rounded-[var(--catalog-radius)] border border-black/10 bg-white/90 p-3 shadow-sm md:grid-cols-[1fr_200px_200px_auto_auto]"} action="">
      <input
        name="q"
        defaultValue={searchState.q}
        placeholder="Buscar productos"
        className="min-h-11 rounded-[var(--catalog-radius)] border border-black/10 bg-white px-4 text-sm text-gray-900"
      />
      <select
        name="category"
        defaultValue={searchState.category}
        className="min-h-11 rounded-[var(--catalog-radius)] border border-black/10 bg-white px-4 text-sm text-gray-900"
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
        className="min-h-11 rounded-[var(--catalog-radius)] border border-black/10 bg-white px-4 text-sm text-gray-900"
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
