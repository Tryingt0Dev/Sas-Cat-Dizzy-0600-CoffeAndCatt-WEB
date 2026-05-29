# Billing And Plans

## 1. Planes base

Planes soportados:

- `FREE`
- `STARTER`
- `PRO`
- `BUSINESS`
- `ENTERPRISE`

La definicion de limites vive en `lib/plans.ts` y se sincroniza con seed/migraciones mediante Prisma.

## 2. Limites por plan

Campos principales de `Plan`:

- `maxProducts`
- `maxImages`
- `maxCategories`
- `maxAiConversationsMonthly`
- `maxUsers`
- `maxMembers`
- `maxStores`
- `maxTemplates`
- `aiEnabled`
- `advancedBranding`
- `advancedSeoEnabled`
- `analyticsEnabled`
- `pageBuilderEnabled`
- `advancedAttributesEnabled`
- `quotesAndOrders`
- `customDomain`
- `supportLevel`

## 3. Suscripciones

Modelo `Subscription`:

- `businessId`
- `planId`
- `status`
- `currentPeriodStart`
- `currentPeriodEnd`
- `cancelAtPeriodEnd`
- `provider`
- `providerCustomerId`
- `providerSubscriptionId`

Estados sugeridos:

- `TRIALING`
- `ACTIVE`
- `PAST_DUE`
- `CANCELED`
- `INCOMPLETE`

## 4. Helpers de servidor

Archivo principal: `services/plan-guard.ts`.

Helpers:

- `getStorePlan(storeId)`
- `requireFeature(storeId, feature)`
- `assertWithinPlanLimit(storeId, limitType)`
- `canCreateProduct(storeId)`
- `canUploadImage(storeId, currentImageCount)`
- `canUseAI(storeId)`
- `canInviteMember(storeId)`

Regla: los limites se aplican en servidor, no solo en UI.

## 5. Aplicacion actual de limites

Ya se aplica:

- crear producto: bloquea sobre `maxProducts`;
- subir imagen: bloquea sobre `maxImages`;
- usar IA: valida `aiEnabled`;
- crear conversaciones IA nuevas: valida `maxAiConversationsMonthly`;
- agregar miembro a tienda: valida `maxMembers`;
- cotizaciones/pedidos: valida feature `quotesAndOrders`.

## 6. Endpoints preparados

Rutas:

- `POST /api/billing/checkout`
- `POST /api/billing/portal`
- `POST /api/billing/webhook`

Seguridad:

- checkout/portal validan origen, sesion, tienda, rol `manage_settings` y rate limit;
- checkout/portal registran auditoria;
- webhook no requiere sesion, pero exige proveedor configurado y firma Stripe valida;
- webhook registra aceptados/rechazados en auditoria;
- ningun endpoint confia en datos del cliente para activar planes.

## 7. Variables de entorno

```bash
BILLING_PROVIDER="stripe"
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_APP_URL="https://app.example.com"
MERCADOPAGO_ACCESS_TOKEN=""
```

Valores validos para `BILLING_PROVIDER`:

- `disabled`
- `manual`
- `stripe`
- `mercadopago`

## 8. Flujo recomendado Stripe

1. Usuario elige plan desde UI.
2. `POST /api/billing/checkout` valida tienda y permisos.
3. Backend crea checkout session en Stripe.
4. Stripe redirige al usuario.
5. Stripe llama `/api/billing/webhook`.
6. Webhook valida firma.
7. Backend actualiza `Subscription` y `Business.planId/planType`.
8. Se registra `AuditLog`.

## 9. Pendientes de pagos reales

- Crear productos/precios en Stripe o Mercado Pago.
- Mapear `planType` a price IDs mediante variables o `PlatformSetting`.
- Implementar checkout session real.
- Implementar billing portal real.
- Procesar eventos `checkout.session.completed`, `customer.subscription.updated` y `customer.subscription.deleted`.
- Agregar UI de suscripcion en dashboard de tienda.
