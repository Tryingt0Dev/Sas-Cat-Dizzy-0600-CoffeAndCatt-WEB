# Modules

Este documento explica que hace cada modulo relevante del proyecto y como se conecta con el resto del SaaS.

## app/

`app/` contiene rutas App Router, server components, route handlers y server actions.

- `app/page.tsx`: landing publica simple para vender la propuesta.
- `app/login` y `app/register`: pantallas de auth.
- `app/(auth)/actions.ts`: login, registro, logout, rate limit y creacion inicial de tienda.
- `app/dashboard`: panel privado de tienda.
- `app/store/[slug]`: catalogo publico multi-template.
- `app/admin`: panel superadmin protegido por rol.
- `app/api/ai/sales-assistant`: endpoint del vendedor IA.
- `app/api/uploads/image`: upload local seguro de imagenes.
- `app/api/health`: healthcheck.

## components/

Componentes compartidos de UI y comportamiento.

- `Button`, `Card`, `Input`: primitives visuales.
- `DashboardNav`: navegacion privada y logout.
- `PendingSubmitButton`, `ConfirmSubmitButton`: feedback y confirmacion en formularios.
- `ImageDropzone`: drag and drop, preview, validacion y upload de imagenes.
- `StoreChat`: chat IA cliente con localStorage, submit, loading, errores y eventos de producto.
- `CopyButton`, `PrintButton`: utilidades para WhatsApp e impresion.

## components/catalog/

Componentes del catalogo publico.

- `CatalogControls`: busqueda, categoria, orden y limpieza de filtros.
- `ProductCard`: card reusable con badges, precio, imagen, IA y WhatsApp.
- `AskAiButton`: emite el evento `storechat:ask`.
- `WhatsAppProductButton`: arma URL `wa.me` con numero sanitizado y mensaje.
- `SafeImage`: fallback visual si la imagen falta o falla.
- `EmptyCatalogState`: estado vacio profesional.

## templates/

Templates visuales publicos para tiendas.

- `ModernGridCatalog`: ecommerce moderno y limpio.
- `BoutiquePremiumCatalog`: layout premium, espaciado amplio y cards grandes.
- `FastSalesCatalog`: foco en precio, descuento y WhatsApp.
- `TechProCatalog`: foco tecnico, confianza y asesoramiento.

Todos reciben datos tipados desde `lib/catalog.ts` y comparten controles, cards y chat.

## lib/

Servicios base sin dependencia directa de UI.

- `auth.ts`: cookies httpOnly, sesiones, usuario actual, negocio actual y rol admin.
- `db.ts`: singleton Prisma.
- `validation.ts`: schemas Zod para formularios, IA y estados.
- `enums.ts`: constantes tipadas para estados, roles, planes y templates.
- `catalog.ts`: tipos de catalogo y estilos dinamicos.
- `format.ts`: formatos de precio, slugs y fechas.
- `rate-limit.ts`: rate limit en memoria para demo/desarrollo.
- `plans.ts`: helpers para planes SaaS.
- `ai.ts`: cliente IA compatible OpenAI/DeepSeek.

## services/

Servicios de dominio.

- `tenant-guard.ts`: verificaciones reutilizables para no cruzar datos entre negocios.
- `product-search.ts`: seleccion de productos relevantes para el contexto de IA.

## prisma/

Modelo de datos, migraciones y seed.

- `schema.prisma`: modelos principales del SaaS.
- `migrations/`: historial de cambios DB.
- `seed.ts`: datos demo, planes, tiendas, productos y usuarios.

## public/

No hay assets obligatorios versionados. Los uploads locales viven en `public/uploads/{businessId}` y estan ignorados por git. Para produccion se recomienda storage externo.

## Dashboard

El dashboard cubre:

- metricas comerciales
- productos y categorias
- CRM y detalle de cliente
- conversaciones
- cotizaciones y vista imprimible
- pedidos y vista imprimible
- settings de tienda, branding e IA

Todas las mutaciones relevantes usan server actions y deben pasar por `businessId`.

## Catalogo Publico

El catalogo publico es la vitrina de cada tienda. Usa `slug` publico para resolver el negocio activo y luego renderiza productos activos, filtros, destacados, WhatsApp y chat.

## Chat IA

El chat mantiene `conversationId` y `visitorId` en localStorage, guarda historial en Prisma y limita el contexto a productos del negocio actual. Si no hay API key, responde en modo demo sin romper la experiencia.

## Upload Imagenes

El upload solo existe desde dashboard autenticado. Valida tipo, tamano, ownership del negocio y path seguro. Bloquea SVG y archivos peligrosos.

## Planes y Superadmin

Los modelos `Plan` y `Subscription` preparan limites comerciales. El superadmin puede ver tiendas y usuarios, y suspender o reactivar negocios.

