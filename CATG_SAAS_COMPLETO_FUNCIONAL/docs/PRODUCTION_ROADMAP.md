# Production Roadmap

Roadmap recomendado para llevar el MVP a SaaS productivo sin reescribirlo desde cero.

## Fase 1: Hardening Tecnico

- Migrar SQLite a PostgreSQL/Supabase.
- Convertir strings de estados a enums Prisma nativos al cambiar de base.
- Reemplazar rate limit en memoria por Redis/Upstash.
- Mover uploads a Supabase Storage, S3, Cloudinary o UploadThing.
- Agregar headers de seguridad, CSP y politica de CORS/origins.
- Agregar logs estructurados y monitoreo de errores.

## Fase 2: Calidad Y QA

- Tests unitarios para `tenant-guard`, validaciones y helpers de formato.
- Tests de integracion para server actions criticas.
- E2E con Playwright para registro, productos, catalogo, chat, upload, cotizacion y pedido.
- Seeds de QA separados de seeds comerciales.
- Checklist visual mobile/tablet/desktop por template.

## Fase 3: Auth Y Permisos

- Recuperacion de password.
- Verificacion de email.
- Rotacion y expiracion avanzada de sesiones.
- Selector de tienda para owners con multiples negocios.
- Roles por negocio: owner, admin, vendedor, solo lectura.
- Auditoria de acciones sensibles.

## Fase 4: Comercial SaaS

- Integracion con Stripe o Mercado Pago.
- Webhooks de suscripcion.
- Bloqueos por limite de plan en UI y backend.
- Pantalla de billing.
- Trial, upgrade, downgrade y cancelacion.
- Facturacion local segun mercado objetivo.

## Fase 5: Ventas Y Operacion

- Paginas individuales de producto con SEO propio.
- Analitica historica de visitas, clicks IA, clicks WhatsApp y conversion.
- Bandeja de conversaciones con respuesta humana.
- Integracion WhatsApp Business API.
- Plantillas de mensajes.
- Exportacion CSV de clientes, productos, cotizaciones y pedidos.

## Fase 6: Escalabilidad

- Background jobs para tareas lentas.
- Colas para IA y webhooks.
- Backups automatizados.
- Retencion y borrado de datos.
- Panel de soporte interno.
- Feature flags para activar modulos por tienda.

