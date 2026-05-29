# Mapa del Proyecto

| Ruta | Tipo | Qué parece hacer | Importancia | Revisar después |
|------|------|------------------|-------------|----------------|
| `/app` | Carpeta | Contiene rutas y layouts de la aplicación Next.js. | Alta | sí |
| `/app/(auth)` | Carpeta | Agrupa rutas de autenticación y flujos públicos/privados. | Alta | sí |
| `/app/admin` | Carpeta | Panel administrativo separado dentro de la app. | Alta | sí |
| `/app/api` | Carpeta | Endpoints API del servidor. | Alta | sí |
| `/app/dashboard` | Carpeta | Rutas de dashboard y experiencia de usuario interna. | Alta | sí |
| `/app/login` | Carpeta | Ruta de inicio de sesión. | Media | sí |
| `/app/register` | Carpeta | Ruta de registro de usuarios. | Media | sí |
| `/app/onboarding` | Carpeta | Flujo de onboarding para nuevos usuarios. | Media | sí |
| `/app/select-store` | Carpeta | Selección de tienda en el flujo multitienda. | Media | sí |
| `/app/settings` | Carpeta | Ajustes y configuración del usuario o tienda. | Media | sí |
| `/app/store` | Carpeta | Rutas relacionadas con la tienda. | Media | sí |
| `/components` | Carpeta | Componentes UI reutilizables y librería de interfaz. | Alta | sí |
| `/components/catalog` | Carpeta | Componentes específicos de catálogo. | Media | sí |
| `/components/theme` | Carpeta | Temas y estilos de componentes. | Media | sí |
| `/lib` | Carpeta | Lógica de negocio, utilidades y servicios compartidos. | Alta | sí |
| `/lib/auth` | Carpeta | Autenticación y autorización. | Alta | sí |
| `/lib/plans` | Carpeta | Gestión de planes y facturación. | Alta | sí |
| `/lib/security` | Carpeta | Seguridad, políticas y validaciones. | Alta | sí |
| `/services` | Carpeta | Servicios de negocio, guardias y búsqueda. | Alta | sí |
| `/prisma` | Carpeta | Esquema de base de datos, migraciones y seed. | Alta | sí |
| `/templates` | Carpeta | Plantillas de catálogo predefinidas. | Media | sí |
| `/public` | Carpeta | Activos públicos estáticos y subcarpetas. | Media | no |
| `/docs` | Carpeta | Documentación de arquitectura, auditoría y roadmap. | Alta | sí |
| `/artifacts` | Carpeta | Reportes y artefactos generados. | Media | no |
| `/scripts` | Carpeta | Scripts auxiliares para mantenimiento y generación. | Media | sí |
| `/README.md` | Archivo | Documentación general del repositorio. | Alta | sí |
| `/next.config.mjs` | Archivo | Configuración de Next.js. | Alta | sí |
| `/package.json` | Archivo | Dependencias, scripts y metadata del proyecto. | Alta | sí |
| `/tsconfig.json` | Archivo | Configuración de TypeScript. | Alta | sí |
| `/tailwind.config.ts` | Archivo | Configuración de Tailwind CSS. | Media | sí |
| `/postcss.config.js` | Archivo | Configuración de PostCSS. | Media | no |
| `/proxy.ts` | Archivo | Posible servidor proxy local o middleware. | Media | sí |
| `.env.example` | Archivo | Ejemplo de variables de entorno. | Media | sí |
| `.gitignore` | Archivo | Exclusiones de Git. | Media | no |
