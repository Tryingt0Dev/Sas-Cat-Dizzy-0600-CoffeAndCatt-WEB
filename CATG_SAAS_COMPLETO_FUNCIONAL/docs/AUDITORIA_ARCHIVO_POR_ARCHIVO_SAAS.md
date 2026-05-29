# AUDITORÍA ARCHIVO POR ARCHIVO - CATG OMNIVENTAS SAAS

## 1. Resumen ejecutivo
Se revisaron 282 archivos relevantes de texto, código, configuración, Prisma, scripts y documentación. El SaaS está maduro como prototipo avanzado: npx prisma validate, npx prisma generate, npx prisma migrate status, npm run lint, npm test y npm run build pasan. No está listo para producción comercial porque hay APIs admin sin autorización, flujo de dominios custom inseguro, billing incompleto, Turnstile/CSP parcial y schemas backup stale.
Hallazgos críticos: 4. Hallazgos altos: 16. Lo primero a corregir es seguridad de API admin y dominios custom.

## 2. Stack tecnológico detectado
| Tecnología | Uso en el proyecto | Archivos relacionados | Observaciones |
| --- | --- | --- | --- |
| Next.js 16 App Router | Rutas app, API routes y proxy | app/**, proxy.ts, next.config.mjs | Build correcto; app/middleware.ts parece no activo |
| React 18 | Componentes UI server/client | components/**, templates/** | UI amplia; algunos any |
| TypeScript strict | Tipado | tsconfig.json, *.ts, *.tsx | Build pasa |
| Prisma 5 | ORM y migraciones | prisma/**, lib/db.ts | Schema válido; backups stale |
| PostgreSQL | Base activa | prisma/schema.prisma | .env.example contradice con SQLite |
| Tailwind | UI y tokens | tailwind.config.ts, app/globals.css | Diseño consistente |
| Auth propia | Sesiones, roles y cookies | lib/auth.ts, services/authorization.ts | Funcional pero parcial |
| Email/Resend | Verificación correo | lib/email*.ts, app/verify-email/** | Tokens hash; proveedor parcial |
| Turnstile | Antibot registro | components/TurnstileWidget.tsx, lib/turnstile.ts | CSP/config pendiente |
| IA DeepSeek/OpenAI-compatible | Asistente ventas | app/api/ai/sales-assistant/route.ts, lib/ai.ts | Multi-tenant con rate limit |
| Testing smoke | Pruebas con tsx | scripts/*smoke.ts | Pasaron; falta unit/e2e |
| Billing | Planes y stubs pago | app/api/billing/**, lib/billing.ts | Integración real incompleta |

## 3. Qué hace el SaaS en general
CATG Omniventas SaaS permite crear tiendas multi-tenant con catálogo público, dashboard privado, productos, categorías, clientes, conversaciones, cotizaciones, pedidos, configuración visual, planes, uploads e IA de ventas. El dueño de plataforma administra tiendas, usuarios, planes, suscripciones, auditoría y accesos globales. Cada tienda se separa por `businessId`, `publicSlug`, membresías y roles. El catálogo público funciona por slug y dominio personalizado, aunque este último necesita exigir verificación.

## 4. Arquitectura general
La arquitectura usa App Router, Server Components, Client Components, Server Actions, API Routes, Prisma/PostgreSQL, Zod, middleware/proxy, RBAC de tienda, platform-admin, plan guards, auditoría, email verification, Turnstile, uploads locales e IA. El patrón privado correcto es `requireStoreAccess`; los bordes débiles están en APIs admin legacy y dominios custom.

## 5. Inventario completo de archivos revisados
Se ignoraron `node_modules`, `.next`, `dist`, `build`, `coverage`, `.git`, `.turbo`, logs, bases locales, binarios, JPG/PNG y `.env`/`.env.local` por secretos. Se revisaron SVG/MMD por ser documentación textual.
| # | Archivo | Tipo | Área | Estado | Prioridad |
| --- | --- | --- | --- | --- | --- |
| 1 | .env.example | Entorno ejemplo | Configuracion/proyecto | Parcial | Alta |
| 2 | .gitattributes | .gitattributes | Configuracion/proyecto | Correcto | Informativa |
| 3 | .gitignore | .gitignore | Configuracion/proyecto | Correcto | Informativa |
| 4 | .vscode/settings.json | JSON | Configuracion/proyecto | Correcto | Informativa |
| 5 | ADMIN_PANEL_AND_CODE_OPTIMIZATION.md | Markdown | Configuracion/proyecto | Correcto | Informativa |
| 6 | ADMIN_PANEL.md | Markdown | Configuracion/proyecto | Correcto | Informativa |
| 7 | app/(auth)/actions.ts | Server Actions TS | Auth | Parcial | Alta |
| 8 | app/admin/actions.ts | Server Actions TS | Admin legado | Parcial | Alta |
| 9 | app/admin/layout.tsx | Next.js UI TSX | Admin legado | Correcto | Informativa |
| 10 | app/admin/owner/page.tsx | Next.js UI TSX | Admin legado | Correcto | Informativa |
| 11 | app/admin/page.tsx | Next.js UI TSX | Admin legado | Parcial | Media |
| 12 | app/admin/stores/[id]/page.tsx | Next.js UI TSX | Admin legado | Correcto | Informativa |
| 13 | app/api/admin/businesses/route.ts | API Route TS | API admin/owner | Correcto | Informativa |
| 14 | app/api/admin/export-owner-csv/route.ts | API Route TS | API admin/owner | Riesgoso | Crítica |
| 15 | app/api/admin/metrics-history/route.ts | API Route TS | API admin/owner | Riesgoso | Crítica |
| 16 | app/api/admin/sync-metrics/route.ts | API Route TS | API admin/owner | Riesgoso | Crítica |
| 17 | app/api/ai/sales-assistant/route.ts | API Route TS | IA | Parcial | Media |
| 18 | app/api/auth/resend-verification/route.ts | API Route TS | Auth/email | Correcto | Informativa |
| 19 | app/api/billing/checkout/route.ts | API Route TS | Billing | Incompleto | Alta |
| 20 | app/api/billing/portal/route.ts | API Route TS | Billing | Correcto | Informativa |
| 21 | app/api/billing/webhook/route.ts | API Route TS | Billing | Incompleto | Alta |
| 22 | app/api/catalog/track/route.ts | API Route TS | Catalogo publico | Correcto | Informativa |
| 23 | app/api/health/route.ts | API Route TS | Configuracion/proyecto | Correcto | Informativa |
| 24 | app/api/platform-admin/summary/route.ts | API Route TS | Platform admin API | Correcto | Informativa |
| 25 | app/api/store-slug-redirect/route.ts | API Route TS | Catalogo publico | Dudoso | Media |
| 26 | app/api/stores/[id]/domains/route.ts | API Route TS | Dominios/tiendas | Riesgoso | Crítica |
| 27 | app/api/uploads/image/route.ts | API Route TS | Uploads | Parcial | Media |
| 28 | app/dashboard/categories/actions.ts | Server Actions TS | Dashboard categorias | Correcto | Informativa |
| 29 | app/dashboard/categories/page.tsx | Next.js UI TSX | Dashboard categorias | Correcto | Informativa |
| 30 | app/dashboard/conversations/page.tsx | Next.js UI TSX | Dashboard | Correcto | Informativa |
| 31 | app/dashboard/customers/[id]/page.tsx | Next.js UI TSX | Dashboard clientes | Correcto | Informativa |
| 32 | app/dashboard/customers/actions.ts | Server Actions TS | Dashboard clientes | Correcto | Informativa |
| 33 | app/dashboard/customers/page.tsx | Next.js UI TSX | Dashboard clientes | Parcial | Media |
| 34 | app/dashboard/design/page.tsx | Next.js UI TSX | Dashboard | Correcto | Informativa |
| 35 | app/dashboard/layout.tsx | Next.js UI TSX | Dashboard | Correcto | Informativa |
| 36 | app/dashboard/learning/page.tsx | Next.js UI TSX | Dashboard | Parcial | Media |
| 37 | app/dashboard/orders/[id]/page.tsx | Next.js UI TSX | Dashboard pedidos | Correcto | Informativa |
| 38 | app/dashboard/orders/actions.ts | Server Actions TS | Dashboard pedidos | Correcto | Informativa |
| 39 | app/dashboard/orders/page.tsx | Next.js UI TSX | Dashboard pedidos | Correcto | Informativa |
| 40 | app/dashboard/page.tsx | Next.js UI TSX | Dashboard | Correcto | Informativa |
| 41 | app/dashboard/products/actions.ts | Server Actions TS | Dashboard productos | Correcto | Informativa |
| 42 | app/dashboard/products/page.tsx | Next.js UI TSX | Dashboard productos | Correcto | Informativa |
| 43 | app/dashboard/products/ProductCreateDrawer.tsx | Componente TSX | Dashboard productos | Correcto | Informativa |
| 44 | app/dashboard/products/ProductTableActions.tsx | Componente TSX | Dashboard productos | Parcial | Media |
| 45 | app/dashboard/quotes/[id]/page.tsx | Next.js UI TSX | Dashboard cotizaciones | Correcto | Informativa |
| 46 | app/dashboard/quotes/actions.ts | Server Actions TS | Dashboard cotizaciones | Correcto | Informativa |
| 47 | app/dashboard/quotes/page.tsx | Next.js UI TSX | Dashboard cotizaciones | Correcto | Informativa |
| 48 | app/dashboard/settings/actions.ts | Server Actions TS | Dashboard configuracion | Correcto | Informativa |
| 49 | app/dashboard/settings/page.tsx | Next.js UI TSX | Dashboard configuracion | Parcial | Media |
| 50 | app/dashboard/settings/SettingsUnsavedGuard.tsx | Componente TSX | Dashboard configuracion | Correcto | Informativa |
| 51 | app/globals.css | CSS global | Configuracion/proyecto | Correcto | Informativa |
| 52 | app/layout.tsx | Next.js UI TSX | Configuracion/proyecto | Correcto | Informativa |
| 53 | app/login/page.tsx | Next.js UI TSX | Auth | Correcto | Informativa |
| 54 | app/middleware.ts | TypeScript | Configuracion/proyecto | Parcial | Alta |
| 55 | app/onboarding/theme/actions.ts | Server Actions TS | Configuracion/proyecto | Correcto | Informativa |
| 56 | app/onboarding/theme/page.tsx | Next.js UI TSX | Configuracion/proyecto | Correcto | Informativa |
| 57 | app/page.tsx | Next.js UI TSX | Configuracion/proyecto | Correcto | Informativa |
| 58 | app/platform-admin/actions.ts | Server Actions TS | Platform admin | Correcto | Informativa |
| 59 | app/platform-admin/layout.tsx | Next.js UI TSX | Platform admin | Correcto | Informativa |
| 60 | app/platform-admin/page.tsx | Next.js UI TSX | Platform admin | Correcto | Informativa |
| 61 | app/platform-admin/PlatformAccessUserPicker.tsx | Componente TSX | Platform admin | Correcto | Informativa |
| 62 | app/register/page.tsx | Next.js UI TSX | Auth | Correcto | Informativa |
| 63 | app/select-store/actions.ts | Server Actions TS | Configuracion/proyecto | Correcto | Informativa |
| 64 | app/select-store/page.tsx | Next.js UI TSX | Configuracion/proyecto | Correcto | Informativa |
| 65 | app/settings/appearance/actions.ts | Server Actions TS | Configuracion/proyecto | Correcto | Informativa |
| 66 | app/settings/appearance/page.tsx | Next.js UI TSX | Configuracion/proyecto | Correcto | Informativa |
| 67 | app/settings/billing/actions.ts | Server Actions TS | Configuracion/proyecto | Correcto | Informativa |
| 68 | app/settings/billing/page.tsx | Next.js UI TSX | Configuracion/proyecto | Correcto | Informativa |
| 69 | app/store/[slug]/layout.tsx | Next.js UI TSX | Catalogo publico | Correcto | Informativa |
| 70 | app/store/[slug]/page.tsx | Next.js UI TSX | Catalogo publico | Parcial | Alta |
| 71 | app/store/[slug]/product/[productSlug]/page.tsx | Next.js UI TSX | Catalogo publico | Correcto | Informativa |
| 72 | app/verify-email-prompt/page.tsx | Next.js UI TSX | Auth | Correcto | Informativa |
| 73 | app/verify-email/page.tsx | Next.js UI TSX | Auth | Correcto | Informativa |
| 74 | AUTH_SECURITY_AND_ADMIN_SEED.md | Markdown | Configuracion/proyecto | Correcto | Informativa |
| 75 | BILLING_AND_PLANS.md | Markdown | Configuracion/proyecto | Correcto | Informativa |
| 76 | components/ActionMenu.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 77 | components/AiSourceBadge.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 78 | components/Button.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 79 | components/Card.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 80 | components/catalog/AskAiButton.tsx | Componente TSX | Catalogo UI | Correcto | Informativa |
| 81 | components/catalog/CatalogControls.tsx | Componente TSX | Catalogo UI | Correcto | Informativa |
| 82 | components/catalog/CatalogHeader.tsx | Componente TSX | Catalogo UI | Correcto | Informativa |
| 83 | components/catalog/CatalogProductTracker.tsx | Componente TSX | Catalogo UI | Correcto | Informativa |
| 84 | components/catalog/EmptyCatalogState.tsx | Componente TSX | Catalogo UI | Correcto | Informativa |
| 85 | components/catalog/ProductAttributeDisplay.tsx | Componente TSX | Catalogo UI | Correcto | Informativa |
| 86 | components/catalog/ProductCard.tsx | Componente TSX | Catalogo UI | Correcto | Informativa |
| 87 | components/catalog/SafeImage.tsx | Componente TSX | Catalogo UI | Correcto | Informativa |
| 88 | components/catalog/WhatsAppProductButton.tsx | Componente TSX | Catalogo UI | Correcto | Informativa |
| 89 | components/CompactCard.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 90 | components/ConfirmSubmitButton.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 91 | components/CopyButton.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 92 | components/DashboardNav.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 93 | components/DashboardNavClient.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 94 | components/DrawerForm.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 95 | components/EmptyState.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 96 | components/FloatingPlatformAdminButton.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 97 | components/FloatingPlatformAdminGate.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 98 | components/FormField.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 99 | components/FormSection.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 100 | components/HelpTooltip.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 101 | components/ImageDropzone.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 102 | components/InfoBox.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 103 | components/InfoCard.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 104 | components/Input.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 105 | components/LearningLink.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 106 | components/OnboardingChecklist.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 107 | components/OwnerMetricsChart.tsx | Componente TSX | Componentes UI | Parcial | Media |
| 108 | components/OwnerMetricsSync.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 109 | components/PageHeader.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 110 | components/PendingSubmitButton.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 111 | components/PrintButton.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 112 | components/ProductAttributesFields.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 113 | components/QuickActions.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 114 | components/RegisterCredentialsFields.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 115 | components/SectionCard.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 116 | components/SectionGuide.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 117 | components/StatusAlert.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 118 | components/StatusBadge.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 119 | components/StepGuide.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 120 | components/StoreChat.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 121 | components/StoreShareCard.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 122 | components/theme/CatalogPaletteBar.tsx | Componente TSX | Temas/UI | Correcto | Informativa |
| 123 | components/theme/CatalogPaletteCard.tsx | Componente TSX | Temas/UI | Correcto | Informativa |
| 124 | components/theme/CatalogPaletteSelector.tsx | Componente TSX | Temas/UI | Correcto | Informativa |
| 125 | components/theme/CatalogPreview.tsx | Componente TSX | Temas/UI | Correcto | Informativa |
| 126 | components/theme/ColorSwatches.tsx | Componente TSX | Temas/UI | Correcto | Informativa |
| 127 | components/theme/LiveThemeColorControls.tsx | Componente TSX | Temas/UI | Correcto | Informativa |
| 128 | components/theme/SaaSThemeCard.tsx | Componente TSX | Temas/UI | Correcto | Informativa |
| 129 | components/theme/SaaSThemeProvider.tsx | Componente TSX | Temas/UI | Correcto | Informativa |
| 130 | components/theme/SaaSThemeSelector.tsx | Componente TSX | Temas/UI | Correcto | Informativa |
| 131 | components/TurnstileWidget.tsx | Componente TSX | Componentes UI | Correcto | Informativa |
| 132 | docs/ARCHITECTURE.md | Markdown | Documentacion | Correcto | Informativa |
| 133 | docs/AUDIT_FINAL.md | Markdown | Documentacion | Correcto | Informativa |
| 134 | docs/AUDIT.md | Markdown | Documentacion | Correcto | Informativa |
| 135 | docs/AUDITORIA_SEGUNDA_FASE.md | Markdown | Documentacion | Correcto | Informativa |
| 136 | docs/AUDITORIA_SEGURIDAD.md | Markdown | Documentacion | Correcto | Informativa |
| 137 | docs/AUDITORIA_UI_UX.md | Markdown | Documentacion | Correcto | Informativa |
| 138 | docs/CAMBIOS_IMPLEMENTADOS.md | Markdown | Documentacion | Correcto | Informativa |
| 139 | docs/CLEANUP_REPORT.md | Markdown | Documentacion | Correcto | Informativa |
| 140 | docs/CLOUDFLARED_AND_DOMAINS.md | Markdown | Documentacion | Correcto | Informativa |
| 141 | docs/diagrams/flujo-catalogo-publico.mmd | Mermaid | Documentacion diagramas | Correcto | Informativa |
| 142 | docs/diagrams/flujo-catalogo-publico.svg | SVG documental | Documentacion diagramas | Correcto | Informativa |
| 143 | docs/diagrams/flujo-chat-ia.mmd | Mermaid | Documentacion diagramas | Correcto | Informativa |
| 144 | docs/diagrams/flujo-chat-ia.svg | SVG documental | Documentacion diagramas | Correcto | Informativa |
| 145 | docs/diagrams/flujo-consultar-ia.mmd | Mermaid | Documentacion diagramas | Correcto | Informativa |
| 146 | docs/diagrams/flujo-consultar-ia.svg | SVG documental | Documentacion diagramas | Correcto | Informativa |
| 147 | docs/diagrams/flujo-cotizacion-pedido.mmd | Mermaid | Documentacion diagramas | Correcto | Informativa |
| 148 | docs/diagrams/flujo-cotizacion-pedido.svg | SVG documental | Documentacion diagramas | Correcto | Informativa |
| 149 | docs/diagrams/flujo-general.mmd | Mermaid | Documentacion diagramas | Correcto | Informativa |
| 150 | docs/diagrams/flujo-general.svg | SVG documental | Documentacion diagramas | Correcto | Informativa |
| 151 | docs/diagrams/flujo-multitenant.mmd | Mermaid | Documentacion diagramas | Correcto | Informativa |
| 152 | docs/diagrams/flujo-multitenant.svg | SVG documental | Documentacion diagramas | Correcto | Informativa |
| 153 | docs/diagrams/flujo-productos.mmd | Mermaid | Documentacion diagramas | Correcto | Informativa |
| 154 | docs/diagrams/flujo-productos.svg | SVG documental | Documentacion diagramas | Correcto | Informativa |
| 155 | docs/diagrams/flujo-superadmin.mmd | Mermaid | Documentacion diagramas | Correcto | Informativa |
| 156 | docs/diagrams/flujo-superadmin.svg | SVG documental | Documentacion diagramas | Correcto | Informativa |
| 157 | docs/diagrams/flujo-upload-imagenes.mmd | Mermaid | Documentacion diagramas | Correcto | Informativa |
| 158 | docs/diagrams/flujo-upload-imagenes.svg | SVG documental | Documentacion diagramas | Correcto | Informativa |
| 159 | docs/diagrams/flujo-whatsapp.mmd | Mermaid | Documentacion diagramas | Correcto | Informativa |
| 160 | docs/diagrams/flujo-whatsapp.svg | SVG documental | Documentacion diagramas | Correcto | Informativa |
| 161 | docs/diagrams/proyecto-completo-viewer.html | HTML documental | Documentacion diagramas | Correcto | Informativa |
| 162 | docs/diagrams/proyecto-completo.mmd | Mermaid | Documentacion diagramas | Correcto | Informativa |
| 163 | docs/diagrams/proyecto-completo.svg | SVG documental | Documentacion diagramas | Correcto | Informativa |
| 164 | docs/FEATURE_MAP.md | Markdown | Documentacion | Correcto | Informativa |
| 165 | docs/FLOWS.md | Markdown | Documentacion | Correcto | Informativa |
| 166 | docs/MAPA_PROYECTO.md | Markdown | Documentacion | Correcto | Informativa |
| 167 | docs/MODULES.md | Markdown | Documentacion | Correcto | Informativa |
| 168 | docs/OVERVIEW.md | Markdown | Documentacion | Correcto | Informativa |
| 169 | docs/PLAN_ACCION_POR_ARCHIVO.md | Markdown | Documentacion | Correcto | Informativa |
| 170 | docs/POSTGRES_MIGRATION.md | Markdown | Documentacion | Correcto | Informativa |
| 171 | docs/PR02_TESTING_PLAN.md | Markdown | Documentacion | Correcto | Informativa |
| 172 | docs/PRODUCTION_ROADMAP.md | Markdown | Documentacion | Correcto | Informativa |
| 173 | docs/PROJECT_AUDIT.md | Markdown | Documentacion | Correcto | Informativa |
| 174 | docs/QA_REPORT.md | Markdown | Documentacion | Correcto | Informativa |
| 175 | docs/SECURITY_AUDIT.md | Markdown | Documentacion | Correcto | Informativa |
| 176 | docs/SECURITY_SUMMARY.md | Markdown | Documentacion | Correcto | Informativa |
| 177 | docs/TICKETS_IMPLEMENTACION_SAAS.md | Markdown | Documentacion | Correcto | Informativa |
| 178 | DOCUMENTACION_COMPLETA_SAAS.md | Markdown | Configuracion/proyecto | Correcto | Informativa |
| 179 | eslint.config.cjs | Modulo CJS | Configuracion/proyecto | Correcto | Informativa |
| 180 | lib/ai-sources.ts | TypeScript | Libreria backend | Correcto | Informativa |
| 181 | lib/ai.ts | TypeScript | Libreria backend | Correcto | Informativa |
| 182 | lib/audit-log.ts | TypeScript | Libreria backend | Correcto | Informativa |
| 183 | lib/auth.ts | TypeScript | Auth/RBAC | Correcto | Informativa |
| 184 | lib/auth/email-verification.ts | TypeScript | Auth/RBAC | Correcto | Informativa |
| 185 | lib/auth/guards.ts | TypeScript | Auth/RBAC | Correcto | Informativa |
| 186 | lib/auth/permissions.ts | TypeScript | Auth/RBAC | Correcto | Informativa |
| 187 | lib/billing.ts | TypeScript | Libreria backend | Correcto | Informativa |
| 188 | lib/catalog.ts | TypeScript | Libreria backend | Correcto | Informativa |
| 189 | lib/db.ts | TypeScript | Libreria backend | Correcto | Informativa |
| 190 | lib/email.ts | TypeScript | Libreria backend | Parcial | Alta |
| 191 | lib/emailVerification.ts | TypeScript | Libreria backend | Correcto | Informativa |
| 192 | lib/enums.ts | TypeScript | Libreria backend | Correcto | Informativa |
| 193 | lib/format.ts | TypeScript | Libreria backend | Correcto | Informativa |
| 194 | lib/password-policy.ts | TypeScript | Libreria backend | Correcto | Informativa |
| 195 | lib/plans/assert-feature-access.ts | TypeScript | Planes/entitlements | Correcto | Informativa |
| 196 | lib/plans/can-use-feature.ts | TypeScript | Planes/entitlements | Correcto | Informativa |
| 197 | lib/plans/entitlements.ts | TypeScript | Planes/entitlements | Correcto | Informativa |
| 198 | lib/plans/feature-keys.ts | TypeScript | Planes/entitlements | Correcto | Informativa |
| 199 | lib/plans/get-plan-entitlements.ts | TypeScript | Planes/entitlements | Correcto | Informativa |
| 200 | lib/plans/index.ts | TypeScript | Planes/entitlements | Correcto | Informativa |
| 201 | lib/plans/plan-types.ts | TypeScript | Planes/entitlements | Correcto | Informativa |
| 202 | lib/plans/plans.ts | TypeScript | Planes/entitlements | Correcto | Informativa |
| 203 | lib/platform-admin.ts | TypeScript | Libreria backend | Parcial | Alta |
| 204 | lib/rate-limit.ts | TypeScript | Libreria backend | Parcial | Alta |
| 205 | lib/request-security.ts | TypeScript | Libreria backend | Correcto | Informativa |
| 206 | lib/safe-json.ts | TypeScript | Libreria backend | Correcto | Informativa |
| 207 | lib/security/audit-log.ts | TypeScript | Compat seguridad | Correcto | Informativa |
| 208 | lib/security/rate-limit.ts | TypeScript | Compat seguridad | Correcto | Informativa |
| 209 | lib/security/safe-json.ts | TypeScript | Compat seguridad | Correcto | Informativa |
| 210 | lib/security/tenant.ts | TypeScript | Compat seguridad | Parcial | Alta |
| 211 | lib/store-types.ts | TypeScript | Libreria backend | Correcto | Informativa |
| 212 | lib/themes/catalog-palettes.ts | TypeScript | Temas | Correcto | Informativa |
| 213 | lib/themes/saas-themes.ts | TypeScript | Temas | Correcto | Informativa |
| 214 | lib/themes/theme-utils.ts | TypeScript | Temas | Correcto | Informativa |
| 215 | lib/turnstile.ts | TypeScript | Libreria backend | Parcial | Alta |
| 216 | lib/validation.ts | TypeScript | Libreria backend | Correcto | Informativa |
| 217 | LICENSE |  | Configuracion/proyecto | Parcial | Media |
| 218 | next-env.d.ts | TypeScript | Configuracion/proyecto | Correcto | Informativa |
| 219 | next.config.mjs | Modulo ESM | Configuracion/proyecto | Parcial | Alta |
| 220 | package-lock.json | JSON | Configuracion/proyecto | Parcial | Media |
| 221 | package.json | JSON | Configuracion/proyecto | Correcto | Informativa |
| 222 | postcss.config.js | JavaScript/config | Configuracion/proyecto | Correcto | Informativa |
| 223 | prisma/migrations.sqlite.backup/20260522052436_init/migration.sql | SQL/Prisma migration | Prisma backup SQLite | Temporal | Media |
| 224 | prisma/migrations.sqlite.backup/20260522063931_professional_saas_upgrade/migration.sql | SQL/Prisma migration | Prisma backup SQLite | Temporal | Media |
| 225 | prisma/migrations.sqlite.backup/20260523032848_add_product_engagement_metrics/migration.sql | SQL/Prisma migration | Prisma backup SQLite | Temporal | Media |
| 226 | prisma/migrations.sqlite.backup/20260523053607_add_dashboard_customization/migration.sql | SQL/Prisma migration | Prisma backup SQLite | Temporal | Media |
| 227 | prisma/migrations.sqlite.backup/20260523090000_security_public_slug_audit/migration.sql | SQL/Prisma migration | Prisma backup SQLite | Temporal | Media |
| 228 | prisma/migrations.sqlite.backup/20260525010314_add_store_types_dynamic_attributes_page_settings/migration.sql | SQL/Prisma migration | Prisma backup SQLite | Temporal | Media |
| 229 | prisma/migrations.sqlite.backup/20260525020958_security_rbac_subscriptions_platform_admin/migration.sql | SQL/Prisma migration | Prisma backup SQLite | Temporal | Media |
| 230 | prisma/migrations.sqlite.backup/20260525025701_ui_auth_admin_seed_hardening/migration.sql | SQL/Prisma migration | Prisma backup SQLite | Temporal | Media |
| 231 | prisma/migrations.sqlite.backup/20260525063138_add_theme_fields/migration.sql | SQL/Prisma migration | Prisma backup SQLite | Temporal | Media |
| 232 | prisma/migrations.sqlite.backup/20260525102000_commercial_plans_entitlements/migration.sql | SQL/Prisma migration | Prisma backup SQLite | Temporal | Media |
| 233 | prisma/migrations.sqlite.backup/20260525104500_normalize_manual_subscription_status/migration.sql | SQL/Prisma migration | Prisma backup SQLite | Temporal | Media |
| 234 | prisma/migrations.sqlite.backup/20260527064051_add_custom_domain_fields/migration.sql | SQL/Prisma migration | Prisma backup SQLite | Temporal | Media |
| 235 | prisma/migrations.sqlite.backup/migration_lock.toml | TOML | Prisma backup SQLite | Temporal | Media |
| 236 | prisma/migrations/20260527074044_init_postgres/migration.sql | SQL/Prisma migration | Prisma migraciones | Correcto | Informativa |
| 237 | prisma/migrations/20260528031849_npx_prisma_validatenpx_prisma_migrate_status/migration.sql | SQL/Prisma migration | Prisma migraciones | Parcial | Alta |
| 238 | prisma/migrations/20260528090000_add_platform_admin_access/migration.sql | SQL/Prisma migration | Prisma migraciones | Correcto | Informativa |
| 239 | prisma/migrations/20260528100000_add_email_verification_and_signup_hardening/migration.sql | SQL/Prisma migration | Prisma migraciones | Correcto | Informativa |
| 240 | prisma/migrations/migration_lock.toml | TOML | Prisma migraciones | Correcto | Informativa |
| 241 | prisma/schema_postgres.prisma | Prisma schema | Prisma/base de datos | Temporal | Alta |
| 242 | prisma/schema.prisma | Prisma schema | Prisma/base de datos | Correcto | Informativa |
| 243 | prisma/schema.sqlite.backup.prisma | Prisma schema | Prisma/base de datos | Temporal | Alta |
| 244 | prisma/seed.ts | TypeScript | Prisma/base de datos | Correcto | Informativa |
| 245 | PRODUCTION_READINESS.md | Markdown | Configuracion/proyecto | Correcto | Informativa |
| 246 | proxy.ts | TypeScript | Configuracion/proyecto | Correcto | Informativa |
| 247 | QUICK_START_SEED.md | Markdown | Configuracion/proyecto | Correcto | Informativa |
| 248 | README.md | Markdown | Configuracion/proyecto | Correcto | Informativa |
| 249 | ROADMAP_NEXT_STEPS.md | Markdown | Configuracion/proyecto | Correcto | Informativa |
| 250 | scripts/ai-origin-smoke.ts | TypeScript | Scripts/tests smoke | Temporal | Media |
| 251 | scripts/cleanup-unverified-users.ts | TypeScript | Scripts/tests smoke | Temporal | Media |
| 252 | scripts/cleanup.js | JavaScript/config | Scripts/tests smoke | Temporal | Media |
| 253 | scripts/generate-diagrams.mjs | Modulo ESM | Scripts/tests smoke | Temporal | Media |
| 254 | scripts/manual-email-verification-test.ts | TypeScript | Scripts/tests smoke | Temporal | Media |
| 255 | scripts/multitenant-audit.ts | TypeScript | Scripts/tests smoke | Temporal | Media |
| 256 | scripts/plan-smoke.ts | TypeScript | Scripts/tests smoke | Temporal | Media |
| 257 | scripts/platform-admin-access-smoke.ts | TypeScript | Scripts/tests smoke | Temporal | Media |
| 258 | scripts/pr02-smoke.ts | TypeScript | Scripts/tests smoke | Temporal | Media |
| 259 | scripts/pr03-smoke.ts | TypeScript | Scripts/tests smoke | Temporal | Media |
| 260 | scripts/pr04-smoke.ts | TypeScript | Scripts/tests smoke | Temporal | Media |
| 261 | scripts/pr05-smoke.ts | TypeScript | Scripts/tests smoke | Temporal | Media |
| 262 | scripts/pr06-smoke.ts | TypeScript | Scripts/tests smoke | Temporal | Media |
| 263 | scripts/pr07-smoke.ts | TypeScript | Scripts/tests smoke | Temporal | Media |
| 264 | scripts/pr071-smoke.ts | TypeScript | Scripts/tests smoke | Temporal | Media |
| 265 | scripts/reset-admin-users.ts | TypeScript | Scripts/tests smoke | Temporal | Media |
| 266 | scripts/security-smoke.ts | TypeScript | Scripts/tests smoke | Temporal | Media |
| 267 | scripts/test-request-origins.ts | TypeScript | Scripts/tests smoke | Temporal | Media |
| 268 | SECURITY_AND_RBAC.md | Markdown | Configuracion/proyecto | Correcto | Informativa |
| 269 | SEED_SETUP_GUIDE.md | Markdown | Configuracion/proyecto | Correcto | Informativa |
| 270 | services/audit-log.ts | TypeScript | Servicios dominio | Correcto | Informativa |
| 271 | services/authorization.ts | TypeScript | Servicios dominio | Correcto | Informativa |
| 272 | services/plan-guard.ts | TypeScript | Servicios dominio | Correcto | Informativa |
| 273 | services/product-search.ts | TypeScript | Servicios dominio | Correcto | Informativa |
| 274 | services/tenant-guard.ts | TypeScript | Servicios dominio | Correcto | Informativa |
| 275 | tailwind.config.ts | TypeScript | Configuracion/proyecto | Correcto | Informativa |
| 276 | templates/BoutiquePremiumCatalog.tsx | Componente TSX | Templates catalogo | Correcto | Informativa |
| 277 | templates/FastSalesCatalog.tsx | Componente TSX | Templates catalogo | Correcto | Informativa |
| 278 | templates/ModernGridCatalog.tsx | Componente TSX | Templates catalogo | Parcial | Media |
| 279 | templates/TechProCatalog.tsx | Componente TSX | Templates catalogo | Correcto | Informativa |
| 280 | tsconfig.json | JSON | Configuracion/proyecto | Correcto | Informativa |
| 281 | UI_POLISH_AND_CLIENT_EXPERIENCE.md | Markdown | Configuracion/proyecto | Correcto | Informativa |
| 282 | UX_IMPROVEMENTS.md | Markdown | Configuracion/proyecto | Correcto | Informativa |

## 6. Análisis archivo por archivo
### 6.1 `.env.example`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 49 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: IA, Turnstile, email-verification.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Parcial

#### Problemas encontrados
- DATABASE_URL de ejemplo usa SQLite aunque schema.prisma activo usa PostgreSQL.

#### Mejoras recomendadas
- Corregir antes de producción y cubrir con prueba negativa/positiva.

#### Prioridad
Alta

### 6.2 `.gitattributes`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 3 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.3 `.gitignore`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 40 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.4 `.vscode/settings.json`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 5 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.5 `ADMIN_PANEL_AND_CODE_OPTIMIZATION.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 178 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: platform-admin, TODO.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Contiene TODO/FIXME pendiente.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.6 `ADMIN_PANEL.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 101 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: platform-admin, auditoria, TODO.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Contiene TODO/FIXME pendiente.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.7 `app/(auth)/actions.ts`

#### Qué hace
Server Actions de Next.js. Tiene 198 líneas. Exports: loginAction, registerAction, logoutAction. Modelos/Prisma: user, business, businessSlugHistory, membership.

#### Cómo encaja en el SaaS
Área: Auth. Señales detectadas: rate-limit, auditoria, Turnstile, email-verification, TODO.

#### Dependencias o conexiones
Imports/conexiones: @prisma/client, next/navigation, @/lib/db, @/lib/auth, next/headers, @/lib/format, @/lib/plans, @/lib/enums.

#### Estado detectado
Parcial

#### Problemas encontrados
- Registro crea sesión antes de verificar email, usa cookie selected business httpOnly=false y no bloquea si falla email.

#### Mejoras recomendadas
- Corregir antes de producción y cubrir con prueba negativa/positiva.

#### Prioridad
Alta

### 6.8 `app/admin/actions.ts`

#### Qué hace
Server Actions de Next.js. Tiene 387 líneas. Exports: toggleBusinessActiveAction, updateStorePlanAction, updateUserRoleAction, addStoreMemberAction, updateStoreMemberRoleAction, removeStoreMemberAction, startDomainVerificationAction, verifyDomainAction. Modelos/Prisma: business, user, membership.

#### Cómo encaja en el SaaS
Área: Admin legado. Señales detectadas: platform-admin, auditoria, email-verification, destructivo, random-no-crypto.

#### Dependencias o conexiones
Imports/conexiones: next/cache, next/navigation, zod, @/lib/db, @/lib/auth, @/lib/enums, @/lib/auth/permissions, @/lib/plans.

#### Estado detectado
Parcial

#### Problemas encontrados
- Admin legacy usa Math.random para token de dominio y permisos globales legacy.

#### Mejoras recomendadas
- Corregir antes de producción y cubrir con prueba negativa/positiva.

#### Prioridad
Alta

### 6.9 `app/admin/layout.tsx`

#### Qué hace
Layout App Router. Tiene 49 líneas. Exports: AdminLayout. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Admin legado. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: next/link, @/app/(auth)/actions, @/lib/auth.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.10 `app/admin/owner/page.tsx`

#### Qué hace
Página App Router. Tiene 276 líneas. Exports: dynamic, OwnerAdminPage. Modelos/Prisma: business, subscription, order.

#### Cómo encaja en el SaaS
Área: Admin legado. Señales detectadas: autorizacion.

#### Dependencias o conexiones
Imports/conexiones: next/link, next/navigation, @/lib/db, @/lib/auth, @/components/Card, @/lib/plans, @/services/plan-guard, ../actions.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.11 `app/admin/page.tsx`

#### Qué hace
Página App Router. Tiene 780 líneas. Exports: AdminPage. Modelos/Prisma: business, user, product, conversation.

#### Cómo encaja en el SaaS
Área: Admin legado. Señales detectadas: auditoria, TODO.

#### Dependencias o conexiones
Imports/conexiones: next/link, @prisma/client, @/components/Card, @/components/ConfirmSubmitButton, @/components/EmptyState, @/components/StatusAlert, @/lib/db, @/lib/enums.

#### Estado detectado
Parcial

#### Problemas encontrados
- Contiene TODO/FIXME pendiente.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.12 `app/admin/stores/[id]/page.tsx`

#### Qué hace
Página App Router. Tiene 572 líneas. Exports: AdminStoreDetailPage. Modelos/Prisma: business, product, category.

#### Cómo encaja en el SaaS
Área: Admin legado. Señales detectadas: auditoria, email-verification.

#### Dependencias o conexiones
Imports/conexiones: next/link, next/navigation, @/components/Card, @/components/ConfirmSubmitButton, @/components/EmptyState, @/components/StatusAlert, @/lib/db, @/lib/enums.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.13 `app/api/admin/businesses/route.ts`

#### Qué hace
API Route de Next.js. Tiene 23 líneas. Exports: GET, POST. Modelos/Prisma: business, plan.

#### Cómo encaja en el SaaS
Área: API admin/owner. Señales detectadas: autorizacion.

#### Dependencias o conexiones
Imports/conexiones: next/server, @/lib/db, @/lib/auth.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.14 `app/api/admin/export-owner-csv/route.ts`

#### Qué hace
API Route de Next.js. Tiene 48 líneas. Exports: POST. Modelos/Prisma: business, order.

#### Cómo encaja en el SaaS
Área: API admin/owner. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: @/lib/db.

#### Estado detectado
Riesgoso

#### Problemas encontrados
- Exporta CSV de tiendas/dueños/ingresos sin autenticación ni autorización.

#### Mejoras recomendadas
- Corregir antes de producción y cubrir con prueba negativa/positiva.

#### Prioridad
Crítica

### 6.15 `app/api/admin/metrics-history/route.ts`

#### Qué hace
API Route de Next.js. Tiene 60 líneas. Exports: GET. Modelos/Prisma: order, business, subscription.

#### Cómo encaja en el SaaS
Área: API admin/owner. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: next/server, @/lib/db.

#### Estado detectado
Riesgoso

#### Problemas encontrados
- Expone métricas históricas globales sin autenticación.

#### Mejoras recomendadas
- Corregir antes de producción y cubrir con prueba negativa/positiva.

#### Prioridad
Crítica

### 6.16 `app/api/admin/sync-metrics/route.ts`

#### Qué hace
API Route de Next.js. Tiene 22 líneas. Exports: POST. Modelos/Prisma: order, subscription, business.

#### Cómo encaja en el SaaS
Área: API admin/owner. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: next/server, @/lib/db.

#### Estado detectado
Riesgoso

#### Problemas encontrados
- Expone métricas owner-level sin autenticación.

#### Mejoras recomendadas
- Corregir antes de producción y cubrir con prueba negativa/positiva.

#### Prioridad
Crítica

### 6.17 `app/api/ai/sales-assistant/route.ts`

#### Qué hace
API Route de Next.js. Tiene 842 líneas. Exports: POST. Modelos/Prisma: business, product, conversation, customer.

#### Cómo encaja en el SaaS
Área: IA. Señales detectadas: rate-limit, auditoria, IA, TODO.

#### Dependencias o conexiones
Imports/conexiones: next/server, @/lib/db, @/lib/ai, @/lib/enums, @/lib/validation, @/lib/rate-limit, @/lib/request-security, @/lib/format.

#### Estado detectado
Parcial

#### Problemas encontrados
- Contiene TODO/FIXME pendiente.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.18 `app/api/auth/resend-verification/route.ts`

#### Qué hace
API Route de Next.js. Tiene 60 líneas. Exports: POST. Modelos/Prisma: auditLog.

#### Cómo encaja en el SaaS
Área: Auth/email. Señales detectadas: autorizacion, rate-limit, auditoria, email-verification.

#### Dependencias o conexiones
Imports/conexiones: next/server, @/lib/auth, @/lib/auth/email-verification, @/lib/rate-limit, @/lib/db.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.19 `app/api/billing/checkout/route.ts`

#### Qué hace
API Route de Next.js. Tiene 83 líneas. Exports: runtime, POST. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Billing. Señales detectadas: autorizacion, rate-limit, auditoria, email-verification.

#### Dependencias o conexiones
Imports/conexiones: next/server, zod, @/lib/billing, @/lib/plans, @/lib/request-security, @/lib/rate-limit, @/services/authorization, @/services/audit-log.

#### Estado detectado
Incompleto

#### Problemas encontrados
- Checkout devuelve 501 y usa skipEmailVerification.

#### Mejoras recomendadas
- Corregir antes de producción y cubrir con prueba negativa/positiva.

#### Prioridad
Alta

### 6.20 `app/api/billing/portal/route.ts`

#### Qué hace
API Route de Next.js. Tiene 75 líneas. Exports: runtime, POST. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Billing. Señales detectadas: autorizacion, rate-limit, auditoria.

#### Dependencias o conexiones
Imports/conexiones: next/server, zod, @/lib/billing, @/lib/request-security, @/lib/rate-limit, @/services/authorization, @/services/audit-log.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.21 `app/api/billing/webhook/route.ts`

#### Qué hace
API Route de Next.js. Tiene 58 líneas. Exports: runtime, POST. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Billing. Señales detectadas: rate-limit, auditoria.

#### Dependencias o conexiones
Imports/conexiones: next/server, @/lib/billing, @/lib/rate-limit, @/services/audit-log.

#### Estado detectado
Incompleto

#### Problemas encontrados
- Webhook valida firma pero no aplica eventos a Subscription ni idempotencia.

#### Mejoras recomendadas
- Corregir antes de producción y cubrir con prueba negativa/positiva.

#### Prioridad
Alta

### 6.22 `app/api/catalog/track/route.ts`

#### Qué hace
API Route de Next.js. Tiene 68 líneas. Exports: POST. Modelos/Prisma: business, product.

#### Cómo encaja en el SaaS
Área: Catalogo publico. Señales detectadas: rate-limit.

#### Dependencias o conexiones
Imports/conexiones: next/server, zod, @/lib/enums, @/lib/rate-limit, @/lib/request-security, @/lib/db.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.23 `app/api/health/route.ts`

#### Qué hace
API Route de Next.js. Tiene 6 líneas. Exports: GET. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: next/server.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.24 `app/api/platform-admin/summary/route.ts`

#### Qué hace
API Route de Next.js. Tiene 36 líneas. Exports: GET. Modelos/Prisma: business, user, subscription.

#### Cómo encaja en el SaaS
Área: Platform admin API. Señales detectadas: platform-admin, auditoria.

#### Dependencias o conexiones
Imports/conexiones: next/server, @/lib/db, @/lib/platform-admin, @/services/audit-log.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.25 `app/api/store-slug-redirect/route.ts`

#### Qué hace
API Route de Next.js. Tiene 22 líneas. Exports: GET. Modelos/Prisma: businessSlugHistory.

#### Cómo encaja en el SaaS
Área: Catalogo publico. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: next/server, @/lib/db.

#### Estado detectado
Dudoso

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.26 `app/api/stores/[id]/domains/route.ts`

#### Qué hace
API Route de Next.js. Tiene 50 líneas. Exports: POST. Modelos/Prisma: business, platformSetting.

#### Cómo encaja en el SaaS
Área: Dominios/tiendas. Señales detectadas: random-no-crypto.

#### Dependencias o conexiones
Imports/conexiones: next/server, @/lib/db, node:dns.

#### Estado detectado
Riesgoso

#### Problemas encontrados
- Permite mutar/verificar dominios custom por id sin requireStoreAccess.

#### Mejoras recomendadas
- Corregir antes de producción y cubrir con prueba negativa/positiva.

#### Prioridad
Crítica

### 6.27 `app/api/uploads/image/route.ts`

#### Qué hace
API Route de Next.js. Tiene 541 líneas. Exports: runtime, POST, DELETE. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Uploads. Señales detectadas: autorizacion, rate-limit, auditoria, TODO, destructivo.

#### Dependencias o conexiones
Imports/conexiones: crypto, fs/promises, path, next/server, @/lib/rate-limit, @/lib/request-security, @/services/audit-log, @/services/authorization.

#### Estado detectado
Parcial

#### Problemas encontrados
- Contiene TODO/FIXME pendiente.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.28 `app/dashboard/categories/actions.ts`

#### Qué hace
Server Actions de Next.js. Tiene 55 líneas. Exports: createCategoryAction, deleteCategoryAction. Modelos/Prisma: category.

#### Cómo encaja en el SaaS
Área: Dashboard categorias. Señales detectadas: autorizacion, auditoria, destructivo.

#### Dependencias o conexiones
Imports/conexiones: next/cache, next/navigation, @/lib/db, @/lib/format, @/lib/validation, @/services/authorization, @/services/audit-log, @/services/plan-guard.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.29 `app/dashboard/categories/page.tsx`

#### Qué hace
Página App Router. Tiene 94 líneas. Exports: CategoriesPage. Modelos/Prisma: category.

#### Cómo encaja en el SaaS
Área: Dashboard categorias. Señales detectadas: autorizacion.

#### Dependencias o conexiones
Imports/conexiones: @/lib/db, @/services/authorization, @/components/Card, @/components/ConfirmSubmitButton, @/components/EmptyState, @/components/HelpTooltip, @/components/Input, @/components/LearningLink.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.30 `app/dashboard/conversations/page.tsx`

#### Qué hace
Página App Router. Tiene 65 líneas. Exports: ConversationsPage. Modelos/Prisma: conversation.

#### Cómo encaja en el SaaS
Área: Dashboard. Señales detectadas: autorizacion.

#### Dependencias o conexiones
Imports/conexiones: @/lib/db, @/services/authorization, @/components/Card, @/components/EmptyState, @/components/HelpTooltip, @/components/LearningLink, @/components/PageHeader, @/components/SectionGuide.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.31 `app/dashboard/customers/[id]/page.tsx`

#### Qué hace
Página App Router. Tiene 151 líneas. Exports: CustomerDetailPage. Modelos/Prisma: customer.

#### Cómo encaja en el SaaS
Área: Dashboard clientes. Señales detectadas: autorizacion.

#### Dependencias o conexiones
Imports/conexiones: next/link, next/navigation, @/lib/db, @/services/authorization, @/components/Card, @/components/HelpTooltip, @/components/Input, @/components/LearningLink.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.32 `app/dashboard/customers/actions.ts`

#### Qué hace
Server Actions de Next.js. Tiene 46 líneas. Exports: updateCustomerAction. Modelos/Prisma: customer.

#### Cómo encaja en el SaaS
Área: Dashboard clientes. Señales detectadas: autorizacion.

#### Dependencias o conexiones
Imports/conexiones: next/cache, next/navigation, @/lib/db, @/lib/validation, @/services/tenant-guard, @/services/authorization.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.33 `app/dashboard/customers/page.tsx`

#### Qué hace
Página App Router. Tiene 130 líneas. Exports: CustomersPage. Modelos/Prisma: customer.

#### Cómo encaja en el SaaS
Área: Dashboard clientes. Señales detectadas: autorizacion, TODO.

#### Dependencias o conexiones
Imports/conexiones: next/link, @/lib/db, @/services/authorization, @/components/Card, @/components/EmptyState, @/components/HelpTooltip, @/components/Input, @/components/LearningLink.

#### Estado detectado
Parcial

#### Problemas encontrados
- Contiene TODO/FIXME pendiente.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.34 `app/dashboard/design/page.tsx`

#### Qué hace
Página App Router. Tiene 116 líneas. Exports: DashboardDesignPage. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Dashboard. Señales detectadas: autorizacion.

#### Dependencias o conexiones
Imports/conexiones: next/link, @/lib/auth, @/services/authorization, @/lib/themes/saas-themes, @/lib/themes/catalog-palettes, @/lib/themes/theme-utils, @/app/settings/appearance/actions, @/components/theme/SaaSThemeSelector.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.35 `app/dashboard/layout.tsx`

#### Qué hace
Layout App Router. Tiene 18 líneas. Exports: DashboardLayout. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Dashboard. Señales detectadas: autorizacion.

#### Dependencias o conexiones
Imports/conexiones: next/navigation, @/components/DashboardNav, @/services/authorization.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.36 `app/dashboard/learning/page.tsx`

#### Qué hace
Página App Router. Tiene 206 líneas. Exports: DashboardLearningPage. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Dashboard. Señales detectadas: TODO.

#### Dependencias o conexiones
Imports/conexiones: @/components/LearningLink, @/components/InfoCard, @/components/PageHeader, @/components/SectionGuide, @/components/StepGuide.

#### Estado detectado
Parcial

#### Problemas encontrados
- Contiene TODO/FIXME pendiente.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.37 `app/dashboard/orders/[id]/page.tsx`

#### Qué hace
Página App Router. Tiene 64 líneas. Exports: OrderDetailPage. Modelos/Prisma: order.

#### Cómo encaja en el SaaS
Área: Dashboard pedidos. Señales detectadas: autorizacion.

#### Dependencias o conexiones
Imports/conexiones: next/link, next/navigation, @/lib/db, @/services/authorization, @/components/HelpTooltip, @/components/LearningLink, @/components/PrintButton, @/lib/format.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.38 `app/dashboard/orders/actions.ts`

#### Qué hace
Server Actions de Next.js. Tiene 82 líneas. Exports: updateOrderStatusAction. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Dashboard pedidos. Señales detectadas: autorizacion, auditoria.

#### Dependencias o conexiones
Imports/conexiones: next/cache, next/navigation, @/lib/db, @/lib/enums, @/services/plan-guard, @/services/tenant-guard, @/services/authorization, @/services/audit-log.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.39 `app/dashboard/orders/page.tsx`

#### Qué hace
Página App Router. Tiene 127 líneas. Exports: OrdersPage. Modelos/Prisma: order, quote.

#### Cómo encaja en el SaaS
Área: Dashboard pedidos. Señales detectadas: autorizacion.

#### Dependencias o conexiones
Imports/conexiones: next/link, @/lib/db, @/services/authorization, @/components/Card, @/components/EmptyState, @/components/HelpTooltip, @/components/LearningLink, @/components/Input.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.40 `app/dashboard/page.tsx`

#### Qué hace
Página App Router. Tiene 249 líneas. Exports: DashboardPage. Modelos/Prisma: product, customer, conversation, order, category, message.

#### Cómo encaja en el SaaS
Área: Dashboard. Señales detectadas: autorizacion.

#### Dependencias o conexiones
Imports/conexiones: next/link, @/lib/db, @/services/authorization, @/components/Card, @/components/LearningLink, @/components/OnboardingChecklist, @/components/PageHeader, @/components/QuickActions.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.41 `app/dashboard/products/actions.ts`

#### Qué hace
Server Actions de Next.js. Tiene 326 líneas. Exports: createCategoryFromProductAction, createProductAction, updateProductAction, toggleProductVisibilityAction, duplicateProductAction, deleteProductAction, quickDiscountAction. Modelos/Prisma: product, category.

#### Cómo encaja en el SaaS
Área: Dashboard productos. Señales detectadas: autorizacion, auditoria, destructivo.

#### Dependencias o conexiones
Imports/conexiones: next/cache, next/navigation, @/lib/db, @/lib/format, @/lib/enums, @/lib/validation, @/services/plan-guard, @/services/tenant-guard.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.42 `app/dashboard/products/page.tsx`

#### Qué hace
Página App Router. Tiene 254 líneas. Exports: ProductsPage. Modelos/Prisma: product, category.

#### Cómo encaja en el SaaS
Área: Dashboard productos. Señales detectadas: autorizacion.

#### Dependencias o conexiones
Imports/conexiones: @/lib/db, @/services/authorization, @/components/Card, @/components/EmptyState, @/components/Input, @/components/LearningLink, @/components/PageHeader, @/components/StatusAlert.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.43 `app/dashboard/products/ProductCreateDrawer.tsx`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 167 líneas. Exports: ProductCreateDrawer. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Dashboard productos. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: react, @/components/DrawerForm, @/components/FormSection, @/components/ImageDropzone, @/components/Input, @/components/PendingSubmitButton, @/components/ProductAttributesFields, @/lib/enums.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.44 `app/dashboard/products/ProductTableActions.tsx`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 200 líneas. Exports: ProductTableActions. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Dashboard productos. Señales detectadas: tipado-debil.

#### Dependencias o conexiones
Imports/conexiones: react, @/components/ActionMenu, @/components/DrawerForm, @/components/FormSection, @/components/Input, @/components/PendingSubmitButton, @/components/ImageDropzone, @/components/ProductAttributesFields.

#### Estado detectado
Parcial

#### Problemas encontrados
- Usa any/@ts-ignore/@ts-expect-error o casts débiles.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.45 `app/dashboard/quotes/[id]/page.tsx`

#### Qué hace
Página App Router. Tiene 86 líneas. Exports: QuoteDetailPage. Modelos/Prisma: quote.

#### Cómo encaja en el SaaS
Área: Dashboard cotizaciones. Señales detectadas: autorizacion.

#### Dependencias o conexiones
Imports/conexiones: next/link, next/navigation, @/lib/db, @/services/authorization, @/components/HelpTooltip, @/components/LearningLink, @/components/PrintButton, @/lib/format.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.46 `app/dashboard/quotes/actions.ts`

#### Qué hace
Server Actions de Next.js. Tiene 205 líneas. Exports: createQuoteAction, updateQuoteStatusAction, createOrderFromQuoteAction. Modelos/Prisma: quote, customer.

#### Cómo encaja en el SaaS
Área: Dashboard cotizaciones. Señales detectadas: autorizacion, auditoria.

#### Dependencias o conexiones
Imports/conexiones: next/cache, next/navigation, @/lib/db, @/lib/format, @/lib/enums, @/services/tenant-guard, @/services/plan-guard, @/services/authorization.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.47 `app/dashboard/quotes/page.tsx`

#### Qué hace
Página App Router. Tiene 179 líneas. Exports: QuotesPage. Modelos/Prisma: quote, customer, conversation, product.

#### Cómo encaja en el SaaS
Área: Dashboard cotizaciones. Señales detectadas: autorizacion.

#### Dependencias o conexiones
Imports/conexiones: next/link, @/lib/db, @/services/authorization, @/components/Card, @/components/CopyButton, @/components/EmptyState, @/components/HelpTooltip, @/components/Input.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.48 `app/dashboard/settings/actions.ts`

#### Qué hace
Server Actions de Next.js. Tiene 237 líneas. Exports: updateSettingsAction. Modelos/Prisma: business, businessSlugHistory, aiSettings.

#### Cómo encaja en el SaaS
Área: Dashboard configuracion. Señales detectadas: autorizacion, auditoria, destructivo.

#### Dependencias o conexiones
Imports/conexiones: @prisma/client, next/cache, next/navigation, @/lib/db, @/lib/validation, @/services/plan-guard, @/services/audit-log, @/services/authorization.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.49 `app/dashboard/settings/page.tsx`

#### Qué hace
Página App Router. Tiene 551 líneas. Exports: SettingsPage. Modelos/Prisma: aiSettings, business.

#### Cómo encaja en el SaaS
Área: Dashboard configuracion. Señales detectadas: autorizacion, TODO.

#### Dependencias o conexiones
Imports/conexiones: next/link, @/components/Card, @/components/CopyButton, @/components/FormField, @/components/ImageDropzone, @/components/InfoBox, @/components/Input, @/components/PageHeader.

#### Estado detectado
Parcial

#### Problemas encontrados
- Contiene TODO/FIXME pendiente.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.50 `app/dashboard/settings/SettingsUnsavedGuard.tsx`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 38 líneas. Exports: SettingsUnsavedGuard. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Dashboard configuracion. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: react.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.51 `app/globals.css`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 36 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.52 `app/layout.tsx`

#### Qué hace
Layout App Router. Tiene 33 líneas. Exports: metadata, dynamic, viewport, RootLayout. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: autorizacion.

#### Dependencias o conexiones
Imports/conexiones: next, ./globals.css, @/lib/auth, @/components/FloatingPlatformAdminGate, @/lib/themes/theme-utils.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.53 `app/login/page.tsx`

#### Qué hace
Página App Router. Tiene 36 líneas. Exports: LoginPage. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Auth. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: next/link, @/app/(auth)/actions, @/components/Card, @/components/Input.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.54 `app/middleware.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 32 líneas. Exports: middleware, config. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: next/server.

#### Estado detectado
Parcial

#### Problemas encontrados
- Está dentro de app/ y parece no ser el middleware activo; el build reporta proxy.ts.

#### Mejoras recomendadas
- Corregir antes de producción y cubrir con prueba negativa/positiva.

#### Prioridad
Alta

### 6.55 `app/onboarding/theme/actions.ts`

#### Qué hace
Server Actions de Next.js. Tiene 29 líneas. Exports: selectSaaSThemeAction. Modelos/Prisma: user.

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: autorizacion.

#### Dependencias o conexiones
Imports/conexiones: next/navigation, zod, @/lib/db, @/lib/auth, @/lib/themes/saas-themes.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.56 `app/onboarding/theme/page.tsx`

#### Qué hace
Página App Router. Tiene 46 líneas. Exports: OnboardingThemePage. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: autorizacion.

#### Dependencias o conexiones
Imports/conexiones: next/navigation, @/lib/auth, @/lib/themes/saas-themes, ./actions, @/components/theme/SaaSThemeSelector, @/components/Card.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.57 `app/page.tsx`

#### Qué hace
Página App Router. Tiene 50 líneas. Exports: HomePage. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: IA.

#### Dependencias o conexiones
Imports/conexiones: next/link, @/components/Card.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.58 `app/platform-admin/actions.ts`

#### Qué hace
Server Actions de Next.js. Tiene 600 líneas. Exports: PlatformAccessUserResult, searchUsersForPlatformAccess, grantPlatformAccessToExistingUser, createPlatformAccessByEmail, updatePlatformAccess, deactivatePlatformAccess, deletePlatformAccess, addPlatformAdminAccessAction. Modelos/Prisma: user, business, plan.

#### Cómo encaja en el SaaS
Área: Platform admin. Señales detectadas: platform-admin, auditoria.

#### Dependencias o conexiones
Imports/conexiones: crypto, next/cache, next/navigation, zod, @/lib/db, @/lib/platform-admin, @/lib/plans, @/services/audit-log.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.59 `app/platform-admin/layout.tsx`

#### Qué hace
Layout App Router. Tiene 46 líneas. Exports: PlatformAdminLayout. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Platform admin. Señales detectadas: platform-admin.

#### Dependencias o conexiones
Imports/conexiones: next/link, @/lib/platform-admin.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.60 `app/platform-admin/page.tsx`

#### Qué hace
Página App Router. Tiene 542 líneas. Exports: PlatformAdminPage. Modelos/Prisma: business, user, plan, subscription.

#### Cómo encaja en el SaaS
Área: Platform admin. Señales detectadas: platform-admin, auditoria.

#### Dependencias o conexiones
Imports/conexiones: @prisma/client, next/link, @/components/Card, @/components/CompactCard, @/components/ConfirmSubmitButton, @/components/EmptyState, @/components/Input, @/components/PageHeader.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.61 `app/platform-admin/PlatformAccessUserPicker.tsx`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 162 líneas. Exports: PlatformAccessUserPicker. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Platform admin. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: react, @/components/Input, @/components/StatusBadge, @/lib/platform-admin, ./actions.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.62 `app/register/page.tsx`

#### Qué hace
Página App Router. Tiene 64 líneas. Exports: RegisterPage. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Auth. Señales detectadas: Turnstile.

#### Dependencias o conexiones
Imports/conexiones: next/link, @/app/(auth)/actions, @/components/Card, @/components/Input, @/components/RegisterCredentialsFields, @/components/TurnstileWidget, @/lib/store-types.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.63 `app/select-store/actions.ts`

#### Qué hace
Server Actions de Next.js. Tiene 57 líneas. Exports: selectStoreAction. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: autorizacion, auditoria.

#### Dependencias o conexiones
Imports/conexiones: next/headers, next/navigation, @/lib/auth, @/services/audit-log, @/services/authorization.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.64 `app/select-store/page.tsx`

#### Qué hace
Página App Router. Tiene 71 líneas. Exports: SelectStorePage. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: next/link, next/navigation, @/components/Card, @/components/PageHeader, @/services/authorization, @/services/plan-guard, ./actions.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.65 `app/settings/appearance/actions.ts`

#### Qué hace
Server Actions de Next.js. Tiene 83 líneas. Exports: updateSaaSThemeAction, updateStoreCatalogPaletteAction. Modelos/Prisma: user, business.

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: autorizacion, auditoria.

#### Dependencias o conexiones
Imports/conexiones: next/navigation, zod, @/lib/db, @/lib/auth, @/services/audit-log, @/services/authorization, @/services/plan-guard, @/lib/themes/saas-themes.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.66 `app/settings/appearance/page.tsx`

#### Qué hace
Página App Router. Tiene 5 líneas. Exports: AppearanceSettingsPage. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: next/navigation.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.67 `app/settings/billing/actions.ts`

#### Qué hace
Server Actions de Next.js. Tiene 41 líneas. Exports: requestPlanUpgradeAction. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: autorizacion, auditoria.

#### Dependencias o conexiones
Imports/conexiones: next/navigation, zod, @/lib/plans, @/services/authorization, @/services/audit-log.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.68 `app/settings/billing/page.tsx`

#### Qué hace
Página App Router. Tiene 210 líneas. Exports: BillingSettingsPage. Modelos/Prisma: business.

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: autorizacion, auditoria.

#### Dependencias o conexiones
Imports/conexiones: next/link, @/lib/db, @/lib/plans, @/components/Card, @/components/PageHeader, @/components/StatusAlert, @/services/authorization, @/services/audit-log.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.69 `app/store/[slug]/layout.tsx`

#### Qué hace
Layout App Router. Tiene 28 líneas. Exports: StoreLayout. Modelos/Prisma: business.

#### Cómo encaja en el SaaS
Área: Catalogo publico. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: next/navigation, @/lib/db, @/lib/themes/theme-utils.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.70 `app/store/[slug]/page.tsx`

#### Qué hace
Página App Router. Tiene 175 líneas. Exports: generateMetadata, StorePage. Modelos/Prisma: business, businessSlugHistory.

#### Cómo encaja en el SaaS
Área: Catalogo publico. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: next, @prisma/client, next/navigation, next/headers, @/lib/db, @/lib/enums, @/lib/catalog, @/templates/ModernGridCatalog.

#### Estado detectado
Parcial

#### Problemas encontrados
- Resuelve customDomain sin exigir customDomainVerified=true.

#### Mejoras recomendadas
- Corregir antes de producción y cubrir con prueba negativa/positiva.

#### Prioridad
Alta

### 6.71 `app/store/[slug]/product/[productSlug]/page.tsx`

#### Qué hace
Página App Router. Tiene 235 líneas. Exports: generateMetadata, ProductDetailPage. Modelos/Prisma: business, businessSlugHistory, product, category.

#### Cómo encaja en el SaaS
Área: Catalogo publico. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: next/link, next, next/navigation, @/components/catalog/AskAiButton, @/components/catalog/CatalogHeader, @/components/catalog/CatalogProductTracker, @/components/catalog/ProductCard, @/components/catalog/ProductAttributeDisplay.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.72 `app/verify-email-prompt/page.tsx`

#### Qué hace
Página App Router. Tiene 57 líneas. Exports: VerifyEmailPromptPage. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Auth. Señales detectadas: email-verification.

#### Dependencias o conexiones
Imports/conexiones: react, next/link, @/components/Card.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.73 `app/verify-email/page.tsx`

#### Qué hace
Página App Router. Tiene 62 líneas. Exports: VerifyEmailPage. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Auth. Señales detectadas: auditoria, email-verification.

#### Dependencias o conexiones
Imports/conexiones: @/lib/audit-log, @/lib/auth/email-verification, next/link, @/components/Card.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.74 `AUTH_SECURITY_AND_ADMIN_SEED.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 115 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: email-verification.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.75 `BILLING_AND_PLANS.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 138 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: auditoria.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.76 `components/ActionMenu.tsx`

#### Qué hace
Componente React reutilizable. Tiene 76 líneas. Exports: ActionMenuItem, ActionMenu. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: react.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.77 `components/AiSourceBadge.tsx`

#### Qué hace
Componente React reutilizable. Tiene 54 líneas. Exports: AiSourceBadge, AiSourcesList. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: @/lib/ai-sources.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.78 `components/Button.tsx`

#### Qué hace
Componente React reutilizable. Tiene 24 líneas. Exports: Button. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: clsx.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.79 `components/Card.tsx`

#### Qué hace
Componente React reutilizable. Tiene 10 líneas. Exports: Card. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: clsx.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.80 `components/catalog/AskAiButton.tsx`

#### Qué hace
Componente React reutilizable. Tiene 75 líneas. Exports: AskAiButton. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Catalogo UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: react, @/lib/catalog.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.81 `components/catalog/CatalogControls.tsx`

#### Qué hace
Componente React reutilizable. Tiene 63 líneas. Exports: CatalogControls. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Catalogo UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: @/lib/catalog.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.82 `components/catalog/CatalogHeader.tsx`

#### Qué hace
Componente React reutilizable. Tiene 66 líneas. Exports: CatalogHeader. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Catalogo UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: next/link, @/lib/catalog, ./SafeImage.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.83 `components/catalog/CatalogProductTracker.tsx`

#### Qué hace
Componente React reutilizable. Tiene 31 líneas. Exports: CatalogProductTracker. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Catalogo UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: react.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.84 `components/catalog/EmptyCatalogState.tsx`

#### Qué hace
Componente React reutilizable. Tiene 12 líneas. Exports: EmptyCatalogState. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Catalogo UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.85 `components/catalog/ProductAttributeDisplay.tsx`

#### Qué hace
Componente React reutilizable. Tiene 107 líneas. Exports: ProductAttributeDisplay. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Catalogo UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: @/lib/store-types.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.86 `components/catalog/ProductCard.tsx`

#### Qué hace
Componente React reutilizable. Tiene 114 líneas. Exports: ProductCard. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Catalogo UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: next/link, @/components/catalog/AskAiButton, @/components/catalog/SafeImage, @/components/catalog/WhatsAppProductButton, @/lib/catalog, @/lib/format.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.87 `components/catalog/SafeImage.tsx`

#### Qué hace
Componente React reutilizable. Tiene 19 líneas. Exports: SafeImage. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Catalogo UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: react.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.88 `components/catalog/WhatsAppProductButton.tsx`

#### Qué hace
Componente React reutilizable. Tiene 80 líneas. Exports: WhatsAppProductButton. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Catalogo UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: react.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.89 `components/CompactCard.tsx`

#### Qué hace
Componente React reutilizable. Tiene 26 líneas. Exports: CompactCard. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: clsx.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.90 `components/ConfirmSubmitButton.tsx`

#### Qué hace
Componente React reutilizable. Tiene 23 líneas. Exports: ConfirmSubmitButton. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.91 `components/CopyButton.tsx`

#### Qué hace
Componente React reutilizable. Tiene 21 líneas. Exports: CopyButton. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: react.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.92 `components/DashboardNav.tsx`

#### Qué hace
Componente React reutilizable. Tiene 8 líneas. Exports: DashboardNav. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: autorizacion.

#### Dependencias o conexiones
Imports/conexiones: @/services/authorization, @/components/DashboardNavClient.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.93 `components/DashboardNavClient.tsx`

#### Qué hace
Componente React reutilizable. Tiene 162 líneas. Exports: DashboardNavClient. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: next/link, react, next/navigation, @/app/(auth)/actions, @/components/CopyButton.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.94 `components/DrawerForm.tsx`

#### Qué hace
Componente React reutilizable. Tiene 50 líneas. Exports: DrawerForm. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: clsx.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.95 `components/EmptyState.tsx`

#### Qué hace
Componente React reutilizable. Tiene 27 líneas. Exports: EmptyState. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: clsx.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.96 `components/FloatingPlatformAdminButton.tsx`

#### Qué hace
Componente React reutilizable. Tiene 45 líneas. Exports: FloatingPlatformAdminButton. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.97 `components/FloatingPlatformAdminGate.tsx`

#### Qué hace
Componente React reutilizable. Tiene 9 líneas. Exports: FloatingPlatformAdminGate. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: platform-admin.

#### Dependencias o conexiones
Imports/conexiones: @/lib/platform-admin, @/components/FloatingPlatformAdminButton.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.98 `components/FormField.tsx`

#### Qué hace
Componente React reutilizable. Tiene 47 líneas. Exports: FieldHint, FieldError, FormField, FormGrid. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: clsx.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.99 `components/FormSection.tsx`

#### Qué hace
Componente React reutilizable. Tiene 24 líneas. Exports: FormSection. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: clsx.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.100 `components/HelpTooltip.tsx`

#### Qué hace
Componente React reutilizable. Tiene 20 líneas. Exports: HelpTooltip. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: clsx.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.101 `components/ImageDropzone.tsx`

#### Qué hace
Componente React reutilizable. Tiene 150 líneas. Exports: ImageDropzone. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: react.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.102 `components/InfoBox.tsx`

#### Qué hace
Componente React reutilizable. Tiene 28 líneas. Exports: InfoBox. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: clsx.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.103 `components/InfoCard.tsx`

#### Qué hace
Componente React reutilizable. Tiene 29 líneas. Exports: InfoCard. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: clsx.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.104 `components/Input.tsx`

#### Qué hace
Componente React reutilizable. Tiene 38 líneas. Exports: Input, Textarea, Select. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: clsx.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.105 `components/LearningLink.tsx`

#### Qué hace
Componente React reutilizable. Tiene 22 líneas. Exports: LearningLink. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: next/link, clsx.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.106 `components/OnboardingChecklist.tsx`

#### Qué hace
Componente React reutilizable. Tiene 58 líneas. Exports: OnboardingChecklist. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: next/link, @/components/LearningLink.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.107 `components/OwnerMetricsChart.tsx`

#### Qué hace
Componente React reutilizable. Tiene 120 líneas. Exports: OwnerMetricsChart. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: tipado-debil.

#### Dependencias o conexiones
Imports/conexiones: react-chartjs-2, chart.js, react.

#### Estado detectado
Parcial

#### Problemas encontrados
- Usa any/@ts-ignore/@ts-expect-error o casts débiles.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.108 `components/OwnerMetricsSync.tsx`

#### Qué hace
Componente React reutilizable. Tiene 67 líneas. Exports: OwnerMetricsSync. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: react.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.109 `components/PageHeader.tsx`

#### Qué hace
Componente React reutilizable. Tiene 31 líneas. Exports: PageHeader. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: clsx.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.110 `components/PendingSubmitButton.tsx`

#### Qué hace
Componente React reutilizable. Tiene 21 líneas. Exports: PendingSubmitButton. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: react-dom.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.111 `components/PrintButton.tsx`

#### Qué hace
Componente React reutilizable. Tiene 10 líneas. Exports: PrintButton. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.112 `components/ProductAttributesFields.tsx`

#### Qué hace
Componente React reutilizable. Tiene 108 líneas. Exports: ProductAttributesFields. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: @/components/HelpTooltip, @/components/Input, @/lib/store-types.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.113 `components/QuickActions.tsx`

#### Qué hace
Componente React reutilizable. Tiene 51 líneas. Exports: QuickAction, QuickActions. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: next/link.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.114 `components/RegisterCredentialsFields.tsx`

#### Qué hace
Componente React reutilizable. Tiene 89 líneas. Exports: RegisterCredentialsFields. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: react, @/components/Input, @/lib/password-policy.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.115 `components/SectionCard.tsx`

#### Qué hace
Componente React reutilizable. Tiene 35 líneas. Exports: SectionCard. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: clsx, @/components/HelpTooltip.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.116 `components/SectionGuide.tsx`

#### Qué hace
Componente React reutilizable. Tiene 39 líneas. Exports: SectionGuide. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: clsx.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.117 `components/StatusAlert.tsx`

#### Qué hace
Componente React reutilizable. Tiene 11 líneas. Exports: StatusAlert. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.118 `components/StatusBadge.tsx`

#### Qué hace
Componente React reutilizable. Tiene 28 líneas. Exports: StatusBadge. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: clsx.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.119 `components/StepGuide.tsx`

#### Qué hace
Componente React reutilizable. Tiene 34 líneas. Exports: StepGuide. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: clsx.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.120 `components/StoreChat.tsx`

#### Qué hace
Componente React reutilizable. Tiene 309 líneas. Exports: StoreChat. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: random-no-crypto.

#### Dependencias o conexiones
Imports/conexiones: react, @/components/AiSourceBadge, @/lib/ai-sources, @/lib/catalog.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.121 `components/StoreShareCard.tsx`

#### Qué hace
Componente React reutilizable. Tiene 113 líneas. Exports: StoreShareCard. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: qrcode, react.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.122 `components/theme/CatalogPaletteBar.tsx`

#### Qué hace
Componente React reutilizable. Tiene 48 líneas. Exports: CatalogPaletteBar. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Temas/UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: @/lib/themes/catalog-palettes.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.123 `components/theme/CatalogPaletteCard.tsx`

#### Qué hace
Componente React reutilizable. Tiene 102 líneas. Exports: CatalogPaletteCard. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Temas/UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: react, @/lib/themes/catalog-palettes, ./ColorSwatches.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.124 `components/theme/CatalogPaletteSelector.tsx`

#### Qué hace
Componente React reutilizable. Tiene 41 líneas. Exports: CatalogPaletteSelector. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Temas/UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: @/lib/themes/catalog-palettes, ./CatalogPaletteCard.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.125 `components/theme/CatalogPreview.tsx`

#### Qué hace
Componente React reutilizable. Tiene 71 líneas. Exports: CatalogPreview. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Temas/UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: @/lib/themes/catalog-palettes, @/lib/themes/theme-utils.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.126 `components/theme/ColorSwatches.tsx`

#### Qué hace
Componente React reutilizable. Tiene 10 líneas. Exports: ColorSwatches. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Temas/UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.127 `components/theme/LiveThemeColorControls.tsx`

#### Qué hace
Componente React reutilizable. Tiene 149 líneas. Exports: LiveThemeColorControls. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Temas/UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: react.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.128 `components/theme/SaaSThemeCard.tsx`

#### Qué hace
Componente React reutilizable. Tiene 103 líneas. Exports: SaaSThemeCard. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Temas/UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: react, @/lib/themes/saas-themes, ./ColorSwatches.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.129 `components/theme/SaaSThemeProvider.tsx`

#### Qué hace
Componente React reutilizable. Tiene 14 líneas. Exports: SaaSThemeProvider. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Temas/UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: react, @/lib/themes/saas-themes, @/lib/themes/theme-utils.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.130 `components/theme/SaaSThemeSelector.tsx`

#### Qué hace
Componente React reutilizable. Tiene 39 líneas. Exports: SaaSThemeSelector. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Temas/UI. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: @/lib/themes/saas-themes, ./SaaSThemeCard.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.131 `components/TurnstileWidget.tsx`

#### Qué hace
Componente React reutilizable. Tiene 69 líneas. Exports: TurnstileWidget. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Componentes UI. Señales detectadas: Turnstile.

#### Dependencias o conexiones
Imports/conexiones: react.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.132 `docs/ARCHITECTURE.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 228 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion. Señales detectadas: IA.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.133 `docs/AUDIT_FINAL.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 322 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion. Señales detectadas: TODO.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Contiene TODO/FIXME pendiente.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.134 `docs/AUDIT.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 183 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion. Señales detectadas: IA.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.135 `docs/AUDITORIA_SEGUNDA_FASE.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 192 líneas. Exports: . Modelos/Prisma: business, conversation, customer, user, membership.

#### Cómo encaja en el SaaS
Área: Documentacion. Señales detectadas: autorizacion, auditoria.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.136 `docs/AUDITORIA_SEGURIDAD.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 97 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion. Señales detectadas: autorizacion, platform-admin, TODO.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Contiene TODO/FIXME pendiente.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.137 `docs/AUDITORIA_UI_UX.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 89 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion. Señales detectadas: TODO.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Contiene TODO/FIXME pendiente.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.138 `docs/CAMBIOS_IMPLEMENTADOS.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 354 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion. Señales detectadas: autorizacion, auditoria, TODO.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Contiene TODO/FIXME pendiente.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.139 `docs/CLEANUP_REPORT.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 106 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion. Señales detectadas: destructivo.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.140 `docs/CLOUDFLARED_AND_DOMAINS.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 115 líneas. Exports: middleware. Modelos/Prisma: store.

#### Cómo encaja en el SaaS
Área: Documentacion. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: next/server, ../lib/db.

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.141 `docs/diagrams/flujo-catalogo-publico.mmd`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 19 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion diagramas. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.142 `docs/diagrams/flujo-catalogo-publico.svg`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 1 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion diagramas. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.143 `docs/diagrams/flujo-chat-ia.mmd`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 23 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion diagramas. Señales detectadas: IA.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.144 `docs/diagrams/flujo-chat-ia.svg`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 1 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion diagramas. Señales detectadas: IA.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.145 `docs/diagrams/flujo-consultar-ia.mmd`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 18 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion diagramas. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.146 `docs/diagrams/flujo-consultar-ia.svg`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 1 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion diagramas. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.147 `docs/diagrams/flujo-cotizacion-pedido.mmd`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 22 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion diagramas. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.148 `docs/diagrams/flujo-cotizacion-pedido.svg`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 1 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion diagramas. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.149 `docs/diagrams/flujo-general.mmd`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 21 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion diagramas. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.150 `docs/diagrams/flujo-general.svg`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 1 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion diagramas. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.151 `docs/diagrams/flujo-multitenant.mmd`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 28 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion diagramas. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.152 `docs/diagrams/flujo-multitenant.svg`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 1 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion diagramas. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.153 `docs/diagrams/flujo-productos.mmd`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 19 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion diagramas. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.154 `docs/diagrams/flujo-productos.svg`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 1 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion diagramas. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.155 `docs/diagrams/flujo-superadmin.mmd`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 16 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion diagramas. Señales detectadas: platform-admin.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.156 `docs/diagrams/flujo-superadmin.svg`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 1 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion diagramas. Señales detectadas: platform-admin.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.157 `docs/diagrams/flujo-upload-imagenes.mmd`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 22 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion diagramas. Señales detectadas: autorizacion.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.158 `docs/diagrams/flujo-upload-imagenes.svg`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 1 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion diagramas. Señales detectadas: autorizacion.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.159 `docs/diagrams/flujo-whatsapp.mmd`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 13 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion diagramas. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.160 `docs/diagrams/flujo-whatsapp.svg`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 1 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion diagramas. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.161 `docs/diagrams/proyecto-completo-viewer.html`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 177 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion diagramas. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.162 `docs/diagrams/proyecto-completo.mmd`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 291 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion diagramas. Señales detectadas: IA.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.163 `docs/diagrams/proyecto-completo.svg`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 1 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion diagramas. Señales detectadas: IA.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.164 `docs/FEATURE_MAP.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 54 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.165 `docs/FLOWS.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 319 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion. Señales detectadas: autorizacion, platform-admin, IA, TODO.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Contiene TODO/FIXME pendiente.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.166 `docs/MAPA_PROYECTO.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 39 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.167 `docs/MODULES.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 115 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion. Señales detectadas: IA, TODO.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Contiene TODO/FIXME pendiente.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.168 `docs/OVERVIEW.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 164 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.169 `docs/PLAN_ACCION_POR_ARCHIVO.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 380 líneas. Exports: . Modelos/Prisma: business, customer, user, membership, product.

#### Cómo encaja en el SaaS
Área: Documentacion. Señales detectadas: autorizacion, platform-admin, auditoria, TODO.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Contiene TODO/FIXME pendiente.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.170 `docs/POSTGRES_MIGRATION.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 72 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.171 `docs/PR02_TESTING_PLAN.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 56 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.172 `docs/PRODUCTION_ROADMAP.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 58 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.173 `docs/PROJECT_AUDIT.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 464 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion. Señales detectadas: autorizacion, platform-admin, auditoria, IA, email-verification, TODO, destructivo.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Contiene TODO/FIXME pendiente.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.174 `docs/QA_REPORT.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 93 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.175 `docs/SECURITY_AUDIT.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 365 líneas. Exports: POST. Modelos/Prisma: user, business, businessSlugHistory.

#### Cómo encaja en el SaaS
Área: Documentacion. Señales detectadas: autorizacion, auditoria, IA, email-verification.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.176 `docs/SECURITY_SUMMARY.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 263 líneas. Exports: POST. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion. Señales detectadas: email-verification, TODO.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Contiene TODO/FIXME pendiente.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.177 `docs/TICKETS_IMPLEMENTACION_SAAS.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 382 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Documentacion. Señales detectadas: autorizacion, auditoria.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener sincronizado con cambios de arquitectura y seguridad.

#### Prioridad
Informativa

### 6.178 `DOCUMENTACION_COMPLETA_SAAS.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 1098 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: autorizacion, platform-admin, auditoria, IA, TODO.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Contiene TODO/FIXME pendiente.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.179 `eslint.config.cjs`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 37 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.180 `lib/ai-sources.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 96 líneas. Exports: AiSourceType, AiSource, getAiSourceLabel, normalizeAiSources, hasUsefulAiSource. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Libreria backend. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.181 `lib/ai.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 12 líneas. Exports: deepseek, hasDeepSeekKey. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Libreria backend. Señales detectadas: IA.

#### Dependencias o conexiones
Imports/conexiones: openai.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.182 `lib/audit-log.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 138 líneas. Exports: AuditResult, sanitizeAuditMetadata, writeAuditLog, auditSuccess, auditFailure, auditBlocked. Modelos/Prisma: auditLog.

#### Cómo encaja en el SaaS
Área: Libreria backend. Señales detectadas: auditoria.

#### Dependencias o conexiones
Imports/conexiones: next/headers, @/lib/db, @/lib/safe-json.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.183 `lib/auth.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 220 líneas. Exports: SELECTED_BUSINESS_COOKIE, BootstrapSecretError, hasPlatformAccess, hasAdminPanelAccess, hasDeveloperPlanAccess, hasFullPlanAccess, resolvePublicRegistrationRole, hashPassword. Modelos/Prisma: session, business.

#### Cómo encaja en el SaaS
Área: Auth/RBAC. Señales detectadas: autorizacion, platform-admin, destructivo.

#### Dependencias o conexiones
Imports/conexiones: next/headers, next/navigation, bcryptjs, crypto, @/lib/db, @/lib/enums, @/lib/auth/permissions.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.184 `lib/auth/email-verification.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 36 líneas. Exports: createEmailVerificationToken, sendVerificationEmail, verifyEmailToken, invalidatePreviousTokens. Modelos/Prisma: emailVerificationToken.

#### Cómo encaja en el SaaS
Área: Auth/RBAC. Señales detectadas: email-verification.

#### Dependencias o conexiones
Imports/conexiones: @/lib/db, @/lib/email, @/lib/emailVerification.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.185 `lib/auth/guards.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 75 líneas. Exports: requireAuth, requireVerifiedUser, requireGlobalRole, requireDeveloperOrAdmin, requireStoreRole, requireBusinessAccess, requireBusinessPermission, requireBusinessRole. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Auth/RBAC. Señales detectadas: autorizacion, platform-admin, email-verification.

#### Dependencias o conexiones
Imports/conexiones: next/navigation, @/lib/auth, @/lib/auth/permissions, @/services/authorization.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.186 `lib/auth/permissions.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 195 líneas. Exports: UserAccessIdentity, BusinessPermission, SUPER_ADMIN_ROLES, FORMAL_GLOBAL_ROLES, LEGACY_GLOBAL_ADMIN_ROLES, PLATFORM_ADMIN_ROLES, ADMIN_PANEL_ROLES, GLOBAL_ADMIN_ROLES. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Auth/RBAC. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: @/lib/enums.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.187 `lib/billing.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 46 líneas. Exports: BillingProvider, getBillingProvider, isBillingProviderConfigured, verifyStripeWebhookSignature. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Libreria backend. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: crypto.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.188 `lib/catalog.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 157 líneas. Exports: CatalogCategory, CatalogProduct, ProductAiContext, StoreChatAskDetail, CatalogBusiness, CatalogSearchState, CatalogThemeStyle, CatalogTemplateProps. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Libreria backend. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: react, @/lib/enums, @/lib/themes/theme-utils.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.189 `lib/db.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 12 líneas. Exports: prisma. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Libreria backend. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: @prisma/client.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.190 `lib/email.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 55 líneas. Exports: sendVerificationEmail. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Libreria backend. Señales detectadas: email-verification.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Parcial

#### Problemas encontrados
- El fallo del proveedor de email no siempre detiene el flujo de verificación.

#### Mejoras recomendadas
- Corregir antes de producción y cubrir con prueba negativa/positiva.

#### Prioridad
Alta

### 6.191 `lib/emailVerification.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 49 líneas. Exports: TokenError, TokenNotFoundError, TokenExpiredError, TokenConsumedError, generateEmailVerificationToken, verifyEmailToken. Modelos/Prisma: emailVerificationToken, user.

#### Cómo encaja en el SaaS
Área: Libreria backend. Señales detectadas: email-verification.

#### Dependencias o conexiones
Imports/conexiones: crypto, @/lib/db.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.192 `lib/enums.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 102 líneas. Exports: UserRole, StoreRole, CatalogTemplate, PlanType. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Libreria backend. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.193 `lib/format.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 22 líneas. Exports: formatCLP, slugify, getFinalPrice. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Libreria backend. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.194 `lib/password-policy.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 34 líneas. Exports: PasswordCheck, passwordPolicyDescription, evaluatePasswordPolicy, isStrongPassword. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Libreria backend. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.195 `lib/plans/assert-feature-access.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 18 líneas. Exports: PlanFeatureAccessError, assertFeatureAccess. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Planes/entitlements. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: @/lib/plans/feature-keys, @/lib/plans/can-use-feature.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.196 `lib/plans/can-use-feature.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 17 líneas. Exports: canUseFeature, getLimit, isWithinPlanLimit. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Planes/entitlements. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: @/lib/plans/entitlements, @/lib/plans/feature-keys, @/lib/plans/get-plan-entitlements, @/lib/plans/plan-types.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.197 `lib/plans/entitlements.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 134 líneas. Exports: PLAN_ENTITLEMENTS, PLAN_LIMIT_LABELS, entitlementAllowsFeature. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Planes/entitlements. Señales detectadas: auditoria.

#### Dependencias o conexiones
Imports/conexiones: @/lib/plans/feature-keys, @/lib/plans/plan-types.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.198 `lib/plans/feature-keys.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 54 líneas. Exports: FEATURE_KEYS, FeatureKey, FEATURE_LABELS. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Planes/entitlements. Señales detectadas: auditoria.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.199 `lib/plans/get-plan-entitlements.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 7 líneas. Exports: getPlanEntitlements. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Planes/entitlements. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: @/lib/plans/entitlements, @/lib/plans/plan-types.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.200 `lib/plans/index.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 8 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Planes/entitlements. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.201 `lib/plans/plan-types.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 111 líneas. Exports: PLAN_SLUGS, PlanSlug, SUBSCRIPTION_STATUSES, SubscriptionStatus, UNLIMITED, Unlimited, PlanLimitValue, AiAssistantLevel. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Planes/entitlements. Señales detectadas: auditoria.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.202 `lib/plans/plans.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 133 líneas. Exports: commercialPlans, planDefinitions, planList, ensureDefaultPlans, getNormalPlan, getFreePlan, getPlanByType. Modelos/Prisma: plan.

#### Cómo encaja en el SaaS
Área: Planes/entitlements. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: @/lib/db, @/lib/plans/entitlements, @/lib/plans/plan-types.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.203 `lib/platform-admin.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 240 líneas. Exports: PRIMARY_PLATFORM_OWNER_EMAIL, PLATFORM_ADMIN_ROLES, PlatformAdminRole, PlatformAdminAccess, normalizePlatformAdminEmail, isPrimaryPlatformOwnerEmail, isPlatformAdminRole, canManagePlatformAccess. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Libreria backend. Señales detectadas: autorizacion, platform-admin, auditoria.

#### Dependencias o conexiones
Imports/conexiones: next/navigation, @/lib/db, @/lib/auth, @/services/audit-log.

#### Estado detectado
Parcial

#### Problemas encontrados
- Dueño OWNER hard-coded y fallback por código.

#### Mejoras recomendadas
- Corregir antes de producción y cubrir con prueba negativa/positiva.

#### Prioridad
Alta

### 6.204 `lib/rate-limit.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 147 líneas. Exports: RateLimitError, getClientIp, rateLimitKey, assertRateLimit. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Libreria backend. Señales detectadas: rate-limit, destructivo.

#### Dependencias o conexiones
Imports/conexiones: next/headers.

#### Estado detectado
Parcial

#### Problemas encontrados
- Fallback de rate limit en memoria no es suficiente para producción multi-instancia.

#### Mejoras recomendadas
- Corregir antes de producción y cubrir con prueba negativa/positiva.

#### Prioridad
Alta

### 6.205 `lib/request-security.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 32 líneas. Exports: requestHasAllowedOrigin. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Libreria backend. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.206 `lib/safe-json.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 35 líneas. Exports: JsonRecord, parseJsonSafely, parseJsonRecord, parseStringRecord, stringifyJsonSafely. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Libreria backend. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.207 `lib/security/audit-log.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 2 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Compat seguridad. Señales detectadas: auditoria.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.208 `lib/security/rate-limit.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 2 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Compat seguridad. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.209 `lib/security/safe-json.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 8 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Compat seguridad. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.210 `lib/security/tenant.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 39 líneas. Exports: assertCanManageProduct, assertCanManageUser, assertTenantAccess, getSafeStoreForUser. Modelos/Prisma: user.

#### Cómo encaja en el SaaS
Área: Compat seguridad. Señales detectadas: autorizacion.

#### Dependencias o conexiones
Imports/conexiones: @/lib/db, @/services/authorization, @/services/tenant-guard.

#### Estado detectado
Parcial

#### Problemas encontrados
- assertCanManageUser podría devolver usuarios fuera del tenant si se usa.

#### Mejoras recomendadas
- Corregir antes de producción y cubrir con prueba negativa/positiva.

#### Prioridad
Alta

### 6.211 `lib/store-types.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 263 líneas. Exports: StoreType, DynamicFieldType, ProductAttributeField, StoreTypeConfig, storeTypeOptions, getStoreTypeConfig, getStoreTypeOptions. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Libreria backend. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.212 `lib/themes/catalog-palettes.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 268 líneas. Exports: CatalogPalette, catalogPalettes. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Temas. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.213 `lib/themes/saas-themes.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 142 líneas. Exports: SaaSTheme, saasThemes. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Temas. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.214 `lib/themes/theme-utils.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 124 líneas. Exports: defaultSaasThemeSlug, defaultCatalogPaletteSlug, getSaasThemeBySlug, isValidSaasThemeSlug, getCatalogPaletteBySlug, isValidCatalogPaletteSlug, getSaasThemeCssVariables, getCatalogPaletteCssVariables. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Temas. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: react, ./catalog-palettes, ./saas-themes.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.215 `lib/turnstile.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 41 líneas. Exports: verifyTurnstileToken. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Libreria backend. Señales detectadas: Turnstile, email-verification.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Parcial

#### Problemas encontrados
- Turnstile puede omitirse por mala configuración de site key pública.

#### Mejoras recomendadas
- Corregir antes de producción y cubrir con prueba negativa/positiva.

#### Prioridad
Alta

### 6.216 `lib/validation.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 267 líneas. Exports: requiredString, optionalText, optionalUrl, optionalInstagramUrl, optionalImageUrl, colorSchema, reservedPublicSlugs, normalizePublicSlug. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Libreria backend. Señales detectadas: IA.

#### Dependencias o conexiones
Imports/conexiones: zod, @/lib/enums, @/lib/store-types, @/lib/format, @/lib/password-policy.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.217 `LICENSE`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 22 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: tipado-debil.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Parcial

#### Problemas encontrados
- Usa any/@ts-ignore/@ts-expect-error o casts débiles.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.218 `next-env.d.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 7 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: ./.next/types/routes.d.ts.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.219 `next.config.mjs`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 84 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: node:os.

#### Estado detectado
Parcial

#### Problemas encontrados
- CSP de producción permite unsafe-inline y no lista explícitamente Cloudflare Turnstile.

#### Mejoras recomendadas
- Corregir antes de producción y cubrir con prueba negativa/positiva.

#### Prioridad
Alta

### 6.220 `package-lock.json`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 11295 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: IA, TODO, tipado-debil.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Parcial

#### Problemas encontrados
- Contiene TODO/FIXME pendiente.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.221 `package.json`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 81 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: IA.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.222 `postcss.config.js`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 7 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.223 `prisma/migrations.sqlite.backup/20260522052436_init/migration.sql`

#### Qué hace
Archivo Prisma/base de datos. Tiene 241 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Prisma backup SQLite. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Temporal

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.224 `prisma/migrations.sqlite.backup/20260522063931_professional_saas_upgrade/migration.sql`

#### Qué hace
Archivo Prisma/base de datos. Tiene 218 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Prisma backup SQLite. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Temporal

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.225 `prisma/migrations.sqlite.backup/20260523032848_add_product_engagement_metrics/migration.sql`

#### Qué hace
Archivo Prisma/base de datos. Tiene 39 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Prisma backup SQLite. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Temporal

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.226 `prisma/migrations.sqlite.backup/20260523053607_add_dashboard_customization/migration.sql`

#### Qué hace
Archivo Prisma/base de datos. Tiene 4 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Prisma backup SQLite. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Temporal

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.227 `prisma/migrations.sqlite.backup/20260523090000_security_public_slug_audit/migration.sql`

#### Qué hace
Archivo Prisma/base de datos. Tiene 67 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Prisma backup SQLite. Señales detectadas: auditoria.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Temporal

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.228 `prisma/migrations.sqlite.backup/20260525010314_add_store_types_dynamic_attributes_page_settings/migration.sql`

#### Qué hace
Archivo Prisma/base de datos. Tiene 55 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Prisma backup SQLite. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Temporal

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.229 `prisma/migrations.sqlite.backup/20260525020958_security_rbac_subscriptions_platform_admin/migration.sql`

#### Qué hace
Archivo Prisma/base de datos. Tiene 86 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Prisma backup SQLite. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Temporal

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.230 `prisma/migrations.sqlite.backup/20260525025701_ui_auth_admin_seed_hardening/migration.sql`

#### Qué hace
Archivo Prisma/base de datos. Tiene 23 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Prisma backup SQLite. Señales detectadas: email-verification.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Temporal

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.231 `prisma/migrations.sqlite.backup/20260525063138_add_theme_fields/migration.sql`

#### Qué hace
Archivo Prisma/base de datos. Tiene 68 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Prisma backup SQLite. Señales detectadas: email-verification.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Temporal

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.232 `prisma/migrations.sqlite.backup/20260525102000_commercial_plans_entitlements/migration.sql`

#### Qué hace
Archivo Prisma/base de datos. Tiene 366 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Prisma backup SQLite. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Temporal

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.233 `prisma/migrations.sqlite.backup/20260525104500_normalize_manual_subscription_status/migration.sql`

#### Qué hace
Archivo Prisma/base de datos. Tiene 9 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Prisma backup SQLite. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Temporal

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.234 `prisma/migrations.sqlite.backup/20260527064051_add_custom_domain_fields/migration.sql`

#### Qué hace
Archivo Prisma/base de datos. Tiene 55 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Prisma backup SQLite. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Temporal

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.235 `prisma/migrations.sqlite.backup/migration_lock.toml`

#### Qué hace
Archivo Prisma/base de datos. Tiene 3 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Prisma backup SQLite. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Temporal

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.236 `prisma/migrations/20260527074044_init_postgres/migration.sql`

#### Qué hace
Archivo Prisma/base de datos. Tiene 593 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Prisma migraciones. Señales detectadas: auditoria, email-verification.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.237 `prisma/migrations/20260528031849_npx_prisma_validatenpx_prisma_migrate_status/migration.sql`

#### Qué hace
Archivo Prisma/base de datos. Tiene 5 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Prisma migraciones. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Parcial

#### Problemas encontrados
- Migración placeholder sin cambios reales.

#### Mejoras recomendadas
- Corregir antes de producción y cubrir con prueba negativa/positiva.

#### Prioridad
Alta

### 6.238 `prisma/migrations/20260528090000_add_platform_admin_access/migration.sql`

#### Qué hace
Archivo Prisma/base de datos. Tiene 43 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Prisma migraciones. Señales detectadas: platform-admin.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.239 `prisma/migrations/20260528100000_add_email_verification_and_signup_hardening/migration.sql`

#### Qué hace
Archivo Prisma/base de datos. Tiene 20 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Prisma migraciones. Señales detectadas: email-verification.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.240 `prisma/migrations/migration_lock.toml`

#### Qué hace
Archivo Prisma/base de datos. Tiene 3 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Prisma migraciones. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.241 `prisma/schema_postgres.prisma`

#### Qué hace
Archivo Prisma/base de datos. Tiene 415 líneas. Exports: . Modelos/Prisma: User, Session, EmailVerificationToken, Business, Membership, BusinessSlugHistory, AuditLog, Plan, Subscription, PlatformSetting, Category, Product, Customer, Conversation, Message, Quote, QuoteItem, Order, OrderItem, AiSettings.

#### Cómo encaja en el SaaS
Área: Prisma/base de datos. Señales detectadas: auditoria, email-verification.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Temporal

#### Problemas encontrados
- Schema alternativo stale frente al schema activo.

#### Mejoras recomendadas
- Corregir antes de producción y cubrir con prueba negativa/positiva.

#### Prioridad
Alta

### 6.242 `prisma/schema.prisma`

#### Qué hace
Archivo Prisma/base de datos. Tiene 421 líneas. Exports: . Modelos/Prisma: User, Session, EmailVerificationToken, Business, Membership, BusinessSlugHistory, AuditLog, Plan, Subscription, PlatformSetting, PlatformAdminAccess, Category, Product, Customer, Conversation, Message, Quote, QuoteItem, Order, OrderItem, AiSettings.

#### Cómo encaja en el SaaS
Área: Prisma/base de datos. Señales detectadas: platform-admin, auditoria, email-verification.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.243 `prisma/schema.sqlite.backup.prisma`

#### Qué hace
Archivo Prisma/base de datos. Tiene 418 líneas. Exports: . Modelos/Prisma: User, Session, EmailVerificationToken, Business, Membership, BusinessSlugHistory, AuditLog, Plan, Subscription, PlatformSetting, Category, Product, Customer, Conversation, Message, Quote, QuoteItem, Order, OrderItem, AiSettings.

#### Cómo encaja en el SaaS
Área: Prisma/base de datos. Señales detectadas: auditoria, email-verification.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Temporal

#### Problemas encontrados
- Backup SQLite stale frente al schema activo.

#### Mejoras recomendadas
- Corregir antes de producción y cubrir con prueba negativa/positiva.

#### Prioridad
Alta

### 6.244 `prisma/seed.ts`

#### Qué hace
Archivo Prisma/base de datos. Tiene 312 líneas. Exports: . Modelos/Prisma: user, plan, business, category, product, subscription.

#### Cómo encaja en el SaaS
Área: Prisma/base de datos. Señales detectadas: email-verification.

#### Dependencias o conexiones
Imports/conexiones: @prisma/client, bcryptjs, crypto, ../lib/enums, ../lib/plans, ../lib/password-policy.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.245 `PRODUCTION_READINESS.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 164 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: IA.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.246 `proxy.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 35 líneas. Exports: proxy, config. Modelos/Prisma: businessSlugHistory.

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: next/server, ./lib/db.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.247 `QUICK_START_SEED.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 86 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.248 `README.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 272 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: autorizacion, IA, email-verification.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.249 `ROADMAP_NEXT_STEPS.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 85 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: email-verification.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.250 `scripts/ai-origin-smoke.ts`

#### Qué hace
Script operativo o smoke test. Tiene 37 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Scripts/tests smoke. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: assert, ../app/api/ai/sales-assistant/route.

#### Estado detectado
Temporal

#### Problemas encontrados
- Script operativo/smoke; puede modificar datos locales y no reemplaza tests unitarios.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.251 `scripts/cleanup-unverified-users.ts`

#### Qué hace
Script operativo o smoke test. Tiene 46 líneas. Exports: . Modelos/Prisma: emailVerificationToken, user.

#### Cómo encaja en el SaaS
Área: Scripts/tests smoke. Señales detectadas: auditoria, email-verification, destructivo.

#### Dependencias o conexiones
Imports/conexiones: @/lib/db, @/lib/audit-log.

#### Estado detectado
Temporal

#### Problemas encontrados
- Script operativo/smoke; puede modificar datos locales y no reemplaza tests unitarios.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.252 `scripts/cleanup.js`

#### Qué hace
Script operativo o smoke test. Tiene 68 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Scripts/tests smoke. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Temporal

#### Problemas encontrados
- Script operativo/smoke; puede modificar datos locales y no reemplaza tests unitarios.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.253 `scripts/generate-diagrams.mjs`

#### Qué hace
Script operativo o smoke test. Tiene 87 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Scripts/tests smoke. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: fs, path, puppeteer, ../node_modules/@mermaid-js/mermaid-cli/src/index.js.

#### Estado detectado
Temporal

#### Problemas encontrados
- Script operativo/smoke; puede modificar datos locales y no reemplaza tests unitarios.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.254 `scripts/manual-email-verification-test.ts`

#### Qué hace
Script operativo o smoke test. Tiene 53 líneas. Exports: . Modelos/Prisma: user.

#### Cómo encaja en el SaaS
Área: Scripts/tests smoke. Señales detectadas: email-verification, destructivo.

#### Dependencias o conexiones
Imports/conexiones: @/lib/db, @/lib/auth/email-verification, @/lib/email.

#### Estado detectado
Temporal

#### Problemas encontrados
- Script operativo/smoke; puede modificar datos locales y no reemplaza tests unitarios.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.255 `scripts/multitenant-audit.ts`

#### Qué hace
Script operativo o smoke test. Tiene 315 líneas. Exports: . Modelos/Prisma: user, plan, business, category, product, customer, conversation, quote, order.

#### Cómo encaja en el SaaS
Área: Scripts/tests smoke. Señales detectadas: destructivo.

#### Dependencias o conexiones
Imports/conexiones: crypto, @prisma/client, ../services/tenant-guard.

#### Estado detectado
Temporal

#### Problemas encontrados
- Script operativo/smoke; puede modificar datos locales y no reemplaza tests unitarios.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.256 `scripts/plan-smoke.ts`

#### Qué hace
Script operativo o smoke test. Tiene 154 líneas. Exports: . Modelos/Prisma: user, session, business.

#### Cómo encaja en el SaaS
Área: Scripts/tests smoke. Señales detectadas: destructivo.

#### Dependencias o conexiones
Imports/conexiones: crypto, @prisma/client, ../app/api/billing/checkout/route, ../lib/plans, ../services/plan-guard.

#### Estado detectado
Temporal

#### Problemas encontrados
- Script operativo/smoke; puede modificar datos locales y no reemplaza tests unitarios.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.257 `scripts/platform-admin-access-smoke.ts`

#### Qué hace
Script operativo o smoke test. Tiene 31 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Scripts/tests smoke. Señales detectadas: platform-admin.

#### Dependencias o conexiones
Imports/conexiones: assert, ../lib/platform-admin.

#### Estado detectado
Temporal

#### Problemas encontrados
- Script operativo/smoke; puede modificar datos locales y no reemplaza tests unitarios.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.258 `scripts/pr02-smoke.ts`

#### Qué hace
Script operativo o smoke test. Tiene 291 líneas. Exports: . Modelos/Prisma: user, session, plan, business.

#### Cómo encaja en el SaaS
Área: Scripts/tests smoke. Señales detectadas: autorizacion, tipado-debil, destructivo.

#### Dependencias o conexiones
Imports/conexiones: crypto, node:assert/strict, @/lib/db, @/services/authorization, @/lib/auth/guards, @/app/api/uploads/image/route, @/app/api/billing/portal/route, @/app/api/billing/checkout/route.

#### Estado detectado
Temporal

#### Problemas encontrados
- Usa any/@ts-ignore/@ts-expect-error o casts débiles.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.259 `scripts/pr03-smoke.ts`

#### Qué hace
Script operativo o smoke test. Tiene 282 líneas. Exports: . Modelos/Prisma: user, session, plan, business, category, product.

#### Cómo encaja en el SaaS
Área: Scripts/tests smoke. Señales detectadas: IA, TODO, destructivo.

#### Dependencias o conexiones
Imports/conexiones: node:assert/strict, @/lib/db, @/lib/enums, @/app/api/ai/sales-assistant/route.

#### Estado detectado
Temporal

#### Problemas encontrados
- Contiene TODO/FIXME pendiente.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.260 `scripts/pr04-smoke.ts`

#### Qué hace
Script operativo o smoke test. Tiene 304 líneas. Exports: . Modelos/Prisma: user, session, plan, business.

#### Cómo encaja en el SaaS
Área: Scripts/tests smoke. Señales detectadas: destructivo.

#### Dependencias o conexiones
Imports/conexiones: node:crypto, node:assert/strict, @/lib/db, @/app/api/uploads/image/route.

#### Estado detectado
Temporal

#### Problemas encontrados
- Script operativo/smoke; puede modificar datos locales y no reemplaza tests unitarios.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.261 `scripts/pr05-smoke.ts`

#### Qué hace
Script operativo o smoke test. Tiene 334 líneas. Exports: . Modelos/Prisma: user, session, plan.

#### Cómo encaja en el SaaS
Área: Scripts/tests smoke. Señales detectadas: autorizacion, destructivo.

#### Dependencias o conexiones
Imports/conexiones: node:crypto, node:assert/strict, @/lib/db, @/lib/enums, @/lib/auth, @/lib/auth/permissions, @/services/authorization, @/app/api/uploads/image/route.

#### Estado detectado
Temporal

#### Problemas encontrados
- Script operativo/smoke; puede modificar datos locales y no reemplaza tests unitarios.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.262 `scripts/pr06-smoke.ts`

#### Qué hace
Script operativo o smoke test. Tiene 320 líneas. Exports: . Modelos/Prisma: business, auditLog, user, session, plan, category.

#### Cómo encaja en el SaaS
Área: Scripts/tests smoke. Señales detectadas: auditoria, IA, destructivo.

#### Dependencias o conexiones
Imports/conexiones: node:crypto, node:assert/strict, @/lib/db, @/lib/audit-log, @/lib/enums, @/app/api/uploads/image/route, @/app/api/ai/sales-assistant/route.

#### Estado detectado
Temporal

#### Problemas encontrados
- Script operativo/smoke; puede modificar datos locales y no reemplaza tests unitarios.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.263 `scripts/pr07-smoke.ts`

#### Qué hace
Script operativo o smoke test. Tiene 216 líneas. Exports: . Modelos/Prisma: business, auditLog, user, session, category, product.

#### Cómo encaja en el SaaS
Área: Scripts/tests smoke. Señales detectadas: auditoria, IA, destructivo.

#### Dependencias o conexiones
Imports/conexiones: node:assert/strict, @/lib/db, @/lib/enums, @/lib/plans, @/app/api/ai/sales-assistant/route, @/services/plan-guard.

#### Estado detectado
Temporal

#### Problemas encontrados
- Script operativo/smoke; puede modificar datos locales y no reemplaza tests unitarios.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.264 `scripts/pr071-smoke.ts`

#### Qué hace
Script operativo o smoke test. Tiene 276 líneas. Exports: . Modelos/Prisma: business, auditLog, user, session.

#### Cómo encaja en el SaaS
Área: Scripts/tests smoke. Señales detectadas: auditoria, destructivo.

#### Dependencias o conexiones
Imports/conexiones: node:crypto, node:assert/strict, node:fs/promises, node:path, @/lib/db, @/lib/plans, @/app/api/uploads/image/route, @/services/plan-guard.

#### Estado detectado
Temporal

#### Problemas encontrados
- Script operativo/smoke; puede modificar datos locales y no reemplaza tests unitarios.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.265 `scripts/reset-admin-users.ts`

#### Qué hace
Script operativo o smoke test. Tiene 167 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Scripts/tests smoke. Señales detectadas: email-verification, destructivo.

#### Dependencias o conexiones
Imports/conexiones: @prisma/client, bcryptjs, crypto, fs, path, ../lib/enums, ../lib/password-policy.

#### Estado detectado
Temporal

#### Problemas encontrados
- Script operativo/smoke; puede modificar datos locales y no reemplaza tests unitarios.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.266 `scripts/security-smoke.ts`

#### Qué hace
Script operativo o smoke test. Tiene 289 líneas. Exports: . Modelos/Prisma: user, session, plan, business, category, product, customer, conversation.

#### Cómo encaja en el SaaS
Área: Scripts/tests smoke. Señales detectadas: destructivo.

#### Dependencias o conexiones
Imports/conexiones: crypto, @prisma/client, ../app/api/ai/sales-assistant/route, ../app/api/catalog/track/route, ../app/api/store-slug-redirect/route, ../app/api/uploads/image/route, ../lib/auth, ../services/plan-guard.

#### Estado detectado
Temporal

#### Problemas encontrados
- Script operativo/smoke; puede modificar datos locales y no reemplaza tests unitarios.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.267 `scripts/test-request-origins.ts`

#### Qué hace
Script operativo o smoke test. Tiene 39 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Scripts/tests smoke. Señales detectadas: tipado-debil.

#### Dependencias o conexiones
Imports/conexiones: @/lib/request-security.

#### Estado detectado
Temporal

#### Problemas encontrados
- Usa any/@ts-ignore/@ts-expect-error o casts débiles.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.268 `SECURITY_AND_RBAC.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 142 líneas. Exports: . Modelos/Prisma: product.

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: autorizacion, platform-admin, auditoria, destructivo.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.269 `SEED_SETUP_GUIDE.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 182 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: TODO.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Contiene TODO/FIXME pendiente.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.270 `services/audit-log.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 9 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Servicios dominio. Señales detectadas: auditoria.

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.271 `services/authorization.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 274 líneas. Exports: AuthenticationError, AuthorizationError, StoreSelectionRequiredError, StorePermission, requireAuth, getCurrentUserAccess, requirePlatformAdminAccess, getAccessibleBusinesses. Modelos/Prisma: business.

#### Cómo encaja en el SaaS
Área: Servicios dominio. Señales detectadas: autorizacion, platform-admin, email-verification.

#### Dependencias o conexiones
Imports/conexiones: next/headers, next/navigation, @/lib/db, @/lib/auth, @/lib/enums, @/lib/auth/permissions, @/services/plan-guard.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.272 `services/plan-guard.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 444 líneas. Exports: platformFullAccessPlan, PlanAccessError, effectivePlanLimits, getPlanLimits, getBusinessPlan, planDisplayName, allowedTemplatesForPlan, assertTemplateAllowed. Modelos/Prisma: business, product, category, membership.

#### Cómo encaja en el SaaS
Área: Servicios dominio. Señales detectadas: auditoria.

#### Dependencias o conexiones
Imports/conexiones: @/lib/db, @/lib/auth, @/lib/enums, @/lib/plans, @/services/audit-log.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.273 `services/product-search.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 297 líneas. Exports: RelevantProduct, ProductSearchAnalysis, analyzeProductQuery, searchRelevantProducts. Modelos/Prisma: product.

#### Cómo encaja en el SaaS
Área: Servicios dominio. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: @/lib/db, @/lib/enums, @/lib/format.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.274 `services/tenant-guard.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 88 líneas. Exports: TenantAccessError, assertBusinessOwner, getBusinessBySlugForPublic, resolveTenantCategoryId, assertTenantProduct, assertTenantCustomer, assertTenantConversation, assertTenantQuote. Modelos/Prisma: business, category, product, customer, conversation, quote, order.

#### Cómo encaja en el SaaS
Área: Servicios dominio. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: @prisma/client, @/lib/db.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.275 `tailwind.config.ts`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 22 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: tailwindcss.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.276 `templates/BoutiquePremiumCatalog.tsx`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 73 líneas. Exports: BoutiquePremiumCatalog. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Templates catalogo. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: @/components/catalog/CatalogControls, @/components/catalog/EmptyCatalogState, @/components/catalog/CatalogHeader, @/components/catalog/ProductCard, @/components/catalog/SafeImage, @/components/StoreChat, @/lib/catalog.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.277 `templates/FastSalesCatalog.tsx`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 69 líneas. Exports: FastSalesCatalog. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Templates catalogo. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: @/components/catalog/CatalogControls, @/components/catalog/EmptyCatalogState, @/components/catalog/CatalogHeader, @/components/catalog/ProductCard, @/components/catalog/SafeImage, @/components/StoreChat, @/lib/catalog.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.278 `templates/ModernGridCatalog.tsx`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 76 líneas. Exports: ModernGridCatalog. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Templates catalogo. Señales detectadas: TODO.

#### Dependencias o conexiones
Imports/conexiones: @/components/catalog/CatalogControls, @/components/catalog/EmptyCatalogState, @/components/catalog/CatalogHeader, @/components/catalog/ProductCard, @/components/catalog/SafeImage, @/components/StoreChat, @/lib/catalog.

#### Estado detectado
Parcial

#### Problemas encontrados
- Contiene TODO/FIXME pendiente.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Media

### 6.279 `templates/TechProCatalog.tsx`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 76 líneas. Exports: TechProCatalog. Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Templates catalogo. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: @/components/catalog/CatalogControls, @/components/catalog/EmptyCatalogState, @/components/catalog/CatalogHeader, @/components/catalog/ProductCard, @/components/catalog/SafeImage, @/components/StoreChat, @/lib/catalog.

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.280 `tsconfig.json`

#### Qué hace
Archivo de configuración, librería o soporte. Tiene 42 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- No se detectaron problemas específicos en lectura estática.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.281 `UI_POLISH_AND_CLIENT_EXPERIENCE.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 61 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

### 6.282 `UX_IMPROVEMENTS.md`

#### Qué hace
Documento Markdown del proyecto. Tiene 64 líneas. Exports: . Modelos/Prisma: .

#### Cómo encaja en el SaaS
Área: Configuracion/proyecto. Señales detectadas: .

#### Dependencias o conexiones
Imports/conexiones: .

#### Estado detectado
Correcto

#### Problemas encontrados
- Riesgo principal: desactualización frente al código actual.

#### Mejoras recomendadas
- Mantener cobertura y revisar cuando cambien dependencias relacionadas.

#### Prioridad
Informativa

## 7. Funcionalidades integradas
| Funcionalidad | Estado | Archivos relacionados | Comentario |
| --- | --- | --- | --- |
| Auth | Parcial | lib/auth.ts, app/(auth)/actions.ts | Login y sesiones funcionan; email/cookies pendientes |
| Registro | Parcial | app/register/page.tsx | Turnstile/email dependen de configuración |
| Login | Correcto | app/login/page.tsx | Credenciales y sesión |
| Verificación email | Parcial | lib/emailVerification.ts, app/verify-email/** | Tokens hash; provider parcial |
| Turnstile | Parcial | components/TurnstileWidget.tsx | CSP/config pendiente |
| Dashboard | Parcial | app/dashboard/** | Protegido por requireStoreAccess |
| Productos | Correcto | app/dashboard/products/** | CRUD con businessId y plan |
| Categorías | Correcto | app/dashboard/categories/** | CRUD tenant |
| Catálogo público | Parcial | app/store/** | Templates; dominio verified pendiente |
| Configuración tienda | Correcto | app/dashboard/settings/** | Zod, slug, temas, IA |
| Roles/permisos | Parcial | services/authorization.ts | RBAC bueno; admin legacy pendiente |
| Platform admin | Parcial | app/platform-admin/** | Panel completo; owner hard-coded |
| Planes y límites | Parcial | lib/plans/** | Entitlements; billing incompleto |
| Uploads | Correcto | app/api/uploads/image/route.ts | MIME, magic bytes, tenant |
| IA | Parcial | app/api/ai/sales-assistant/route.ts | Rate limit y tenant; flag por tienda pendiente |
| Auditoría/logs | Parcial | lib/audit-log.ts | Sanitiza; no cubre APIs críticas |
| Tests | Parcial | scripts/*smoke.ts | Pasan; falta unit/e2e |
| Documentación | Parcial | docs/** | Abundante; revisar frescura |

## 8. Funcionalidades faltantes, incompletas o no integradas
| Funcionalidad | Evidencia | Qué falta | Riesgo | Prioridad |
| --- | --- | --- | --- | --- |
| Guardas API admin | Tres rutas admin sin requirePlatformAdmin | Auth, rate limit, auditoría | Crítico | Crítica |
| Dominio custom seguro | Ruta domains sin permisos y catálogo no exige verified | Permisos, crypto token, verified=true | Crítico | Crítica |
| Billing real | Checkout/portal 501 y webhook no actualiza | Proveedor, idempotencia, transacciones | Alto | Alta |
| Turnstile producción | CSP/config parcial | Keys obligatorias y CSP | Alto | Alta |
| Tests unit/e2e | No hay tests/ ni Jest/Vitest/Playwright | Cobertura formal | Alto | Alta |
| SCA dependencias | npm audit/outdated no verificables | Entorno autorizado/mirror privado | Medio | Media |

## 9. Fallos detectados
### 9.1 Fallos críticos
| Archivo | Problema | Impacto | Recomendación | Prioridad |
| --- | --- | --- | --- | --- |
| app/api/admin/metrics-history/route.ts | Expone métricas históricas globales sin autenticación. | Riesgo de fuga o mutación global no autorizada | Agregar autorización explícita, rate limit, auditoría y tests | Crítica |
| app/api/admin/sync-metrics/route.ts | Expone métricas owner-level sin autenticación. | Riesgo de fuga o mutación global no autorizada | Agregar autorización explícita, rate limit, auditoría y tests | Crítica |
| app/api/stores/[id]/domains/route.ts | Permite mutar/verificar dominios custom por id sin requireStoreAccess. | Riesgo de fuga o mutación global no autorizada | Agregar autorización explícita, rate limit, auditoría y tests | Crítica |
| app/api/admin/export-owner-csv/route.ts | Exporta CSV de tiendas/dueños/ingresos sin autenticación ni autorización. | Riesgo de fuga o mutación global no autorizada | Agregar autorización explícita, rate limit, auditoría y tests | Crítica |

### 9.2 Fallos altos
| Archivo | Problema | Impacto | Recomendación | Prioridad |
| --- | --- | --- | --- | --- |
| app/api/billing/checkout/route.ts | Checkout devuelve 501 y usa skipEmailVerification. | Riesgo alto para producción o venta | Corregir antes de release comercial | Alta |
| prisma/schema_postgres.prisma | Schema alternativo stale frente al schema activo. | Riesgo alto para producción o venta | Corregir antes de release comercial | Alta |
| lib/rate-limit.ts | Fallback de rate limit en memoria no es suficiente para producción multi-instancia. | Riesgo alto para producción o venta | Corregir antes de release comercial | Alta |
| prisma/schema.sqlite.backup.prisma | Backup SQLite stale frente al schema activo. | Riesgo alto para producción o venta | Corregir antes de release comercial | Alta |
| lib/platform-admin.ts | Dueño OWNER hard-coded y fallback por código. | Riesgo alto para producción o venta | Corregir antes de release comercial | Alta |
| app/admin/actions.ts | Admin legacy usa Math.random para token de dominio y permisos globales legacy. | Riesgo alto para producción o venta | Corregir antes de release comercial | Alta |
| lib/turnstile.ts | Turnstile puede omitirse por mala configuración de site key pública. | Riesgo alto para producción o venta | Corregir antes de release comercial | Alta |
| app/store/[slug]/page.tsx | Resuelve customDomain sin exigir customDomainVerified=true. | Riesgo alto para producción o venta | Corregir antes de release comercial | Alta |
| .env.example | DATABASE_URL de ejemplo usa SQLite aunque schema.prisma activo usa PostgreSQL. | Riesgo alto para producción o venta | Corregir antes de release comercial | Alta |
| app/api/billing/webhook/route.ts | Webhook valida firma pero no aplica eventos a Subscription ni idempotencia. | Riesgo alto para producción o venta | Corregir antes de release comercial | Alta |
| lib/security/tenant.ts | assertCanManageUser podría devolver usuarios fuera del tenant si se usa. | Riesgo alto para producción o venta | Corregir antes de release comercial | Alta |
| prisma/migrations/20260528031849_npx_prisma_validatenpx_prisma_migrate_status/migration.sql | Migración placeholder sin cambios reales. | Riesgo alto para producción o venta | Corregir antes de release comercial | Alta |
| app/middleware.ts | Está dentro de app/ y parece no ser el middleware activo; el build reporta proxy.ts. | Riesgo alto para producción o venta | Corregir antes de release comercial | Alta |
| next.config.mjs | CSP de producción permite unsafe-inline y no lista explícitamente Cloudflare Turnstile. | Riesgo alto para producción o venta | Corregir antes de release comercial | Alta |
| app/(auth)/actions.ts | Registro crea sesión antes de verificar email, usa cookie selected business httpOnly=false y no bloquea si falla email. | Riesgo alto para producción o venta | Corregir antes de release comercial | Alta |
| lib/email.ts | El fallo del proveedor de email no siempre detiene el flujo de verificación. | Riesgo alto para producción o venta | Corregir antes de release comercial | Alta |

### 9.3 Fallos medios
| Archivo | Problema | Impacto | Recomendación | Prioridad |
| --- | --- | --- | --- | --- |
| components/OwnerMetricsChart.tsx | Casts any | Menor confianza de tipos | Tipar Chart.js | Media |
| scripts/*smoke.ts | Pruebas escriben en DB local | No reemplazan unit/e2e | Separar entorno test | Media |
| docs/** | Posible desactualización | Decisiones con docs viejas | Actualizar tras PRs | Media |

### 9.4 Fallos bajos
| Archivo | Problema | Impacto | Recomendación | Prioridad |
| --- | --- | --- | --- | --- |
| scripts/generate-diagrams.mjs | Artefactos pueden quedar obsoletos | Bajo | Regenerar diagramas | Baja |
| LICENSE | Sin impacto técnico directo | Informativo | Validar legal antes de vender | Informativa |

## 10. Seguridad
| Área | Archivo | Riesgo | Impacto | Recomendación | Severidad |
| --- | --- | --- | --- | --- | --- |
| Autorización admin | app/api/admin/export-owner-csv/route.ts | Sin guardia | Exfiltración | requirePlatformAdmin | Crítica |
| Autorización admin | app/api/admin/metrics-history/route.ts | Sin guardia | Métricas expuestas | requirePlatformAdmin | Crítica |
| Autorización admin | app/api/admin/sync-metrics/route.ts | Sin guardia | Métricas expuestas | requirePlatformAdmin | Crítica |
| Dominios | app/api/stores/[id]/domains/route.ts | Sin permisos | Secuestro dominio | requireStoreAccess + crypto | Crítica |
| Custom domain | app/store/[slug]/page.tsx | No exige verified | Tenant por dominio no validado | customDomainVerified=true | Alta |
| Auth | app/(auth)/actions.ts | Cookie/verificación parcial | Signup endurecido incompleto | Unificar cookie/email verification | Alta |
| Turnstile/CSP | next.config.mjs, lib/turnstile.ts | Config parcial | CAPTCHA roto/ausente | CSP y env validation | Alta |
| Rate limit | lib/rate-limit.ts | Memoria local | Bypass multi-instancia | Backend externo obligatorio | Alta |
| Secrets | .env/.env.local | Detectados pero no leídos | Exposición si se documentan | Gestionar por secret manager | Alta |

## 11. Multi-tenant
| Archivo | Riesgo multi-tenant | Evidencia | Recomendación | Prioridad |
| --- | --- | --- | --- | --- |
| app/api/stores/[id]/domains/route.ts | Mutación por id sin tenant guard | No usa requireStoreAccess | Exigir manage_settings | Crítica |
| app/api/admin/export-owner-csv/route.ts | Consulta todas las tiendas sin guardia | findMany global | Solo platform OWNER/BILLING | Crítica |
| app/api/admin/metrics-history/route.ts | Métricas globales públicas | orders/business/subscription global | Proteger | Crítica |
| app/store/[slug]/page.tsx | Dominio custom no verificado | findFirst customDomain | verified=true | Alta |
| lib/security/tenant.ts | Helper potencialmente fuga usuarios | findUnique user sin membership | Corregir o eliminar | Alta |
| services/authorization.ts | Patrón positivo | accessWhere owner/membership | Mantener central | Media |

## 12. Prisma y base de datos
schema.prisma valida y usa PostgreSQL con índices relevantes por businessId, slugs, estados y relaciones. Riesgos: roles/estados como strings, backups stale, migración placeholder, schema_postgres alternativo desactualizado, billing webhook sin persistencia/idempotencia y necesidad de probar migraciones desde base limpia.

## 13. Frontend, UX y UI
Dashboard y catálogo tienen base usable, componentes reutilizables, estados vacíos y templates. Deudas: páginas admin muy grandes, tablas anchas, estados de error de email/billing, CSP para Turnstile, casts any en gráficos/productos y QA responsive/accesibilidad antes de venta.

## 14. Backend, API y Server Actions
Server Actions del dashboard suelen validar con requireStoreAccess, Zod, businessId y plan guards. Uploads e IA están relativamente endurecidos. APIs admin legacy y domains route son los puntos más débiles. Billing está validado pero funcionalmente incompleto.

## 15. IA e integraciones
La IA filtra por tienda activa/publicSlug, limita payload, aplica origin check, rate limit, plan gates, búsqueda de productos por businessId y auditoría sin mensaje completo. Falta flag por tienda, medición de costos/tokens, manejo avanzado de provider down y pruebas de prompt injection.

## 16. Email verification, Turnstile y antispam
Email verification usa token hash, expiración, consumedAt, requestIp e invalidación previa. Riesgos: send email no bloquea siempre, resend depende de provider, Turnstile puede omitirse por configuración y CSP no lista Cloudflare. Faltan tests de expiración, reuso, cooldown y token inválido.

## 17. Testing
| Área | Tests existentes | Tests faltantes | Prioridad |
| --- | --- | --- | --- |
| Auth | Smoke indirecto | Registro, cookies, sesiones expiradas | Alta |
| Multi-tenant | multitenant/pr smokes | APIs admin/domain/catalog e2e | Crítica |
| Platform-admin | platform-admin smoke | Roles OWNER/ADMIN/SUPPORT/BILLING UI/API | Alta |
| Email | manual script | Expirado, consumido, provider down | Alta |
| Turnstile | No dedicado | Token inválido, producción sin key, CSP | Alta |
| Uploads | security/pr smokes | Storage externo y borrado cross-tenant | Alta |
| IA | pr03/pr06/pr07 | Costos, prompt injection, provider down | Alta |
| Billing | plan smoke | Webhook/checkout/portal real | Alta |

## 18. Código muerto, duplicado, temporal o innecesario
| Archivo | Tipo de problema | Evidencia | Recomendación | Prioridad |
| --- | --- | --- | --- | --- |
| app/middleware.ts | Posiblemente muerto | Dentro de app; build reporta proxy.ts | Consolidar o eliminar | Alta |
| prisma/schema_postgres.prisma | Stale | Difiere de schema.prisma | Sincronizar o retirar | Alta |
| prisma/schema.sqlite.backup.prisma | Backup stale | usedAt vs consumedAt | Mover a histórico | Alta |
| prisma/migrations.sqlite.backup/** | Backup histórico | Migraciones SQLite antiguas | Documentar fuera del flujo | Media |
| lib/security/*.ts | Compat/duplicado | Reexports y helper riesgoso | Eliminar/corregir | Alta |
| scripts/manual-email-verification-test.ts | Temporal | Imprime token raw | Local-only | Media |
| .vscode/settings.json | Config personal | Autoaprueba npm install | No versionar/desactivar | Media |

## 19. Buenas prácticas que ya existen
- `requireStoreAccess` centralizado. - Filtros `businessId` en la mayoría del dashboard. - Zod en formularios críticos. - Uploads con magic bytes y path traversal. - Auditoría sanitizada. - Rate limiting reutilizable. - Plan guards. - Smoke tests que pasan. - Build/lint/Prisma validate pasan.

## 20. Buenas prácticas que faltan
- Guardas en todas las APIs admin/globales. - Tests unit/e2e. - Rate limit distribuido obligatorio. - Validación env. - Billing real con idempotencia. - Backups/restore. - Observabilidad/alertas. - CI/CD completo. - CSP por proveedor. - Documentar admin legacy vs platform-admin.

## 21. Comandos de verificación ejecutados
| Comando | Resultado | Error si existe | Recomendación |
| --- | --- | --- | --- |
| npx prisma validate | Correcto | Schema válido | Mantener en CI |
| npx prisma generate | Correcto | Cliente generado | Mantener en build |
| npx prisma migrate status | Correcto | PostgreSQL local al día con 4 migraciones | Validar base limpia |
| npm run lint | Correcto | Sin errores | Mantener |
| npm test | Correcto | Pasaron smoke tests plans/security/platform-admin/PR-02..PR-07.1 | Agregar unit/e2e |
| npm run build | Correcto | Next build y TypeScript pasaron | Mantener bloqueo PR |
| npm outdated | Falló/no verificable | EACCES y escalado rechazado por riesgo de divulgar metadatos al registry | Ejecutar en entorno autorizado/mirror privado |
| npm audit | Falló/no verificable | Audit endpoint falló y escalado rechazado por envío de inventario a npm público | Ejecutar en entorno autorizado/SCA privado |

## 22. Roadmap de mejoras
### Fase 1: Crítico antes de producción
| Tarea | Archivos afectados | Impacto | Dificultad | Prioridad |
| --- | --- | --- | --- | --- |
| Proteger exportación CSV owner | app/api/admin/export-owner-csv/route.ts | Evita exfiltración de tiendas, dueños e ingresos | Media | Crítica |
| Proteger métricas globales | app/api/admin/metrics-history/route.ts, app/api/admin/sync-metrics/route.ts | Cierra endpoints públicos de inteligencia comercial | Media | Crítica |
| Bloquear mutación insegura de dominios | app/api/stores/[id]/domains/route.ts | Evita secuestro o modificación de dominios de tiendas | Media | Crítica |
| Exigir dominio verificado en catálogo | app/store/[slug]/page.tsx | Impide servir tiendas desde dominios no validados | Baja | Alta |

### Fase 2: Seguridad y multi-tenant
| Tarea | Archivos afectados | Impacto | Dificultad | Prioridad |
| --- | --- | --- | --- | --- |
| Unificar admin legacy y platform-admin | lib/auth.ts, lib/platform-admin.ts, app/admin/**, app/platform-admin/** | Reduce confusión de roles globales y permisos | Alta | Alta |
| Corregir helper de usuarios tenant | lib/security/tenant.ts | Evita fuga cross-tenant si el helper se integra | Baja | Alta |
| Endurecer registro y verificación de email | app/(auth)/actions.ts, lib/email.ts, services/authorization.ts | Mejora protección de cuentas nuevas | Media | Alta |
| Hacer rate limit distribuido obligatorio | lib/rate-limit.ts, .env.example | Evita bypass en despliegues multi-instancia | Media | Alta |

### Fase 3: Estabilidad y testing
| Tarea | Archivos afectados | Impacto | Dificultad | Prioridad |
| --- | --- | --- | --- | --- |
| Agregar tests negativos para APIs críticas | app/api/admin/**, app/api/stores/[id]/domains/route.ts, tests/** | Evita regresiones de autorización | Media | Alta |
| Crear suite unit para auth, planes y validaciones | lib/**, services/**, tests/** | Detecta errores rápidos sin tocar DB real | Media | Alta |
| Probar migraciones desde base limpia | prisma/migrations/**, prisma/schema.prisma | Reduce riesgo de deploy y drift | Media | Alta |
| Separar smoke tests destructivos de CI rápido | scripts/*smoke.ts, package.json | Mejora confiabilidad de pipeline | Media | Media |

### Fase 4: UX/UI comercial
| Tarea | Archivos afectados | Impacto | Dificultad | Prioridad |
| --- | --- | --- | --- | --- |
| Mejorar UX de verificación de email | app/verify-email/page.tsx, app/verify-email-prompt/page.tsx, app/register/page.tsx | Reduce fricción de alta de tiendas | Media | Media |
| Pulir pantalla de billing incompleto | app/settings/billing/page.tsx, app/api/billing/** | Evita prometer checkout que aún no existe | Baja | Alta |
| Dividir páginas admin grandes | app/platform-admin/page.tsx, app/admin/page.tsx | Mejora mantenibilidad y performance percibida | Media | Media |
| Revisar responsive de tablas | app/platform-admin/page.tsx, app/admin/stores/[id]/page.tsx, dashboard tables | Mejora uso operativo en pantallas pequeñas | Media | Media |

### Fase 5: Escalabilidad y rendimiento
| Tarea | Archivos afectados | Impacto | Dificultad | Prioridad |
| --- | --- | --- | --- | --- |
| Migrar uploads a storage externo | app/api/uploads/image/route.ts, components/ImageDropzone.tsx | Escala mejor en serverless/producción | Alta | Media |
| Optimizar consultas de dashboard/admin | app/dashboard/page.tsx, app/platform-admin/page.tsx, app/admin/page.tsx | Reduce latencia en cuentas grandes | Media | Media |
| Incorporar observabilidad | lib/audit-log.ts, app/api/**, docs/** | Permite detectar incidentes y abuso | Media | Alta |
| Definir backups y restore PostgreSQL | prisma/**, docs/** | Reduce riesgo operativo serio | Media | Alta |

### Fase 6: Funciones comerciales para vender mejor el SaaS
| Tarea | Archivos afectados | Impacto | Dificultad | Prioridad |
| --- | --- | --- | --- | --- |
| Implementar checkout y portal reales | app/api/billing/checkout/route.ts, app/api/billing/portal/route.ts, lib/billing.ts | Habilita monetización self-service | Alta | Alta |
| Procesar webhooks con idempotencia | app/api/billing/webhook/route.ts, prisma/schema.prisma | Mantiene planes y suscripciones consistentes | Alta | Alta |
| Convertir dominios custom en feature premium segura | app/api/stores/[id]/domains/route.ts, app/dashboard/settings/**, services/plan-guard.ts | Aumenta valor comercial del plan alto | Alta | Alta |
| Analytics comercial por tienda | app/dashboard/**, app/api/catalog/track/route.ts, app/api/ai/sales-assistant/route.ts | Mejora propuesta de valor para clientes | Media | Media |

## 23. Conclusión final
El proyecto no está listo para producción ni venta sin un PR de seguridad previo. La base funcional es buena y las verificaciones locales pasan, pero las APIs admin sin guardia, dominios custom inseguros, billing incompleto y configuración parcial de Turnstile/CSP bloquean un lanzamiento serio. El siguiente PR debe proteger las rutas críticas, exigir customDomainVerified, unificar platform-admin/admin legacy, endurecer email/Turnstile y agregar pruebas e2e negativas.
