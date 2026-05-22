# CATG OmniVentas SaaS

SaaS multi-tienda para catalogos comerciales con vendedor IA, CRM basico, productos, descuentos, clientes, conversaciones, cotizaciones y pedidos.

## Stack

- Next.js App Router
- TypeScript strict
- Tailwind CSS
- Prisma
- SQLite en desarrollo
- DeepSeek API mediante SDK compatible OpenAI
- Auth simple con email/password y cookie httpOnly

## Seguridad y tenancy

- No se versionan `.env`, `.next`, `node_modules`, `dev.db`, archivos `.db` ni builds locales.
- `.env.example` contiene solo placeholders seguros.
- Las cookies de sesion son `httpOnly`, `sameSite=lax` y `secure` en produccion.
- Las rutas privadas filtran por `businessId`.
- Updates/deletes sensibles validan pertenencia mediante `services/tenant-guard.ts`.
- Login, registro y endpoint IA tienen rate limit basico en memoria.
- La IA recibe solo productos activos del `businessId` actual.
- SQLite no soporta Prisma enums en Prisma 5.22; por eso los estados se guardan como `String` y se validan con constantes TypeScript + Zod en `lib/enums.ts` y `lib/validation.ts`. Al migrar a PostgreSQL/Supabase se pueden convertir a enums Prisma nativos.

## Configuracion local

1. Instalar dependencias si falta `node_modules`:

```bash
npm install
```

2. Crear `.env` desde `.env.example` y completar valores reales localmente.

3. Generar cliente Prisma y aplicar migraciones:

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

## Usuarios demo

- `storelamon@demo.cl` / `Demo1234!`
- `seguridad@demo.cl` / `Demo1234!`
- `admin@demo.cl` / `Demo1234!`

## Rutas principales

- `/dashboard`: metricas comerciales por tienda.
- `/dashboard/products`: CRUD completo de productos, filtros, duplicado y stock bajo.
- `/dashboard/categories`: gestion de categorias.
- `/dashboard/customers`: CRM con filtros y detalle.
- `/dashboard/conversations`: historial de conversaciones.
- `/dashboard/quotes`: cotizaciones y conversion a pedidos.
- `/dashboard/orders`: pedidos y estados.
- `/dashboard/settings`: branding, templates e IA.
- `/store/[slug]`: catalogo publico multi-template.
- `/admin`: superadmin de plataforma.

## Templates de catalogo

- `MODERN_GRID`
- `BOUTIQUE_PREMIUM`
- `FAST_SALES`
- `TECH_PRO`

Cada tienda puede configurar colores, radio de botones, logo, banner y template desde `/dashboard/settings`.

## Preparacion para pagos

El schema incluye `Plan` y `Subscription`, con limites para productos, conversaciones IA mensuales, usuarios, templates, branding avanzado y cotizaciones/pedidos. Los campos `provider`, `providerCustomerId` y `providerSubscriptionId` dejan preparada la integracion futura con Mercado Pago o Stripe.

## Verificacion

Comandos usados:

```bash
npx prisma validate
npx prisma migrate dev --name professional_saas_upgrade
npm run db:seed
npm run lint
npm run build
```

Checklist manual sugerido:

- Registrar un usuario y crear tienda.
- Entrar al dashboard y crear categoria.
- Crear producto con categoria propia.
- Intentar editar producto, duplicarlo y eliminarlo con confirmacion.
- Cambiar template y colores en ajustes.
- Abrir `/store/[slug]` y probar busqueda, filtro, orden, WhatsApp e IA.
- Enviar dos mensajes al chat y confirmar que conserva `conversationId`.
- Revisar `/dashboard/conversations` y `/dashboard/customers`.
- Crear cotizacion con productos.
- Cambiar cotizacion a `ACCEPTED` y crear pedido.
- Confirmar que el stock se descuenta y no queda negativo.
- Entrar con usuario admin y suspender/reactivar una tienda.
