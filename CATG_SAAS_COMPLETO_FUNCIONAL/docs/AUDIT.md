# Software Audit

Fecha de revisión: 2026-05-22

## Stack Usado

- Next.js App Router
- React
- TypeScript strict
- Tailwind CSS
- Prisma
- SQLite en desarrollo
- Zod
- OpenAI SDK compatible con DeepSeek
- bcryptjs

## Rutas Públicas

- `/`: landing simple.
- `/login`: login.
- `/register`: registro.
- `/store/[slug]`: catálogo público por tienda.
- `/api/health`: healthcheck.
- `/api/ai/sales-assistant`: endpoint público controlado para chat IA por tienda.

## Rutas Privadas

- `/dashboard`: métricas.
- `/dashboard/products`: productos.
- `/dashboard/categories`: categorías.
- `/dashboard/customers`: CRM.
- `/dashboard/customers/[id]`: detalle CRM.
- `/dashboard/conversations`: conversaciones.
- `/dashboard/quotes`: cotizaciones.
- `/dashboard/quotes/[id]`: vista imprimible.
- `/dashboard/orders`: pedidos.
- `/dashboard/orders/[id]`: detalle imprimible.
- `/dashboard/settings`: tienda, diseño, branding e IA.
- `/api/uploads/image`: upload de imágenes con sesión.

## Rutas Admin

- `/admin`: panel de plataforma protegido por `PLATFORM_ADMIN`.

## API Routes

| Ruta | Uso | Seguridad |
| --- | --- | --- |
| `/api/health` | Healthcheck simple | Público |
| `/api/ai/sales-assistant` | Chat IA del catálogo | Valida slug, rate limit, business activo y productId por tenant |
| `/api/uploads/image` | Upload local de imágenes | Requiere sesión y ownership de tienda |

## Server Actions

- Auth: login, registro, logout.
- Productos: crear, editar, duplicar, borrar.
- Categorías: crear, borrar.
- Settings: actualizar tienda, branding e IA.
- Clientes: actualizar ficha CRM.
- Cotizaciones: crear, cambiar estado, crear pedido.
- Pedidos: cambiar estado.
- Admin: suspender/reactivar tienda.

## Modelos Prisma

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

## Componentes Principales

- `DashboardNav`: navegación privada.
- `StoreChat`: chat IA cliente.
- `ImageDropzone`: subida de imágenes.
- `ProductCard`: card pública de producto.
- `CatalogControls`: filtros del catálogo público.
- `AskAiButton`: botón de consulta IA por producto.
- `WhatsAppProductButton`: botón WhatsApp por producto.
- `SafeImage`: fallback de imágenes.
- `PendingSubmitButton`: feedback de submit.

## Servicios Principales

- `services/tenant-guard.ts`: verificaciones multi-tenant.
- `services/product-search.ts`: selección de productos relevantes para IA.
- `lib/auth.ts`: sesiones y usuario actual.
- `lib/validation.ts`: Zod.
- `lib/rate-limit.ts`: rate limit en memoria.
- `lib/catalog.ts`: tipos/helpers de catálogo.
- `lib/plans.ts`: definición de planes.

## Flujo De Datos

1. El usuario de tienda entra al dashboard.
2. `getCurrentBusiness()` resuelve su tienda activa.
3. Las páginas privadas consultan Prisma filtrando por `businessId`.
4. Los formularios privados llaman server actions.
5. Las server actions validan con Zod y guardas tenant.
6. El catálogo público busca una tienda activa por `slug`.
7. El chat IA envía datos a `/api/ai/sales-assistant`.
8. La API IA valida tienda, conversación y producto por tenant.
9. Prisma guarda mensajes, clientes y conversaciones.
10. Si hay API key, se llama al proveedor IA; si no, se responde en modo demo.

## Funcionalidades Completas Para Demo

- Registro/login.
- Dashboard privado.
- CRUD principal de productos.
- Categorías.
- Branding y templates.
- Catálogo público con filtros.
- Chat IA persistente.
- WhatsApp por producto.
- Upload local de imágenes.
- CRM básico.
- Cotizaciones.
- Pedidos desde cotización aceptada.
- Superadmin.
- Planes como estructura de datos.

## Funcionalidades Incompletas O MVP

- Planes sin cobro real.
- Suscripciones sin proveedor.
- Rate limit en memoria.
- Storage local.
- Sin tests automatizados.
- Sin multiusuario por tienda.
- Sin selector de tienda.
- Sin recuperación de contraseña.
- Sin integración WhatsApp Business API.
- Sin páginas individuales de producto.

## Listo Para Mostrar A Cliente

- Catálogo público.
- Los 4 templates visuales.
- Configuración de branding.
- Productos con imágenes.
- Chat IA en modo real o demo.
- WhatsApp por producto.
- Dashboard comercial básico.
- CRM/cotizaciones/pedidos simples.

## No Listo Para Producción

- Persistencia con SQLite.
- Upload en disco local.
- Rate limit en memoria.
- Falta observabilidad.
- Falta suite de tests.
- Falta hardening de auth.
- Falta política formal de backups y retención.

## Hallazgos Corregidos En Esta Revisión

- Se eliminó el bloqueo potencial de formularios por usar `type="url"` con rutas relativas `/uploads/...` en `ImageDropzone`.
- Se quitó configuración hardcodeada de localhost/IP en `next.config.mjs`; ahora se configura por variables de entorno.
- `.env.example` dejó de sugerir localhost como URL pública por defecto y usa placeholders.
- `registerAction` ahora usa fallback seguro para evitar slugs vacíos de tienda.
- `createCategoryAction` ahora usa fallback seguro para evitar slugs vacíos de categoría.
- `DELETE /api/uploads/image` ahora valida el `businessId` de la URL subida contra el dueño autenticado, en vez de asumir la primera tienda del usuario.

## Hallazgos Pendientes Recomendados

- Implementar selector de tienda antes de permitir múltiples negocios por usuario.
- Agregar tests e2e de registro, catálogo, chat, upload, cotización y pedido.
- Migrar a PostgreSQL y storage externo antes de producción.
- Agregar middleware de seguridad HTTP headers.
