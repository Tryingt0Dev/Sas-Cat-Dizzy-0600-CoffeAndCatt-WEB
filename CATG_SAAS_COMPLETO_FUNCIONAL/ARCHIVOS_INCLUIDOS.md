# ARCHIVOS INCLUIDOS - CATG SAAS COMPLETO FUNCIONAL

Este inventario fue generado desde la carpeta `CATG_SAAS_COMPLETO_FUNCIONAL` despues de copiar el paquete limpio. No incluye `node_modules`, `.next`, secretos reales, logs, bases locales, uploads generados ni backups SQLite antiguos.

Total de archivos incluidos en el paquete limpio: **271**.

| Archivo | Tipo | Por que es necesario | Que pasa si falta |
| ------- | ---- | -------------------- | ----------------- |
| $(Escape-Md .env.example) | Variables de entorno | Plantilla segura para crear .env sin secretos reales | El instalador no sabe que variables configurar |
| $(Escape-Md .gitattributes) | Control de repositorio | Normaliza atributos de Git del proyecto | Puede haber diferencias de formato entre entornos |
| $(Escape-Md .gitignore) | Control de repositorio | Evita versionar builds, dependencias, bases locales y secretos | Se pueden incluir archivos generados o secretos por accidente |
| $(Escape-Md ADMIN_PANEL_AND_CODE_OPTIMIZATION.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md ADMIN_PANEL.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md app\(auth)\actions.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\admin\actions.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\admin\layout.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\admin\owner\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\admin\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\admin\stores\[id]\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\api\admin\businesses\route.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\api\admin\export-owner-csv\route.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\api\admin\metrics-history\route.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\api\admin\sync-metrics\route.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\api\ai\sales-assistant\route.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\api\auth\resend-verification\route.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\api\billing\checkout\route.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\api\billing\portal\route.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\api\billing\webhook\route.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\api\catalog\track\route.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\api\health\route.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\api\platform-admin\summary\route.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\api\store-slug-redirect\route.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\api\stores\[id]\domains\route.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\api\uploads\image\route.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\dashboard\categories\actions.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\dashboard\categories\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\dashboard\conversations\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\dashboard\customers\[id]\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\dashboard\customers\actions.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\dashboard\customers\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\dashboard\design\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\dashboard\layout.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\dashboard\learning\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\dashboard\orders\[id]\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\dashboard\orders\actions.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\dashboard\orders\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\dashboard\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\dashboard\products\actions.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\dashboard\products\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\dashboard\products\ProductCreateDrawer.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\dashboard\products\ProductTableActions.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\dashboard\quotes\[id]\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\dashboard\quotes\actions.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\dashboard\quotes\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\dashboard\settings\actions.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\dashboard\settings\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\dashboard\settings\SettingsUnsavedGuard.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\globals.css) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md app\layout.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\login\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\middleware.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\onboarding\theme\actions.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\onboarding\theme\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\platform-admin\actions.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\platform-admin\layout.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\platform-admin\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\platform-admin\PlatformAccessUserPicker.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\register\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\select-store\actions.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\select-store\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\settings\appearance\actions.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\settings\appearance\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\settings\billing\actions.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\settings\billing\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\store\[slug]\layout.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\store\[slug]\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\store\[slug]\product\[productSlug]\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\verify-email-prompt\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md app\verify-email\page.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md ARCHIVOS_INCLUIDOS.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md AUTH_SECURITY_AND_ADMIN_SEED.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md BILLING_AND_PLANS.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md components\ActionMenu.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\AiSourceBadge.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\Button.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\Card.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\catalog\AskAiButton.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\catalog\CatalogControls.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\catalog\CatalogHeader.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\catalog\CatalogProductTracker.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\catalog\EmptyCatalogState.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\catalog\ProductAttributeDisplay.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\catalog\ProductCard.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\catalog\SafeImage.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\catalog\WhatsAppProductButton.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\CompactCard.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\ConfirmSubmitButton.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\CopyButton.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\DashboardNav.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\DashboardNavClient.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\DrawerForm.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\EmptyState.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\FloatingPlatformAdminButton.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\FloatingPlatformAdminGate.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\FormField.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\FormSection.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\HelpTooltip.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\ImageDropzone.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\InfoBox.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\InfoCard.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\Input.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\LearningLink.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\OnboardingChecklist.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\OwnerMetricsChart.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\OwnerMetricsSync.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\PageHeader.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\PendingSubmitButton.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\PrintButton.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\ProductAttributesFields.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\QuickActions.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\RegisterCredentialsFields.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\SectionCard.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\SectionGuide.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\StatusAlert.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\StatusBadge.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\StepGuide.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\StoreChat.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\StoreShareCard.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\theme\CatalogPaletteBar.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\theme\CatalogPaletteCard.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\theme\CatalogPaletteSelector.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\theme\CatalogPreview.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\theme\ColorSwatches.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\theme\LiveThemeColorControls.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\theme\SaaSThemeCard.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\theme\SaaSThemeProvider.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\theme\SaaSThemeSelector.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md components\TurnstileWidget.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md docs\ARCHITECTURE.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md docs\AUDIT_FINAL.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md docs\AUDIT.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md docs\AUDITORIA_ARCHIVO_POR_ARCHIVO_SAAS.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md docs\AUDITORIA_SEGUNDA_FASE.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md docs\AUDITORIA_SEGURIDAD.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md docs\AUDITORIA_UI_UX.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md docs\CAMBIOS_IMPLEMENTADOS.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md docs\CLEANUP_REPORT.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md docs\CLOUDFLARED_AND_DOMAINS.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md docs\diagrams\flujo-catalogo-publico.mmd) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md docs\diagrams\flujo-catalogo-publico.svg) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md docs\diagrams\flujo-chat-ia.mmd) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md docs\diagrams\flujo-chat-ia.svg) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md docs\diagrams\flujo-consultar-ia.mmd) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md docs\diagrams\flujo-consultar-ia.svg) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md docs\diagrams\flujo-cotizacion-pedido.mmd) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md docs\diagrams\flujo-cotizacion-pedido.svg) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md docs\diagrams\flujo-general.mmd) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md docs\diagrams\flujo-general.svg) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md docs\diagrams\flujo-multitenant.mmd) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md docs\diagrams\flujo-multitenant.svg) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md docs\diagrams\flujo-productos.mmd) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md docs\diagrams\flujo-productos.svg) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md docs\diagrams\flujo-superadmin.mmd) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md docs\diagrams\flujo-superadmin.svg) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md docs\diagrams\flujo-upload-imagenes.mmd) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md docs\diagrams\flujo-upload-imagenes.svg) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md docs\diagrams\flujo-whatsapp.mmd) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md docs\diagrams\flujo-whatsapp.svg) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md docs\diagrams\proyecto-completo-viewer.html) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md docs\diagrams\proyecto-completo.mmd) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md docs\diagrams\proyecto-completo.svg) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md docs\FEATURE_MAP.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md docs\FLOWS.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md docs\MAPA_PROYECTO.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md docs\MODULES.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md docs\OVERVIEW.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md docs\PLAN_ACCION_POR_ARCHIVO.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md docs\POSTGRES_MIGRATION.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md docs\PR02_TESTING_PLAN.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md docs\PRODUCTION_ROADMAP.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md docs\PROJECT_AUDIT.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md docs\QA_REPORT.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md docs\SECURITY_AUDIT.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md docs\SECURITY_SUMMARY.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md docs\TICKETS_IMPLEMENTACION_SAAS.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md DOCUMENTACION_COMPLETA_SAAS.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md eslint.config.cjs) | Lint | Configura reglas de ESLint del proyecto | npm run lint no funciona correctamente |
| $(Escape-Md INSTRUCCIONES_INSTALACION.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md lib\ai-sources.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\ai.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\audit-log.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\auth.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\auth\email-verification.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\auth\guards.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\auth\permissions.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\billing.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\catalog.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\db.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\email.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\emailVerification.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\enums.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\format.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\password-policy.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\plans\assert-feature-access.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\plans\can-use-feature.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\plans\entitlements.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\plans\feature-keys.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\plans\get-plan-entitlements.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\plans\index.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\plans\plan-types.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\plans\plans.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\platform-admin.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\rate-limit.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\request-security.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\safe-json.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\security\audit-log.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\security\rate-limit.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\security\safe-json.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\security\tenant.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\store-types.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\themes\catalog-palettes.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\themes\saas-themes.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\themes\theme-utils.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\turnstile.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md lib\validation.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md LICENSE) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md next-env.d.ts) | TypeScript | Configura tipos, paths y soporte de Next.js | TypeScript y build pierden resolucion de tipos |
| $(Escape-Md next.config.mjs) | Configuracion Next.js | Configura headers, CSP, Server Actions y origenes dev | Next.js puede compilar o servir con configuracion incorrecta |
| $(Escape-Md package-lock.json) | Lockfile npm | Fija versiones reproducibles de dependencias | npm install puede resolver versiones distintas |
| $(Escape-Md package.json) | Configuracion npm | Define scripts, dependencias y metadatos del SaaS | No funcionan npm install, lint, test, build ni dev |
| $(Escape-Md postcss.config.js) | Estilos | Configura Tailwind/PostCSS para la UI | La interfaz pierde estilos o falla el build CSS |
| $(Escape-Md prisma\migrations\20260527074044_init_postgres\migration.sql) | SQL | Define cambios de base de datos | La base no queda alineada con Prisma |
| $(Escape-Md prisma\migrations\20260528031849_npx_prisma_validatenpx_prisma_migrate_status\migration.sql) | SQL | Define cambios de base de datos | La base no queda alineada con Prisma |
| $(Escape-Md prisma\migrations\20260528090000_add_platform_admin_access\migration.sql) | SQL | Define cambios de base de datos | La base no queda alineada con Prisma |
| $(Escape-Md prisma\migrations\20260528100000_add_email_verification_and_signup_hardening\migration.sql) | SQL | Define cambios de base de datos | La base no queda alineada con Prisma |
| $(Escape-Md prisma\migrations\migration_lock.toml) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md prisma\schema_postgres.prisma) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md prisma\schema.prisma) | Archivo del proyecto | Forma parte del paquete funcional copiado | Puede faltar contexto o soporte para ejecucion |
| $(Escape-Md prisma\seed.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md PRODUCTION_READINESS.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md proxy.ts) | Middleware/Proxy | Aplica controles transversales de rutas u origenes | Se pierden protecciones o comportamiento de navegacion |
| $(Escape-Md QUICK_START_SEED.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md README.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md ROADMAP_NEXT_STEPS.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md scripts\ai-origin-smoke.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md scripts\cleanup-unverified-users.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md scripts\cleanup.js) | Configuracion/Codigo JS | Soporta configuracion o ejecucion del proyecto | Puede fallar build, scripts o tooling |
| $(Escape-Md scripts\generate-diagrams.mjs) | Configuracion/Codigo JS | Soporta configuracion o ejecucion del proyecto | Puede fallar build, scripts o tooling |
| $(Escape-Md scripts\manual-email-verification-test.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md scripts\multitenant-audit.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md scripts\plan-smoke.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md scripts\platform-admin-access-smoke.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md scripts\pr02-smoke.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md scripts\pr03-smoke.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md scripts\pr04-smoke.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md scripts\pr05-smoke.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md scripts\pr06-smoke.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md scripts\pr07-smoke.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md scripts\pr071-smoke.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md scripts\reset-admin-users.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md scripts\security-smoke.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md scripts\test-request-origins.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md SECURITY_AND_RBAC.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md SEED_SETUP_GUIDE.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md services\audit-log.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md services\authorization.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md services\plan-guard.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md services\product-search.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md services\tenant-guard.ts) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md tailwind.config.ts) | Estilos | Configura Tailwind/PostCSS para la UI | La interfaz pierde estilos o falla el build CSS |
| $(Escape-Md templates\BoutiquePremiumCatalog.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md templates\FastSalesCatalog.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md templates\ModernGridCatalog.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md templates\TechProCatalog.tsx) | Codigo TypeScript | Implementa logica o UI del SaaS | Puede fallar compilacion o funcionalidad |
| $(Escape-Md tsconfig.json) | TypeScript | Configura tipos, paths y soporte de Next.js | TypeScript y build pierden resolucion de tipos |
| $(Escape-Md UI_POLISH_AND_CLIENT_EXPERIENCE.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md UX_IMPROVEMENTS.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
| $(Escape-Md VERIFICACION_FUNCIONAL.md) | Documentacion | Conserva auditoria, arquitectura, setup o guias del SaaS | Se pierde contexto para operar y evolucionar el proyecto |
