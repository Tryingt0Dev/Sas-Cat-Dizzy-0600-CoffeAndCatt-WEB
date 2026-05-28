# Tickets de implementación SaaS

## 1. Resumen ejecutivo

El primer conjunto de tickets debe centrarse en seguridad multi-tenant, auth/roles y endpoint IA. Estos cambios reducen el riesgo de acceso entre tiendas, elevación de privilegios y abuso de recursos de IA públicos.

No deben tocarse todavía las mejoras de UI/UX profundas ni las migraciones grandes de Prisma a enums, salvo que haya pruebas que las respalden. Tampoco se deben borrar archivos sin evidencia clara de que están obsoletos.

## 2. Estrategia de trabajo

- Priorizar PRs pequeños y enfocados.
- No mezclar seguridad con UI y Prisma en un mismo PR salvo que sean cambios triviales de integración.
- Cada PR debe comprobarse con `npm run lint` y `npm run build`.
- Evitar refactors amplios sin tests existentes.
- Mantener cambios de seguridad y autorización aislados de las mejoras de experiencia visual.

## 3. Pull Requests recomendados

| PR | Nombre | Objetivo | Archivos | Riesgo | Prioridad |
|---|---|---|---|---|---|
| PR-01 | Guards multi-tenant y auth | Asegurar acceso correcto por tienda | `services/authorization.ts`, `lib/auth.ts`, `app/select-store/actions.ts` | Alto | Crítica |
| PR-02 | Endpoint IA seguro | Limitar IA pública y contexto por negocio | `app/api/ai/sales-assistant/route.ts`, `services/plan-guard.ts`, `services/product-search.ts` | Alto | Crítica |
| PR-03 | Uploads seguros y límites de plan | Proteger rutas de imagenes y validar storage | `app/api/uploads/image/route.ts`, `services/plan-guard.ts` | Alto | Alta |
| PR-04 | Roles globales y admin panel | Ajustar permisos GLOBAL/PLATFORM y asignaciones | `app/admin/actions.ts`, `lib/auth/permissions.ts` | Alto | Alta |
| PR-05 | Dashboard tenant-safe | Reducir carga y confirmar guards en dashboard | `app/dashboard/page.tsx` | Media | Media |
| PR-06 | Prisma SaaS preparatorio | Documentar y planificar enums y audit log | `prisma/schema.prisma`, `lib/auth/permissions.ts` | Media | Media |
| PR-07 | UI/UX y responsive | Mejorar interfaz comercial del dashboard | `components/DashboardNavClient.tsx`, `app/dashboard/page.tsx`, `app/dashboard/settings/page.tsx` | Bajo | Baja |
| PR-08 | Tests de aislamiento y roles | Añadir pruebas de acceso entre tiendas y roles | `tests/**/*` o nueva carpeta de tests | Alto | Crítica |

## 4. Tickets detallados

### TICKET-001: Refinar guards multi-tenant en autorización

**Prioridad:** Crítica
**Tipo:** Seguridad / Auth
**PR sugerido:** PR-01
**Archivos afectados:**
- `services/authorization.ts`
- `lib/auth.ts`
- `app/select-store/actions.ts`

**Problema:**
`getStoreAccess` combina `businessId`, `businessSlug` y cookie `catg_selected_business` como fallback, lo que puede ocultar el tenant real en mutaciones críticas.

**Riesgo:**
Usuarios pueden operar en la tienda equivocada, comprometiendo el aislamiento de datos entre tenants.

**Cambio requerido:**
- Forzar uso de `businessId` o `businessSlug` en endpoints mutables.
- Usar la cookie solo para navegación y selección de tienda, no como permiso principal.
- Añadir auditoría o logs cuando se recurra al fallback de cookie.

**Criterios de aceptación:**
- [ ] El tenant se identifica explícitamente en mutaciones.
- [ ] La cookie no decide acceso en rutas críticas.
- [ ] `npm run lint` pasa.
- [ ] `npm run build` pasa.

**Tests recomendados:**
- acceso a tienda A no puede usar datos de tienda B con cookie de selección distinta.
- selección de tienda con `app/select-store/actions.ts` produce `catg_selected_business` correcta.

**Notas técnicas:**
- Revisar manualmente todas las rutas que llaman `getStoreAccess`.

### TICKET-002: Proteger endpoint IA público

**Prioridad:** Crítica
**Tipo:** IA / Seguridad
**PR sugerido:** PR-02
**Archivos afectados:**
- `app/api/ai/sales-assistant/route.ts`
- `services/plan-guard.ts`
- `services/product-search.ts`

**Problema:**
El endpoint se identifica solo por `businessSlug` público y no exige auth adicional, aunque ya valida `canUseAI` y rate limit.

**Riesgo:**
Scraping de tiendas, abuso de IA y mezcla inadvertida de datos entre negocios.

**Cambio requerido:**
- Definir si el endpoint debe seguir público.
- Si se mantiene, agregar token/secret por negocio o validar dominio de origen permitido.
- Limitar tamaño de prompt y respuesta.
- Revisar que `analyzeProductQuery` use solo productos de `business.id`.

**Criterios de aceptación:**
- [ ] Endpoint IA no permite datos de tienda cruzada.
- [ ] Rate limit y plan `canUseAI` se aplican correctamente.
- [ ] `npm run lint` pasa.
- [ ] `npm run build` pasa.

**Tests recomendados:**
- POST con `businessSlug` inválido/inactivo.
- POST con `productId` de otra tienda devuelve 404.

**Notas técnicas:**
- No modificar el endpoint si no hay política clara; documentar la decisión.

### TICKET-003: Fortalecer uploads seguros y límites por plan

**Prioridad:** Alta
**Tipo:** Uploads / Seguridad
**PR sugerido:** PR-03
**Archivos afectados:**
- `app/api/uploads/image/route.ts`
- `services/plan-guard.ts`

**Problema:**
El upload usa almacenamiento local con límite de 5MB y validación de path, pero no valida el uso total de espacio por negocio.

**Riesgo:**
Abuso de almacenamiento, archivos huérfanos y posible sobrecarga del host.

**Cambio requerido:**
- Mantener validación de path y MIME/excepción de contenido.
- Añadir límite por bytes totales o número de archivos según plan.
- Registrar métricas de espacio usado por tienda.

**Criterios de aceptación:**
- [ ] Upload solo acepta JPG/PNG/WEBP.
- [ ] No se puede escribir fuera de `public/uploads/{businessId}`.
- [ ] `npm run lint` pasa.
- [ ] `npm run build` pasa.

**Tests recomendados:**
- subida con `businessId` correcto e incorrecto.
- eliminación de URL de otra tienda rechazada.

**Notas técnicas:**
- No permitir SVG/HTML a menos que se añada sanitización de SVG.

### TICKET-004: Ajustar roles globales y administración de plataforma

**Prioridad:** Alta
**Tipo:** Auth / Roles
**PR sugerido:** PR-04
**Archivos afectados:**
- `app/admin/actions.ts`
- `lib/auth/permissions.ts`

**Problema:**
Los roles `SUPPORT`, `DEVELOPER`, `PLATFORM_ADMIN`, `ADMIN_GLOBAL`, `OWNER` y `SUPER_ADMIN` están mezclados en conjuntos de acceso a admin panel y asignación global.

**Riesgo:**
Permisos excesivos y elevación de privilegios a través de la UI de admin.

**Cambio requerido:**
- Definir claramente qué roles pueden ver el admin panel y qué roles pueden administrar la plataforma.
- Limitar a `SUPER_ADMIN` la asignación de roles de mayor nivel.
- Revisar `USER_GLOBAL_ROLE_OPTIONS` y `PLATFORM_ADMIN_ROLES`.

**Criterios de aceptación:**
- [ ] `SUPPORT`/`DEVELOPER` no obtienen permisos administrativos no deseados.
- [ ] Solo `SUPER_ADMIN` asigna roles críticos.
- [ ] `npm run lint` pasa.
- [ ] `npm run build` pasa.

**Tests recomendados:**
- cambio de rol por `PLATFORM_ADMIN` no permite asignar `SUPER_ADMIN`.
- `SUPPORT` no puede acceder a acciones de admin platform.

**Notas técnicas:**
- Revisar manualmente el UI admin si es necesario.

### TICKET-005: Verificar dashboard tenant-safe

**Prioridad:** Media
**Tipo:** UI / Seguridad
**PR sugerido:** PR-05
**Archivos afectados:**
- `app/dashboard/page.tsx`

**Problema:**
El dashboard carga múltiples queries, pero el guard `requireStoreAccess` ya protege el tenant. Aun así, hay riesgo de carga excesiva y uso de datos innecesarios.

**Riesgo:**
Rendimiento degradado y mayor superficie de error al mostrar métricas.

**Cambio requerido:**
- Confirmar el uso de `requireStoreAccess({ permission: "view_dashboard" })`.
- Reducir datos devueltos con selects limitados y paginación donde sea apropiado.

**Criterios de aceptación:**
- [ ] Dashboard solo consulta datos del tenant autorizado.
- [ ] `npm run lint` pasa.
- [ ] `npm run build` pasa.

**Tests recomendados:**
- dashboard muestra datos de la tienda correcta.
- cambios de tienda no mezclan métricas.

**Notas técnicas:**
- No refactorizar el diseño visual en este ticket si no hay tests.

### TICKET-006: Preparar Prisma para SaaS robusto

**Prioridad:** Media
**Tipo:** Prisma / Documentación
**PR sugerido:** PR-06
**Archivos afectados:**
- `prisma/schema.prisma`
- `lib/auth/permissions.ts`

**Problema:**
El esquema usa strings para roles y estados por compatibilidad con SQLite y no aprovecha enums estructurados.

**Riesgo:**
Valores inconsistentes, validación de datos débil y dificultad para migrar a PostgreSQL.

**Cambio requerido:**
- Documentar claramente el plan de migración a enums nativos.
- Preparar campos SaaS adicionales en `Subscription` y `AuditLog` sin aplicar cambios de esquema inmediatos.

**Criterios de aceptación:**
- [ ] Documento de plan de migración actualizado.
- [ ] `npx prisma validate` sigue pasando.
- [ ] `npm run lint` pasa.

**Tests recomendados:**
- revisión manual del esquema y sus índices.

**Notas técnicas:**
- No alterar aún la base de datos en producción.

### TICKET-007: Mejoras UI/UX seguras

**Prioridad:** Baja
**Tipo:** UI
**PR sugerido:** PR-07
**Archivos afectados:**
- `components/DashboardNavClient.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/settings/page.tsx`

**Problema:**
El panel y la navegación son demasiado densos para ciertos tamaños de pantalla.

**Riesgo:**
Mala experiencia de usuario y reducción de adopción.

**Cambio requerido:**
- Implementar sidebar colapsable.
- Añadir estados vacíos/loading donde falten.
- Refinar layout del dashboard para móviles.

**Criterios de aceptación:**
- [ ] La navegación es más compacta y usable.
- [ ] `npm run lint` pasa.
- [ ] `npm run build` pasa.

**Tests recomendados:**
- comprobación visual en móviles y escritorio.

**Notas técnicas:**
- No mezclar con cambios de seguridad.

### TICKET-008: Añadir tests de aislamiento y roles

**Prioridad:** Crítica
**Tipo:** Tests / Seguridad
**PR sugerido:** PR-08
**Archivos afectados:**
- `tests/**/*` o nueva carpeta de tests

**Problema:**
No hay evidencia de tests automáticos que cubran aislamiento de tiendas, roles y uploads.

**Riesgo:**
Cambios futuros pueden romper la seguridad sin detección temprana.

**Cambio requerido:**
- Crear tests de acceso entre tiendas.
- Añadir tests de roles globales y store roles.
- Añadir tests para endpoint IA por negocio.
- Añadir tests para uploads y path isolation.

**Criterios de aceptación:**
- [ ] Tests de aislamiento pasan.
- [ ] `npm run test` (si existe) pasa.
- [ ] `npm run lint` pasa.

**Tests recomendados:**
- tienda A no ve datos de tienda B.
- `SUPPORT` no obtiene permisos de admin platform.
- upload de imagen validada por `businessId`.

**Notas técnicas:**
- Si no existe suite, crear una carpeta mínima para estos tests.

## 5. Tickets mínimos obligatorios

### Seguridad multi-tenant

- TICKET-001: Refinar guards multi-tenant en autorización
- TICKET-005: Verificar dashboard tenant-safe
- TICKET-008: Añadir tests de aislamiento y roles

### Auth y roles

- TICKET-004: Ajustar roles globales y administración de plataforma
- TICKET-001: Refinar guards multi-tenant en autorización

### IA

- TICKET-002: Proteger endpoint IA público
- TICKET-008: Añadir tests de aislamiento y roles

### Uploads

- TICKET-003: Fortalecer uploads seguros y límites por plan
- TICKET-008: Añadir tests de aislamiento y roles

### Prisma/schema

- TICKET-006: Preparar Prisma para SaaS robusto

### UI/UX

- TICKET-007: Mejoras UI/UX seguras

### Tests

- TICKET-008: Añadir tests de aislamiento y roles

## 6. Orden recomendado de implementación

### Fase 1: Seguridad crítica

- TICKET-001: Refinar guards multi-tenant en autorización
- TICKET-002: Proteger endpoint IA público
- TICKET-003: Fortalecer uploads seguros y límites por plan
- TICKET-004: Ajustar roles globales y administración de plataforma

### Fase 2: Tests de aislamiento

- TICKET-008: Añadir tests de aislamiento y roles
- TICKET-005: Verificar dashboard tenant-safe

### Fase 3: IA y uploads

- TICKET-002: Proteger endpoint IA público
- TICKET-003: Fortalecer uploads seguros y límites por plan

### Fase 4: Prisma SaaS

- TICKET-006: Preparar Prisma para SaaS robusto

### Fase 5: UI/UX comercial

- TICKET-007: Mejoras UI/UX seguras

### Fase 6: Producción

- Completar tests, documentación y validaciones finales antes de deploy.

## 7. Checklist antes de cada PR

- [ ] Crear rama nueva.
- [ ] Leer archivos afectados.
- [ ] Aplicar cambios mínimos.
- [ ] Ejecutar `npm run lint`.
- [ ] Ejecutar `npm run build`.
- [ ] Ejecutar `npx prisma validate`.
- [ ] Ejecutar `npx prisma generate` si cambia Prisma.
- [ ] Probar flujo manual afectado.
- [ ] Documentar cambios en `docs/CAMBIOS_IMPLEMENTADOS.md`.

## 8. Checklist final antes de producción

- [ ] Seguridad multi-tenant validada.
- [ ] Auth y roles revisados.
- [ ] Endpoint IA protegido y limitado.
- [ ] Uploads validados por MIME, extensión, tamaño y path.
- [ ] Prisma confirmado con índices y constraints correctos.
- [ ] UI responsive y estados vacíos/loading documentados.
- [ ] Performance del dashboard evaluada.
- [ ] Backups y logs de auditoría planificados.
- [ ] Deploy con validación de lint/build/prisma.
- [ ] Documentación actualizada en `docs/CAMBIOS_IMPLEMENTADOS.md`.
