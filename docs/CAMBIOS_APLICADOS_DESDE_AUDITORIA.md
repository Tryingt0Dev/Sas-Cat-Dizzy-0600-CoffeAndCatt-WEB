# CAMBIOS APLICADOS DESDE AUDITORIA

Fecha: 2026-05-28

## Resumen

Se aplico una primera fase acotada de seguridad y multi-tenant basada en `docs/AUDITORIA_ARCHIVO_POR_ARCHIVO_SAAS.md`, validada contra el codigo actual antes de editar. No se abordaron cambios grandes de billing, migraciones historicas, UI ni refactors amplios.

## Cambios aplicados

| Cambio | Archivo | Motivo | Hallazgo de auditoria relacionado | Riesgo reducido | Validacion |
| ------ | ------- | ------ | --------------------------------- | --------------- | ---------- |
| Helper compartido para proteger APIs platform-admin con JSON, rol, rate limit, origen y auditoria | `lib/api-security.ts` | Evitar duplicar guardias y cerrar APIs sensibles | APIs admin sin autenticacion/autorizacion | Exfiltracion de metricas, ingresos y datos globales | `npm run lint`, `npm run test:pr08` |
| Proteccion de exportacion CSV owner | `app/api/admin/export-owner-csv/route.ts` | La ruta exportaba tiendas, duenos e ingresos sin guardia | Fallo critico: CSV owner sin autenticacion | Exfiltracion de datos comerciales | `npm run lint`, `npm run test:pr08` |
| Proteccion de metricas historicas globales | `app/api/admin/metrics-history/route.ts` | La ruta devolvia ingresos, altas y churn sin guardia | Fallo critico: metricas globales publicas | Fuga de inteligencia comercial | `npm run lint`, `npm run test:pr08` |
| Proteccion de sincronizacion de metricas owner | `app/api/admin/sync-metrics/route.ts` | La ruta exponia metricas owner-level sin guardia | Fallo critico: sync metrics publico | Fuga de metricas y abuso de endpoint | `npm run lint`, `npm run test:pr08` |
| Reescritura segura de gestion de dominios custom | `app/api/stores/[id]/domains/route.ts` | La ruta mutaba dominios por id sin tenant guard y usaba `Math.random` | Fallo critico: dominios sin `requireStoreAccess` | Secuestro o alteracion de dominios entre tiendas | `npm run lint`, `npm run test:pr08` |
| Resolucion de catalogo por dominio solo si esta verificado | `app/store/[slug]/page.tsx` | El catalogo aceptaba `customDomain` no verificado | Hallazgo alto: `customDomainVerified` no exigido | Servir tiendas bajo dominios no validados | `npm run lint`, `npm run test:pr08` |
| `.env.example` alineado con PostgreSQL | `.env.example` | El schema activo usa PostgreSQL y el ejemplo apuntaba a SQLite | Hallazgo alto: datasource inconsistente | Errores de instalacion/migracion en nuevos entornos | `npx prisma validate` |
| Filtro tenant para `assertCanManageUser` | `lib/security/tenant.ts` | El helper podia devolver usuarios fuera del tenant si se integraba | Hallazgo alto: fuga potencial cross-tenant | Acceso accidental a usuarios de otra tienda | `npm run lint`, `npm run test:pr08` |
| Turnstile falla cerrado ante produccion/configuracion parcial | `lib/turnstile.ts`, `app/(auth)/actions.ts` | El registro podia omitir CAPTCHA si solo faltaba la site key publica | Hallazgo alto: Turnstile parcial | Creacion abusiva de cuentas o bypass CAPTCHA | `npm run lint`, `npm run test:pr08` |
| Registro audita y respeta fallo real del proveedor de email | `lib/email.ts`, `app/(auth)/actions.ts`, `app/api/auth/resend-verification/route.ts` | El envio podia considerarse correcto aunque Resend respondiera error | Hallazgo alto: email verification parcialmente debil | Cuentas sin verificacion efectiva y mala trazabilidad | `npm run lint` |
| Cookie de tienda seleccionada endurecida | `app/(auth)/actions.ts` | La cookie server-side se emitia con `httpOnly: false` | Hallazgo alto: cookie de negocio seleccionada expuesta a JS | Manipulacion/lectura innecesaria desde cliente | `npm run lint` |
| El middleware de UI ya no fuerza redirecciones en APIs | `app/middleware.ts` | Evitar que middleware UI fuerce redirecciones y bloquee respuestas JSON de API | `app/middleware.ts` | Preservar errores JSON de autorización y reducir falsos bloqueos de API | `npm run lint`, `npm run build` |
| Token de dominio admin legacy reemplazado por crypto seguro | `app/admin/actions.ts` | `Math.random` era inseguro y no validaba customDomain antes de DNS; ahora usa `crypto.randomBytes` y requiere token guardado | `app/admin/actions.ts` | Reduce riesgo de token predecible y dominio no validado | `npm run lint`, `npm run build` |
| CSP de produccion reconoce Cloudflare Turnstile | `next.config.mjs` | La CSP no listaba explicitamente Turnstile | Hallazgo alto: Turnstile/CSP parcial | CAPTCHA bloqueado por CSP o configuracion incompleta | `npm run lint` |
| Smoke test de regresion para guardias criticas | `scripts/pr08-security-audit-smoke.ts`, `package.json` | Evitar que se remuevan guardias criticas sin detectar | Falta de tests negativos para APIs criticas | Regresiones de seguridad en PRs futuros | `npm run test:pr08` |

## Hallazgos no corregidos en esta fase

| Hallazgo | Motivo para no aplicar ahora | Riesgo pendiente |
| -------- | ---------------------------- | --------------- |
| Billing checkout/portal reales | Requiere decision de proveedor de pagos y flujo comercial | Monetizacion incompleta |
| Webhook billing con idempotencia | Requiere contrato real de eventos del proveedor | Inconsistencia de suscripciones |
| Rate limit distribuido obligatorio | Requiere decision de infraestructura Redis/Upstash | Bypass en multi-instancia |
| Owner hard-coded en `lib/platform-admin.ts` | Cambiarlo puede bloquear el acceso operativo actual | Dependencia operativa de fallback |
| `schema_postgres.prisma` stale | Requiere decision sobre mantener scripts historicos o retirar schema alternativo | Confusion de migraciones |
| Migracion placeholder | Borrar o modificar migraciones aplicadas es riesgoso | Ruido historico en Prisma |
| `app/middleware.ts` posiblemente muerto | Limpieza diferida hasta confirmar despliegue y compatibilidad | Deuda tecnica menor |
| Refactors UI/admin grandes | Fuera de la fase critica de seguridad | Mantenibilidad/UX pendiente |

## Validaciones intermedias

| Comando | Resultado | Observacion |
| ------- | --------- | ----------- |
| `npx prisma validate` | Exitoso | Schema valido despues de cambios sin migracion |
| `npm run lint` | Exitoso | Sin errores ni warnings por encima del limite |
| `npm run test:pr08` | Exitoso | Smoke test de guardias criticas paso |

## Validacion final

| Comando | Resultado | Observacion |
| ------- | --------- | ----------- |
| `npx prisma validate` | Exitoso | Schema activo `prisma/schema.prisma` valido. |
| `npx prisma generate` | Exitoso | Prisma Client v5.22.0 generado. |
| `npx prisma migrate status` | Exitoso | 4 migraciones detectadas; base PostgreSQL `catg_omniventas` al dia. |
| `npm run lint` | Exitoso | ESLint completo sin errores. |
| `npm test` | Exitoso | Pasaron smoke tests existentes y nuevo `test:pr08`. |
| `npm run build` | Exitoso | Next.js 16.2.6 compilo correctamente. |
