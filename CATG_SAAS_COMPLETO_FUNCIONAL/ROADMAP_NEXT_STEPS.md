# Roadmap Next Steps

## Estado actual

El SaaS ya cuenta con:

- tiendas multi-tenant;
- productos, categorias, clientes, conversaciones, cotizaciones y pedidos;
- catalogo publico;
- IA de ventas;
- panel admin global;
- roles globales y roles por tienda;
- auditoria de acciones sensibles;
- planes y suscripciones base;
- endpoints preparados para billing;
- registro con email unico y contrasena fuerte;
- estructura de email verification.

## Que se mejoro ahora

- Se removieron credenciales demo visibles.
- Se endurecio registro con checklist de contrasena.
- Se preparo verificacion de email con tokens hasheados.
- Se agrego reset local seguro para dos admins.
- Se elimino lenguaje tecnico visible en areas de cliente.
- Se agrego roadmap visible en admin.
- Se documentaron UI, auth, seed y camino a produccion.

## Prioridad alta

- Configurar proveedor real de email.
- Implementar recuperacion de contrasena.
- Activar verificacion de email en login/acciones sensibles.
- Configurar backups automaticos.
- Probar restauracion de base de datos.
- Completar auditoria para productos, settings, roles y billing.
- Agregar tests e2e multi-tenant.

## Prioridad media

- Integrar Stripe o Mercado Pago.
- Procesar webhooks reales de suscripcion.
- Agregar portal de billing.
- Agregar analytics por tienda y producto.
- Agregar dominios personalizados.
- Mejorar onboarding por industria.
- Importacion masiva de productos.

## Prioridad baja

- Temas visuales avanzados.
- Plantillas publicas adicionales.
- Integraciones con redes sociales.
- Automatizaciones de marketing.
- Centro de ayuda avanzado.

## Seguridad pendiente

- `User.isActive` o `User.status` para suspender cuentas sin borrar datos.
- Politica de sesiones por dispositivo.
- Rotacion y revocacion de sesiones.
- Rate limit distribuido obligatorio en produccion.
- Storage externo para uploads.

## Billing pendiente

- Mapear planes a productos/precios del proveedor.
- Crear checkout real.
- Crear portal real.
- Actualizar `Subscription` desde webhooks firmados.
- Mostrar estado de suscripcion en dashboard de tienda.

## Checklist para vender el SaaS

- Build y typecheck pasan.
- PostgreSQL configurado.
- Migraciones aplicadas con `prisma migrate deploy`.
- Backups activos.
- Email transaccional activo.
- Recuperacion de password activa.
- Billing real activo o plan manual definido.
- Admin inicial creado.
- Logs y auditoria revisados.
- Terminos, privacidad y soporte definidos.
