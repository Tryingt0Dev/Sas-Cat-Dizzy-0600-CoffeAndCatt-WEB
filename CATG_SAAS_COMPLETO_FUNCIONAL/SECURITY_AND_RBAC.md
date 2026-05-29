# Security And RBAC

## 1. Modelo de roles

El SaaS separa permisos globales de permisos por tienda.

Roles globales (`User.role`):

- `SUPER_ADMIN`: creador principal del SaaS. Puede asignar cualquier rol, incluido otro `SUPER_ADMIN`.
- `PLATFORM_ADMIN`: administra tiendas, usuarios, planes operativos y diagnosticos.
- `DEVELOPER`: accede al panel admin en modo limitado para diagnostico tecnico. No puede cambiar roles ni suspender tiendas.
- `SUPPORT`: accede al panel admin en modo limitado para soporte. No puede cambiar roles ni suspender tiendas.
- `USER`: usuario normal.
- Compatibilidad legacy: `ADMIN_GLOBAL` y `OWNER` se aceptan como administradores globales.

Roles por tienda (`Membership.role`):

- `STORE_OWNER`: dueno con control total sobre la tienda.
- `STORE_ADMIN`: administra configuracion, pedidos y operaciones sensibles.
- `STORE_MANAGER`: gestiona productos, categorias e imagenes.
- `STORE_STAFF`: gestiona clientes, conversaciones y uso operativo.
- `VIEWER`: solo lectura.
- Compatibilidad legacy: `OWNER`, `ADMIN`, `MANAGER`, `STAFF` se normalizan a los roles `STORE_*`.

## 2. Helpers centrales

- `lib/auth.ts`: sesion, `requireUser()`, `requirePlatformAdmin()`, `requireSuperAdmin()`, `requireAdminPanelUser()`.
- `lib/auth/permissions.ts`: rankings, roles permitidos, `canAssignGlobalRole()`, `canManagePlatform()`, `normalizeStoreRole()`.
- `services/authorization.ts`: acceso multi-tenant por tienda, `getStoreAccess()`, `requireStoreAccess()`.
- `lib/auth/guards.ts`: aliases para nuevas actions.
- `lib/security/tenant.ts`: wrappers de tenant/ownership.
- `lib/security/audit-log.ts`: wrapper de auditoria.
- `lib/security/rate-limit.ts`: wrapper de rate limit.
- `lib/security/safe-json.ts` y `lib/safe-json.ts`: parseo seguro de JSON.

## 3. Como proteger nuevas actions

Patron recomendado para una server action de tienda:

```ts
const access = await requireStoreAccess({
  businessId,
  permission: "manage_products"
});

await prisma.product.updateMany({
  where: { id: productId, businessId: access.business.id },
  data
});
```

Patron recomendado para una API route:

```ts
if (!requestHasAllowedOrigin(req)) {
  return NextResponse.json({ ok: false, error: "Origen no permitido" }, { status: 403 });
}

const access = await getStoreAccess({
  request: req,
  businessId,
  permission: "manage_settings"
});
```

## 4. Consultas seguras e inseguras

Seguro:

```ts
await prisma.product.findFirst({
  where: { id: productId, businessId: access.business.id }
});
```

Seguro para mutacion:

```ts
await prisma.product.updateMany({
  where: { id: productId, businessId: access.business.id },
  data: { name }
});
```

Inseguro:

```ts
await prisma.product.update({
  where: { id: productId },
  data: { name }
});
```

La consulta insegura permite operar sobre un producto de otra tienda si el `productId` se filtra o adivina.

## 5. Aislamiento multi-tenant

- Nunca confiar en `businessId` enviado por el navegador sin verificar ownership/membresia.
- Toda lectura privada debe pasar por `getStoreAccess()` o filtrar por `businessId` verificado.
- Toda mutacion de productos/categorias/clientes/pedidos/configuracion debe incluir `businessId`.
- El catalogo publico solo consulta tiendas activas por `publicSlug` y productos activos de esa tienda.
- Las rutas globales solo existen bajo `/admin` y usan rol global en servidor.

## 6. Auditoria

`services/audit-log.ts` registra acciones sensibles en `AuditLog` con `userId`, `businessId`, `action`, `resourceType`, `resourceId`, `metadata`, `ip`, `userAgent` y `createdAt`.

Acciones ya cubiertas:

- suspender/reactivar tienda;
- cambio de rol global;
- alta/cambio/remocion de miembros de tienda;
- uploads de imagen;
- solicitudes de billing;
- webhooks de billing aceptados/rechazados.

## 7. Como probar aislamiento

1. Crear dos tiendas con usuarios distintos.
2. Iniciar sesion con usuario A.
3. Intentar usar `businessId` de tienda B en actions/API de productos, uploads o settings.
4. El servidor debe devolver 403, redirigir o no afectar registros.
5. Verificar en DB que ningun registro de tienda B cambio.

Comandos utiles:

```bash
npm test
npm run typecheck
npm run build
```

## 8. Reglas para nuevos modulos

- Crear schema Zod para inputs.
- Validar sesion en servidor.
- Validar rol global o rol de tienda en servidor.
- Aplicar filtros `businessId` en Prisma.
- Usar `updateMany/deleteMany` con `businessId` cuando el ID viene del cliente.
- Registrar `AuditLog` si la accion cambia permisos, planes, configuracion, productos, billing o estado de tienda.
- No devolver stack traces ni datos sensibles al cliente.
