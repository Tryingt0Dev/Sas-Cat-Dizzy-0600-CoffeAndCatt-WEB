# INSTRUCCIONES DE INSTALACION - CATG SAAS COMPLETO FUNCIONAL

Estas instrucciones asumen Windows PowerShell y PostgreSQL disponible. El paquete no incluye secretos reales, `node_modules`, `.next`, bases locales ni uploads generados.

## 1. Entrar a la carpeta

```powershell
cd .\CATG_SAAS_COMPLETO_FUNCIONAL
```

## 2. Instalar dependencias

```powershell
npm install
```

## 3. Crear `.env` desde `.env.example`

```powershell
Copy-Item .\.env.example .\.env
```

## 4. Configurar `DATABASE_URL`

Editar `.env` y reemplazar `DATABASE_URL` por una conexion PostgreSQL real.

Ejemplo local:

```powershell
notepad .\.env
```

Valor esperado:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/catg_omniventas?schema=public"
```

## 5. Validar Prisma

```powershell
npx prisma validate
```

## 6. Generar Prisma Client

```powershell
npx prisma generate
```

## 7. Ejecutar migraciones

```powershell
npx prisma migrate dev
```

Para solo revisar estado contra una base existente:

```powershell
npx prisma migrate status
```

## 8. Ejecutar seed si se requiere

El proyecto tiene `prisma/seed.ts` y scripts `seed`/`db:seed`.

```powershell
npm run db:seed
```

O:

```powershell
npm run seed
```

## 9. Ejecutar lint

```powershell
npm run lint
```

## 10. Ejecutar tests

```powershell
npm test
```

## 11. Ejecutar build

```powershell
npm run build
```

## 12. Ejecutar servidor de desarrollo

```powershell
npm run dev
```

## 13. Abrir localhost

Abrir en el navegador:

```text
http://localhost:3000
```

## Notas importantes

- No copiar `.env` desde otro proyecto si contiene secretos reales.
- Si `npx prisma migrate status` falla por conexion, revisar PostgreSQL, credenciales y nombre de base de datos.
- Si se usa IA, configurar `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL` y `DEEPSEEK_MODEL`.
- Si se usa verificacion de email, configurar `RESEND_API_KEY` y `EMAIL_FROM`.
- Si se usa Turnstile, configurar `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`.
- El paquete conserva `prisma/schema_postgres.prisma` porque hay scripts historicos que lo referencian; revisar antes de usarlo como schema principal.