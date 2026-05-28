# Guía de Configuración del Seed de Prisma

## ✅ Estado Actual

El proyecto está completamente configurado para ejecutar seeds de datos demo en PostgreSQL.

## Scripts Disponibles

### Seed Principal
```bash
npm run seed
# o equivalentemente
npx prisma db seed
```

### Otros Scripts Útiles
- `npm run db:seed` - Ejecuta el seed (alias)
- `npm run db:generate` - Genera el cliente Prisma
- `npm run db:migrate` - Crea nuevas migraciones
- `npm run db:setup:pg` - Setup completo: genera cliente, migra y ejecuta seed
- `npm run db:reset:pg` - Reset completo de la BD y re-ejecuta seed (⚠️ Elimina datos)
- `npm run db:studio` - Abre Prisma Studio (interfaz gráfica)

## Archivos Configurados

### 1. `package.json`
Se agregaron:
- Script `"seed": "prisma db seed"` en scripts
- Configuración `"prisma": { "seed": "tsx prisma/seed.ts" }` para Prisma

### 2. `prisma/seed.ts`
Script que crea:
- **Usuario Admin**: `admin@demo.cl` (SUPER_ADMIN)
- **Usuarios Demo**: 
  - `storelamon@demo.cl` (propietaria STORELAMON)
  - `seguridad@demo.cl` (propietario CATG Seguridad)
- **Tiendas Demo**:
  - STORELAMON: Boutique de ropa/accesorios
  - CATG Seguridad: Sistemas CCTV
- **Categorías**: Ropa, Accesorios, Kits CCTV, Instalación
- **Productos Demo**: 6 productos con imágenes y detalles
- **Planes**: Normal y Premium
- **Configuración de Catálogo**: Paletas de colores, temas, configuración AI

### 3. `prisma/schema_postgres.prisma`
Schema completo para PostgreSQL con validación exitosa ✅

### 4. Migraciones
- Nueva carpeta `prisma/migrations/` para PostgreSQL
- Migración inicial: `20260527074044_init_postgres`
- Backup de migraciones SQLite: `prisma/migrations.sqlite.backup`

## Contraseña Demo

Por defecto, el seed genera automáticamente una contraseña fuerte aleatoria:
```
Local-hHpzHehZTatvdaBH!7Aa
```

### Personalizar Contraseña
Para usar una contraseña específica, set la variable de entorno en `.env`:
```env
DEMO_SEED_PASSWORD=TuContraseñaSegura123!
```

La contraseña debe cumplir la política de seguridad (min 12 caracteres, mayúsculas, números, símbolos).

## Datos Demo Creados

### Tienda 1: STORELAMON
- **Slug**: storelamon
- **URL**: /store/storelamon
- **Tema**: Boutique Premium (paleta minimal-arena, colores rosa/blanco)
- **Productos**: 
  - Polera Oversize Rosada (15.990 CLP, -20%)
  - Jeans Cargo Wide Leg (28.990 CLP, -10%)
  - Cartera Mini Pink (12.990 CLP)
- **WhatsApp**: +56912345678
- **Instagram**: @storelamon

### Tienda 2: CATG Seguridad
- **Slug**: catg-seguridad
- **URL**: /store/catg-seguridad
- **Tema**: Tech Pro (paleta minimal-arena, colores azul/blanco)
- **Productos**:
  - Kit CCTV 4 Cámaras (89.990 CLP, -15%)
  - Kit CCTV 8 Cámaras (159.990 CLP, -10%)
  - Instalación Básica (49.990 CLP)
- **WhatsApp**: +56987654321
- **Instagram**: @catgseguridad

## Ejecutar el Setup Completo

Si necesitas resetear todo:

```bash
# 1. Reset de base de datos (borra TODO)
npm run db:reset:pg

# 2. O paso a paso (para migrar schema nuevo):
npx prisma validate --schema=prisma/schema_postgres.prisma
npx prisma generate --schema=prisma/schema_postgres.prisma
npx prisma migrate dev --schema=prisma/schema_postgres.prisma --name tu_migracion
npm run seed

# 3. Build final
npm run build
```

## Verificar que Funciona

### En Terminal
```bash
# Ver las tablas creadas
npm run db:studio

# O conectar directamente a PostgreSQL
psql -h localhost -U tu_usuario -d catg_omniventas
```

### En Navegador
1. Inicia el servidor: `npm run dev`
2. Ve a `http://localhost:3000/login`
3. Inicia sesión con: `storelamon@demo.cl`
4. Contraseña: ver la mostrada en seed (o la de .env)
5. Ve a Dashboard → Categorías/Productos para ver los datos
6. Abre `http://localhost:3000/store/storelamon` para ver el catálogo público

## Troubleshooting

### Error: "migration_lock.toml - SQLite"
- Significa que hay migraciones de SQLite antiguas
- **Solución**: Ya está hecho - movimos `migrations/` a `migrations.sqlite.backup`

### Error: "DATABASE_URL no definida"
- **Solución**: Verifica tu archivo `.env` tenga `DATABASE_URL=postgresql://...`

### El seed no crea datos
- **Verificar**: `npm run db:studio` y abre Prisma Studio
- **Revisar**: Los logs en la salida del comando `npm run seed`

### Contraseña no cumple la política
- El seed valida automáticamente
- **Solución**: Usa contraseña con: mayúscula, minúscula, número, símbolo, min 12 chars

## Base de Datos

- **Provider**: PostgreSQL
- **Host**: localhost (por defecto)
- **Database**: catg_omniventas
- **URL**: Se lee desde `DATABASE_URL` en `.env`

## Notas Importantes

✅ **Hecho**: 
- PostgreSQL completamente configurado
- Seed con 2 tiendas demo y 6 productos
- Migraciones iniciales creadas
- Build exitoso

⚠️ **Evitado**:
- SQLite para producción
- `db push` (se usó `migrate dev`)
- Contraseñas reales en archivos públicos

🔒 **Seguridad**:
- Contraseñas hasheadas con bcryptjs (rounds=10)
- Roles RBAC (SUPER_ADMIN, STORE_OWNER, USER)
- Email de admin verificado automáticamente

## Próximos Pasos (Opcionales)

1. **Agregar más tiendas**: Edita `prisma/seed.ts` y re-ejecuta `npm run seed`
2. **Personalizar datos**: Modifica los valores de products[], categories[], etc.
3. **Crear migraciones**: `npm run db:migrate` cuando cambies el schema
4. **Backup**: Exporta datos con: `npm run db:studio` → "Export to CSV"

---

**Última actualización**: 27 de Mayo, 2026
**Versión**: 1.0 - Setup Oficial PostgreSQL + Seed
