Resumen
------
Este documento describe la arquitectura y los pasos para habilitar:
- Subdominios automáticos por tienda: `store.myapp.com` o `store.<tenant>.myapp.com`.
- Dominios personalizados por cliente: `mi-tienda.com` apuntando a la tienda del cliente.
- Uso de Cloudflared (Cloudflare Tunnel) para exponer instancias internas de la app y gestionar DNS automáticamente.

Requisitos
---------
- Cuenta Cloudflare con API token (permisos: Zone:DNS edit, Zone:Read, Zone:Tunnels).
- Dominio base (ej. `myapp.com`) con Cloudflare como DNS.
- cloudflared instalado en el servidor (o usar Cloudflare Tunnels on Kubernetes).

Arquitectura propuesta
---------------------
- Cada tenant (tienda) tiene un registro en la DB `Store` con campos: `id`, `publicSlug`, `ownerId`, `customDomain?`, `status`, etc.
- Por defecto se provisiona un subdominio: `<publicSlug>.myapp.com`.
- Si el cliente añade `customDomain`, se verifica la propiedad (DNS TXT o CNAME) y se añade un registro DNS apuntando al túnel.
- Un mapping en la app resuelve la tienda por `Host` header (prioridad: `customDomain` -> `publicSlug` subdomain -> fallback path `/store/[slug]`).
- cloudflared expone la app y gestiona certificados TLS automáticamente via Cloudflare.

Prisma (ejemplo) — cambios en `schema.prisma`
---------------------------------------------
model Store {
  id          String   @id @default(cuid())
  name        String
  publicSlug  String   @unique
  ownerId     String
  customDomain String? @unique
  status      String   @default("ACTIVE")
  // ...otros campos
}

Endpoints y flujos
------------------
1. Creación de cuenta/tienda
   - Al crear cuenta se genera `publicSlug` y tienda en DB.
   - Provisionar subdominio: crear registro DNS `publicSlug.myapp.com -> CNAME -> tunnels.myapp.com` o crear registro A/ALIAS según infra.

2. Añadir dominio personalizado (por cliente)
   - Endpoint `POST /api/stores/:id/domains` recibe `domain`.
   - Genera token de verificación y devuelve instrucciones (ej: crear TXT `_myapp-verify.<domain>` con token).
   - Cliente añade el registro DNS y llama `POST /api/stores/:id/domains/verify`.
   - Backend verifica via DNS lookup. Si OK, crea registro DNS en Cloudflare apuntando al túnel (CNAME o A según configuración).

3. Resolución en la app
   - Middleware Next.js (app/middleware.ts) inspecciona `req.headers.get('host')`.
   - Busca `Store` por `customDomain = host` primero; si no, intenta extraer `slug` del host (`slug.myapp.com`) y busca por `publicSlug`.
   - Adjunta `tenant` en `request` o cookies para downstream handlers.

Ejemplo de middleware (esqueleto)
---------------------------------
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../lib/db';

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  // remover puerto
  const hostname = host.replace(/:\\d+$/, '');

  // 1) buscar por customDomain
  let store = await prisma.store.findUnique({ where: { customDomain: hostname } });

  // 2) si no, parsear subdominio
  if (!store) {
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      const slug = parts[0];
      store = await prisma.store.findUnique({ where: { publicSlug: slug } });
    }
  }

  if (store) {
    // adjuntar header para handlers del app
    const res = NextResponse.next();
    res.headers.set('x-tenant-id', store.id);
    return res;
  }

  return NextResponse.next();
}

Notas de seguridad y RBAC
-------------------------
- Añadir roles: `super-owner` (tu cuenta), `owner` (dueño de la tienda), `admin` (admins autorizados por owner), `viewer` (solo ver catálogo).
- Añadir tabla `UserRole` o `Membership` que asocie `userId`, `storeId`, `role`.
- Middleware que protege rutas de admin/dashboard: solo `owner` o `admin` del store o `super-owner` global.
- Catálogo público: permitir acceso `viewer` o público según la configuración de la tienda.

Cloudflared y DNS
-----------------
- Usar Cloudflare Tunnels para exponer la app con nombre estable `tunnels.myapp.com` o usar túnel por host.
- Configuración mínima `cloudflared`:
  tunnel: <TUNNEL_ID>
  credentials-file: /root/.cloudflared/<TUNNEL_ID>.json
  ingress:
    - hostname: "*.myapp.com"
      service: https://localhost:4000
    - hostname: "myapp.com"
      service: https://localhost:4000
    - service: http_status:404
- Para dominios personalizados: crear CNAME `mi-tienda.com -> <tunnel-target>` o usar Cloudflare SSL for SaaS (recomendado para escala).

Automatización con Cloudflare API
---------------------------------
- Crear records DNS mediante Cloudflare API: `POST zones/:zone_identifier/dns_records`.
- Para dominios que no están en tu cuenta (dominios del cliente), pedir al cliente que apunte un CNAME a `customers.myapp.com` o usar Cloudflare's SSL for SaaS para gestión de certificados y delegación.

Siguiente paso propuesto
-----------------------
- Implemento los cambios mínimos en el código para soportar resolución por `Host` y el campo `customDomain` en Prisma + migración.
- Fabrico el middleware `app/middleware.ts` y un endpoint API para iniciar verificación de dominio.

¿Quieres que implemente ahora los cambios de Prisma, la migración y el middleware inicial para que lo pruebe localmente? No ejecutaré cambios en infra (Cloudflare) sin tus credenciales y aprobación.
