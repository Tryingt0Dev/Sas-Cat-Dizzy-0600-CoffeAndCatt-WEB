# Auditoría UI/UX SaaS

Basado en la estructura del proyecto y los archivos de dashboard, catálogo y componentes.

## app/dashboard/layout.tsx
- Problema: la navegación lateral está fija en una única columna en móvil, lo que puede ocupar espacio vertical innecesario en pantallas compactas.
- Mejora: considerar un menú colapsable o un botón de navegación para móviles, y reducir el padding externo en `section` para ganar espacio útil.

## components/DashboardNavClient.tsx
- Problema: usa múltiples estilos manuales y no reutiliza un componente de botón unificado. La lista de enlaces es extensa y puede verse densa en pantalla pequeña.
- Mejora: unificar botones/enlaces con el componente `Button`, agrupar secciones (Operaciones, Soporte, Admin) y mantener un estilo de tamaño más compacto.
- Mejora: agregar un estado activo más claro y espaciado vertical uniforme para mejorar la lectura.

## components/PageHeader.tsx
- Problema: los títulos y acciones se ven bien, pero las acciones se renderizan con estilos inconsistentes en cada página.
- Mejora: estandarizar el uso de un componente de botón para `actions` y reducir la variación de altura entre botones.

## components/SectionGuide.tsx
- Problema: la guía es informativa, pero usa un panel bastante ancho y alto en cada sección; en páginas con muchas secciones suma peso visual.
- Mejora: hacer la tarjeta más compacta y quizá usar una versión `compact` con menos padding cuando la sección sea secundaria.

## components/EmptyState.tsx
- Problema: el vacío es genérico y no tiene icono personalizado ni CTA con estilo consistente.
- Mejora: incluir un icono de marca/sectores y estandarizar acción con botón primario; mejorar la comunicación para que el cliente entienda el siguiente paso claramente.

## components/Button.tsx
- Problema: existe un componente de botón con variantes, pero muchas páginas no lo usan y construyen botones con clases manuales.
- Mejora: migrar los botones de dashboard a `Button` y aprovechar las variantes `primary`, `secondary`, `danger` para consistencia de tamaño, color y efecto hover.

## app/dashboard/page.tsx
- Problema: el dashboard tiene muchas tarjetas grandes y se siente amplio, pero también puede parecer poco compacto para usar diario.
- Problema: los `quickActions` usan tarjetas individuales con mucho espacio interno; el bloque podría reducir altura y agrupar acciones similares.
- Problema: botones de acción usan estilos distintos entre enlaces `Link` y `LearningLink`, lo que afecta consistencia visual.
- Mejora: compactar las métricas en tarjetas más pequeñas con iconos o indicadores, y usar un grid más apretado en pantallas medianas.
- Mejora: mejorar la jerarquía visual priorizando 4-6 métricas clave y colapsando las demás en un panel secundario.

## app/dashboard/products/page.tsx
- Problema: el formulario de creación/edición está dentro de la misma página que el listado, lo cual añade mucho scroll y una experiencia menos enfocada.
- Problema: cada producto tiene un `details` expandible para editar, lo que genera tarjetas muy grandes y puede ser confuso en móviles.
- Problema: los botones de acción (`Duplicar`, `Eliminar`, `Guardar cambios`) usan distintos estilos manuales.
- Mejora: separar la edición a una página o modal para reducir la cantidad de detalles en la lista principal.
- Mejora: usar cards de producto más compactas tipo mini-lista, con acciones primarias visibles y secundarias en un menú.
- Mejora: unificar el diseño de inputs y botones con el componente `Button`, y usar un esquema de espaciado consistente entre secciones del formulario.

## app/dashboard/categories/page.tsx
- Problema: el panel de categorías está bien, pero el lado izquierdo fijo a `360px` puede ser demasiado ancho en tablets y generar scroll horizontal.
- Mejora: permitir `minmax(0, 1fr)` en vez de un ancho fijo para mejorar responsive.
- Mejora: reducir el padding de la tarjeta de creación si se busca un dashboard más compacto.

## app/dashboard/conversations/page.tsx
- Problema: las tarjetas de conversaciones son claras, pero no tienen un estado de carga o placeholder cuando se está esperando datos.
- Mejora: añadir un skeleton o estado de loading para la lista de conversaciones, y un CTA más destacado en el empty state.

## app/dashboard/customers/page.tsx
- Problema: el input de búsqueda muestra `Buscar` como texto fijo dentro de la etiqueta, lo que puede confundirse con placeholder.
- Problema: la tabla usa `overflow-x-auto`, pero la fila tiene muchas columnas; en móvil puede resultar apretada.
- Mejora: considerar un diseño de lista compacta en móvil en lugar de tabla para mejorar legibilidad.
- Mejora: usar un botón de acción estándar y un mientras-cargas más visible en los filtros.

## app/store/[slug]/page.tsx
- Problema: el catálogo público tiene plantillas modernas y responsive, pero no hay control de `loading` o feedback de búsqueda en esta página.
- Mejora: validar que el catálogo funcione bien en móviles con filtros desplegables y un CTA claro para WhatsApp o ver detalles.

## templates/ModernGridCatalog.tsx
- Observación: buena aproximación tipo marketplace con pestañas y tarjetas. La jerarquía visual es sólida y el layout es responsive.
- Problema: el bloque `featuredProducts` usa el mismo grid que el contenido principal; puede perder prioridad en algunos temas.
- Mejora: usar un espacio más definido entre el hero y el listado, y reducir la altura del hero para una experiencia más compacta.
- Mejora: si se busca un estilo Shopify/CATG, hacer los botones de filtro y CTA más consistentes con el branding de la tienda.

## components/catalog/ProductCard.tsx
- Observación: muy cercano al estilo catálogo profesional. Buen uso de imagen, badges y CTA.
- Problema: tres CTA en cada tarjeta (`Ver detalles`, WhatsApp, `AskAiButton`) puede generar fatiga de decisión.
- Mejora: priorizar dos acciones principales (ver detalle + WhatsApp) y mover IA a un control secundario menos dominante.
- Mejora: hacer el botón de precio/producto más compacto para que la tarjeta se vea más pequeña y ordenada.

## General UI/UX
- Problema: no se evidencia un esquema uniforme de estados `loading`, solo `StatusAlert` para success/error.
- Problema: la experiencia en móviles puede ser correcta, pero `Card` y `PageHeader` usan padding generoso que puede reducir la densidad si se busca un dashboard muy compacto.
- Mejora: implementar variantes `compact` en `Card`, `SectionGuide` y `PageHeader` para secciones operativas.
- Mejora: revisar textos para clientes reales, eliminando frases demasiado internas como "datos separados por tienda" o "score" sin contexto.
- Mejora: aplicar un sistema de colores y botones consistente en todo el dashboard, usando `Button` y las variables CSS ya definidas.

## Recomendaciones de acción
1. Consolidar estilos de botones en `components/Button.tsx` y migrar páginas clave.
2. Definir un modo `compacto` para dashboard y productos.
3. Añadir estados de carga / skeletons en listas de dashboard y catálogo.
4. Revisar el copy de las páginas principales para enfocarlo en clientes reales: objetivos, beneficios y pasos claros.
5. Testear el catálogo público en móviles y ajustar el ancho fijo de algunas tarjetas.
