export function EmptyCatalogState() {
  return (
    <div className="rounded-[var(--catalog-radius)] border border-dashed border-[var(--catalog-border)] bg-[var(--catalog-surface)] p-8 text-center">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--catalog-text-muted)]">Catalogo sin resultados</p>
      <h2 className="mt-3 text-2xl font-black text-[var(--catalog-text)]">No encontramos productos con esos filtros</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--catalog-text-muted)]">
        Prueba con otra busqueda o consulta a la IA para que te oriente con los productos activos de esta tienda.
      </p>
    </div>
  );
}
