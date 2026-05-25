# Admin Panel

## 1. Ruta

Panel global:

- `/admin`
- `/admin/stores/[id]`

Este panel es del creador/equipo SaaS, no de los duenos normales de tiendas.

## 2. Roles permitidos

Acceso completo:

- `SUPER_ADMIN`
- `PLATFORM_ADMIN`
- `ADMIN_GLOBAL`
- `OWNER`

Acceso limitado de lectura/diagnostico:

- `DEVELOPER`
- `SUPPORT`

Sin acceso:

- `USER`
- roles de tienda como `STORE_OWNER`, `STORE_ADMIN`, `STORE_MANAGER`, `STORE_STAFF`, `VIEWER` si no tienen rol global autorizado.

## 3. Proteccion

El layout `app/admin/layout.tsx` usa `requireAdminPanelUser()`.

Las acciones sensibles en `app/admin/actions.ts` usan `requirePlatformAdmin()`.

Esto significa:

- soporte/desarrollador pueden diagnosticar en modo limitado;
- solo administradores globales pueden suspender tiendas, cambiar roles o modificar membresias;
- usuarios normales son redirigidos a `/dashboard`.

## 4. Funciones disponibles

- Resumen general del SaaS.
- Gestion de tiendas con busqueda, filtro por tipo, estado, dueno, plan y conteos.
- Detalle tecnico de tienda con miembros, productos, categorias, configuracion, IA, suscripcion, auditoria y diagnostico.
- Gestion de usuarios con roles globales, tiendas asociadas y cambio seguro de rol.
- Gestion de miembros por tienda.
- Productos globales con filtros y deteccion de datos incompletos.
- Diagnostico de productos, tiendas, SEO, stock y atributos JSON.
- Logs/auditoria recientes.
- Configuracion global operativa y vista de planes.

## 5. Gestion de roles globales

Reglas implementadas:

- Solo `SUPER_ADMIN` puede asignar `SUPER_ADMIN`.
- `PLATFORM_ADMIN`, `ADMIN_GLOBAL` y `OWNER` pueden asignar `USER`, `SUPPORT` o `DEVELOPER`.
- Nadie puede elevar sus propios permisos.
- No se permite dejar el sistema sin ningun `SUPER_ADMIN`.
- No se permite dejar el sistema sin ningun administrador global.
- Todo cambio queda en `AuditLog`.

## 6. Gestion de miembros de tienda

Desde `/admin/stores/[id]`:

- agregar miembro existente por email;
- cambiar rol de tienda;
- quitar miembro;
- bloquear remocion del dueno principal;
- bloquear cambios al dueno salvo `SUPER_ADMIN`;
- aplicar limite `maxMembers` del plan al agregar miembros nuevos;
- registrar auditoria.

## 7. Como probar acceso denegado

1. Iniciar sesion como usuario normal.
2. Abrir `/admin`.
3. Debe redirigir a `/dashboard`.
4. Iniciar sesion como `SUPPORT` o `DEVELOPER`.
5. Debe poder ver diagnostico limitado, pero no acciones destructivas.
6. Iniciar sesion como `SUPER_ADMIN`.
7. Debe poder administrar roles, tiendas y membresias.

Usuario demo admin:

```text
admin@demo.cl
```

La contrasena demo no se documenta. Usa `DEMO_SEED_PASSWORD` o la contrasena temporal impresa por `npm run db:seed`.

## 8. Restricciones actuales

- No existe `User.isActive`; por eso no se implemento desactivar/reactivar usuario.
- Las tablas tienen `take` para evitar cargas globales enormes; falta paginacion completa para volumen alto.
- Billing esta preparado con endpoints seguros, pero los proveedores reales aun no crean checkout/portal.
