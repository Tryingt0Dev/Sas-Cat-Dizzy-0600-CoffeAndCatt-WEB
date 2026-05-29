# PLAN DE MEJORAS DESDE AUDITORIA

Fecha: 2026-05-28

Base revisada: `docs/AUDITORIA_ARCHIVO_POR_ARCHIVO_SAAS.md` y contraste directo contra el codigo actual.

## Criterio de aplicacion

No se aplican recomendaciones de forma ciega. Esta fase prioriza hallazgos criticos y altos que siguen vigentes, tienen evidencia directa en codigo y pueden corregirse con cambios acotados sin alterar la logica comercial principal.

## Hallazgos priorizados

| Hallazgo | Archivo | Sigue vigente | Prioridad | Accion recomendada | Se aplicara ahora |
| -------- | ------- | ------------- | --------- | ------------------ | ----------------- |
| Exportacion CSV owner sin autenticacion/autorizacion | `app/api/admin/export-owner-csv/route.ts` | Vigente | Critica | Exigir acceso platform-admin con permiso de billing, rate limit, auditoria y validacion de fechas | Si |
| Metricas historicas globales sin autenticacion/autorizacion | `app/api/admin/metrics-history/route.ts` | Vigente | Critica | Exigir acceso platform-admin con permiso de billing, limitar rango de dias, rate limit y auditoria de bloqueos | Si |
| Sincronizacion de metricas owner sin autenticacion/autorizacion | `app/api/admin/sync-metrics/route.ts` | Vigente | Critica | Exigir acceso platform-admin con permiso de billing, rate limit y auditoria de bloqueos | Si |
| Mutacion/verificacion de dominios por id sin tenant guard | `app/api/stores/[id]/domains/route.ts` | Vigente | Critica | Usar `getStoreAccess` con `manage_settings`, validar origen, aplicar rate limit, validar dominio, usar `crypto.randomBytes` y auditoria | Si |
| Admin legacy usa token de dominio inseguro | `app/admin/actions.ts` | Vigente | Alta | Reemplazar `Math.random` por `crypto.randomBytes`, validar `customDomain` y auditar acceso | Si |
| Catalogo resuelve `customDomain` sin exigir verificacion | `app/store/[slug]/page.tsx` | Vigente | Alta | Filtrar `customDomainVerified: true` al resolver por host | Si |
| `.env.example` usa SQLite aunque `schema.prisma` activo usa PostgreSQL | `.env.example` | Vigente | Alta | Actualizar ejemplo a PostgreSQL sin secretos reales | Si |
| `assertCanManageUser` puede devolver usuarios fuera del tenant | `lib/security/tenant.ts` | Vigente | Alta | Filtrar usuario por membresia/owner del tenant actual salvo platform admin | Si |
| Registro crea cookie de tienda seleccionada con `httpOnly: false` | `app/(auth)/actions.ts` | Vigente | Alta | Cambiar cookie server-side a `httpOnly: true` | Si |
| Registro no bloquea cuando falla envio de verificacion en produccion | `app/(auth)/actions.ts`, `lib/auth/email-verification.ts`, `lib/email.ts` | Parcialmente corregido | Alta | Validar resultado del envio y bloquear flujo en produccion si el proveedor falla | Si |
| Turnstile puede omitirse si solo falta site key publica | `app/(auth)/actions.ts`, `lib/turnstile.ts` | Vigente | Alta | Exigir verificacion si existe cualquiera de las keys o si `NODE_ENV=production`; fallar ante configuracion incompleta | Si |
| CSP no lista explicitamente Cloudflare Turnstile | `next.config.mjs` | Vigente | Alta | Agregar dominios de Turnstile a `script-src`, `frame-src` y `connect-src` de produccion | Si |
| Rate limit en memoria no es suficiente para multi-instancia | `lib/rate-limit.ts` | Vigente | Alta | Documentar y agregar advertencia/guia; no bloquear produccion sin decidir backend externo | No: requiere decision de infraestructura |
| `lib/platform-admin.ts` mantiene email owner hard-coded | `lib/platform-admin.ts` | Vigente | Alta | Migrar a configuracion estricta por entorno/base de datos | No: requiere decision operativa para no bloquear acceso actual |
| Billing checkout devuelve 501 | `app/api/billing/checkout/route.ts` | Vigente | Alta | Implementar proveedor real o marcar flujo como no disponible | No: requiere decision de proveedor de pagos |
| Billing webhook no actualiza suscripciones/idempotencia | `app/api/billing/webhook/route.ts` | Vigente | Alta | Agregar idempotencia y actualizacion real de suscripciones cuando se defina proveedor | No: requiere proveedor/eventos reales |
| `schema_postgres.prisma` esta stale frente al schema activo | `prisma/schema_postgres.prisma` | Vigente | Alta | Sincronizar o retirar scripts que lo referencian | No: riesgo de tocar flujo de migracion sin decision |
| Migracion placeholder sin cambios reales | `prisma/migrations/20260528031849_npx_prisma_validatenpx_prisma_migrate_status/migration.sql` | Vigente | Alta | Mantener si ya fue aplicada; documentar como historica | No: borrar/alterar migraciones aplicadas es riesgoso |
| `app/middleware.ts` parece muerto frente a `proxy.ts` | `app/middleware.ts` | Vigente | Alta | Confirmar con build y retirar si no hay referencias | No: limpieza diferida |
| Tests negativos para APIs criticas ausentes | `scripts/`, `package.json` | Vigente | Alta | Agregar smoke test estatico para verificar guardias criticas | Si |

## Hallazgos obsoletos o no confirmados

| Hallazgo | Archivo | Sigue vigente | Prioridad | Accion recomendada | Se aplicara ahora |
| -------- | ------- | ------------- | --------- | ------------------ | ----------------- |
| Uploads sin controles basicos | `app/api/uploads/image/route.ts` | Ya corregido | Informativa | Mantener controles actuales de MIME, magic bytes, tenant, rate limit y borrado cross-tenant | No |
| Reenvio de verificacion sin cooldown | `app/api/auth/resend-verification/route.ts` | Ya corregido | Informativa | Mantener rate limits por minuto/hora/dia | No |
| Tokens de verificacion reutilizables | `lib/emailVerification.ts` | Ya corregido | Informativa | Mantener `consumedAt`, expiracion y transaccion | No |
| Falta completa de platform-admin | `app/platform-admin/**`, `lib/platform-admin.ts` | Ya corregido parcialmente | Media | Seguir unificando legacy admin y platform-admin en fase posterior | No |

