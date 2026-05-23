# Feature Map

Estado funcional de las areas principales del producto.

| Area | Estado | Archivos clave | Observaciones |
| --- | --- | --- | --- |
| Registro/Login | Demo estable | `app/(auth)/actions.ts`, `lib/auth.ts` | Email/password, bcrypt y cookie httpOnly. Falta recuperacion de password y verificacion email. |
| Multi-tenant | Demo estable | `services/tenant-guard.ts`, `lib/auth.ts` | Recursos privados filtran por `businessId`. La UI asume una tienda activa por usuario. |
| Catalogo publico | Presentable | `app/store/[slug]/page.tsx`, `templates/*`, `components/catalog/*` | Busqueda, filtros, orden, destacados, badges, IA y WhatsApp. |
| Templates | Presentable | `templates/*.tsx` | Cuatro estilos diferenciados con colores dinamicos. |
| Branding | Presentable | `app/dashboard/settings/*`, `ImageDropzone` | Colores, logo, banner, radio de boton e IA. |
| Productos | Presentable | `app/dashboard/products/*` | CRUD, filtros, duplicado, stock bajo, imagen y validacion Zod. |
| Categorias | MVP estable | `app/dashboard/categories/*` | Crear/borrar y aislamiento por tienda. Falta edicion inline. |
| Chat IA | Demo estable | `components/StoreChat.tsx`, `app/api/ai/sales-assistant/route.ts` | Mantiene conversacion y usa solo productos del tenant. Rate limit en memoria. |
| WhatsApp | Presentable | `components/catalog/WhatsAppProductButton.tsx` | Mensaje por producto y boton deshabilitado si no hay numero. |
| Upload imagenes | Demo estable | `components/ImageDropzone.tsx`, `app/api/uploads/image/route.ts` | Storage local seguro para desarrollo. Migrar a storage externo para produccion. |
| CRM | MVP presentable | `app/dashboard/customers/*` | Filtros, detalle, historial, notas y lead score. |
| Conversaciones | MVP estable | `app/dashboard/conversations/page.tsx` | Historial por tienda. Faltan respuestas manuales desde dashboard. |
| Cotizaciones | MVP presentable | `app/dashboard/quotes/*` | Crea cotizaciones, estados, totales e impresion. |
| Pedidos | MVP presentable | `app/dashboard/orders/*` | Pedido desde cotizacion aceptada y descuento de stock. |
| Dashboard comercial | Presentable | `app/dashboard/page.tsx` | Metricas reales desde Prisma. Falta analitica historica. |
| Planes SaaS | Arquitectura lista | `prisma/schema.prisma`, `lib/plans.ts`, `prisma/seed.ts` | Sin cobro real todavia. |
| Superadmin | MVP estable | `app/admin/*`, `lib/auth.ts` | Protegido por rol y permite suspender/reactivar tiendas. |
| SEO/OG | Basico | `app/store/[slug]/page.tsx` | Metadata por tienda. Puede mejorar con paginas de producto. |
| Seguridad produccion | Pendiente | Varios | Falta Redis rate limit, storage externo, tests, headers y observabilidad. |

## Funciones Listas Para Mostrar

- Catalogo publico por tienda.
- Cuatro templates con branding.
- Productos con imagenes.
- Chat IA con historial.
- WhatsApp por producto.
- CRM basico.
- Cotizaciones y pedidos simples.
- Dashboard y superadmin.

## Funciones Demo/MVP

- IA demo cuando no hay API key.
- Planes sin pago.
- Upload local.
- Rate limit en memoria.
- Una tienda activa por usuario en UI.

## Funciones No Productivas Aun

- Pago real con Stripe/Mercado Pago.
- Multiusuario por tienda.
- Selector de tienda para owners con multiples negocios.
- Tests automatizados.
- Observabilidad, auditoria y backups.

