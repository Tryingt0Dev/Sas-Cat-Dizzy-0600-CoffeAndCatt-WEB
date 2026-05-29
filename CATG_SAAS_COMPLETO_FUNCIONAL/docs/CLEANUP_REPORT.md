# Reporte de limpieza controlada

Fecha: 2026-05-26

## Alcance

La limpieza fue deliberadamente pequena. No se hicieron refactors masivos, no se tocaron migraciones, no se cambio Prisma schema, auth, planes, Server Actions criticas ni reglas multi-tenant.

## Archivos eliminados

| Archivo | Motivo | Evidencia |
| --- | --- | --- |
| `t` | Artefacto accidental en raiz | Sin trackear; contenido era ayuda de `less`; 0 referencias/imports. |
| `ma generate` | Artefacto accidental en raiz | Sin trackear; contenido era salida de `git diff`/warnings; 0 referencias/imports. |

## Archivos modificados

| Archivo | Cambio | Motivo |
| --- | --- | --- |
| `app/dashboard/settings/page.tsx` | Se agrego `const themeStyle = getCatalogThemeStyle(business);` | Corrige `TS2304: Cannot find name 'themeStyle'` y usa el import existente. |
| `docs/PROJECT_AUDIT.md` | Documento nuevo de auditoria | Mapa profesional del proyecto, flujos, riesgos, candidatos y recomendaciones. |
| `docs/CLEANUP_REPORT.md` | Documento nuevo de reporte | Evidencia de limpieza, validaciones y pruebas manuales. |

## Imports/variables eliminados

No se eliminaron imports manualmente. El warning de lint quedo resuelto al usar `getCatalogThemeStyle`.

## Duplicaciones resueltas

No se unificaron duplicaciones por seguridad. Se documentaron candidatos:

- Repeticion estructural entre templates de catalogo.
- Componentes UI con 0 referencias directas: `Button`, `FormSection`, `StatusBadge`, `SaaSThemeProvider`.
- Wrappers sin imports directos: `lib/auth/guards.ts`, `lib/security/*`.

## Riesgos pendientes

- Workspace tenia muchos cambios previos sin commitear. Solo se modifico `app/dashboard/settings/page.tsx` dentro de esos archivos preexistentes.
- `app/dashboard/design/`, `components/DashboardNavClient.tsx` y `components/theme/LiveThemeColorControls.tsx` siguen sin trackear, pero estan activos/importados.
- Componentes/wrappers con 0 referencias no se borraron porque pueden ser reutilizables o API interna legacy.
- Root docs dispersos pueden reorganizarse en una tarea aparte.
- Billing sigue preparado pero sin provider real de checkout/portal.

## Validaciones ejecutadas

| Comando | Resultado |
| --- | --- |
| `npx prisma generate` | Paso tras detener el dev server que bloqueaba `query_engine-windows.dll.node`. Prisma Client v5.22.0 generado. |
| `npx prisma migrate status` | Paso. SQLite `dev.db`, 11 migraciones encontradas, schema al dia. |
| `npm run typecheck` | Paso. |
| `npm run lint` | Paso sin warnings. |
| `npm run test` | Paso. `Plan smoke checks passed`; `Security smoke checks passed`. |
| `npm run build` | Paso. Next.js 16.2.6 compilo, TypeScript paso y genero 28 paginas. |

Nota: el primer `npx prisma generate` fallo con `EPERM` por lock de Windows sobre `node_modules/.prisma/client/query_engine-windows.dll.node`. Se identifico un `npm run dev` del mismo proyecto, se detuvo y el comando paso al reintentarlo.

## Pruebas manuales basicas

Servidor local usado: `http://localhost:3000`

Se registro un usuario temporal, se completo onboarding de tema, se verificaron rutas privadas y luego se borro el usuario temporal de la base local (`deleteMany` devolvio `{"count":1}`).

| Ruta | Resultado |
| --- | --- |
| `/` | Carga home sin error visible. |
| `/login` | Carga formulario de login sin error visible. |
| `/register` | Carga formulario de registro sin error visible. |
| `/dashboard` | Carga con sesion temporal. |
| `/dashboard/design` | Carga con sesion temporal. |
| `/dashboard/products` | Carga con sesion temporal. |
| `/dashboard/categories` | Carga con sesion temporal. |
| `/settings/billing` | Carga pagina de plan y limites. |
| `/store/codex-audit-store-1779770136719` | Carga catalogo publico de la tienda temporal. |
| `/admin` | Usuario normal es redirigido a `/dashboard`, como corresponde. |

Flujo login verificado:

- Logout desde dashboard redirigio a `/login`.
- Login con el usuario temporal redirigio a `/dashboard`.
- Dashboard post-login mostro enlaces de `Productos` y `Plan`.
- Consola del navegador integrado: 0 errores capturados.

## Seguridad verificada por tests

Los smoke tests cubrieron:

- Usuario comun no obtiene acceso admin por `PLATFORM_OWNER_EMAILS`.
- Bootstrap admin requiere secreto seguro.
- `PLATFORM_ADMIN` obtiene limites internos completos sin mezclarlo con plan comercial.
- Recursos de otro tenant no se leen ni actualizan por `businessId` ajeno.
- API IA rechaza `productId` de otra tienda.
- API tracking rechaza `productId` de otra tienda.
- API upload rechaza `businessId` de otra tienda.
- Slug duplicado se rechaza.
- Slug history resuelve redireccion.
- Tiendas inactivas no resuelven como publicas.
- Checkout sin provider no concede plan automaticamente.

## Recomendaciones siguientes

1. Revisar y decidir si se conserva o elimina la capa legacy `lib/security/*` y `lib/auth/guards.ts`.
2. Decidir politica de componentes UI reutilizables sin referencias directas.
3. Mover documentacion root a `docs/` y crear un indice unico.
4. Integrar o remover `eslint-config-next` en una tarea de dependencias.
5. Agregar pruebas e2e ligeras para login, onboarding, dashboard y catalogo publico.
