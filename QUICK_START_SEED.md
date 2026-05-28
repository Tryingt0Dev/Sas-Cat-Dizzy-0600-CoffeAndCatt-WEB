# 🚀 Quick Start - Seed & Database

## Lo Esencial

```bash
# Ejecutar el seed (crea usuarios, tiendas, productos demo)
npm run seed

# Ver/editar datos (interfaz gráfica)
npm run db:studio

# Iniciar desarrollo
npm run dev

# Compilar producción
npm run build
```

## Usuarios Demo (Contraseña: ver output de `npm run seed`)

| Email | Rol | Acceso |
|-------|-----|--------|
| admin@demo.cl | SUPER_ADMIN | Admin Panel |
| storelamon@demo.cl | STORE_OWNER | Dashboard + Tienda |
| seguridad@demo.cl | STORE_OWNER | Dashboard + Tienda |

## URLs Demo

- Login: `http://localhost:3000/login`
- Dashboard: `http://localhost:3000/dashboard`
- Tienda 1: `http://localhost:3000/store/storelamon`
- Tienda 2: `http://localhost:3000/store/catg-seguridad`
- Studio: `npm run db:studio`

## Comandos Database

```bash
npm run db:generate      # Generar cliente Prisma
npm run db:migrate       # Crear nueva migración
npm run db:seed          # Ejecutar seed (alias)
npm run db:reset:pg      # Reset + seed (⚠️ destructivo)
npm run db:setup:pg      # Setup completo: migra + seed
```

## Reset Rápido

```bash
# Opción 1: Reset seguro (si la BD existe)
npm run db:reset:pg

# Opción 2: Manual (si hay conflictos)
npx prisma migrate resolve --rolled-back 20260527074044_init_postgres
npx prisma migrate deploy --schema=prisma/schema_postgres.prisma
npm run seed
```

## Personalizar Contraseña

En `.env`:
```env
DEMO_SEED_PASSWORD=TuContraseña123!
```

Luego:
```bash
npm run seed
```

## Verificar Setup

```bash
# Ver schema
npx prisma validate

# Ver datos en la BD
npm run db:studio

# Probar login
npm run dev
# Abre http://localhost:3000/login
```

---

**Nota**: Para más detalles ver [SEED_SETUP_GUIDE.md](SEED_SETUP_GUIDE.md)
