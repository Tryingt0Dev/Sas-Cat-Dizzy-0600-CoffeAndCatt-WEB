# Auth Security And Admin Seed

## Email unico

`User.email` mantiene constraint `@unique`.

El registro normaliza correos con:

- `trim`
- `lowercase`

Si el correo ya existe, el usuario ve:

```text
Este correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña.
```

No se exponen errores tecnicos de Prisma.

## Politica de contrasena

Requisitos:

- minimo 10 caracteres;
- una mayuscula;
- una minuscula;
- un numero;
- un simbolo;
- sin espacios al inicio o final;
- distinta al correo;
- confirmacion obligatoria.

Las contrasenas se hashean con bcrypt usando el helper existente `hashPassword()`.

## Email verification

Quedo preparada la estructura:

- `User.emailVerifiedAt`
- `EmailVerificationToken`
- `createEmailVerificationToken()`
- `verifyEmailToken()`
- `sendVerificationEmail()` como stub seguro

Actualmente el login no bloquea correos no verificados porque no hay proveedor de email configurado.

Cuando exista proveedor:

1. Crear token al registrarse.
2. Enviar enlace por email.
3. Verificar token en ruta dedicada.
4. Marcar `emailVerifiedAt`.
5. Opcionalmente bloquear acciones sensibles hasta verificar.

## Reset local de admins

Script:

```bash
npm run db:reset-admins
```

El script NO corre sin permiso explicito.

PowerShell:

```powershell
$env:ALLOW_DESTRUCTIVE_ADMIN_RESET="true"
npm run db:reset-admins
```

Admins finales:

- `felipebustamante003@gmail.com`
- `rivas.matias79@gmail.com`

Reglas de seguridad:

- bloquea `NODE_ENV=production`;
- exige `ALLOW_DESTRUCTIVE_ADMIN_RESET=true`;
- exige `DATABASE_URL` local/desarrollo;
- conserva tiendas/productos;
- reasigna ownership al primer admin;
- borra usuarios no incluidos;
- crea ambos admins como `SUPER_ADMIN`;
- marca `emailVerifiedAt`;
- borra sesiones existentes;
- no escribe contrasenas en archivos.

Passwords:

- si `ADMIN_1_PASSWORD` y `ADMIN_2_PASSWORD` existen, las usa;
- si no existen, genera passwords temporales fuertes;
- las passwords generadas se imprimen solo una vez en consola local.

Variables opcionales:

```bash
ADMIN_1_EMAIL=felipebustamante003@gmail.com
ADMIN_2_EMAIL=rivas.matias79@gmail.com
ADMIN_1_PASSWORD=
ADMIN_2_PASSWORD=
```

## Seed demo

`prisma/seed.ts` ya no guarda una contrasena demo fija.

Opciones:

- definir `DEMO_SEED_PASSWORD` localmente;
- dejar que el seed genere una contrasena temporal y la muestre en consola.

No documentar ni commitear contrasenas reales.
