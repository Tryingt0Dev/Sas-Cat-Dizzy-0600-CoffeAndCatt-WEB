# Flows

Este documento describe los flujos principales del SaaS con diagramas Mermaid. Los diagramas se enfocan en el comportamiento actual del sistema y en los limites multi-tenant que deben mantenerse.

## 🎨 Cómo ver los diagramas

> **Nota**: Si VS Code no muestra los diagramas correctamente (aparecen negros), abre los archivos SVG/PNG generados directamente en el navegador.

### Generar diagramas SVG y PNG

Los diagramas se pueden exportar como archivos SVG y PNG con fondo blanco para mejor visualización:

```bash
# Instalar dependencias
npm install

# Generar todos los diagramas (SVG y PNG)
npm run diagrams:all
```

### Archivos generados

Una vez ejecutado `npm run diagrams:all`, los archivos SVG estarán disponibles en `docs/diagrams/`:

- [proyecto-completo.svg](diagrams/proyecto-completo.svg)
- [flujo-general.svg](diagrams/flujo-general.svg)
- [flujo-multitenant.svg](diagrams/flujo-multitenant.svg)
- [flujo-catalogo-publico.svg](diagrams/flujo-catalogo-publico.svg)
- [flujo-chat-ia.svg](diagrams/flujo-chat-ia.svg)
- [flujo-consultar-ia.svg](diagrams/flujo-consultar-ia.svg)
- [flujo-whatsapp.svg](diagrams/flujo-whatsapp.svg)
- [flujo-upload-imagenes.svg](diagrams/flujo-upload-imagenes.svg)
- [flujo-productos.svg](diagrams/flujo-productos.svg)
- [flujo-cotizacion-pedido.svg](diagrams/flujo-cotizacion-pedido.svg)
- [flujo-superadmin.svg](diagrams/flujo-superadmin.svg)

### Abrir en navegador

Para abrir un diagrama en el navegador (en Windows):

```bash
start docs\diagrams\flujo-general.svg
start docs\diagrams\proyecto-completo.svg
```

O con otros navegadores:

```bash
# Chrome
chrome docs\diagrams\flujo-general.svg

# Edge
msedge docs\diagrams\flujo-general.svg
```

---

## 0. Proyecto Completo

**Archivo Mermaid**: [docs/diagrams/proyecto-completo.mmd](diagrams/proyecto-completo.mmd)  
**SVG generado**: [proyecto-completo.svg](diagrams/proyecto-completo.svg)  
**PNG generado**: [proyecto-completo.png](diagrams/proyecto-completo.png)
**Visor con zoom**: [proyecto-completo-viewer.html](diagrams/proyecto-completo-viewer.html)

Diagrama profesional completo del software: usuarios, zona publica, autenticacion, tenant, dashboard, catalogo publico, chat IA, upload, modelo Prisma, seguridad y superadmin.

![Proyecto completo](diagrams/proyecto-completo.svg)

## 1. Flujo General SaaS

**Archivo Mermaid**: [docs/diagrams/flujo-general.mmd](diagrams/flujo-general.mmd)
**SVG generado**: [flujo-general.svg](diagrams/flujo-general.svg)

```mermaid
flowchart TD
    Usuario["Usuario tienda"] --> Landing["Landing /"]
    Landing --> Registro["Registro /register"]
    Registro --> CrearCuenta["Crear User + Business"]
    CrearCuenta --> Dashboard["Dashboard privado /dashboard"]
    Dashboard --> Productos["Productos"]
    Dashboard --> Categorias["Categorias"]
    Dashboard --> Branding["Settings: branding + IA"]
    Dashboard --> CRM["CRM"]
    Dashboard --> Cotizaciones["Cotizaciones"]
    Dashboard --> Pedidos["Pedidos"]
    Branding --> CatalogoPublico["Catalogo publico /store/[slug]"]
    Productos --> CatalogoPublico
    ClienteFinal["Cliente final"] --> CatalogoPublico
    CatalogoPublico --> ChatIA["Chat IA"]
    CatalogoPublico --> WhatsApp["WhatsApp"]
    ChatIA --> Leads["Clientes y conversaciones"]
    Cotizaciones --> Pedidos
```

## 2. Flujo Multi-Tenant

**Archivo Mermaid**: [docs/diagrams/flujo-multitenant.mmd](diagrams/flujo-multitenant.mmd)
**SVG generado**: [flujo-multitenant.svg](diagrams/flujo-multitenant.svg)

```mermaid
flowchart TD
    User["User"] --> Business["Business tenant"]
    Business --> Product["Product.businessId"]
    Business --> Category["Category.businessId"]
    Business --> Customer["Customer.businessId"]
    Business --> Conversation["Conversation.businessId"]
    Conversation --> Message["Message por conversationId"]
    Business --> Quote["Quote.businessId"]
    Business --> Order["Order.businessId"]
    Business --> AiSettings["AiSettings.businessId"]

    PrivatePage["Pagina dashboard"] --> CurrentBusiness["getCurrentBusiness()"]
    CurrentBusiness --> Business
    ServerAction["Server action"] --> TenantGuard["services/tenant-guard.ts"]
    TenantGuard --> Product
    TenantGuard --> Category
    TenantGuard --> Customer
    TenantGuard --> Conversation
    TenantGuard --> Quote
    TenantGuard --> Order

    PublicStore["/store/[slug]"] --> ActiveBusiness["Business activo por slug"]
    ActiveBusiness --> PublicProducts["Productos activos del tenant"]
    AiRoute["/api/ai/sales-assistant"] --> ActiveBusiness
    AiRoute --> PublicProducts
```

## 3. Flujo Catalogo Publico

**Archivo Mermaid**: [docs/diagrams/flujo-catalogo-publico.mmd](diagrams/flujo-catalogo-publico.mmd)
**SVG generado**: [flujo-catalogo-publico.svg](diagrams/flujo-catalogo-publico.svg)

```mermaid
sequenceDiagram
    participant Cliente as Cliente final
    participant Store as /store/[slug]
    participant DB as Prisma
    participant Template as Catalog template

    Cliente->>Store: Abre URL publica
    Store->>DB: Busca Business activo por slug
    DB-->>Store: Branding, IA settings, categorias
    Store->>DB: Busca productos ACTIVE por businessId
    DB-->>Store: Productos filtrados y ordenados
    Store->>Template: Renderiza MODERN_GRID, BOUTIQUE_PREMIUM, FAST_SALES o TECH_PRO
    Template-->>Cliente: Hero, filtros, destacados, cards, WhatsApp y chat
    Cliente->>Store: Cambia busqueda, categoria u orden
    Store->>DB: Reconsulta con searchParams
    Store-->>Cliente: Resultados actualizados
```

## 4. Flujo Chat IA

**Archivo Mermaid**: [docs/diagrams/flujo-chat-ia.mmd](diagrams/flujo-chat-ia.mmd)
**SVG generado**: [flujo-chat-ia.svg](diagrams/flujo-chat-ia.svg)

```mermaid
sequenceDiagram
    participant Cliente as Cliente final
    participant Chat as StoreChat.tsx
    participant API as /api/ai/sales-assistant
    participant DB as Prisma
    participant Provider as DeepSeek o demo local

    Cliente->>Chat: Escribe mensaje y envia
    Chat->>Chat: Lee conversationId y visitorId de localStorage
    Chat->>API: POST slug, message, conversationId, visitorId, productId opcional
    API->>API: Valida Zod y rate limit por tienda/IP
    API->>DB: Busca Business activo por slug
    API->>DB: Verifica conversationId por businessId
    API->>DB: Guarda mensaje USER
    API->>DB: Obtiene historial y productos activos del tenant
    API->>Provider: Envia contexto controlado
    Provider-->>API: Respuesta
    API->>DB: Guarda mensaje ASSISTANT
    API-->>Chat: ok, conversationId, reply
    Chat-->>Cliente: Muestra respuesta y mantiene scroll
```

## 5. Flujo Boton Consultar IA

**Archivo Mermaid**: [docs/diagrams/flujo-consultar-ia.mmd](diagrams/flujo-consultar-ia.mmd)
**SVG generado**: [flujo-consultar-ia.svg](diagrams/flujo-consultar-ia.svg)

```mermaid
sequenceDiagram
    participant Cliente as Cliente final
    participant Card as ProductCard
    participant Ask as AskAiButton
    participant Window as CustomEvent storechat:ask
    participant Chat as StoreChat
    participant API as API IA

    Cliente->>Ask: Click Consultar IA
    Ask->>Window: Dispatch productId + mensaje contextual
    Window->>Chat: StoreChat escucha evento
    Chat->>Chat: Enfoca input y hace scroll al chat
    Chat->>API: Envia mensaje con productId y conversationId activo
    API-->>Chat: Respuesta sobre producto del mismo businessId
    Chat-->>Cliente: Muestra respuesta o error visible
```

## 6. Flujo WhatsApp

**Archivo Mermaid**: [docs/diagrams/flujo-whatsapp.mmd](diagrams/flujo-whatsapp.mmd)
**SVG generado**: [flujo-whatsapp.svg](diagrams/flujo-whatsapp.svg)

```mermaid
flowchart TD
    Cliente["Cliente final"] --> Card["Card de producto"]
    Card --> Boton["Hablar al WhatsApp"]
    Boton --> Numero["Limpiar Business.whatsappNumber"]
    Numero --> TieneNumero{"Numero configurado?"}
    TieneNumero -- "No" --> Disabled["Boton deshabilitado: WhatsApp no configurado"]
    TieneNumero -- "Si" --> Mensaje["Mensaje con tienda, producto, precio y link"]
    Mensaje --> Encoded["encodeURIComponent(text)"]
    Encoded --> WaMe["https://wa.me/NUMERO?text=MENSAJE"]
    WaMe --> WhatsApp["WhatsApp Web/App"]
```

## 7. Flujo Upload Imagenes

**Archivo Mermaid**: [docs/diagrams/flujo-upload-imagenes.mmd](diagrams/flujo-upload-imagenes.mmd)
**SVG generado**: [flujo-upload-imagenes.svg](diagrams/flujo-upload-imagenes.svg)

```mermaid
sequenceDiagram
    participant Owner as Usuario tienda
    participant Dropzone as ImageDropzone
    participant Upload as /api/uploads/image
    participant Auth as Auth cookie
    participant DB as Prisma
    participant FS as public/uploads

    Owner->>Dropzone: Arrastra o selecciona imagen
    Dropzone->>Dropzone: Valida JPG, PNG, WEBP y maximo 5MB
    Dropzone->>Upload: POST FormData file + businessId
    Upload->>Auth: getCurrentUser()
    Auth-->>Upload: User autenticado
    Upload->>DB: Verifica Business.id + ownerId
    DB-->>Upload: Tenant autorizado
    Upload->>Upload: Sanitiza nombre y valida ruta
    Upload->>FS: Guarda en /public/uploads/{businessId}
    Upload-->>Dropzone: ok + /uploads/{businessId}/archivo
    Dropzone-->>Owner: Preview y campo oculto actualizado
```

## 8. Flujo Productos

**Archivo Mermaid**: [docs/diagrams/flujo-productos.mmd](diagrams/flujo-productos.mmd)
**SVG generado**: [flujo-productos.svg](diagrams/flujo-productos.svg)

```mermaid
sequenceDiagram
    participant Owner as Usuario tienda
    participant Page as /dashboard/products
    participant Action as Product server actions
    participant Guard as tenant-guard
    participant DB as Prisma

    Owner->>Page: Crea o edita producto
    Page->>Action: FormData
    Action->>Action: Valida productFormSchema
    Action->>DB: getCurrentBusiness()
    Action->>Guard: Verifica categoria/producto por businessId
    Guard-->>Action: Recurso valido del tenant
    Action->>DB: Create, update, duplicate o delete
    Action->>Page: revalidate dashboard y /store/[slug]
    Page-->>Owner: Estado actualizado
```

## 9. Flujo Cotizacion A Pedido

**Archivo Mermaid**: [docs/diagrams/flujo-cotizacion-pedido.mmd](diagrams/flujo-cotizacion-pedido.mmd)
**SVG generado**: [flujo-cotizacion-pedido.svg](diagrams/flujo-cotizacion-pedido.svg)

```mermaid
sequenceDiagram
    participant Owner as Usuario tienda
    participant Quotes as /dashboard/quotes
    participant Action as createOrderFromQuoteAction
    participant DB as Prisma transaction

    Owner->>Quotes: Marca cotizacion como ACCEPTED
    Owner->>Quotes: Click Crear pedido
    Quotes->>Action: quoteId
    Action->>DB: Busca Quote por id + businessId
    DB-->>Action: Quote con items y order
    Action->>Action: Verifica que este ACCEPTED y sin pedido previo
    loop Por cada item con producto
        Action->>DB: Busca Product por id + businessId
        Action->>Action: Valida stock suficiente
        Action->>DB: Decrementa stock
    end
    Action->>DB: Crea Order + OrderItems
    Action-->>Quotes: Redirect /dashboard/orders
```

## 10. Flujo Superadmin

**Archivo Mermaid**: [docs/diagrams/flujo-superadmin.mmd](diagrams/flujo-superadmin.mmd)
**SVG generado**: [flujo-superadmin.svg](diagrams/flujo-superadmin.svg)

```mermaid
flowchart TD
    Admin["Usuario plataforma"] --> AdminRoute["/admin"]
    AdminRoute --> RequireAdmin["requirePlatformAdmin()"]
    RequireAdmin --> RoleCheck{"role = PLATFORM_ADMIN?"}
    RoleCheck -- "No" --> Dashboard["Redirect /dashboard"]
    RoleCheck -- "Si" --> Panel["Panel superadmin"]
    Panel --> Stores["Tiendas registradas"]
    Panel --> Users["Usuarios"]
    Panel --> Plans["Planes"]
    Panel --> Metrics["Conteos de productos y conversaciones"]
    Panel --> Toggle["Suspender/Reactivar"]
    Toggle --> Action["toggleBusinessActiveAction"]
    Action --> Business["Business.isActive"]
```
