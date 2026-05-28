# Plan de acción por archivo

## 1. Resumen ejecutivo

Primero deben corregirse los riesgos críticos de seguridad multi-tenant y los accesos públicos de IA.

- `app/api/ai/sales-assistant/route.ts` es un endpoint público con acceso basado solo en `businessSlug`. Debe revisarse si debe ser público o si debe migrar a un token de cliente / auth adicional.
- `services/authorization.ts` y `lib/auth.ts` definen un modelo mixto de `businessId`, `businessSlug` y cookie de tienda seleccionada. Esa flexibilidad es útil, pero también puede ocultar contexto y generar errores de acceso entre tiendas.
- `app/api/uploads/image/route.ts` maneja uploads locales con validación de path. El guard actual es bueno, pero falta un límite más fuerte por plan y métricas de almacenamiento.
- `app/admin/actions.ts` gestiona roles globales y administración de tiendas. Es necesario restringir quién puede asignar roles y verificar que el flujo no permita elevación de privilegios inadvertida.

Estas correcciones deben hacerse antes de avanzar en mejoras menores de UI/UX o en migraciones Prisma.

## 2. Prioridades generales

| Prioridad | Área | Riesgo | Archivos afectados | Acción recomendada |
|---|---|---|---|---|
| Crítica | Endpoint IA público | Descubrimiento de tiendas, scraping, abuso IA | `app/api/ai/sales-assistant/route.ts` | Revisar si el endpoint debe mantenerse público; si no, exigir token/secret y limitar la información enviada al modelo. |
| Crítica | Autorización multi-tenant | Contexto de tienda ambiguo y acceso cruzado | `services/authorization.ts`, `lib/auth.ts`, `app/select-store/actions.ts` | Forzar validación explícita de negocio en mutaciones; documentar cookie como fallback solo de navegación. |
| Alta | Roles globales | Elevación de privilegios / permisos demasiado amplios | `app/admin/actions.ts`, `lib/auth/permissions.ts` | Separar roles de admin de plataforma de los roles de solo vista de panel; limitar asignaciones a `SUPER_ADMIN` cuando corresponda. |
| Alta | Uploads | Path traversal, uso de almacenamiento local, límites de plan | `app/api/uploads/image/route.ts`, `services/plan-guard.ts` | Revisar storage local, agregar límites de peso totales y métricas de uso, mantener guardias de path. |
| Media | Esquema Prisma | Valores de roles/estatus como strings | `prisma/schema.prisma` | Planificar migración a enums nativos en PostgreSQL o reforzar validación de strings. |
| Media | Dashboard y UI | Carga de datos y experiencia en móviles | `app/dashboard/page.tsx`, `components/DashboardNavClient.tsx` | Reducir queries innecesarios, agregar estados vacíos/loading y mejorar la navegación responsiva. |

## 3. Acciones críticas

### app/api/ai/sales-assistant/route.ts

**Problema detectado:**
- El endpoint acepta solo `businessSlug` público para identificar la tienda.
- No existe autenticación real para el consumidor del endpoint.
- El contexto de IA puede incluir datos del catálogo de otras tiendas si el slug no se valida estrictamente.

**Riesgo:**
- Enumeración y scraping de tiendas mediante `publicSlug`.
- Uso abusivo del servicio IA por terceros.
- Exposición indirecta de información comercial y datos de clientes.

**Cambio recomendado:**
- Revisar si este endpoint debe seguir siendo público. Si no, exigir un token / API key por tienda o cliente.
- Si debe seguir abierto, agregar un segundo factor de validación: `aiClientSecret`, `siteToken` o dominio permitido.
- Limitar la información enviada al modelo: evita inyectar metadatos internos que no son necesarios para la respuesta.
- Añadir una protección de tamaño máximo de prompt y response, además del rate limit actual.

**Validación necesaria:**
- Prueba de acceso con `businessSlug` válido e inválido.
- Prueba de acceso desde otro dominio si se cambia a token.
- Comprobar que la información de `customerMessage`, `visitorId` y `productContext` no cruza negocios.
- Revisar logs de protección de rate limit y de plan `canUseAI`.

**Prioridad:** Crítica.

### services/authorization.ts

**Problema detectado:**
- `getStoreAccess` prioriza `businessId`, `businessSlug` y finalmente la cookie `catg_selected_business`.
- El uso implícito de cookie como fallback puede ocultar qué negocio se está usando en acciones críticas.

**Riesgo:**
- Contexto de tienda incorrecto al ejecutar mutaciones.
- Usuarios podrían operar en la tienda equivocada si la cookie no corresponde a la intención actual.
- Dificulta auditoría y simplificación de permisos.

**Cambio recomendado:**
- Forzar `businessId` o `businessSlug` en routes mutables y solo usar cookie de selección en navegación / visualización.
- Añadir logs de auditoría cuando se usa la cookie y no se proporciona `businessId` explícito.
- Documentar claramente en el código el uso de `selectedBusinessIdFromCookie` como fallback de UI.

**Validación necesaria:**
- Pruebas de selección de tienda a través de `app/select-store/actions.ts`.
- Revisión de todas las rutas que llaman `getStoreAccess` para confirmar el uso de parámetros explícitos donde corresponde.

**Prioridad:** Crítica.

### app/api/uploads/image/route.ts

**Problema detectado:**
- La ruta de subida acepta `businessId` del formulario y luego valida acceso con `getStoreAccess`.
- Almacenamiento local en `public/uploads/{businessId}`.
- El recuento de imágenes se basa en el filesystem y no en un límite total de bytes.

**Riesgo:**
- Bypass de paths mediante nombres maliciosos si no se mantiene la validación.
- Carga ilimitada de archivos si el plan no controla peso total.
- Dependencia en almacenamiento local que escala mal y no tiene control de retención.

**Cambio recomendado:**
- Mantener y revisar estrictamente la validación de `resolvedFile.startsWith(resolvedRoot + path.sep)`.
- Agregar límite por plan de almacenamiento total y de número de archivos guardados.
- Considerar mover el almacenamiento a un proveedor externo seguro a futuro.
- Añadir metadatos de uso de espacio por tienda.

**Validación necesaria:**
- Pruebas de subida con `businessId` válido y no válido.
- Pruebas de eliminación de una URL que no pertenece a la tienda autenticada.
- Pruebas de límite de plan con `canUploadImage`.

**Prioridad:** Alta.

### app/admin/actions.ts

**Problema detectado:**
- La gestión de roles globales se realiza por `requirePlatformAdmin` y `canAssignGlobalRole`.
- `USER_GLOBAL_ROLE_OPTIONS` incluye `SUPPORT` y `DEVELOPER` como roles de admin panel.
- No se revisó si el panel de administración permite ciertas acciones a `SUPPORT`/`DEVELOPER` más allá de solo ver.

**Riesgo:**
- Elevación de privilegios si `SUPPORT` / `DEVELOPER` reciben más capa de acceso de la necesaria.
- Asignación de roles globales de forma ambigua entre `PLATFORM_ADMIN`, `ADMIN_GLOBAL`, `OWNER`.

**Cambio recomendado:**
- Restringir la asignación de roles globales más allá de `USER`, `SUPPORT`, `DEVELOPER` si el actor no es `SUPER_ADMIN`.
- Revisar el flujo UI/API para asegurarse de que `SUPPORT` no hereda permisos administrativos de negocios.
- Confirmar que `GLOBAL_ADMIN_ROLES` y `PLATFORM_ADMIN_ROLES` están alineados con la política de acceso real.

**Validación necesaria:**
- Pruebas de cambio de rol con `SUPER_ADMIN`, `PLATFORM_ADMIN` y `SUPPORT`.
- Prueba de mantener al menos un `SUPER_ADMIN` y un administrador global activo.
- Revisión de rutas admin para verificar que solo roles permitidos accedan.

**Prioridad:** Alta.

### lib/auth.ts

**Problema detectado:**
- Las funciones `getCurrentBusinessContext` y `getCurrentBusiness` utilizan la cookie `catg_selected_business` junto con permisos.
- `requirePlatformAdmin`, `requireSuperAdmin` y `requireAdminPanelUser` dependen de `requireUser` sobre el cookie de sesión.

**Riesgo:**
- Si la cookie de tienda está desincronizada, las páginas pueden cargar contexto incorrecto.
- Puede haber rutas que no utilicen `requireStoreAccess` y que dependan de la cookie en lugar de una validación explícita.

**Cambio recomendado:**
- Verificar qué páginas usan `getCurrentBusinessContext` y valorar si deben migrar a `requireStoreAccess` con `permission` explícita.
- Mantener `sameSite: strict` en todas las cookies y revisar la caducidad de `catg_selected_business`.

**Validación necesaria:**
- Pruebas de navegación entre tiendas con cookies de selección.
- Pruebas de expiración de sesión y cookie de selección en modo producción.

**Prioridad:** Alta.

### lib/auth/permissions.ts

**Problema detectado:**
- Roles globales y de tienda están representados como strings sin tipos nativos.
- `ADMIN_PANEL_ROLES` agrupa `SUPPORT` y `DEVELOPER` con admins de plataforma.

**Riesgo:**
- Valores inconsistentes en la base de datos y permisos incorrectos.
- Dificultad para auditar qué rol puede hacer qué acción.

**Cambio recomendado:**
- Revisar y documentar qué roles deben tener acceso al panel vs. qué roles pueden cambiar planes/tiendas.
- Preparar migración a enums en Prisma donde el esquema lo permita.

**Validación necesaria:**
- Revisión de `GLOBAL_ADMIN_ROLES`, `PLATFORM_ADMIN_ROLES`, `ADMIN_PANEL_ROLES` y `canAssignGlobalRole`.
- Pruebas de permisos en páginas admin y panel.

**Prioridad:** Media.

### prisma/schema.prisma

**Problema detectado:**
- Muchos campos de rol/estatus son strings debido a SQLite y falta de enums.
- `AuditLog.metadata` es `String?` en lugar de JSON estructurado.
- `BusinessSlugHistory` usa `onDelete: Cascade` y `slug` único.

**Riesgo:**
- Validación de valores en la base de datos dependiente solo de la aplicación.
- Dificultad para consultas seguras y auditoría robusta.
- Eliminaciones accidentales de historial o datos relacionados.

**Cambio recomendado:**
- Planificar migración a enums nativos cuando pase a PostgreSQL.
- Evaluar `metadata` como JSON o JSONB en el futuro.
- Revisar relaciones y cascadas para retención de datos SaaS (soft-delete en lugar de cascada total en negocios críticos).

**Validación necesaria:**
- Auditoría del esquema con `npx prisma validate` y `npx prisma generate`.
- Revisión manual de restricciones únicas y relaciones de negocios.

**Prioridad:** Media.

## 4. Revisión multi-tenant por archivo

| Archivo | Query o función sospechosa | Riesgo | Corrección recomendada |
|---|---|---|---|
| `app/api/ai/sales-assistant/route.ts` | `prisma.business.findFirst({ where: { publicSlug: businessSlug, isActive: true } })` | Tenant identificado solo por slug público; permite descubrimiento de tiendas. | Validar `businessSlug` y agregar un token/secret adicional o auth. |
| `app/api/ai/sales-assistant/route.ts` | `prisma.customer.findFirst({ where: { businessId: business.id, phone: customerPhone } })` | Reuso de teléfono en otra tienda no cruza negocios, pero la consulta depende del slug. | Mantener businessId en la consulta y revisar transformaciones de phone. |
| `app/api/uploads/image/route.ts` | `getStoreAccess({ request: req, businessId, permission: "manage_uploads" })` | El `businessId` proviene del formulario y se valida después; el flujo de autorización depende de `getStoreAccess`. | Confirmar la autorización y validar `businessId` solo con `access.business.id`. |
| `app/admin/actions.ts` | `prisma.user.update({ where: { id: target.id }, data: { role: parsed.data.role } })` | Actualización global de roles realizada por admin platform; debe respetar reglas de asignación. | Verificar con pruebas que solo `SUPER_ADMIN` puede subir roles de mayor nivel y que no se elevan roles incorrectamente. |
| `app/admin/actions.ts` | `prisma.membership.upsert({ where: { userId_businessId: ... } })` | Miembro de tienda agregado/actualizado sin validación adicional de permisos de plan. | Verificar `canInviteMember` y agregar validación de plan en actualizaciones de miembro cuando corresponda. |
| `app/dashboard/page.tsx` | `prisma.product.findMany({ where: { businessId: business.id } })` | Carga potencialmente pesada de datos para el dashboard; usa tenant guard correcto. | Mantener `requireStoreAccess` y reducir la cantidad de datos devueltos con selects/paginación. |
| `app/select-store/actions.ts` | `getStoreAccess({ businessId, permission: "view_dashboard" })` | Selección de tienda explícita; buen guard, pero requiere claridad de flujo. | Confirmar que `catg_selected_business` se usa solo como fallback de navegación y no como permiso principal. |

## 5. Revisión auth y roles

- `lib/auth.ts` contiene wrappers sólidos: `requireUser`, `requirePlatformAdmin`, `requireSuperAdmin`, `requireAdminPanelUser`, `requireStoreAccess`.
- `services/authorization.ts` expone `getStoreAccess` y `requireStoreAccess`; el modelo actual es correcto, pero la mezcla de `businessId` / `businessSlug` / cookie requiere estandarización.
- `app/api/ai/sales-assistant/route.ts` no usa `requireAuth` ni `getStoreAccess`; está diseñado como endpoint público. Esta es la excepción que requiere revisión de seguridad específica.
- `app/api/uploads/image/route.ts` sí usa `getStoreAccess(..., permission: "manage_uploads")`, lo cual es correcto para autorización de upload/delete.
- `app/dashboard/page.tsx` usa `requireStoreAccess({ permission: "view_dashboard" })`, lo cual es el patrón adecuado para datos de dashboard.
- `app/admin/actions.ts` usa `requirePlatformAdmin()` para todas las acciones de administración global. Es necesario verificar si `SUPPORT` / `DEVELOPER` deben tener acceso al panel y qué operaciones deben bloquearse.
- No se detecta un helper genérico `requireBusinessRole`, pero las funciones `assertCanManageProducts`, `assertCanManageOrders`, `assertCanManageSettings`, `assertCanUseAI` en `services/authorization.ts` cubren permisos específicos.
- `app/api/billing/portal/route.ts`, `app/api/billing/checkout/route.ts` y `app/api/catalog/track/route.ts` no fueron inspeccionados en este plan y requieren revisión manual para asegurar validación de `businessId` y permisos.

## 6. Revisión endpoint IA

- El endpoint actual debe considerarse público mientras no se añada auth adicional.
- La identificación del tenant se basa en `businessSlug` público y `isActive: true`, con `canUseAI(business.id)` y rate limit por IP/negocio de `30` solicitudes cada `10` minutos.
- Buenas prácticas existentes:
  - `productId` se valida contra `business.id` y estado `ACTIVE`.
  - `conversationId` se valida contra `business.id` y estado distinto de `CLOSED`.
- Recomendaciones concretas:
  - Si el endpoint sigue abierto, exigir un token de cliente o un campo secreto por tienda.
  - Limitar el tamaño de entrada y salida de IA.
  - No enviar al modelo metadatos internos no necesarios; mantener solo campos comerciales limitados.
  - Registrar eventos IA separados de las conversaciones generales (`ai.conversation.request`, `ai.conversation.error`).
- Test específicos a crear:
  - `POST /api/ai/sales-assistant` con `businessSlug` inválido/activo/inactivo.
  - `POST /api/ai/sales-assistant` con `productId` de otra tienda y confirmar que retorna 404.
  - Prueba de límite de token/prompt si se implementa.
  - Prueba de `visitorId` y `conversationId` cruzados para asegurar no se mezclan tiendas.

## 7. Revisión uploads

- `app/api/uploads/image/route.ts` ya valida:
  - `Origin` permitido.
  - `businessId` con `getStoreAccess(..., permission: "manage_uploads")`.
  - MIME permitido y contenido mágico detectado.
  - Tamaño máximo 5 MB.
  - Sanitización del nombre de archivo y path traversal con `resolvedFile.startsWith(resolvedRoot + path.sep)`.
- Recomendaciones concretas:
  - Agregar un límite de bytes totales por tienda en el plan, no solo un conteo de archivos.
  - Registrar el uso de almacenamiento y permitir monitorear archivos históricos.
  - Considerar cambio a un proveedor de almacenamiento externo para producción.
  - Revisar eliminación de archivos cuando se borra un recurso o cambia de tienda, para evitar archivos huérfanos.

## 8. Revisión Prisma/schema

- El esquema actual es consistente con SQLite y contiene el comentario de que los enums nativos se migrarán en PostgreSQL.
- Recomendaciones concretas sin modificar aún:
  - Planificar migrar `User.role`, `Membership.role`, `Product.status`, `Conversation.status`, `Quote.status`, `Order.status`, `Subscription.status`, `Business.catalogTemplate`, `Plan.type` a enums nativos.
  - Evaluar `AuditLog.metadata` como JSON/JSONB en el futuro.
  - Añadir campos SaaS útiles en `Subscription`: `trialEndsAt`, `gracePeriodEndsAt`, `canceledAt`, `paymentFailedAt`.
  - Revisar cascadas en `Business -> BusinessSlugHistory`, `Business -> customers/conversations/orders`; en SaaS de producción puede convenir soft-delete en lugar de borrado en cascada completo.

## 9. Mejoras UI/UX por archivo

| Archivo | Problema visual | Mejora recomendada | Prioridad |
|---|---|---|---|
| `app/dashboard/page.tsx` | Dashboard carga muchas métricas y tablas en un único server render. | Reducir consultas, usar selects limitados y presentar cards más compactas con skeletons. | Media |
| `components/DashboardNavClient.tsx` | Sidebar amplio y denso en pantallas grandes/móviles. | Implementar versión colapsable y agrupar enlaces en secciones. | Media |
| `app/dashboard/settings/page.tsx` | Ya se corrigió import faltante; puede requerir validación de layout. | Confirmar que la página usa `requireStoreAccess` y carga settings de forma segura. | Baja |
| `app/select-store/actions.ts` | Flujo de selección de tienda depende de cookie. | Mejorar claridad UX de selección y mensaje de error si no hay acceso. | Baja |

## 10. Backlog ordenado de implementación

### Fase 1: Seguridad crítica

- `app/api/ai/sales-assistant/route.ts`
  - Acción: decidir si el endpoint debe seguir público y/o añadir token de cliente.
  - Riesgo: scraping de tiendas, abuso IA, exposición de datos.
  - Resultado esperado: endpoint IA seguro o documentado como público con protecciones adicionales.

- `services/authorization.ts`
  - Acción: estandarizar `getStoreAccess` para uso explícito en rutas mutables y documentar cookie como fallback.
  - Riesgo: operaciones en tienda equivocada y permisos ambiguos.
  - Resultado esperado: todas las mutaciones usan `businessId`/`businessSlug` explícito y cookie se usa solo para UX.

- `app/api/uploads/image/route.ts`
  - Acción: reforzar límites de plan y revisar storage path.
  - Riesgo: uploads abusivos y escalado de almacenamiento local.
  - Resultado esperado: validación de path intacta y límite de uso por tienda comprobado.

### Fase 2: Tests multi-tenant

- `app/admin/actions.ts`
  - Acción: cubrir con tests la asignación de roles y el mantenimiento de al menos un `SUPER_ADMIN`.
  - Riesgo: cambios de rol inseguros.
  - Resultado esperado: reglas de rol probadas y bloqueo de autorizaciones incorrectas.

- `app/select-store/actions.ts`
  - Acción: probar selección de tienda y cookie `catg_selected_business`.
  - Riesgo: contexto de tienda desincronizado.
  - Resultado esperado: selección de tienda confiable y errores claros.

- `app/dashboard/page.tsx`
  - Acción: probar acceso a dashboard con `requireStoreAccess` y datos de tienda.
  - Riesgo: dashboard mostrará datos de tienda equivocada si falla la selección.
  - Resultado esperado: dashboard solo carga datos del `business.id` autorizado.

### Fase 3: IA y uploads

- `services/product-search.ts`
  - Acción: revisar que `analyzeProductQuery` use solo `businessId` y no permita filtrado cruzado.
  - Riesgo: IA respondiendo con productos no pertenecientes a la tienda.
  - Resultado esperado: búsqueda de producto aislada a la tienda y análisis seguro.

- `services/plan-guard.ts`
  - Acción: revisar límites por plan, especialmente `canUploadImage` y `canUseAI`.
  - Riesgo: planes permitiendo más uso del esperado.
  - Resultado esperado: límites correctos y excepciones manejadas.

- `app/api/uploads/image/route.ts`
  - Acción: agregar métricas de uso por tienda y comentarios sobre almacenamiento externo.
  - Riesgo: repositorio de archivos sin control de retención.
  - Resultado esperado: uploads auditables y límite de plan aplicado.

### Fase 4: Prisma/schema SaaS

- `prisma/schema.prisma`
  - Acción: preparar esquema para enums nativos y campos de suscripción SaaS.
  - Riesgo: validación de datos dependiente solo de TypeScript.
  - Resultado esperado: esquema listo para migración a PostgreSQL con mejores restricciones.

- `lib/auth/permissions.ts`
  - Acción: validar lista de roles globales y de tienda, separar roles de visualización de roles operativos.
  - Riesgo: roles ambiguos y acceso excesivo.
  - Resultado esperado: roles documentados y policy de asignación clara.

### Fase 5: UI/UX comercial

- `app/dashboard/page.tsx`
  - Acción: refactorizar cards y métricas para una experiencia más ligera.
  - Riesgo: dashboard pesado y difícil de usar en móviles.
  - Resultado esperado: dashboard más simple, rápido y responsive.

- `components/DashboardNavClient.tsx`
  - Acción: crear versión colapsable y agrupar enlaces.
  - Riesgo: navegación confusa para usuarios de tienda.
  - Resultado esperado: menú más usable y menos denso.

### Fase 6: Producción/deploy

- `docs/AUDITORIA_SEGUNDA_FASE.md` / `docs/PLAN_ACCION_POR_ARCHIVO.md`
  - Acción: revisar el plan antes de codificar y cerrar hallazgos.
  - Riesgo: cambios sin plan.
  - Resultado esperado: guía exacta para implementación.

- General
  - Acción: ejecutar `npm run lint`, `npm run build`, `npx prisma validate`, `npx prisma generate` antes y después de cada fase.
  - Riesgo: regresiones sin detección.
  - Resultado esperado: validación continua del código.

## 11. Checklist antes de modificar código

- Archivos a respaldar o revisar primero:
  - `app/api/ai/sales-assistant/route.ts`
  - `services/authorization.ts`
  - `app/api/uploads/image/route.ts`
  - `app/admin/actions.ts`
  - `lib/auth.ts`
  - `lib/auth/permissions.ts`
  - `prisma/schema.prisma`

- Tests que deben existir o crearse:
  - Acceso multi-tenant para `getStoreAccess` y `requireStoreAccess`.
  - Autorización de upload/delete de imágenes por tienda.
  - Endpoint IA con `businessSlug`, `productId`, `conversationId` y límites.
  - Asignación de roles globales y mantenimiento de admins.

- Comandos a ejecutar:
  - `npm run lint`
  - `npm run build`
  - `npx prisma validate`
  - `npx prisma generate`
  - `npm test` si existe suite de tests

- Orden seguro de cambios:
  1. Ajustar seguridad de IA y permissions.
  2. Normalizar autorización multi-tenant.
  3. Añadir pruebas de guardias y límites.
  4. Revisar uploads y storage.
  5. Preparar esquema Prisma y roles para migración.
  6. Mejorar UI/UX.
  7. Validar todo con los comandos de build y tests.
