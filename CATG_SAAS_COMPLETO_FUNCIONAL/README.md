# CATG OmniVentas SaaS

CATG OmniVentas SaaS es una plataforma multi-tienda para que negocios creen un catalogo web profesional con productos, branding, vendedor IA, WhatsApp, CRM basico, cotizaciones, pedidos, dashboard, planes y superadmin.

El objetivo del producto es ayudar a tiendas pequenas y equipos comerciales que venden por mensajes a tener una vitrina ordenada, con asesor IA y datos separados por tienda.

## Stack

- Next.js App Router
- React
- TypeScript strict
- Tailwind CSS
- Prisma
- SQLite en desarrollo
- Zod
- bcryptjs
- OpenAI SDK compatible con DeepSeek

## Instalacion Local

1. Instalar dependencias:

```bash
npm install
```

2. Crear `.env` desde `.env.example` y completar valores reales solo en local.

3. Generar Prisma y aplicar migraciones:

```bash
npx prisma generate
npx prisma migrate dev
```

4. Cargar datos demo:

```bash
npm run db:seed
```

5. Levantar desarrollo:

```bash
npm run dev
```

## Variables De Entorno

Usa `.env.example` como referencia. No versionar `.env`.

```bash
DATABASE_URL="file:./dev.db"
DEEPSEEK_API_KEY="replace-with-your-deepseek-api-key"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
DEEPSEEK_MODEL="deepseek-chat"
NEXT_PUBLIC_APP_URL="https://your-domain.example"
NEXT_ALLOWED_DEV_ORIGINS=""
NEXT_SERVER_ACTION_ALLOWED_ORIGINS=""
PLATFORM_OWNER_EMAILS="owner@example.com"
ADMIN_BOOTSTRAP_SECRET="replace-with-32-plus-chars"
DEMO_SEED_PASSWORD=""
ALLOW_DESTRUCTIVE_ADMIN_RESET=""
ADMIN_1_EMAIL="felipebustamante003@gmail.com"
ADMIN_2_EMAIL="rivas.matias79@gmail.com"
ADMIN_1_PASSWORD=""
ADMIN_2_PASSWORD=""
BILLING_PROVIDER="disabled"
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
```

La app responde en modo demo local si no hay API key de IA configurada.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:reset-admins
npm run diagrams:all
```

## 🎨 Diagramas de Flujo

La documentación incluye diagramas de flujo Mermaid que visualizan los principales flujos del sistema.

### Ver los diagramas

Los diagramas están en [docs/FLOWS.md](docs/FLOWS.md) y se pueden ver de dos formas:

**Opción 1: En VS Code (dentro de Markdown)**

Si el preview Mermaid aparece negro, usa la Opción 2.

**Opción 2: En navegador (recomendado)**

Primero, genera los archivos SVG/PNG:

```bash
npm run diagrams:all
```

Luego abre los diagramas SVG en tu navegador:

```bash
# Windows
start docs\diagrams\flujo-general.svg

# O desde Chrome/Edge directamente
chrome docs\diagrams\flujo-general.svg
msedge docs\diagrams\flujo-general.svg
```

**Archivos disponibles:**

- `proyecto-completo.svg` — Arquitectura completa del SaaS, modulos, datos, APIs y seguridad
- `flujo-general.svg` — Flujo principal del SaaS
- `flujo-multitenant.svg` — Aislamiento de datos por tenant
- `flujo-catalogo-publico.svg` — Catálogo público y búsqueda
- `flujo-chat-ia.svg` — Chat de IA vendedor
- `flujo-consultar-ia.svg` — Botón "Consultar IA" en cards
- `flujo-whatsapp.svg` — Integración con WhatsApp
- `flujo-upload-imagenes.svg` — Subida de imágenes
- `flujo-productos.svg` — Gestión de productos
- `flujo-cotizacion-pedido.svg` — Flujo cotización → pedido
- `flujo-superadmin.svg` — Panel de superadministrador

Diagrama completo:

```bash
start docs\diagrams\proyecto-completo.svg
start docs\diagrams\proyecto-completo-viewer.html
```

## Usuarios Demo

El seed local crea usuarios demo, pero no documenta contrasenas fijas.

- `storelamon@demo.cl`
- `seguridad@demo.cl`
- `admin@demo.cl`

Define `DEMO_SEED_PASSWORD` en `.env` o usa la contrasena temporal que imprime `npm run db:seed` en consola local.

## Rutas Principales

### Publicas

- `/`: landing
- `/login`: inicio de sesion
- `/register`: registro
- `/store/[slug]`: catalogo publico por tienda
- `/api/health`: healthcheck
- `/api/ai/sales-assistant`: chat IA publico controlado por tenant

### Privadas

- `/dashboard`: metricas comerciales
- `/dashboard/products`: productos
- `/dashboard/categories`: categorias
- `/dashboard/customers`: CRM
- `/dashboard/customers/[id]`: detalle de cliente
- `/dashboard/conversations`: conversaciones
- `/dashboard/quotes`: cotizaciones
- `/dashboard/quotes/[id]`: vista imprimible de cotizacion
- `/dashboard/orders`: pedidos
- `/dashboard/orders/[id]`: vista imprimible de pedido
- `/dashboard/settings`: tienda, branding, templates e IA
- `/api/uploads/image`: upload autenticado de imagenes

### Admin

- `/admin`: superadmin de plataforma
- `/admin/stores/[id]`: detalle y diagnostico de una tienda para administradores globales
- `/api/billing/checkout`: endpoint preparado para checkout autenticado
- `/api/billing/portal`: endpoint preparado para portal de billing autenticado
- `/api/billing/webhook`: webhook de billing con firma Stripe cuando el proveedor esta activo

## Arquitectura Resumida

- `Business` es el tenant principal.
- Productos, categorias, clientes, conversaciones, cotizaciones, pedidos e IA cuelgan de `businessId`.
- Las rutas privadas resuelven tienda con `getCurrentBusiness()` o `services/authorization.ts`.
- Las mutaciones sensibles deben usar `requireStoreAccess()`/`getStoreAccess()` y filtrar por `businessId`.
- El catalogo publico usa `slug` para resolver una tienda activa.
- El chat IA guarda `conversationId`, historial y solo consulta productos de la tienda actual.
- El upload local guarda archivos en `/public/uploads/{businessId}` y devuelve `/uploads/{businessId}/archivo`.

## Templates De Catalogo

- `MODERN_GRID`: ecommerce moderno general.
- `BOUTIQUE_PREMIUM`: visual premium para moda, belleza y accesorios.
- `FAST_SALES`: venta rapida con precio, descuento y WhatsApp destacados.
- `TECH_PRO`: estilo tecnico con foco en confianza y asesoria.

Cada tienda configura colores, logo, banner, radio de botones y template desde `/dashboard/settings`.

## Seguridad Y Tenancy

- `.env`, `.next`, `node_modules`, `dev.db`, `*.db`, builds y uploads locales estan ignorados.
- `.env.example` usa placeholders seguros.
- Cookies de sesion `httpOnly`, `sameSite=lax` y `secure` en produccion.
- Login, registro e IA tienen rate limit basico en memoria.
- La IA no recibe productos de otras tiendas.
- Los uploads requieren sesion y validacion de ownership.
- SVG esta bloqueado para uploads.
- Roles globales: `SUPER_ADMIN`, `PLATFORM_ADMIN`, `DEVELOPER`, `SUPPORT`, `USER` y aliases legacy.
- Roles por tienda: `STORE_OWNER`, `STORE_ADMIN`, `STORE_MANAGER`, `STORE_STAFF`, `VIEWER`.
- `PLATFORM_OWNER_EMAILS` permite marcar emails de dueño/desarrollador con acceso total sin consumir limites comerciales.

## Advertencias De Produccion

Antes de venderlo en produccion real:

- Migrar SQLite a PostgreSQL/Supabase.
- Mover uploads locales a storage externo.
- Cambiar rate limit en memoria por Redis/Upstash.
- Agregar tests automatizados.
- Agregar recuperacion de password y verificacion de email.
- Agregar observabilidad, backups y auditoria.
- Implementar pagos con Stripe o Mercado Pago.
- Agregar selector de tienda si un usuario tendra multiples negocios.

## Documentacion

- `ADMIN_PANEL_AND_CODE_OPTIMIZATION.md`: auditoria aplicada, panel admin global, proteccion, validacion y pendientes.
- `SECURITY_AND_RBAC.md`: modelo de roles, permisos, helpers y patrones multi-tenant seguros.
- `ADMIN_PANEL.md`: panel global, roles permitidos, acciones y pruebas de acceso.
- `BILLING_AND_PLANS.md`: planes, limites, suscripciones y endpoints de pagos preparados.
- `PRODUCTION_READINESS.md`: checklist de despliegue, variables, migraciones, backups y hardening.
- `UI_POLISH_AND_CLIENT_EXPERIENCE.md`: pulido visual, estados vacios y lenguaje de cliente.
- `AUTH_SECURITY_AND_ADMIN_SEED.md`: email unico, contrasena fuerte y reset local seguro de admins.
- `ROADMAP_NEXT_STEPS.md`: prioridades y camino para vender el SaaS.
- `docs/OVERVIEW.md`: vision funcional del SaaS.
- `docs/ARCHITECTURE.md`: arquitectura tecnica.
- `docs/FLOWS.md`: diagramas Mermaid.
- `docs/diagrams/proyecto-completo.svg`: diagrama profesional completo de arquitectura.
- `docs/diagrams/proyecto-completo-viewer.html`: visor local con zoom para leer el diagrama completo.
- `docs/MODULES.md`: explicacion por modulo.
- `docs/FEATURE_MAP.md`: matriz de features y estado.
- `docs/QA_REPORT.md`: auditoria, hallazgos y checklist.
- `docs/PRODUCTION_ROADMAP.md`: roadmap hacia produccion.
- `docs/AUDIT.md`: inventario tecnico de auditoria.

## Roadmap Corto

1. Hardening de base de datos, storage y rate limit.
2. Tests unitarios, integracion y e2e.
3. Recuperacion de password, email verification y roles por tienda.
4. Stripe o Mercado Pago.
5. Analitica comercial, paginas de producto y WhatsApp Business API.

## Checklist Manual Basico

1. Registrar usuario y entrar al dashboard.
2. Crear categoria y producto con imagen.
3. Cambiar branding y template.
4. Abrir `/store/storelamon`.
5. Probar busqueda, filtros y orden.
6. Click en Consultar IA.
7. Click en WhatsApp.
8. Revisar conversaciones y clientes.
9. Crear cotizacion, aceptarla y crear pedido.
10. Entrar a `/admin` y suspender/reactivar tienda.
