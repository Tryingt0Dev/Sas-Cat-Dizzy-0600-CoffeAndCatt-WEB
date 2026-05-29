# QA Report

Fecha: 2026-05-22

## Alcance Revisado

- `app/`
- `components/`
- `lib/`
- `services/`
- `templates/`
- `prisma/`
- API routes
- server actions
- dashboard
- catalogo publico
- chat IA
- upload de imagenes
- CRM
- cotizaciones
- pedidos
- planes
- superadmin

No se leyeron ni imprimieron valores reales de `.env`.

## Hallazgos Corregidos

| Hallazgo | Riesgo | Correccion |
| --- | --- | --- |
| Registro podia generar slug vacio si el nombre de tienda no tenia caracteres validos para slug. | Tiendas con slug vacio o colisiones raras. | Fallback a `tienda` en `registerAction`. |
| Categorias podian generar slug vacio por nombres solo con simbolos. | URLs internas o constraints inconsistentes. | Fallback a `categoria` y base slug estable. |
| `DELETE /api/uploads/image` resolvia la primera tienda del usuario. | En usuarios con multiples tiendas podia negar borrados validos o validar contra tenant incorrecto. | Extrae `businessId` desde `/uploads/{businessId}/...` y verifica `ownerId`. |

## Hallazgos Ya Cubiertos En El Estado Actual

- Boton Consultar IA usa evento controlado hacia `StoreChat`.
- `StoreChat` usa fetch relativo, `conversationId`, `visitorId`, loading, errores y scroll.
- Endpoint IA valida Zod, rate limit, slug activo, producto por tenant y conversacion por tenant.
- WhatsApp limpia numero y arma URL `wa.me` con mensaje por producto.
- `ImageDropzone` valida tipos, tamano y bloquea SVG.
- Productos validan precio, descuento, stock y estado con Zod.
- Server actions privadas filtran por negocio o usan `tenant-guard`.
- `.env`, `.next`, `node_modules`, `dev.db`, `*.db` y uploads locales estan ignorados.
- `.env.example` usa placeholders seguros.

## Riesgos Restantes

- SQLite no es suficiente para produccion multi-tenant.
- Upload local en `public/uploads` no es persistente en plataformas serverless.
- Rate limit en memoria no funciona entre multiples instancias.
- No hay suite automatizada de tests.
- No hay recuperacion de password ni verificacion de email.
- No hay selector de tienda si un usuario administra multiples negocios.
- No hay integracion de pagos real.
- No hay observabilidad, logs estructurados ni auditoria de eventos.

## Checklist Manual Recomendado

1. Registrar usuario y crear tienda.
2. Iniciar sesion con usuario demo.
3. Crear categoria.
4. Crear producto con imagen subida.
5. Editar producto, duplicarlo y eliminarlo con confirmacion.
6. Cambiar template y colores en settings.
7. Subir logo y banner desde settings.
8. Abrir `/store/storelamon`.
9. Buscar producto.
10. Filtrar por categoria.
11. Ordenar por menor precio y mayor descuento.
12. Click en Consultar IA de un producto.
13. Confirmar que el chat responde y conserva conversacion.
14. Click en WhatsApp y revisar mensaje prellenado.
15. Revisar conversaciones en dashboard.
16. Revisar cliente/lead en CRM.
17. Crear cotizacion con productos.
18. Cambiar cotizacion a ACCEPTED.
19. Crear pedido y confirmar descuento de stock.
20. Entrar a `/admin` como plataforma y suspender/reactivar tienda.

## Comandos De QA Tecnico

```bash
npx prisma validate
npx prisma generate
npm run lint
npm run typecheck
npm run build
```

Los resultados concretos de la ultima ejecucion deben registrarse en la entrega final de cada auditoria.

