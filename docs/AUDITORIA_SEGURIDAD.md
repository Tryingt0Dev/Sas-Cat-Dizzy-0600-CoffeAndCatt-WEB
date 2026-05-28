# Auditoría de Seguridad SaaS Multi-Tenant

## Riesgos críticos

- **Control de roles globales y panel admin**: `app/admin/actions.ts`, `lib/auth.ts`, `lib/auth/permissions.ts`.
  - El sistema permite que usuarios con rol de plataforma realicen cambios de rol global y de miembros de tienda. Esto es una superficie de privilegios muy poderosa y debe revisarse como parte de la separación entre administración de plataforma y administración de tienda.

- **Registro público con asignación de rol**: `app/(auth)/actions.ts`, `lib/auth.ts`.
  - La creación de cuentas valida un `ADMIN_BOOTSTRAP_SECRET` para asignar `SUPER_ADMIN`. Si la variable de entorno está ausente o mal configurada, el flujo podría fallar o permitir una filtración de privilegio si no se protege correctamente.

- **Endpoint público de IA por `businessSlug`**: `app/api/ai/sales-assistant/route.ts`.
  - Este endpoint no requiere autenticación y expone información de productos/ conversaciones de una tienda a cualquier cliente que conozca el `publicSlug`. Si ese slug es predecible o está enumerado, puede haber extracción de datos o abuso de recursos.

## Archivos afectados

- `lib/auth.ts`
- `lib/auth/permissions.ts`
- `services/authorization.ts`
- `services/tenant-guard.ts`
- `app/(auth)/actions.ts`
- `app/admin/actions.ts`
- `app/admin/layout.tsx`
- `app/select-store/actions.ts`
- `app/api/uploads/image/route.ts`
- `app/api/billing/portal/route.ts`
- `app/api/billing/checkout/route.ts`
- `app/api/ai/sales-assistant/route.ts`
- `app/dashboard/products/actions.ts`
- `app/dashboard/customers/actions.ts`
- `app/dashboard/quotes/actions.ts`
- `app/dashboard/orders/actions.ts`

## Explicación

### 1. Roles y privilegios globales
- `lib/auth/permissions.ts` define múltiples roles globales y los permisos de acceso al panel global.
- `app/admin/actions.ts` permite a administradores globales cambiar roles de usuarios y miembros de tiendas.
- La lógica de asignación `canAssignGlobalRole` es razonable, pero el entorno de roles globales es delicado: un error en los valores de rol o en su aplicación puede elevar permisos más de lo esperado.

### 2. Manejo de sesión y tenant context
- `lib/auth.ts` guarda la sesión en cookie `catg_session` y usa `selectedBusinessId` en cookie para seleccionar la tienda activa.
- `services/authorization.ts` aplica acceso al tenant con `accessWhere`, restringiendo negocio por `ownerId` o `memberships`.
- El filtro de tenant parece consistente con la mayoría de acciones: siempre se verifica `businessId` o `businessSlug` antes de crear/actualizar recursos.

### 3. Protección de rutas y middleware
- Las páginas del admin usan `requireAdminPanelUser` en layout y acciones en `requirePlatformAdmin`.
- Las rutas del dashboard y acciones de tienda usan `requireStoreAccess` con permisos específicos.
- Esto cubre bien el acceso en servidor, aunque queda un punto a revisar en la aplicación general: todas las rutas deben seguir usando los mismos guards y no confiar solo en el cliente.

### 4. Prisma queries y tenant isolation
- `services/tenant-guard.ts` agrega aserciones explícitas para recursos de tenant.
- En `app/dashboard/products/actions.ts`, `customers/actions.ts`, `quotes/actions.ts` y similares, se usan guardias de tenant antes de cambios de recursos.
- Esta es buena práctica, pero debe validarse que no existan consultas directas de Prisma en páginas o rutas fuera de estos guardias.

### 5. API routes y servidor
- `app/api/uploads/image/route.ts` usa origin check y `getStoreAccess` con `manage_uploads`.
- `app/api/billing/portal/route.ts` y `app/api/billing/checkout/route.ts` usan origin check y `getStoreAccess` con `manage_settings`.
- Estos endpoints están protegidos correctamente contra acceso cruzado entre tiendas, siempre que el guard de `getStoreAccess` no sea eludible.

### 6. Riesgo de `publicSlug` y exposición de tenant público
- La API de IA permite acceso a la tienda por `businessSlug` público sin autenticación.
- Esto es probablemente una funcionalidad de charla pública, pero desde el punto de vista de seguridad tenant es un vector de descubrimiento de tiendas y posible scraping.

## Solución recomendada

1. **Revisar y endurecer la separación de roles globales**.
   - Asegurar que solo `SUPER_ADMIN` pueda asignar roles de plataforma críticos.
   - Auditar todas las acciones de `app/admin/actions.ts` donde se manipulan roles y membresías.
   - Considerar una política de mínimos privilegios para `PLATFORM_ADMIN_ROLES` en `lib/auth/permissions.ts`.

2. **Validar con pruebas de seguridad los flujos de registro y bootstrap de admin**.
   - Verificar que `ADMIN_BOOTSTRAP_SECRET` esté presente y se gestione fuera del código.
   - Añadir pruebas automatizadas que aseguren que `PLATFORM_OWNER_EMAILS` no eleva permisos por sí solo.

3. **Bloquear y monitorear el endpoint público de IA**.
   - Si la intención es chat público, limitar el scraping con rate limiting adicional y validación de `businessSlug`.
   - Si no debe ser público, migrar el endpoint a un flujo autenticado o agregar un token de cliente.

4. **Verificar uso consistente de tenant guards**.
   - Revisar todas las rutas y server actions para confirmar que no existen consultas directas a Prisma sin `businessId` + tenant validado.
   - En particular, auditar `app/dashboard` y `app/api` por consultas que puedan saltarse `assertTenant*` o `getStoreAccess`.

5. **Mejorar el control de cookies de tienda seleccionada**.
   - Añadir expiración y validación constante de `catg_selected_business` against user access cada vez que se use.
   - Considerar invalidar la cookie al revocar membresías o cambios en roles.

## Cambios que habría que hacer después

- Hacer una revisión de seguridad intencional en todos los archivos `app/dashboard/**` y `app/api/**` para confirmar que cada operación escrita en base de datos respeta `businessId`.
- Implementar pruebas de integración para:
  - acceso entre tiendas por usuarios con varias membresías,
  - intento de acceso a recursos con `businessId` externo,
  - uso de roles globales y modificación de miembros de tienda.
- Auditar los roles en `lib/enums.ts`/`lib/auth/permissions.ts` para evitar alias de roles que permitan escalada accidental.
- Revisar si `app/api/ai/sales-assistant/route.ts` debe ser un endpoint público o si debería estar protegido por token/seguridad adicional.
- Considerar la segregación de funciones entre administración de plataforma y administración de tiendas para limitar el alcance de `PLATFORM_ADMIN_ROLES`.
