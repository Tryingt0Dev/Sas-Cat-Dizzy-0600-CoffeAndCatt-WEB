# Auditoría Segunda Fase

## Resumen ejecutivo

Esta segunda fase analiza el estado actual del proyecto como un SaaS multi-tenant construido con Next.js y Prisma. Se revisaron permisos, queries de Prisma, endpoints de IA, upload de imágenes, esquema de datos y experiencia del dashboard. El foco principal es detectar riesgos de aislamiento tenant, escalación de privilegios, exposición de datos en endpoints públicos, y debilidades UX que afectan la adopción comercial.

El proyecto tiene buenas bases: `requireStoreAccess` y `assertTenant*` ofrecen un patrón razonable para proteger datos de tienda, y las rutas de uploads/IA ya utilizan validaciones de origen y rate limit. Sin embargo, persisten riesgos importantes en la segmentación de roles globales, el endpoint público de IA, el uso de slugs compartidos, y el diseño de planes/planes límites.

## Riesgos críticos encontrados

- `app/api/ai/sales-assistant/route.ts` expone un endpoint público basado en `publicSlug` sin autenticación. Esto abre una superficie de scraping comercial, enumeración de tiendas y posible exposición de información de catálogo y conversación.
- `app/admin/actions.ts` permite roles globales `PLATFORM_ADMIN`, `ADMIN_GLOBAL`, `OWNER` y `SUPER_ADMIN` sobre usuarios y tiendas. La distinción entre administración de plataforma y administración de tienda es débil.
- `services/authorization.ts` usa cookies `catg_selected_business` y `selectedBusinessIdFromCookie`; el fallback implícito puede ocultar contextos de cambio de tienda y generar confusión en multi-tenant.
- En `app/api/uploads/image/route.ts`, aunque la validación MIME y extensión son correctas, el almacenamiento local por `public/uploads/{businessId}` requiere controles adicionales de limpieza, bloqueo de nombres y límites por tienda.
- El esquema Prisma está basado en Strings para roles y estados. Esto deja espacio para valores inconsistentes en la base de datos, lo que complica auditorías y roles estrictos.
- `lib/auth/permissions.ts` incluye `SUPPORT` y `DEVELOPER` en `ADMIN_PANEL_ROLES`; es necesario revisar si deberían tener acceso de solo lectura o capacidades administrativas completas.
- No se detecta un mecanismo global de auditoría para cambios de data de tienda más allá de logs puntuales en acciones. En SaaS esto es crítico para compliance y detección de abuso.

## Tabla de prioridad

| Prioridad | Archivo / ruta | Problema | Riesgo | Solución | Notes |
|---|---|---|---|---|---|
| Alta | `app/api/ai/sales-assistant/route.ts` | Endpoint público con `businessSlug` solo, sin validación de cliente o token | Descubrimiento de tiendas, scraping, abuso de recursos IA | Migrar a token cliente o auth opcional; limitar data expuesta; bloquear slugs no activos | Prioridad máxima para cierre de superficie pública |
| Alta | `app/admin/actions.ts` | Roles globales demasiado amplios y mezcla plataforma/tienda | Escalación de privilegios y admin panel mal segmentado | Separar `ADMIN_PANEL_VIEW` de `ADMIN_PLATFORM_MANAGE`; restringir cambios de rol global solo a `SUPER_ADMIN` | Revisar UI para no exponer acciones a roles de soporte |
| Alta | `services/authorization.ts` | `getStoreAccess` acepta `businessId`, `businessSlug` y cookie compartida | Contexto de tienda ambiguo y posible acceso erróneo entre tiendas | Forzar validación explícita de `businessId` cuando hay acciones mutables; documentar cookie como fallback solo de navegación | Añadir logs de negocio cuando se usa cookie selectedBusiness |
| Media | `app/api/uploads/image/route.ts` | Uso de almacenamiento local y límite de tamaño fijo | RCE/file path traversal, falta de limpieza de uploads por tienda | Mantener guardias de path, añadir checks de permiso de escritura y caducidad de archivos | Mejorar con almacenamiento externo seguro y scans de contenido |
| Media | `lib/auth/permissions.ts` | Roles representados como strings sueltos | Valores inconsistentes, pruebas y validaciones complejas | Migrar a enums en TS + validar en Prisma en próxima fase | También revisar `USER_GLOBAL_ROLE_OPTIONS` y `STORE_ROLE_OPTIONS` |
| Media | `prisma/schema.prisma` | `publicSlug` único pero expone tienda pública | Descubrimiento y dependencia del slug global | Considerar token de acceso adicional para IA público o rutas de catálogo privadas | Mantener `publicSlug` para catálogo, pero separar `publicSlug` de IA pública quizá con `chatSlug` |
| Baja | `app/dashboard/page.tsx` | Dashboard compila, pero usa muchas métricas con consultas amplias | Rendimiento en tiendas grandes | Segmentar queries, usar paginación y caché de métricas | Ya se mejoró con `select` en productos |
| Baja | `components/DashboardNavClient.tsx` | Sidebar amplio y pesada en móvil | UX poco compacta | Añadir versión colapsable y botones reutilizables | Mejora estética/uso diario |

## Queries Prisma sospechosas

- `app/api/ai/sales-assistant/route.ts`:
  - `prisma.business.findFirst({ where: { publicSlug: businessSlug, isActive: true } })` — llave pública y pública del tenant.
  - `prisma.conversation.findFirst({ where: { id: conversationId, businessId: business.id } })` — buena validación, pero depende del negocio resuelto por slug.
  - `prisma.customer.findFirst({ where: { businessId: business.id, phone: customerPhone } })` — posible unión de leads no intencional si el mismo teléfono existe en otra tienda.

- `app/api/uploads/image/route.ts`:
  - `getStoreAccess({ request: req, businessId, permission: "manage_uploads" })` — correcto, pero el `businessId` viene del form y requiere validación extra en el cliente.
  - `getStoreAccess({ request: req, businessId: uploadBusinessId, permission: "manage_uploads" })` en DELETE — buen guard, pero el URL se parsea manualmente.

- `app/admin/actions.ts`:
  - `prisma.user.update({ where: { id: target.id }, data: { role: parsed.data.role } })` — cambio de rol global directo; debe seguir reglas estrictas.
  - `prisma.membership.upsert({ ... })` — cambios de miembro de tienda sin validación adicional de límites de plan en el update path.

- `app/dashboard/products/actions.ts` y `app/dashboard/quotes/actions.ts`:
  - Uso consistente de `assertTenantProduct`, `assertTenantQuote`, `assertTenantCustomer` — buenas prácticas visibles.

- `services/plan-guard.ts`:
  - `assertWithinPlanLimit(businessId, "images")` y `assertWithinPlanLimit(businessId, "products")` — correcto, pero la limitación se basa en contadores de tabla sin cache ni resguardos transaccionales.

## Rutas que necesitan guards reforzados

- `app/api/ai/sales-assistant/route.ts` — endpoint público. Revisar acceso y throttling por `businessSlug`.
- `app/api/uploads/image/route.ts` — upload/delete ya usan guard, pero la validación por URL y ruta local debe ser revisada para evitar bypass.
- `app/api/billing/portal/route.ts` y `app/api/billing/checkout/route.ts` — usan `getStoreAccess`; revisar para bloquear cambios de `businessId` manipulados desde payload.
- `app/api/catalog/track/route.ts` — probable evento de tracking público; revisar qué datos se registran y si se puede falsificar `businessId`.
- `app/admin/actions.ts` — acciones globales deben diferenciar visualización de la API de modificaciones efectivas.
- `app/dashboard/settings/actions.ts`, `app/settings/billing/actions.ts`, `app/settings/appearance/actions.ts` — revisar que permiten sólo roles de tienda con permiso `manage_settings`.
- `app/select-store/actions.ts` — usa `getStoreAccess` para seleccionar tienda, se debe mantener como único control de cambio de contexto.

## Mejoras necesarias en IA

- Aislamiento de tienda:
  - `businessSlug` es el único selector. Añadir un token de cliente o un campo de sitio secreto para IA pública.
  - Evitar que el endpoint acepte `businessSlug` y `visitorId` sin validación de origen o cliente.

- Prompt injection / seguridad de prompt:
  - El prompt actual prohíbe lenguaje interno, pero mezcla variables de catálogo y texto libre.
  - Debe añadirse un sandbox más estricto: no usar datos de sistema no verificados en el prompt, y limitar la longitud de `history` / `catalogContext`.

- Rate limit y límites:
  - Ya hay rate limit por IP + negocio en `ai:sales-assistant` (30 requests / 10 min), pero no hay límite duro de tokens o de prompt size.
  - Añadir un límite de tamaño de texto de entrada y salida, y límites de token por `businessId`/mes.

- Exposición de datos privados:
  - El endpoint escribe conversaciones, clientes y mensajes sin anonimizar.
  - Debe revisarse el storage de `message.metadata` para no guardar datos sensibles innecesarios.

- Logs y monitoreo:
  - Falta un mecanismo de auditoría específico para IA: número de consultas por tienda, errores del proveedor, fallos de parseo y respuestas fallback.
  - Ideal: almacenar eventos de IA separados, no solo `conversation` y `message`.

## Mejoras necesarias en uploads

- Validación MIME / extensión:
  - Ya se valida `file.type` y el contenido mágico en `app/api/uploads/image/route.ts`.
  - Faltarían controles para detectar archivos con doble extensión `image.png.php` si el nombre se usa en otros sistemas.

- Tamaño máximo y límites por tienda:
  - Max 5MB está bien, pero el sistema no expone un límite configurable por plan ni verificación de conteo de archivos antes de la subida.
  - `canUploadImage` usa el contador de archivos, pero no hay control de peso total ni versions.

- Extensiones peligrosas:
  - Solo JPG/PNG/WEBP permitidas; buen punto. Debe revisarse si `image/svg+xml` puede agregarse en el futuro, ya que SVG es peligroso.

- Separación por `businessId`:
  - El upload usa `public/uploads/{businessId}` y el delete usa la URL para reconstruir ruta.
  - El path traversal está mitigado, pero la variable `businessId` es entregada por el cliente en POST y el URL en DELETE; esto debe ser tratado como un dato de contexto crítico.

- Límite por tienda:
  - `canUploadImage` se basa en el plan. Buen principio.
  - Falta un registro de uso histórico y métricas de almacenamiento total.

## Mejoras recomendadas en Prisma/schema

- Convertir Strings de roles y estados a enums en el esquema Prisma cuando se migre a PostgreSQL.
  - `User.role`, `Membership.role`, `Product.status`, `Conversation.status`, `Subscription.status`, `Plan.type`, `Business.catalogTemplate`, etc.
- Añadir índices únicos y composite más explícitos para asegurar integridad tenant:
  - `Product` ya tiene `@@unique([businessId, slug])`; buen dato.
  - `Category` tiene `@@unique([businessId, slug])`; bien.
  - Considerar `@@unique([businessId, sku])` si SKU debe ser único por tienda.
- Revisar cascades peligrosos:
  - `Business` -> `BusinessSlugHistory` con `onDelete: Cascade` puede borrar historiales completos.
  - `Subscription` -> `Plan` usa `onDelete: Restrict`, correcto.
  - `User` -> `sessions` usa `onDelete: Cascade`; bueno.
  - Se debe revisar si la eliminación de `Business` debe borrar `customers/conversations/orders` automáticamente o requerir soft-delete.
- AuditLog:
  - El modelo existe, pero no hay relaciones `action` con usuario y tienda obligatorios.
  - Añadir campos `resourceName`, `resourceActionType`, `severity` y `metadata` estructurado puede facilitar búsquedas.
- Plan / subscription:
  - `Subscription` tiene `businessId` único; correcto para un solo plan por tienda.
  - Falta un campo `trialEndsAt` y `gracePeriodEndsAt` si el producto SaaS requiere facturación de suscripción.
  - El esquema no refleja expiración de pago o estado de cancelación con suficientes detalles.

## Mejoras UI/UX necesarias

- Dashboard compacto:
  - `app/dashboard/page.tsx` debe soportar un layout `compact` con menos padding y menos bloques predeterminados.
  - Usar tarjetas de métricas pequeñas y listas colapsables en vez de tablas horizontales en móviles.

- Catálogo público profesional:
  - El catálogo debe priorizar hero, filtros y CTA claros.
  - Minimizar acciones por producto (preferir 1-2 CTA principales y un menú de más acciones).

- Cards tipo tienda real:
  - `components/DashboardNavClient.tsx` ya está en mejor camino, pero necesita versión colapsable y agrupación de enlaces.
  - `PageHeader` y `SectionGuide` pueden tener variantes `compact`.

- Responsive:
  - Revisar `app/dashboard/categories/page.tsx` y `app/dashboard/customers/page.tsx` para evitar tablas apretadas en móviles.

- Estados vacíos/loading/error:
  - Apenas se observan `StatusAlert` y mensajes estáticos.
  - Añadir skeletons, placeholders y estados de error específicos en listas de conversación, productos y clientes.

- Textos comerciales:
  - Usar copy enfocado en beneficio comercial y en la reducción de fricción del vendedor.
  - Evitar texto técnico en el dashboard; preferir lenguaje de negocios.

## Roadmap por orden de implementación

1. Seguridad multi-tenant y auth
   - Reforzar roles globales y separación admin plataforma/tienda.
   - Revisar `requireStoreAccess`, `getStoreAccess` y `ADMIN_PANEL_ROLES`.
   - Auditar `app/admin/actions.ts` y `app/(auth)/actions.ts`.

2. Endpoint IA
   - Cerrar superficie pública de IA al menos con token o client auth.
   - Añadir límites de input/output y monitoreo de IA.

3. Uploads y almacenamiento
   - Revisar `app/api/uploads/image/route.ts` y aplicar almacenamiento seguro externo.
   - Añadir métricas y limites de peso/archivos por plan.

4. Prisma/schema y planes
   - Migrar roles/estatus a enums en la próxima versión de BD.
   - Añadir campos de suscripción y auditoría faltantes.

5. UI/UX comercial
   - Implementar dashboard compacto con componentes `compact`.
   - Mejorar catálogo público y estados de carga.

6. Operaciones SaaS
   - Añadir panel admin global de métricas, auditoría y backups.
   - Habilitar exportación CSV, informes de uso y onboarding guiado.

## Checklist final antes de producción

- [ ] Validación de tenant en todas las queries Prisma de mutación.
- [ ] Revisión completa de roles globales vs roles de tienda.
- [ ] Endpoint IA protegido o explícitamente documentado como público.
- [ ] Rate limits por negocio y por IP en IA, uploads y billing.
- [ ] Storage de uploads aislado por `businessId` y protegido contra path traversal.
- [ ] Esquema Prisma con enums o validación de valores de rol/estado.
- [ ] Auditoría de cambios críticos y logs para acciones admin, uploads e IA.
- [ ] UI responsive para dashboard, clientes, catálogos y estados vacíos.
- [ ] Pruebas automatizadas de multi-tenant: acceso entre tiendas, roles y asignaciones.
- [ ] Backups y exportación de datos disponibles para clientes importantes.
- [ ] Onboarding claro con métricas de activación y pasos de configuración.
