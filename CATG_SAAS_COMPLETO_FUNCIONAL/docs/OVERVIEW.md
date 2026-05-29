# Overview

CATG OmniVentas SaaS es una plataforma multi-tienda para que negocios pequeños creen un catálogo web profesional con productos, diseños predeterminados, vendedor IA, WhatsApp, CRM básico, cotizaciones, pedidos y métricas comerciales.

El producto resuelve un problema común en tiendas pequeñas: vender por mensajes sin tener una experiencia pública ordenada, sin perder conversaciones, sin mezclar clientes y sin depender de catálogos manuales difíciles de mantener.

## Público Objetivo

- Tiendas de ropa, belleza, accesorios y moda.
- Negocios que venden rápido por WhatsApp.
- Tiendas técnicas de seguridad, electrónica, repuestos o servicios.
- Emprendedores que necesitan una presencia comercial simple antes de invertir en ecommerce completo.
- Agencias o dueños de plataforma que quieren administrar múltiples tiendas.

## Funcionalidades Principales

- Registro e inicio de sesión con email y contraseña.
- Una tienda por usuario dentro del flujo actual.
- Catálogo público por slug en `/store/[slug]`.
- Cuatro templates visuales configurables:
  - `MODERN_GRID`
  - `BOUTIQUE_PREMIUM`
  - `FAST_SALES`
  - `TECH_PRO`
- Branding por tienda:
  - colores
  - logo
  - banner
  - radio de botones
- Gestión de productos y categorías.
- Upload local de imágenes para productos, logo y banner.
- Chat IA por tienda con conversación persistente.
- Botón de consulta por WhatsApp por producto.
- CRM con clientes, estados, score y notas.
- Historial de conversaciones.
- Cotizaciones con productos, descuento y total.
- Pedidos creados desde cotizaciones aceptadas.
- Dashboard comercial.
- Superadmin para revisar tiendas, usuarios y suspender/reactivar negocios.
- Estructura inicial de planes SaaS y suscripción.

## Qué Puede Hacer Una Tienda

Una tienda puede:

- Crear y administrar productos.
- Agrupar productos por categorías.
- Configurar diseño visual del catálogo.
- Subir imagen principal de producto.
- Subir logo y banner.
- Ver clientes/leads generados desde el chat.
- Revisar conversaciones.
- Crear cotizaciones.
- Crear pedidos desde cotizaciones aceptadas.
- Ver métricas comerciales básicas.
- Configurar instrucciones, tono y comportamiento de la IA.

## Qué Puede Hacer El Administrador

El superadmin puede entrar a `/admin` y ver:

- tiendas registradas
- usuarios
- plan de cada tienda
- estado activo/suspendido
- cantidad de productos
- cantidad de conversaciones
- fecha de creación

También puede suspender o reactivar tiendas.

## Qué Hace La IA

El vendedor IA responde desde `/api/ai/sales-assistant`. Su contexto se arma únicamente con productos activos de la tienda actual (`businessId`). Si llega un `productId`, ese producto se prioriza en el contexto.

La IA:

- conserva `conversationId` en el navegador
- guarda mensajes de cliente y asistente
- puede crear leads si `allowAutoLead` está activo
- respeta `humanHandoffEnabled`
- responde en modo demo si no hay API key configurada
- no debe inventar productos, precios, stock, garantías ni entregas

## Qué Hace WhatsApp

Cada card de producto tiene un botón de WhatsApp. El botón:

- usa el número configurado en la tienda
- limpia el número a formato compatible con `wa.me`
- arma un mensaje con tienda, producto, precio y link público
- muestra estado si WhatsApp no está configurado

## Qué Hace El CRM

El CRM permite:

- buscar clientes por nombre, teléfono o email
- filtrar por estado
- ver detalle de cliente
- cambiar estado manualmente
- editar lead score
- escribir notas internas
- revisar conversaciones, cotizaciones y pedidos asociados

## Qué Hacen Cotizaciones Y Pedidos

Las cotizaciones permiten:

- elegir cliente o conversación
- agregar productos de la tienda actual
- calcular subtotal, descuento y total en servidor
- cambiar estado
- copiar mensaje para WhatsApp
- ver una versión imprimible

Los pedidos se crean desde cotizaciones aceptadas. Al crear un pedido se descuenta stock dentro de una transacción y se evita stock negativo.

## Estado Actual Del Producto

Listo para demo comercial controlada:

- catálogo público funcional
- templates diferenciados
- chat IA usable
- WhatsApp usable
- dashboard privado
- upload de imágenes local
- CRM, cotizaciones y pedidos funcionales
- superadmin funcional

Todavía no listo para producción plena:

- base de datos SQLite de desarrollo
- storage local en `public/uploads`
- rate limit en memoria
- sin proveedor de pago real
- sin recuperación de contraseña
- sin roles por tienda ni multiusuario de tienda
- sin tests automatizados
- sin observabilidad centralizada

## Partes MVP/Demo

- Seed con usuarios demo.
- Respuesta local de IA cuando no hay API key.
- Planes y suscripciones sin integración de pago.
- Upload local en disco.
- Rate limit en memoria.
- Un negocio activo por usuario en el flujo actual.

## Partes Presentables A Cliente

- Catálogo público.
- Branding visual por tienda.
- Cuatro templates.
- Productos y categorías.
- Chat IA con historial.
- WhatsApp por producto.
- CRM básico.
- Cotizaciones y pedidos simples.
- Dashboard comercial.

