# Cambios implementados

## Archivos modificados
- `lib/request-security.ts`
- `lib/auth.ts`
- `app/select-store/actions.ts`
- `app/api/ai/sales-assistant/route.ts`
- `app/dashboard/page.tsx`
- `components/DashboardNavClient.tsx`
- `app/dashboard/settings/page.tsx`

## Qué se cambió

1. `lib/request-security.ts`
   - Endurecí la validación de origen en producción: si no hay header `Origin`, la petición se rechaza.
   - Esto reduce el riesgo de peticiones no browser o cross-site no autorizadas en rutas protegidas con esta función.

2. `lib/auth.ts`
   - Cambié la cookie de sesión `catg_session` a `sameSite: "strict"`.
   - Esto mejora la protección CSRF y limita que la sesión se envíe desde contextos cross-site.

3. `app/select-store/actions.ts`
   - Cambié la cookie `catg_selected_business` también a `sameSite: "strict"`.
   - Mejora la seguridad de la selección de tienda y evita fugas en navegación cross-site.

4. `app/api/ai/sales-assistant/route.ts`
   - Normalicé `businessSlug` con `trim().toLowerCase()` y rechacé slugs vacíos.
   - Refuerza que la ruta pública de IA use solo `publicSlug` válido y evita resoluciones inconsistentes de tienda.

5. `app/dashboard/page.tsx`
   - Optimicé la consulta de productos a un `select` limitado a los campos necesarios.
   - Reduce la carga de datos y mejora el rendimiento del dashboard sin cambiar la lógica de negocio.

6. `components/DashboardNavClient.tsx`
   - Ajusté el layout de la barra lateral para ser más compacto y evitar un panel demasiado amplio en pantallas grandes.

7. `app/dashboard/settings/page.tsx`
   - Importé `getCatalogThemeStyle` faltante.
   - Esto corrige un error de compilación del proyecto.

## Por qué

- Prioricé primero seguridad multi-tenant y autenticación estricta.
- Aseguré cookies sensibles con `sameSite: strict` para minimizar ataques CSRF y fugas de sesión.
- Mejoré la validación de la API pública de IA para evitar rutas inválidas o datos de tienda mal resueltos.
- Reduje la carga del dashboard con una consulta más eficiente a Prisma.
- Ajusté un componente UI crítico para una experiencia más compacta en el panel.
- Arreglé un error de importación que impedía compilar el proyecto.

## Riesgo resuelto

- Exposición de endpoints sin `Origin` en producción.
- Sesiones y selección de tienda con cookies `SameSite` laxas.
- Solicitudes AI con `businessSlug` inválido que podían consultar tiendas incorrectas.
- Uso excesivo de campos de producto en el dashboard y posible sobrecarga de datos.
- Falla de compilación en `app/dashboard/settings/page.tsx`.

## Próximas mejoras

- Auditar todas las rutas `app/dashboard/**` y `app/api/**` para confirmar el uso consistente de tenant guards.
- Añadir tests de integración para:
  - acceso entre tiendas con distintos usuarios/membresías,
  - cambios de rol global y demotion de administradores,
  - flujo de registro público con `ADMIN_BOOTSTRAP_SECRET`.
- Revisar si el endpoint `app/api/ai/sales-assistant` debe dejar de ser público y pasar a auth/token.
- Consolidar componentes de UI para usar `Button` en todos los enlaces de acción del dashboard.
- Evaluar la eliminación segura de módulos no usados como `lib/auth/guards.ts`.

# PR-02 Tests de aislamiento multi-tenant

## Archivos modificados
- `scripts/pr02-smoke.ts`
- `package.json`

## Qué se probó
- `getStoreAccess({ requireExplicitBusiness: true })` no usa fallback por cookie.
- Petición sin `businessId` explícito falla con `AuthorizationError("Tienda obligatoria")`.
- `requireExplicitStoreAccess` acepta sesión válida y tienda explícita.
- Usuario A puede acceder a tienda A con permiso `view_dashboard`.
- Usuario A no puede acceder a tienda B ni operar sobre ella.
- Rutas sensibles de PR-01 (`app/api/uploads/image`, `app/api/billing/portal`, `app/api/billing/checkout`) requieren tenant explícito y rechazan acceso cruzado.
- El flujo explícito de tienda no depende del cookie `catg_selected_business` en las rutas protegidas.

## Riesgo resuelto

- Aislamiento insuficiente entre tenants cuando se usaba cookie seleccionada como fallback.
- Acceso cruzado de Usuario A a recursos de Tienda B en APIs sensibles.
- Rutas mutables que podían aceptar sesiones válidas pero tiendas implícitas sin `businessId` explícito.

## Verificación realizada

- `npm run lint`
- `npm run build`
- `npx prisma validate`
- `npm test`

## Próximo PR recomendado

Sugerido PR-03: hardening endpoint IA, ya que el riesgo más alto restante detectado es que `app/api/ai/sales-assistant` sigue siendo público y debe revisarse con auth/token o validación adicional.

- `npm run lint`
- `npm run build`
- `npx prisma validate`
- `npx prisma generate`

# PR-03 Hardening endpoint IA

## Archivos modificados
- `app/api/ai/sales-assistant/route.ts`
- `services/product-search.ts`
- `lib/rate-limit.ts`
- `lib/validation.ts`
- `scripts/pr03-smoke.ts`
- `package.json`
- `docs/CAMBIOS_IMPLEMENTADOS.md`

## Qué se cambió
- Se reforzó la validación del endpoint público de IA: método `POST`, JSON inválido, `businessSlug/publicSlug` explícito normalizado, mensaje obligatorio, límite de longitud y rechazo de historial excesivo.
- Se agregó rate limit por IP + slug público de tienda con límite inicial de 20 requests por minuto. En desarrollo usa memoria local; en producción debe operar con Redis/KV mediante el backend ya soportado por `lib/rate-limit.ts`.
- La tienda se resuelve únicamente por `publicSlug` explícito e `isActive: true`, sin fallback por cookie `catg_selected_business`.
- El contexto enviado al proveedor IA quedó limitado a campos públicos mínimos: nombre y descripción pública de tienda, nombre de producto, precio público, descuento público, disponibilidad pública, categoría y descripción pública.
- Se removieron del prompt IDs internos, SKU, tags, instrucciones privadas de `AiSettings`, usuarios, roles, costos, márgenes y otros datos no necesarios.
- Se limitó el contexto a un máximo fijo de productos relevantes y se agregó `max_tokens` para acotar la respuesta del proveedor IA.
- El system prompt ahora refuerza aislamiento por tienda, no invención de precio/stock, rechazo de prompt injection básica y no revelación de instrucciones internas.
- Los errores del endpoint devuelven respuestas genéricas y el logging de desarrollo registra solo tipo de error, `businessId` y timestamp.

## Riesgo resuelto
- Reduce abuso del endpoint público mediante rate limit por IP + tienda.
- Reduce mezcla de datos entre tiendas al mantener todas las consultas de productos, conversaciones y clientes filtradas por `businessId`.
- Reduce prompt injection básica al fijar reglas explícitas de tienda actual, datos públicos y no revelación de instrucciones.
- Reduce exposición de datos privados al no enviar al modelo costos, márgenes, usuarios, roles, emails, tokens, configuración privada ni IDs internos innecesarios.
- Reduce consumo excesivo de IA al limitar mensaje, historial, contexto de productos y tamaño de respuesta.

## Verificación realizada
- `npm run test:pr03`
- `npm run lint`
- `npm run build`
- `npx prisma validate`

## Próximo PR recomendado
Sugerido PR-04: hardening uploads/storage.

# PR-04 Hardening uploads/storage

## Archivos modificados
- `app/api/uploads/image/route.ts`
- `lib/validation.ts`
- `scripts/pr02-smoke.ts`
- `scripts/pr04-smoke.ts`
- `package.json`
- `docs/CAMBIOS_IMPLEMENTADOS.md`

## Qué se cambió
- Se reforzó la autorización de uploads y delete con sesión, `businessId` explícito, permiso `manage_uploads` y `requireExplicitBusiness`, sin fallback por cookie `catg_selected_business`.
- La subida valida archivo único, presencia, tamaño máximo de 5MB, MIME permitido, extensión permitida y nombre original seguro.
- Se permiten solo `image/jpeg`, `image/png` e `image/webp`; SVG, HTML, JS, PDF, ejecutables, archivos sin extensión, doble extensión peligrosa y path traversal se rechazan.
- Se mantiene validación MIME real con magic bytes para JPG, PNG y WEBP, además de `file.type`.
- La ruta de storage nueva queda aislada por tienda: `/uploads/businesses/{businessId}/images/{uuid}.{ext}`. El cliente no controla el path final.
- El delete ahora requiere `businessId` explícito, valida acceso a la tienda y comprueba que la URL pertenece al prefijo seguro de esa tienda antes de borrar. Se mantiene lectura de rutas legacy `/uploads/{businessId}/...` para compatibilidad.
- Se aplicó rate limit por IP + tienda para upload y delete, con 30 requests cada 10 minutos.
- Los errores evitan stack traces, rutas absolutas y detalles de filesystem; el logging de desarrollo registra solo acción, `businessId`, `userId`, tamaño, MIME, tipo de error y timestamp.
- `imageUrlBelongsToBusiness` acepta la ruta nueva y la legacy, manteniendo validación de ownership por `businessId`.

## Riesgo resuelto
- Reduce subida de archivos maliciosos al bloquear tipos no permitidos, SVG, doble extensión peligrosa y nombres inseguros.
- Reduce path traversal al impedir que el cliente controle rutas y al resolver siempre dentro del directorio permitido.
- Reduce mezcla de archivos entre tiendas con storage aislado por `businessId` y autorización explícita.
- Reduce abuso de almacenamiento con tamaño máximo, archivo único por request y rate limit.
- Reduce eliminación de archivos de otra tienda al requerir `businessId` explícito y validar prefijo seguro antes de borrar.
- Reduce exposición de rutas internas al devolver solo URLs relativas y errores genéricos.

## Verificación realizada
- `npm run test:pr04`
- `npm run lint`
- `npm run build`
- `npx prisma validate`

## Próximo PR recomendado
Sugerido PR-05: roles globales vs roles de tienda.

# PR-05 Roles globales vs roles de tienda

## Archivos modificados
- `lib/auth/permissions.ts`
- `services/authorization.ts`
- `lib/auth/guards.ts`
- `scripts/pr05-smoke.ts`
- `package.json`
- `docs/CAMBIOS_IMPLEMENTADOS.md`

## Qué se cambió
- Se formalizó la separación entre roles globales del SaaS y roles de tienda. `SUPER_ADMIN`, `DEVELOPER` y `SUPPORT` quedan como roles globales formales; `PLATFORM_ADMIN`, `ADMIN_GLOBAL` y `OWNER` se mantienen como aliases legacy globales para no romper compatibilidad.
- Se centralizó el mapa de permisos de tienda en `lib/auth/permissions.ts`, con permisos como `manage_products`, `manage_uploads`, `manage_settings`, `manage_users`, `manage_business` y `view_dashboard`.
- Se agregaron helpers puros como `businessRoleHasPermission`, `canManageBusiness`, `canManageUploads`, `canManageUsers`, `canManageProducts`, `canManageSettings` y `canViewDashboard`.
- `services/authorization.ts` ahora consume el mapa centralizado y expone helpers compatibles `requireBusinessAccess`, `requireBusinessPermission` y `requireBusinessRole`, manteniendo `requireStoreAccess` para el código existente.
- `lib/auth/guards.ts` expone aliases backend `requireBusinessAccess`, `requireBusinessPermission` y `requireBusinessRole`, y alinea `requireDeveloperOrAdmin` con los roles globales autorizados para el panel.
- Las rutas y acciones existentes siguen usando los guards actuales; las rutas sensibles endurecidas en PR-01/PR-04 continúan exigiendo `businessId` explícito.
- No se cambió Prisma ni se renombraron roles existentes. La separación completa a nivel schema queda documentada como limitación futura porque `User.role` y `Membership.role` siguen siendo strings.

## Riesgo resuelto
- Reduce escalada de privilegios al distinguir rol global de SaaS y rol de tienda.
- Evita que un OWNER/ADMIN de tienda sea tratado como administrador global solo por su membresía.
- Reduce acciones sensibles sin rol suficiente al concentrar permisos de tienda en un mapa único.
- Reduce lógica de permisos duplicada entre helpers y servicios.
- Reduce mezcla de permisos entre tiendas al reforzar helpers explícitos por `businessId`.

## Verificación realizada
- `npm run test:pr05`
- `npm run test:pr02`
- `npm run test:pr04`
- `npm run lint`
- `npm run build`
- `npx prisma validate`

## Próximo PR recomendado
Sugerido PR-06: AuditLog para acciones sensibles.

# PR-06 AuditLog para acciones sensibles

## Archivos modificados
- `lib/audit-log.ts`
- `services/audit-log.ts`
- `lib/security/audit-log.ts`
- `app/api/uploads/image/route.ts`
- `app/api/ai/sales-assistant/route.ts`
- `app/select-store/actions.ts`
- `app/dashboard/settings/actions.ts`
- `app/settings/appearance/actions.ts`
- `scripts/pr06-smoke.ts`
- `package.json`
- `docs/CAMBIOS_IMPLEMENTADOS.md`

## Qué se cambió
- Se reutilizó el modelo `AuditLog` existente en Prisma. No se agregó una tabla nueva ni se modificó el schema porque el proyecto ya tenía `userId`, `businessId`, `action`, `resourceType`, `resourceId`, `metadata`, `ip`, `userAgent` y `createdAt`.
- Se creó `lib/audit-log.ts` como helper centralizado con `writeAuditLog`, `auditSuccess`, `auditFailure` y `auditBlocked`.
- El helper acepta `entityType/entityId` y mantiene compatibilidad con `resourceType/resourceId`; el `result` se guarda dentro de metadata por compatibilidad con el modelo existente.
- Se agregó redacción de metadata para claves sensibles como `password`, `token`, `cookie`, `authorization`, `secret`, `apiKey`, `accessToken` y `refreshToken`.
- Se limitan strings largos, arrays, profundidad y tamaño final de metadata para evitar almacenar payloads grandes o sensibles.
- La escritura de auditoría falla de forma segura: si el log no se puede escribir, no rompe la acción principal y solo registra un aviso mínimo en desarrollo.
- Se auditan uploads: `upload_image_success`, `upload_image_blocked`, `delete_image_success`, `delete_image_blocked`.
- Se audita IA pública: `ai_sales_assistant_request`, `ai_sales_assistant_blocked`, `ai_sales_assistant_rate_limited`, guardando solo longitud de mensaje, cantidad de historial, resultado y conteos mínimos.
- Se audita selección de tienda: `select_store_success`, `select_store_blocked`.
- Se auditan settings/apariencia: `update_business_settings_success` y `update_appearance_success`.
- Se mantiene compatibilidad con PR-01 a PR-05: los guards siguen exigiendo `businessId` explícito y los logs se asocian a `businessId` solo después de resolver acceso real.

## PR-06.1 Limpieza AuditLog

- Se revisaron y dejaron sin imports duplicados las integraciones AuditLog en uploads, IA, selección de tienda, settings y apariencia.
- Se mantuvo una sola interfaz principal de auditoría en las rutas PR-06: `auditSuccess` y `auditBlocked`, sin mezclar `writeAuditLog` para las mismas acciones sensibles.
- Se confirmaron los nombres normalizados en `snake_case`: `upload_image_success`, `upload_image_blocked`, `delete_image_success`, `delete_image_blocked`, `ai_sales_assistant_request`, `ai_sales_assistant_blocked`, `ai_sales_assistant_rate_limited`, `select_store_success`, `select_store_blocked`, `update_business_settings_success` y `update_appearance_success`.
- Se ajustó la metadata de uploads/delete para no guardar URLs de archivo; ahora se registra solo `fileName` seguro, `mime`, `size` y `extension` cuando corresponde.
- No quedaron escrituras duplicadas para la misma acción sensible ni nombres legacy tipo `upload.image.create` o `upload.image.delete` en las rutas PR-06.
- Verificación ejecutada: `npm run test:pr06`, `npm run test:pr04`, `npm run test:pr03`, `npm run lint`, `npm run build`, `npx prisma validate`, `npm run test:pr02` y `npm run test:pr05`.

## Riesgo resuelto
- Reduce falta de trazabilidad en acciones sensibles.
- Reduce abuso no detectable en uploads e IA pública.
- Reduce cambios sensibles sin historial en settings, apariencia y selección de tienda.
- Mejora soporte al registrar resultado, acción, usuario, tienda, IP y user agent sin exponer secretos.
- Aporta evidencia mínima ante incidentes sin guardar mensajes completos, archivos, tokens ni cookies.

## Verificación realizada
- `npm run test:pr06`
- `npm run test:pr02`
- `npm run test:pr03`
- `npm run test:pr04`
- `npm run test:pr05`
- `npm run lint`
- `npm run build`
- `npx prisma validate`
- `npx prisma generate`

## Próximo PR recomendado
Sugerido PR-07: límites por plan normal/premium/business.

# PR-07 Límites por plan normal/premium/business

## Archivos modificados
- `lib/plans/plan-types.ts`
- `lib/plans/entitlements.ts`
- `services/plan-guard.ts`
- `app/api/ai/sales-assistant/route.ts`
- `scripts/plan-smoke.ts`
- `scripts/pr03-smoke.ts`
- `scripts/pr07-smoke.ts`
- `package.json`
- `docs/CAMBIOS_IMPLEMENTADOS.md`

## Qué se cambió
- Se extendió la definición centralizada de planes existente en `lib/plans` con `aiRequestsPerMinute`, `customTheme`, `auditLog` y `advancedSettings`, sin tocar Prisma.
- Se fijaron límites backend por plan: NORMAL 50 productos, 100 imágenes, 10 requests IA/min y 1 usuario; PREMIUM 500 productos, 1000 imágenes, 30 requests IA/min y 3 usuarios; BUSINESS 5000 productos, 10000 imágenes, 60 requests IA/min y 10 usuarios.
- Se mantuvo el fallback compatible: negocios sin `planId` o `subscription` formal resuelven como NORMAL mediante `getBusinessPlan`/`getPlanLimitsForBusiness`.
- Se agregaron aliases backend `getBusinessPlan`, `getPlanLimits` y `requirePlanLimit` sobre el guard existente, evitando una segunda fuente de verdad.
- IA ahora aplica un rate limit adicional por plan después de resolver la tienda explícita y audita bloqueos con `ai_plan_limit_blocked`.
- Uploads y productos reutilizan `assertWithinPlanLimit`; los bloqueos ahora auditan `upload_plan_limit_blocked` y `product_plan_limit_blocked` con metadata mínima de plan, límite y uso actual.
- Se mantiene compatibilidad con PR-03, PR-04 y PR-06: validación pública de IA, uploads endurecidos y AuditLog siguen usando tenant explícito y metadata segura.

## Riesgo resuelto
- Reduce abuso de recursos al aplicar límites de plan desde backend.
- Reduce consumo excesivo de IA con rate limit por plan y tienda.
- Reduce almacenamiento sin control con límites de imágenes por negocio.
- Crea una base comercial clara para diferenciar NORMAL, PREMIUM y BUSINESS sin implementar pagos todavía.
- Evita que la lógica de límites quede dispersa entre rutas y acciones.

## Verificación realizada
- `npm run test:pr07`
- `npm run test:pr03`
- `npm run test:pr04`
- `npm run test:pr06`
- `npm run lint`
- `npm run build`
- `npx prisma validate`

## Próximo PR recomendado
Sugerido PR-08: dashboard y catálogo comercial.

# PR-07.1 Enforcement real de límites por plan

## Archivos modificados
- `lib/plans/entitlements.ts`
- `services/plan-guard.ts`
- `app/dashboard/products/actions.ts`
- `app/api/uploads/image/route.ts`
- `app/admin/actions.ts`
- `app/settings/appearance/actions.ts`
- `app/dashboard/settings/actions.ts`
- `scripts/pr071-smoke.ts`
- `package.json`
- `docs/CAMBIOS_IMPLEMENTADOS.md`

## Qué se cambió
- Se reforzó el límite real de productos con `requireMaxProducts`; las acciones de crear y duplicar producto bloquean antes de insertar si la tienda alcanzó `maxProducts`.
- Se reforzó el límite real de uploads con `requireMaxImages`; el endpoint cuenta archivos bajo `public/uploads/businesses/{businessId}/images` y rutas legacy antes de guardar. TODO técnico: cuando exista metadata de imágenes en DB, cambiar el conteo de filesystem por ownership transaccional en tabla.
- Se aplicó límite de usuarios internos en el flujo existente de miembros del panel admin con `requireMaxUsers`; si no hay flujo público de invitación de tienda, este queda como punto backend disponible para reutilizar.
- Se aplicó enforcement backend de apariencia: NORMAL solo puede guardar la paleta básica `minimal-arena`; PREMIUM/BUSINESS pueden guardar paletas avanzadas. TODO técnico: `updateSaaSThemeAction` es user-level y aún no está ligado a un `businessId`, por lo que no se puede limitar por plan de tienda sin cambiar el modelo de esa preferencia.
- Se aplicó enforcement backend de settings avanzados: SEO avanzado e instrucciones/automatización IA requieren `advancedSettings`; en los entitlements queda habilitado solo para BUSINESS.
- Los bloqueos reutilizan AuditLog con metadata mínima y segura: `product_plan_limit_blocked`, `upload_plan_limit_blocked`, `user_plan_limit_blocked`, `appearance_plan_limit_blocked` y `settings_plan_limit_blocked`.

## Riesgo resuelto
- Reduce abuso de recursos al hacer cumplir límites de producto, imagen y usuarios en backend.
- Evita planes sin enforcement real aunque el frontend o una request manual intenten saltarse la UI.
- Reduce consumo excesivo de almacenamiento antes de escribir archivos.
- Bloquea features premium/Business accesibles desde backend, como paletas avanzadas y settings avanzados.
- Reduce inconsistencias entre plan comercial y permisos reales.

## Verificación realizada
- `npm run test:pr071`
- `npm run test:pr07`
- `npm run test:pr04`
- `npm run test:pr06`
- `npm run lint`
- `npm run build`
- `npx prisma validate`
