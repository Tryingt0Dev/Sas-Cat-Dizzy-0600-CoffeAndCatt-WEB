# PR-02 Testing Plan

## Objetivo
Crear una prueba mínima de aislamiento multi-tenant para verificar que los accesos explícitos a tienda funcionan correctamente y que las rutas sensibles no dependen de la cookie seleccionada.

## Alcance
- `services/authorization.ts`
- `lib/auth/guards.ts`
- `app/select-store/actions.ts`
- `app/api/uploads/image/route.ts`
- `app/api/billing/portal/route.ts`
- `app/api/billing/checkout/route.ts`

## Casos requeridos
1. `requireExplicitBusiness` con `requireExplicitBusiness: true`
   - Si no hay `businessId` ni `businessSlug`, debe fallar con `AuthorizationError("Tienda obligatoria")`.
   - Si se proporciona `businessId` válido y el usuario tiene acceso, se permite.
   - Si se proporciona `businessId` de otra tienda, se rechaza.

2. `requireExplicitStoreAccess`
   - Exige `businessId` explícito.
   - Rechaza sesión inválida.
   - Rechaza usuario no miembro de la tienda.
   - Rechaza permiso insuficiente.
   - No acepta tienda implícita desde cookie en rutas sensibles.

3. APIs sensibles de PR-01
   - `app/api/uploads/image` POST y DELETE
   - `app/api/billing/portal` POST
   - `app/api/billing/checkout` POST
   - `app/select-store/actions.ts` debe validar explícitamente.BusinessId

4. Multi-tenant
   - Fixture de Usuario A y Usuario B.
   - Tienda A con Usuario A miembro.
   - Tienda B con Usuario B miembro.
   - Usuario A no puede operar sobre Tienda B.
   - Usuario A puede operar sobre Tienda A.
   - Una petición con cookie seleccionada pero sin `businessId` expĺícito falla en rutas sensibles.

## Requisitos de entorno
- `npm install` ya debe estar hecho.
- `npx prisma validate` debe pasar antes de ejecutar los tests.
- Se debe poder ejecutar `npm run test:pr02`.

## Implementación recomendada
- Crear `scripts/pr02-smoke.ts` como prueba end-to-end de autorización y tenant isolation sobre Prisma local.
- Usar la misma base de datos local y Prisma client existente.
- No modificar UI ni schema Prisma salvo lo estrictamente necesario.

## Verificación
- `npm run lint`
- `npm run build`
- `npx prisma validate`
- `npm test`
