export function EmptyCatalogState() {
  return (
    <div className="rounded-[var(--catalog-radius)] border border-dashed border-black/20 bg-white p-10 text-center">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Catalogo sin resultados</p>
      <h2 className="mt-3 text-2xl font-black">No encontramos productos con esos filtros</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
        Prueba con otra busqueda o consulta a la IA para que te oriente con los productos activos de esta tienda.
      </p>
    </div>
  );
}
