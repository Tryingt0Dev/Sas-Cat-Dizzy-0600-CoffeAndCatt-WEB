# Architecture

## Stack

- Next.js 16 App Router
- React 18
- TypeScript strict
- Tailwind CSS
- Prisma 5
- SQLite en desarrollo
- OpenAI SDK compatible con DeepSeek
- Zod para validación
- bcryptjs para hash de contraseñas

## Estructura De Carpetas

```text
app/
  (auth)/actions.ts              Server actions de login, registro y logout
  api/
    ai/sales-assistant/route.ts  Endpoint del vendedor IA
    uploads/image/route.ts       Endpoint de upload local de imagenes
    health/route.ts              Healthcheck simple
  admin/                         Superadmin
  dashboard/                     Panel privado de tienda
  store/[slug]/page.tsx          Catalogo publico multi-template
components/
  catalog/                       Componentes del catalogo publico
  StoreChat.tsx                  Chat IA cliente
  ImageDropzone.tsx              Upload drag and drop
lib/
  auth.ts                        Sesiones, cookies y helpers de usuario
  db.ts                          Prisma singleton
  enums.ts                       Estados y enums TypeScript
  validation.ts                  Schemas Zod
  catalog.ts                     Tipos y helpers de catalogo
  rate-limit.ts                  Rate limit en memoria
services/
  tenant-guard.ts                Guardas multi-tenant
  product-search.ts              Busqueda de productos para IA
templates/
  ModernGridCatalog.tsx
  BoutiquePremiumCatalog.tsx
  FastSalesCatalog.tsx
  TechProCatalog.tsx
prisma/
  schema.prisma
  migrations/
  seed.ts
public/
  uploads/                       Storage local ignorado por git
```

## Next.js App Router

El proyecto usa App Router con:

- server components para páginas de dashboard y catálogo
- client components para interacciones como chat, upload, copiar, imprimir y botones dinámicos
- server actions para formularios privados
- route handlers para IA, upload y healthcheck

Las páginas privadas obtienen la tienda actual con `getCurrentBusiness()`. Las páginas públicas consultan por `slug`.

## Prisma Y Base De Datos

Prisma modela:

- `User`
- `Session`
- `Business`
- `Plan`
- `Subscription`
- `Category`
- `Product`
- `Customer`
- `Conversation`
- `Message`
- `Quote`
- `QuoteItem`
- `Order`
- `OrderItem`
- `AiSettings`

SQLite no soporta Prisma enums en Prisma 5.22. Por eso los campos de estado, plan y template se guardan como `String` y se validan con `lib/enums.ts` + `lib/validation.ts`. Al migrar a PostgreSQL/Supabase se recomienda convertirlos a enums nativos.

## Multi-Tenant

El tenant principal es `Business`. Los recursos privados cuelgan de `businessId`.

Reglas actuales:

- Las páginas privadas consultan `getCurrentBusiness()`.
- Productos, categorías, clientes, conversaciones, cotizaciones y pedidos se filtran por `businessId`.
- Updates/deletes usan helpers en `services/tenant-guard.ts`.
- La IA busca el negocio por `slug` público y luego filtra productos por `business.id`.
- El upload exige sesión y valida que el usuario sea dueño del `businessId`.

Riesgo actual: el modelo permite múltiples tiendas por usuario, pero la UI usa la primera tienda activa. Si el producto evoluciona a multi-tienda por usuario, se necesita selector de tienda y contexto explícito.

## Autenticación

La autenticación es simple:

- email/password
- hash bcrypt
- `Session` en DB
- cookie `catg_session`
- cookie `httpOnly`, `sameSite=lax`, `secure` en producción

No existe todavía:

- recuperación de contraseña
- verificación de email
- rotación avanzada de sesiones
- MFA

## Upload De Imágenes

`ImageDropzone` permite:

- drag and drop
- selección de archivo
- preview
- URL manual
- borrar imagen del formulario
- errores visibles

`POST /api/uploads/image`:

- requiere sesión
- valida ownership de tienda
- acepta JPG, PNG y WEBP
- bloquea SVG
- limita a 5MB
- guarda en `public/uploads/{businessId}/archivo`
- devuelve URL pública `/uploads/{businessId}/archivo`

Esto está bien para desarrollo y demo. Para producción se debe reemplazar internamente por Supabase Storage, S3, Cloudinary o UploadThing.

## Chat IA

`StoreChat.tsx` mantiene:

- mensajes en estado local
- `conversationId` en localStorage
- `visitorId` en localStorage
- envío por `fetch("/api/ai/sales-assistant")`
- submit con formulario
- estados de carga y error

`/api/ai/sales-assistant`:

- valida request con Zod
- aplica rate limit por tienda/IP
- busca tienda activa por slug
- valida `conversationId` contra `businessId`
- si llega `productId`, valida que sea producto activo de la tienda
- crea o reutiliza conversación
- guarda mensaje del cliente
- arma contexto de productos
- llama a DeepSeek si hay API key
- si no hay API key, responde en modo demo
- guarda respuesta del asistente
- actualiza cliente y conversación

## Catálogo Público

`/store/[slug]`:

- busca tienda activa por slug
- filtra productos activos
- soporta búsqueda, categoría y orden
- calcula metadata SEO y Open Graph básico
- renderiza template según `business.catalogTemplate`

Templates:

- `MODERN_GRID`: ecommerce moderno general
- `BOUTIQUE_PREMIUM`: visual premium con más espacio
- `FAST_SALES`: venta rápida con precio y WhatsApp visibles
- `TECH_PRO`: técnico/profesional con foco en asesoría

## Dashboard

El dashboard incluye:

- métricas comerciales
- gestión de productos
- gestión de categorías
- CRM
- conversaciones
- cotizaciones
- pedidos
- settings de tienda, branding e IA

Los formularios principales usan server actions y validación Zod.

## Superadmin

`/admin` requiere `UserRole.PLATFORM_ADMIN`. Permite ver tiendas, usuarios, planes y suspender/reactivar tiendas.

## Riesgos Técnicos Actuales

- SQLite no es base de datos de producción para multi-tenant SaaS.
- Rate limit en memoria no sirve en despliegue serverless multi-instancia.
- Upload local no persiste de forma confiable en plataformas serverless.
- No hay tests automatizados.
- No hay observabilidad ni auditoría de eventos.
- No hay selector de tienda si un usuario tiene más de una.
- No hay recuperación de contraseña.
- No hay integración real de pagos.
- No hay permisos granulares por usuario dentro de una tienda.

## Recomendaciones Para Producción

1. Migrar a PostgreSQL/Supabase.
2. Convertir estados a enums Prisma nativos.
3. Mover uploads a Supabase Storage, S3, Cloudinary o UploadThing.
4. Reemplazar rate limit en memoria por Redis/Upstash.
5. Agregar tests unitarios y e2e.
6. Agregar selector de tienda y roles por negocio.
7. Implementar recuperación de contraseña y verificación de email.
8. Integrar Stripe o Mercado Pago.
9. Agregar logging estructurado y monitoreo de errores.
10. Agregar backups y políticas de retención de datos.

