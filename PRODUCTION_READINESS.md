# Production Readiness

## 1. Base de datos

Para produccion se recomienda PostgreSQL gestionado.

Opciones:

- Supabase Postgres
- Neon
- Railway Postgres
- Render Postgres
- RDS/Aurora

Requisitos:

- `DATABASE_URL` separado para dev/staging/prod;
- usuario de DB con permisos minimos necesarios;
- backups automaticos;
- restauracion probada;
- migraciones con `npx prisma migrate deploy`;
- no usar SQLite en produccion comercial.

No se implemento Row Level Security porque la arquitectura actual usa Prisma y validacion centralizada en servidor. Si se migra a Supabase con acceso directo desde cliente, evaluar RLS en una fase separada.

## 2. Variables de entorno

Basicas:

```bash
DATABASE_URL=""
NEXT_PUBLIC_APP_URL=""
NEXTAUTH_SECRET=""
AUTH_SECRET=""
ADMIN_BOOTSTRAP_SECRET=""
PLATFORM_OWNER_EMAILS=""
PLATFORM_OWNER_EMAILS_DEV_UNLOCK="false"
NEXT_ALLOWED_DEV_ORIGINS=""
NEXT_SERVER_ACTION_ALLOWED_ORIGINS=""
REQUEST_ALLOWED_ORIGINS=""
CSP_IMG_SRC=""
CSP_CONNECT_SRC=""
```

IA:

```bash
DEEPSEEK_API_KEY=""
DEEPSEEK_BASE_URL="https://api.deepseek.com"
DEEPSEEK_MODEL="deepseek-chat"
```

Rate limit:

```bash
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

Billing:

```bash
BILLING_PROVIDER="disabled"
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
MERCADOPAGO_ACCESS_TOKEN=""
```

## 3. Seguridad web

Implementado:

- cookies `httpOnly`, `sameSite=lax`, `secure` en produccion;
- CSP configurable;
- `X-Content-Type-Options`;
- `X-Frame-Options`;
- `Referrer-Policy`;
- `Permissions-Policy`;
- HSTS en produccion;
- validacion de origen en APIs mutables;
- rate limit basico con backend local o Upstash;
- validacion Zod en actions/APIs clave;
- uploads con mime/ext/magic bytes, tamano maximo y ruta segura;
- auditoria de acciones sensibles.

Checklist:

- No subir `.env`.
- Rotar secretos al pasar a produccion.
- Usar secretos de la plataforma de hosting.
- Configurar `NEXT_PUBLIC_APP_URL`.
- Configurar `REQUEST_ALLOWED_ORIGINS` si existen dominios extra.
- Usar Redis/Upstash para rate limit distribuido.
- Mover uploads a storage externo.

## 4. Despliegue recomendado

Ruta recomendada inicial:

1. Vercel para Next.js.
2. PostgreSQL gestionado.
3. Upstash Redis para rate limit.
4. Storage externo para imagenes.
5. Stripe o Mercado Pago cuando billing pase a real.

Comandos:

```bash
npm install
npx prisma generate
npm run build
npx prisma migrate deploy
npm run start
```

En Vercel:

- build command: `npm run build`
- install command: `npm install`
- post-deploy/manual migration: `npx prisma migrate deploy`

## 5. Admin inicial

Para crear el primer `SUPER_ADMIN`:

1. Configurar `ADMIN_BOOTSTRAP_SECRET` con al menos 32 caracteres.
2. Registrarse usando el secreto de bootstrap.
3. Confirmar que el usuario queda como `SUPER_ADMIN`.
4. Quitar o rotar el secreto si ya no se usara.

El seed demo crea el usuario admin local, pero la contrasena debe salir de `DEMO_SEED_PASSWORD` o de la contrasena temporal impresa en consola:

```text
admin@demo.cl
```

## 6. Checklist final

- `npm run lint` pasa.
- `npm run typecheck` pasa.
- `npm run build` pasa.
- `npx prisma validate` pasa.
- `npx prisma generate` pasa.
- `npm test` pasa.
- `npx prisma migrate deploy` aplicado en produccion.
- Admin inicial creado.
- Variables configuradas.
- Backups activos.
- Storage externo configurado.
- Rate limit distribuido activo.
- Billing provider definido o explicitamente `disabled`.
- `/admin` bloquea usuarios normales.
- Acciones de tienda no aceptan `businessId` ajeno.
- Catalogo publico sigue mostrando solo tienda activa por slug.

## 7. Riesgos pendientes

- Agregar recuperacion de password y verificacion de email.
- Agregar `User.status`/`isActive` para suspender usuarios.
- Agregar paginacion server-side completa en admin.
- Agregar tests e2e multi-tenant con dos usuarios y dos tiendas.
- Reemplazar storage local antes de vender en serio.
- Implementar pagos reales y webhooks completos.
