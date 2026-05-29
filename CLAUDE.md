# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma y estilo

- Responde siempre en español.
- Explica causas, cambios y errores en español.
- Los mensajes finales deben estar en español claro y técnico.
- Los nombres de archivos, comandos, rutas, variables de entorno, código y errores reales deben mantenerse exactamente como están.
- No traduzcas comandos como `npm`, `npx`, `prisma`, `git`, `PowerShell`, `TypeScript`, `Next.js` o `Prisma`.
- Si necesitas escribir comentarios nuevos en código, usa español salvo que el proyecto ya use otro idioma en ese archivo.
- Cuando termines una tarea, entrega siempre:
  1. Resumen de causa raíz.
  2. Archivos modificados.
  3. Cambios aplicados.
  4. Comandos ejecutados.
  5. Validaciones realizadas.
  6. Próximos pasos.

## Comandos de desarrollo

```bash
# Servidor de desarrollo (escucha en 0.0.0.0 para acceso en red)
npm run dev

# Compilar e iniciar en producción
npm run build && npm start

# Lint (máximo 20 warnings permitidos)
npm run lint

# Verificación de tipos TypeScript (sin emitir archivos)
npm run typecheck

# Ejecutar todos los smoke tests
npm test

# Ejecutar un solo smoke test
npx tsx scripts/plan-smoke.ts
npx tsx scripts/security-smoke.ts
npx tsx scripts/platform-admin-access-smoke.ts

# Prisma
npm run db:generate   # Regenerar cliente de Prisma
npm run db:migrate    # Ejecutar migraciones pendientes (dev)
npm run db:seed       # Poblar la base de datos
npm run db:studio     # Abrir Prisma Studio

# Configuración completa (generate + migrate + seed)
npm run setup

# Reinicio forzado (borra BD, re-migra, re-puebla)
npm run reset
```

## Arquitectura general

**Stack**: Next.js 16 (App Router, React 18, Server Components), Prisma + PostgreSQL, Tailwind CSS 3, TypeScript en modo strict.

### Multi-tenancy

Cada `Business` es un tenant. El middleware (`app/middleware.ts`) detecta tenants por subdominio (ej. `slug.miapp.com`) y asigna el header `x-tenant-slug`. Las rutas API y páginas usan `services/authorization.ts` (`requireStoreAccess`, `getStoreAccess`) para resolver el contexto del negocio del usuario — mediante la cookie `catg_selected_business` para usuarios con múltiples tiendas, o la única tienda que poseen.

### Sistema de autenticación (`lib/auth.ts`)

Autenticación propia basada en sesiones mediante la cookie `catg_session` (httpOnly, 14 días de expiración). Funciones clave:
- `getCurrentUser(req?)` — lee la sesión desde la cookie, devuelve el usuario o null
- `requireUser()` — redirige a `/login` si no está autenticado
- `createSession(userId)` / `destroySession()` — ciclo de vida de la sesión
- `hashPassword()` / `verifyPassword()` — basadas en bcrypt

El registro (`app/(auth)/actions.ts`) crea usuario + negocio + membresía + suscripción en una sola transacción, envía verificación de correo y redirige a `/verify-email-prompt`.

### RBAC (`lib/auth/permissions.ts`)

**Roles globales** (User.role): `USER`, `SUPPORT`, `DEVELOPER`, `PLATFORM_ADMIN`, `ADMIN_GLOBAL`, `OWNER`, `SUPER_ADMIN`. Los administradores de plataforma omiten todas las verificaciones de permisos a nivel de tienda.

**Roles de tienda** (Membership.role): `STORE_OWNER` > `STORE_ADMIN` > `STORE_MANAGER` > `STORE_STAFF` > `VIEWER`. Cada rol se asigna a un rango mínimo para permisos específicos como `manage_products`, `manage_settings`, `use_ai`, etc.

Funciones como `requirePlatformAdmin()`, `requireSuperAdmin()`, `requireAdminPanelUser()` se usan para proteger rutas.

### Capa de autorización (`services/authorization.ts`)

Es el punto de entrada principal para el control de acceso del lado del servidor. `requireStoreAccess(options)` ejecuta: autenticar usuario → forzar verificación de correo (excepto para admins de plataforma) → resolver negocio (desde ID explícito, slug, cookie o tienda única por defecto) → calcular storeRole → opcionalmente verificar un permiso específico. Lanza errores tipados (`AuthenticationError`, `AuthorizationError`, `StoreSelectionRequiredError`) que redirigen apropiadamente.

Para rutas API, usar `getStoreAccess()` que lanza excepciones en vez de redirigir, permitiendo devolver respuestas JSON de error.

### Sistema de planes y suscripciones (`lib/plans/`, `services/plan-guard.ts`)

Los planes (`normal`, `premium`, `business`) definen límites (max productos, categorías, miembros, imágenes, tiendas) y feature flags (IA, branding avanzado, dominio personalizado, cotizaciones/pedidos, analíticas). `services/plan-guard.ts` proporciona:
- `effectivePlanLimits(plan, user)` — devuelve los límites resueltos; los admins de plataforma obtienen acceso ilimitado "PLATFORM_FULL_ACCESS"
- `requireFeature(businessId, feature)` / `assertWithinPlanLimit(businessId, limitType)` — fuerzan restricciones en tiempo de ejecución
- `allowedTemplatesForPlan(plan)` — filtra plantillas de catálogo según el nivel del plan

### Rutas API

Las rutas API residen bajo `app/api/`. Siguen las convenciones del App Router de Next.js con archivos `route.ts` que exportan manejadores de métodos HTTP. Endpoints clave:
- `app/api/ai/sales-assistant/route.ts` — endpoint del chat de IA
- `app/api/billing/checkout/route.ts` y `billing/webhook/route.ts` — facturación compatible con Stripe
- `app/api/admin/` — exportación CSV de administración, métricas
- `app/api/stores/[id]/domains/route.ts` — gestión de dominios personalizados

### Rutas de página

- `/` — Landing page
- `/login`, `/register` — Páginas de autenticación (server actions en `app/(auth)/actions.ts`)
- `/dashboard` — Panel principal con navegación lateral (`components/DashboardNav.tsx`)
- `/dashboard/products`, `/categories`, `/customers`, `/orders`, `/quotes`, `/conversations` — Secciones CRUD
- `/dashboard/settings` — Configuración de tienda con guardia de cambios no guardados
- `/dashboard/design` — Personalización de plantilla/paleta/tema del catálogo
- `/dashboard/learning` — Recursos de aprendizaje
- `/admin` — Panel de super admin (gestión de usuarios, métricas)
- `/admin/owner` — Métricas del propietario y gestión de accesos de plataforma
- `/platform-admin` — Panel de administración de plataforma (resumen de negocios, métricas)
- `/store/[slug]` — Página pública del catálogo/tienda
- `/select-store` — Selector para usuarios con múltiples tiendas
- `/verify-email`, `/verify-email-prompt` — Flujo de verificación de correo
- `/onboarding/theme` — Selector de tema SaaS
- `/settings/appearance`, `/settings/billing` — Configuración a nivel de cuenta

### Módulos clave de `lib/`

- `lib/db.ts` — Cliente singleton de Prisma
- `lib/validation.ts` — Esquemas Zod para auth, configuración de tienda, productos, etc.
- `lib/rate-limit.ts` — Rate limiter intercambiable (memoria local o Upstash Redis)
- `lib/format.ts` — Slugify, formato de moneda, helpers de fecha
- `lib/audit-log.ts` — Helpers de auditoría (`auditSuccess`, `auditFailure`, `auditBlocked`)
- `lib/turnstile.ts` — Verificación de Cloudflare Turnstile
- `lib/email.ts` / `lib/emailVerification.ts` — Correo transaccional basado en Resend
- `lib/request-security.ts` — Validación de origen para server actions
- `lib/api-security.ts` — Utilidades de seguridad para API
- `lib/ai.ts` / `lib/ai-sources.ts` — Asistente de ventas IA (compatible con DeepSeek/OpenAI)
- `lib/catalog.ts` — Lógica de renderizado del catálogo
- `lib/themes/` — Definiciones de temas SaaS, paletas de catálogo, generadores de variables CSS

### Pruebas

Las pruebas son scripts de smoke test ejecutados con `tsx` (sin Jest/Vitest). Cada PR tiene un smoke test correspondiente en `scripts/`. Estos scripts importan módulos de la aplicación y ejercitan flujos clave (auth, planes, seguridad, acceso de plataforma). No existen pruebas unitarias tradicionales.

### Variables de entorno

Copiar `.env.example` a `.env`. Variables clave:
- `DATABASE_URL` — Conexión a PostgreSQL
- `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `DEEPSEEK_MODEL` — Proveedor de IA
- `TRUSTED_ORIGINS` — Orígenes permitidos (separados por coma) para server actions
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` — Cloudflare Turnstile
- `RESEND_API_KEY` / `EMAIL_FROM` — Correo transaccional
- `PLATFORM_OWNER_EMAILS` — Correos (separados por coma) con acceso de administración de plataforma
- `ADMIN_BOOTSTRAP_SECRET` — Secreto opcional para auto-elevarse a SUPER_ADMIN durante el registro
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — Rate limiting en producción (opcional)
- `CSP_IMG_SRC` / `CSP_CONNECT_SRC` — Personalización del CSP

### Convenciones

- El alias de importación `@/*` apunta a la raíz del proyecto
- Las server actions usan la directiva `"use server"` y se ubican junto a los componentes de página (o en archivos `actions.ts` dedicados)
- Las rutas API usan `requireAuth()`, `getStoreAccess()` etc. para autorización — devuelven errores JSON, no redirecciones
- Las rutas de interfaz usan `requireUser()`, `requireStoreAccess()` etc. que redirigen en caso de fallo
- El acceso a base de datos siempre se hace a través de Prisma, nunca con SQL crudo
- Los mensajes de error están en español
