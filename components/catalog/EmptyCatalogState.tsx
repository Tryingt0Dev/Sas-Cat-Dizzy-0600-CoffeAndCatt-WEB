export function EmptyCatalogState() {
  return (
    <div className="rounded-[var(--catalog-radius)] border border-dashed border-[var(--catalog-border)] bg-[var(--catalog-surface)] p-10 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--catalog-secondary)]">
        <svg className="h-7 w-7 text-[var(--catalog-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </div>
      <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--catalog-text-muted)]">Sin resultados</p>
      <h2 className="mt-3 text-2xl font-black text-[var(--catalog-text)]">No encontramos productos con esos filtros</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[var(--catalog-text-muted)]">
        Prueba con otra busqueda, selecciona una categoria diferente o consulta a la IA para que te oriente con los productos activos de esta tienda.
      </p>
    </div>
  );
}
