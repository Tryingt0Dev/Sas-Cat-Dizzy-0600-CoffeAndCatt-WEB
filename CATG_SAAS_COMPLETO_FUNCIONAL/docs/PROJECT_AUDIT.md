# Auditoria tecnica del proyecto

Fecha: 2026-05-26  
Proyecto: `catg-omniventas-saas`  
Stack auditado: Next.js App Router, TypeScript, Prisma, SQLite, Tailwind CSS, Server Actions.

## 1. Resumen general

El proyecto implementa un SaaS multi-tenant para tiendas virtuales. Cada tienda se modela como `Business` y concentra catalogo publico, productos, categorias, clientes, conversaciones, cotizaciones, pedidos, ajustes de marca, tema de catalogo, IA y plan comercial.

La aplicacion tiene tres superficies principales:

- Superficie publica: home, login, registro y catalogo publico `/store/[slug]`.
- Superficie privada de tienda: dashboard, productos, categorias, clientes, conversaciones, cotizaciones, pedidos, ajustes, diseno y billing.
- Superficie administrativa: `/admin` para usuarios con rol global autorizado.

La seguridad multi-tenant se apoya en:

- `services/authorization.ts` para sesion, seleccion de tienda, permisos por rol operativo y contexto de negocio.
- `services/tenant-guard.ts` para validar que recursos como producto, cliente, conversacion, cotizacion y pedido pertenezcan al `businessId` activo.
- `lib/auth.ts` para sesiones y roles globales.
- `lib/validation.ts` para entradas, colores, slugs e imagenes.
- `services/plan-guard.ts` y `lib/plans/*` para limites y features de planes `normal`, `premium` y `business`.

## 2. Arquitectura general

```text
app/                 Rutas App Router, Server Actions y Route Handlers.
components/          UI compartida del dashboard, catalogo y temas.
lib/                 Infraestructura, dominio compartido, validaciones, auth, temas, planes.
services/            Servicios de autorizacion, tenant guard, plan guard, busqueda y auditoria.
prisma/              Esquema, migraciones y seed local.
scripts/             Smoke tests, auditorias y utilidades operativas.
templates/           Plantillas visuales del catalogo publico.
public/              Assets estaticos y uploads locales por tienda.
docs/                Documentacion tecnica y diagramas.
```

Dependencias de alto nivel:

- `app/` consume `components/`, `lib/`, `services/`, `templates/` y Prisma.
- `components/` consume `lib/` y algunas Server Actions cuando son formularios cliente/servidor.
- `services/` concentra reglas de autorizacion, planes y tenant ownership usando `lib/db`.
- `lib/plans/` es la fuente canonica de planes comerciales y features.
- `lib/themes/` es la fuente canonica de temas SaaS y paletas de catalogo.
- `templates/` consume componentes de catalogo y tipos de `lib/catalog`.
- `scripts/` reutiliza rutas y servicios reales para validar seguridad y planes.

## 3. Mapa de carpetas

### `app/`

Contiene rutas App Router, Server Actions y Route Handlers.

Partes criticas:

- `app/(auth)/actions.ts`: login, registro, sesiones, bootstrap admin privado y alta inicial de tienda.
- `app/dashboard/layout.tsx`: exige acceso a tienda y onboarding de tema antes de renderizar dashboard.
- `app/dashboard/*/actions.ts`: mutaciones de productos, categorias, clientes, cotizaciones, pedidos y ajustes.
- `app/settings/appearance/actions.ts`: actualiza tema SaaS del usuario y paleta del catalogo por tienda.
- `app/api/uploads/image/route.ts`: upload/delete local con tenant guard, origen permitido, tipo/extension/magic bytes y limite por plan.
- `app/api/ai/sales-assistant/route.ts`: endpoint IA con origen permitido, limite por plan, rate limit, datos aislados por tienda y control de productos recomendados.
- `app/api/billing/*`: checkout/portal/webhook preparados, sin conceder planes automaticamente.
- `app/admin/*`: panel y acciones de superadmin/plataforma.
- `app/store/[slug]/*`: catalogo publico, producto publico y redireccion por historial de slugs.

Candidatos a revisar:

- `app/settings/appearance/page.tsx` es un redirect a `/dashboard/design`; se mantiene como compatibilidad.
- `app/dashboard/design/page.tsx` esta sin trackear en el estado actual, pero esta enlazado desde el sidebar y usa acciones reales de tema/paleta.
- `app/dashboard/settings/page.tsx` tenia un fallo previo de `themeStyle` no declarado en la linea base.

### `components/`

Contiene componentes UI compartidos.

Partes criticas:

- `DashboardNav.tsx` y `DashboardNavClient.tsx`: navegacion privada y seleccion de enlaces principales.
- `ImageDropzone.tsx`: cliente de upload/delete de imagenes.
- `StoreChat.tsx`: chat publico que llama al endpoint IA.
- `ProductAttributesFields.tsx`: campos dinamicos por tipo de tienda.
- `catalog/*`: header, cards, filtros, tracking, WhatsApp, imagen segura y boton IA del catalogo.
- `theme/*`: selectores y cards de temas SaaS/paletas de catalogo, previews y controles de color.
- `PendingSubmitButton.tsx`, `ConfirmSubmitButton.tsx`, `CopyButton.tsx`, `PrintButton.tsx`: acciones interactivas puntuales.

Candidatos a revisar:

- `components/Button.tsx`, `components/FormSection.tsx`, `components/StatusBadge.tsx` no tienen referencias directas actuales. Parecen componentes UI reutilizables, no basura segura.
- `components/theme/SaaSThemeProvider.tsx` no tiene imports actuales. Puede ser legacy/reutilizable porque el tema ahora se aplica en `app/layout.tsx`.
- `components/theme/LiveThemeColorControls.tsx` esta sin trackear pero es importado por `app/dashboard/settings/page.tsx`; no debe borrarse.

### `lib/`

Contiene infraestructura y dominio compartido.

Partes criticas:

- `lib/db.ts`: singleton Prisma.
- `lib/auth.ts`: cookies de sesion, roles globales, seleccion de tienda y acceso admin.
- `lib/auth/permissions.ts`: jerarquia de roles globales y roles de tienda.
- `lib/validation.ts`: schemas Zod para auth, productos, settings, IA, colores y slugs publicos.
- `lib/enums.ts`: enums como objetos TS porque SQLite no soporta enums Prisma nativos en esta version.
- `lib/plans/*`: plan slugs, entitlements, features, limites y seeds/upserts de planes.
- `lib/themes/*`: temas SaaS y paletas de catalogo permitidas.
- `lib/catalog.ts`: tipos y helpers de catalogo publico.
- `lib/rate-limit.ts`, `lib/request-security.ts`, `lib/safe-json.ts`: protecciones auxiliares.
- `lib/ai.ts`: cliente OpenAI-compatible para DeepSeek.

Candidatos a revisar:

- `lib/auth/guards.ts` y `lib/security/*` son wrappers de compatibilidad con 0 imports directos actuales. No se eliminan sin revisar dependencias externas o futuras.
- `lib/store-types.ts` es grande, pero activo: alimenta registro, ajustes y atributos dinamicos.

### `services/`

Contiene servicios de dominio y seguridad.

Partes criticas:

- `authorization.ts`: acceso actual de usuario/tienda, permisos por rol operativo, seleccion por cookie o negocio explicito.
- `tenant-guard.ts`: evita mutaciones cross-tenant en productos, clientes, conversaciones, cotizaciones, pedidos y categorias.
- `plan-guard.ts`: limites y features comerciales, acceso total interno para plataforma y validacion de branding/plantillas.
- `audit-log.ts`: escritura tolerante de auditoria.
- `product-search.ts`: analisis de consulta para IA de ventas.

Candidatos a revisar:

- Hay solapamiento conceptual entre `services/tenant-guard.ts` y wrappers `lib/security/tenant.ts`, pero hoy el codigo productivo usa principalmente `services/*`.

### `prisma/`

Contiene esquema, migraciones y seed.

Partes criticas:

- `schema.prisma`: contrato de datos completo.
- `migrations/*`: historial de cambios; no deben borrarse.
- `seed.ts`: crea planes, usuarios demo, tiendas demo, categorias y productos.

Modelos principales:

- Auth y roles: `User`, `Session`, `EmailVerificationToken`, `Membership`.
- Multi-tenant: `Business`, `BusinessSlugHistory`, `AuditLog`.
- Planes: `Plan`, `Subscription`.
- Comercio: `Category`, `Product`, `Customer`, `Conversation`, `Message`, `Quote`, `QuoteItem`, `Order`, `OrderItem`.
- IA: `AiSettings`.

### `scripts/`

Contiene validaciones y utilidades.

Activos:

- `plan-smoke.ts`: valida normal/premium/business, limites y que checkout no conceda plan.
- `security-smoke.ts`: valida aislamiento de tenants, origenes, slugs, upload y acceso admin.
- `ai-origin-smoke.ts`: valida origen de IA en produccion/desarrollo.
- `multitenant-audit.ts`: auditoria HTTP/DB de separacion multi-tenant.
- `reset-admin-users.ts`: utilidad de administradores.
- `generate-diagrams.mjs`: genera diagramas docs.
- `cleanup.js`: utilidad Windows para limpiar `.next` y Prisma client locks; potencialmente destructiva para procesos locales, mantener con uso consciente.

### `templates/`

Contiene plantillas de catalogo publico:

- `ModernGridCatalog.tsx`
- `FastSalesCatalog.tsx`
- `BoutiquePremiumCatalog.tsx`
- `TechProCatalog.tsx`

Son activas: `app/store/[slug]/page.tsx` selecciona una segun `Business.catalogTemplate`.

Candidato a refactor:

- Las cuatro plantillas repiten estructura de hero, filtros, destacados, listado y `StoreChat`. No conviene unificar en esta limpieza porque toca superficie visual publica.

### `public/`

Contiene uploads locales bajo `public/uploads/[businessId]/...`.

Critico:

- No borrar archivos sin confirmar si estan referenciados por `Business.logoUrl`, `Business.bannerUrl` o `Product.imageUrl`.
- El endpoint de uploads guarda imagenes por tenant y `imageUrlBelongsToBusiness` valida rutas `/uploads/[businessId]/...`.

### `docs/`

Contiene documentacion previa, diagramas y reportes:

- `ARCHITECTURE.md`, `OVERVIEW.md`, `MODULES.md`, `FLOWS.md`, `FEATURE_MAP.md`
- `SECURITY_AUDIT.md`, `SECURITY_SUMMARY.md`, `QA_REPORT.md`, `PRODUCTION_ROADMAP.md`
- `diagrams/*`

Candidatos a organizar:

- Hay documentos root (`ADMIN_PANEL.md`, `SECURITY_AND_RBAC.md`, etc.) que podrian migrarse a `docs/` en una tarea documental separada. No se eliminan.

## 4. Archivos root criticos

| Archivo | Proposito | Estado | Riesgo |
| --- | --- | --- | --- |
| `package.json` | Scripts, dependencias y comandos de validacion | Critico | Alto |
| `package-lock.json` | Lockfile npm | Critico | Alto |
| `tsconfig.json` | TypeScript estricto, paths `@/*`, includes de Next | Critico | Alto |
| `next.config.mjs` | CSP, headers de seguridad, allowed origins dev/server actions | Critico | Alto |
| `eslint.config.cjs` | ESLint flat config con warning para unused vars | Activo | Medio |
| `tailwind.config.ts` | Content paths y colores extendidos | Activo | Medio |
| `postcss.config.js` | Tailwind/PostCSS | Activo | Bajo |
| `proxy.ts` | Redireccion 301 para slugs historicos de catalogo | Critico | Alto |
| `.env.example` | Variables esperadas para DB, IA, CSP, origins, admin bootstrap | Activo | Medio |
| `README.md` | Documentacion principal | Activo | Bajo |
| `DOCUMENTACION_COMPLETA_SAAS.md` y otros `.md` root | Documentacion previa del proyecto | Reutilizable | Bajo |
| `.codex*.log`, `.next-dev*.log` | Logs locales de ejecuciones | Revisar manualmente | Bajo |
| `t` | Artefacto accidental con ayuda de `less`, sin trackear | No usado | Bajo |
| `ma generate` | Artefacto accidental con salida de `git diff`, sin trackear | No usado | Bajo |

## 5. Flujos principales

### Registro/login

1. `/register` renderiza formulario con datos de usuario y tienda.
2. `registerAction` valida con Zod, rate limit, politica de password y bootstrap admin privado opcional.
3. Crea `User`, `Business`, `Subscription`, `AiSettings` y membership `STORE_OWNER`.
4. Genera token de verificacion de email y sesion.
5. `/login` usa `loginAction`, valida credenciales, crea `Session` y redirige a `/dashboard`.

Riesgos: auth y bootstrap admin son criticos; no modificar sin pruebas de seguridad.

### Dashboard

1. `app/dashboard/layout.tsx` llama `requireStoreAccess({ permission: "view_dashboard" })`.
2. Si el usuario no completo onboarding de tema, redirige a `/onboarding/theme`.
3. `DashboardNav` carga contexto de tienda y plan.
4. Las paginas internas consultan datos filtrados por `business.id`.

Riesgos: seleccion de tienda por cookie y permisos de rol operativo son frontera de tenant.

### Productos

1. `/dashboard/products` lista productos/categorias de la tienda activa.
2. `createProductAction` valida formulario, pertenencia de imagen, limite de plan y categoria tenant.
3. `updateProductAction`, `duplicateProductAction`, `deleteProductAction` usan `assertTenantProduct`.
4. Catalogo publico solo muestra productos `ACTIVE`.

Riesgos: no quitar `businessId` en queries ni `updateMany/deleteMany` con tenant filter.

### Categorias

1. `/dashboard/categories` lista categorias por tienda.
2. Acciones crean/eliminan con permiso `manage_categories`.
3. Prisma impone `@@unique([businessId, slug])`.

Riesgos: validar slugs por tienda y no borrar categorias de otra tienda.

### Diseno del SaaS

1. `/onboarding/theme` permite seleccionar tema inicial de usuario.
2. `/dashboard/design` permite actualizar `User.saasTheme`.
3. `app/layout.tsx` aplica variables CSS del tema SaaS al `body`.

Riesgos: tema SaaS pertenece al usuario, no a la tienda.

### Paleta del catalogo

1. `/dashboard/design` lista tiendas accesibles y paletas permitidas.
2. `updateStoreCatalogPaletteAction` valida slug contra `catalogPalettes`.
3. `requireStoreAccess({ businessId, permission: "manage_settings" })` evita cambiar tienda ajena.
4. `lib/catalog.ts` convierte paleta a variables CSS de catalogo.

Riesgos: no aceptar CSS arbitrario ni colores libres fuera de validacion.

### Catalogo publico

1. `/store/[slug]` busca `Business.publicSlug` activo.
2. Si no existe, revisa `BusinessSlugHistory` y redirige permanentemente al slug nuevo.
3. Filtra productos activos por busqueda, categoria y sort.
4. Renderiza plantilla segun `catalogTemplate`.
5. `/store/[slug]/product/[productSlug]` valida producto activo y tienda activa.

Riesgos: no exponer tiendas inactivas ni productos de otro tenant.

### Planes normal/premium/business

1. `lib/plans/plan-types.ts` define slugs canonicos.
2. `lib/plans/entitlements.ts` define limites/features.
3. `lib/plans/plans.ts` sincroniza definiciones a DB.
4. `services/plan-guard.ts` aplica limites, features y full access interno para plataforma.
5. Billing checkout/portal registran auditoria, pero no conceden plan si el proveedor no esta integrado.
6. `/admin` puede hacer override manual validado.

Riesgos: no mezclar roles operativos con planes comerciales; checkout no debe actualizar plan automaticamente.

### Admin/superadmin

1. `requirePlatformAdmin` protege `/admin`.
2. Acciones admin cambian estado de tienda, roles globales, miembros y planes.
3. `canAssignGlobalRole` evita escaladas indebidas.
4. Acciones escriben `AuditLog`.

Riesgos: no permitir que usuario comun cambie roles o plan.

### Seguridad multi-tenant

Controles observados:

- `requireStoreAccess` valida sesion, tienda activa, membership/owner/platform admin y permiso operativo.
- Server Actions de recursos usan business activo y guardias tenant.
- APIs mutantes validan origen con `requestHasAllowedOrigin` donde corresponde.
- Upload valida tenant, tipo de archivo, extension, magic bytes, ruta y limite por plan.
- IA valida `businessSlug`, producto activo dentro de la tienda y filtra ids recomendados.
- Slugs publicos se normalizan, tienen reservas y quedan en historial al cambiar.

## 6. Tabla de archivos principales

| Archivo | Proposito | Tipo | Estado | Riesgo de modificar | Observaciones |
| --- | --- | --- | --- | --- | --- |
| `app/(auth)/actions.ts` | Login, registro, sesiones, bootstrap admin | Server Action | Critico | Alto | No concede admin salvo secreto privado |
| `app/dashboard/layout.tsx` | Gate de dashboard y onboarding | Layout | Critico | Alto | Depende de `requireStoreAccess` |
| `app/dashboard/page.tsx` | Vista principal privada | Page | Activo | Medio | Cambios actuales sin commitear |
| `app/dashboard/products/actions.ts` | CRUD productos | Server Action | Critico | Alto | Usa tenant guard y plan limit |
| `app/dashboard/products/page.tsx` | UI productos | Page | Activo | Medio | Carga categorias/atributos |
| `app/dashboard/categories/actions.ts` | Crear/eliminar categorias | Server Action | Critico | Alto | Debe filtrar por negocio |
| `app/dashboard/customers/actions.ts` | Actualizar clientes | Server Action | Critico | Alto | Validacion tenant |
| `app/dashboard/quotes/actions.ts` | Cotizaciones y pedidos desde cotizacion | Server Action | Critico | Alto | Valida productos tenant |
| `app/dashboard/orders/actions.ts` | Estado de pedidos | Server Action | Critico | Alto | Valida `assertTenantOrder` |
| `app/dashboard/settings/actions.ts` | Ajustes tienda, branding, IA, slug | Server Action | Critico | Alto | Valida colores, imagenes, plan y slug history |
| `app/dashboard/settings/page.tsx` | Formulario completo de settings | Page | Activo | Medio | Linea base fallo por `themeStyle` |
| `app/dashboard/design/page.tsx` | Temas SaaS y paletas catalogo | Page | Activo | Medio | Sin trackear pero enlazado |
| `app/settings/appearance/actions.ts` | Actualiza tema/paleta | Server Action | Critico | Alto | Valida slugs contra listas permitidas |
| `app/settings/appearance/page.tsx` | Redirect a diseno | Page | Reutilizable | Bajo | Compatibilidad de ruta antigua |
| `app/settings/billing/page.tsx` | Billing/planes | Page | Activo | Medio | No debe conceder plan directo |
| `app/admin/actions.ts` | Mutaciones admin/plataforma | Server Action | Critico | Alto | Cambios de plan/rol/miembros |
| `app/admin/page.tsx` | Panel admin | Page | Critico | Alto | Visible solo a plataforma |
| `app/admin/stores/[id]/page.tsx` | Detalle tienda admin | Page | Critico | Alto | Admin puede operar tienda |
| `app/api/ai/sales-assistant/route.ts` | IA de ventas publica | API route | Critico | Alto | Aislamiento por tienda y plan |
| `app/api/uploads/image/route.ts` | Upload/delete imagenes | API route | Critico | Alto | Seguridad de archivos |
| `app/api/billing/checkout/route.ts` | Solicitud checkout | API route | Critico | Alto | No concede planes |
| `app/api/billing/portal/route.ts` | Portal billing | API route | Activo | Medio | Provider pendiente |
| `app/api/billing/webhook/route.ts` | Webhook billing | API route | Critico | Alto | Verifica firma Stripe si aplica |
| `app/api/catalog/track/route.ts` | Tracking publico catalogo | API route | Activo | Medio | Debe validar producto en tienda |
| `app/store/[slug]/page.tsx` | Catalogo publico | Page | Critico | Alto | Selecciona templates |
| `app/store/[slug]/product/[productSlug]/page.tsx` | Detalle publico producto | Page | Critico | Alto | Filtra por producto activo y tienda |
| `components/DashboardNav.tsx` | Nav server wrapper | Component | Critico | Medio | Obtiene acceso y plan |
| `components/DashboardNavClient.tsx` | Nav cliente | Component | Activo | Medio | Sin trackear, importado por nav |
| `components/StoreChat.tsx` | Chat publico | Component | Critico | Medio | Llama IA |
| `components/ImageDropzone.tsx` | Upload UI | Component | Critico | Medio | Depende de API uploads |
| `components/catalog/ProductCard.tsx` | Card producto publico | Component | Activo | Medio | Usado por templates y producto |
| `components/theme/LiveThemeColorControls.tsx` | Controles color live | Component | Activo | Medio | Sin trackear, importado por settings |
| `lib/auth.ts` | Sesiones, roles, tienda actual | Lib | Critico | Alto | Frontera auth |
| `lib/auth/permissions.ts` | Permisos globales/tienda | Lib | Critico | Alto | No mezclar con planes |
| `lib/validation.ts` | Zod schemas | Lib | Critico | Alto | Slugs, colores, imagenes |
| `lib/plans/*` | Planes y entitlements | Lib | Critico | Alto | Fuente canonica normal/premium/business |
| `lib/themes/*` | Temas y paletas permitidas | Lib | Critico | Medio | No CSS arbitrario |
| `services/authorization.ts` | Acceso tienda/permisos | Service | Critico | Alto | Frontera multi-tenant |
| `services/tenant-guard.ts` | Validaciones tenant | Service | Critico | Alto | Evita IDOR/cross-tenant |
| `services/plan-guard.ts` | Limites/features | Service | Critico | Alto | Control comercial |
| `prisma/schema.prisma` | Modelo de datos | Prisma | Critico | Alto | No cambiar sin migracion |
| `prisma/seed.ts` | Datos demo/planes | Script | Activo | Medio | No borrar |
| `scripts/plan-smoke.ts` | Smoke planes | Test script | Critico | Medio | Parte de `npm test` |
| `scripts/security-smoke.ts` | Smoke seguridad | Test script | Critico | Medio | Parte de `npm test` |
| `templates/*.tsx` | Plantillas catalogo | Template | Activo | Medio | No borrar por rutas dinamicas |
| `proxy.ts` | Slug redirect proxy | Proxy | Critico | Alto | Importante para historial |

## 7. Candidatos a limpieza

### A) Seguro de borrar

| Archivo | Evidencia |
| --- | --- |
| `t` | Sin trackear, raiz, contenido es ayuda de `less`, 0 referencias/imports. |
| `ma generate` | Sin trackear, raiz, contenido es salida accidental de `git diff`/warnings, 0 referencias/imports. |

### B) Probablemente no usado, revisar

| Archivo | Evidencia | Recomendacion |
| --- | --- | --- |
| `components/Button.tsx` | 0 referencias directas | Mantener como UI reutilizable o borrar en PR separado si se confirma politica de componentes |
| `components/FormSection.tsx` | 0 referencias directas | Mantener/revisar |
| `components/StatusBadge.tsx` | 0 referencias directas | Mantener/revisar; hay helpers locales de badges en admin |
| `components/theme/SaaSThemeProvider.tsx` | 0 imports directos | Probable legacy tras mover tema a `app/layout.tsx` |
| `lib/auth/guards.ts` | 0 imports directos | Wrapper de compatibilidad; revisar antes de eliminar |
| `lib/security/*.ts` | 0 imports directos por alias | Wrappers de compatibilidad; revisar antes de eliminar |
| `.codex*.log`, `.next-dev*.log` | Logs locales | Limpiar solo si no estan trackeados o si se acuerda politica |

### C) No borrar, archivo critico

- `prisma/migrations/*`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `scripts/plan-smoke.ts`
- `scripts/security-smoke.ts`
- `app/(auth)/actions.ts`
- `app/dashboard/*/actions.ts`
- `app/settings/appearance/actions.ts`
- `app/api/*/route.ts`
- `services/authorization.ts`
- `services/tenant-guard.ts`
- `services/plan-guard.ts`
- `lib/plans/*`
- `lib/themes/*`
- `templates/*.tsx`
- `public/uploads/*` sin verificacion contra DB.

### D) Requiere prueba manual

- `app/dashboard/design/page.tsx`
- `components/DashboardNavClient.tsx`
- `components/theme/LiveThemeColorControls.tsx`
- Todas las paginas privadas de dashboard despues de corregir `themeStyle`.
- Catalogo publico con cada template.
- Billing pages y acciones admin.

## 8. Dependencias posiblemente no usadas

Sin instalar herramientas externas como `depcheck`, se revisaron referencias textuales.

- `eslint-config-next`: no aparece importado en `eslint.config.cjs`; verificar si se quiere integrar configuracion de Next o remover en una tarea separada.
- `@types/qrcode`: `qrcode` se usa en `StoreShareCard`; el tipo puede ser necesario por TS aunque no aparezca import directo.
- `@types/bcryptjs`: `bcryptjs` se usa; revisar si la version actual ya trae tipos o si el paquete sigue aportando.
- `@types/react`, `@types/react-dom`, `@types/node`: dev deps necesarias por TypeScript/Next aunque no haya imports directos.
- `@mermaid-js/mermaid-cli`: usado por `scripts/generate-diagrams.mjs`.
- `postcss`, `autoprefixer`, `tailwindcss`: usados por config/build, no por imports runtime.

No se recomienda modificar dependencias en esta limpieza sin una herramienta dedicada y build completo.

## 9. Riesgos tecnicos

- Workspace con muchos cambios previos sin commitear; no se debe revertir ni mezclar limpieza grande con trabajo existente.
- `app/dashboard/settings/page.tsx` tenia fallo de typecheck preexistente: `themeStyle` no declarado.
- Componentes y wrappers con 0 referencias pueden ser legacy, pero tambien API interna prevista. No borrar sin PR dedicado.
- Root docs dispersos pueden duplicar contenido de `docs/`; conviene reorganizacion documental posterior.
- `scripts/cleanup.js` mata procesos en puerto 3000 y borra caches/cliente Prisma; util, pero debe ejecutarse conscientemente.
- SQLite obliga a validar enums en TypeScript/Zod; migrar a PostgreSQL requerira revisar campos `String` convertibles a enums.
- Billing esta preparado, pero provider real pendiente; no conceder planes desde checkout.
- Upload local no es ideal para produccion; migrar a storage externo manteniendo validaciones tenant.

## 10. Recomendaciones de optimizacion

1. Crear una tarea separada para retirar wrappers legacy (`lib/security/*`, `lib/auth/guards.ts`) solo si no hay consumidores externos.
2. Centralizar helpers visuales repetidos de templates cuando se haga una iteracion visual, no en una limpieza de seguridad.
3. Consolidar documentacion root dentro de `docs/` con indice unico.
4. Activar o integrar `eslint-config-next` si se quiere mayor cobertura App Router.
5. Evaluar `noUnusedLocals`/`noUnusedParameters` en TypeScript solo despues de limpiar warnings actuales.
6. Mantener listas canonicas de planes y features en `lib/plans/*`; evitar strings sueltos nuevos.
7. Mantener listas canonicas de temas y paletas en `lib/themes/*`; no permitir CSS arbitrario.
8. Agregar pruebas manuales documentadas para `/dashboard/design`, `/settings/billing`, `/store/[slug]` y `/admin`.

## 11. Linea base antes de limpieza

Comandos ejecutados antes de modificar codigo:

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Falla: `app/dashboard/settings/page.tsx(263,128): error TS2304: Cannot find name 'themeStyle'.` |
| `npm run lint` | Pasa con 1 warning: `getCatalogThemeStyle` importado y no usado en `app/dashboard/settings/page.tsx`. |

Hallazgos de busqueda:

- `rg "TODO|FIXME|deprecated|legacy|old|unused|backup|prueba|temporal|tmp|copy"` no encontro marcadores relevantes en archivos fuente.
- Conteo de referencias de componentes marco como 0: `Button`, `FormSection`, `StatusBadge`, `SaaSThemeProvider`.
- Conteo de imports marco como 0 por alias: `lib/auth/guards.ts`, `lib/security/audit-log.ts`, `lib/security/rate-limit.ts`, `lib/security/safe-json.ts`, `lib/security/tenant.ts`.
- Archivos basura evidentes: `t`, `ma generate`.
