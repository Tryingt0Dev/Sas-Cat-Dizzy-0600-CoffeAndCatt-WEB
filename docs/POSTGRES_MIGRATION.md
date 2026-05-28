Postgres migration and reset instructions

This project uses SQLite by default for local development. The following
notes explain how to switch to PostgreSQL (or Supabase) and run resets,
migrations and seed.

1) Prepare a Postgres database

- Create a Postgres database locally or use a managed provider (Supabase, Neon, RDS).
- Note the connection string format:
  postgres://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
  Example:
  postgres://dbuser:StrongPassw0rd@127.0.0.1:5432/catg_prod?schema=public

2) Set environment variable

- Create a `.env.local` (gitignored) and set:
  DATABASE_URL="postgresql://dbuser:password@host:5432/catg_prod?schema=public"

3) Generate client and run migrations

- For local development and to create migration files (useful on first run):

```bash
# ensure your DATABASE_URL is set in .env.local
npm run db:generate
npm run db:setup:pg
```

- `db:setup:pg` runs `prisma migrate dev --name init` and then the seed.

- For deploying to production (CI) use migration deploy:

```bash
# on CI where DATABASE_URL is set
npm run db:migrate:pg
# If you maintain a separate schema file for Postgres (recommended), Prisma
# commands must target it. This repo provides `prisma/schema_postgres.prisma`.
# Example commands (local):

# generate client and create migration interactively (local dev):
npm run db:setup:pg

# deploy migrations in CI / production (uses schema_postgres.prisma):
npm run db:migrate:pg

# run seed after migrations if needed:
npm run db:seed
```

4) Reset database

- To reset a Postgres database (drops all data and re-applies migrations):

```bash
# ensure DATABASE_URL points to the postgres instance you want to reset
npm run db:reset:pg
```

Caveats & tips

- Prisma may create a shadow database during `migrate dev` with Postgres. Ensure
  the configured user can create databases or set `DATABASE_SHADOW_URL`.
- If migrating enums from string columns to native enums, create a migration
  that converts data to the new enum values then updates the schema.
- For hosted Postgres (Supabase/Neon) prefer `prisma migrate deploy` in CI and
  `prisma migrate dev` only for local development.

If you want, I can:
- Run the local `npm run reset` now (will modify local SQLite DB).
- Or guide you step-by-step to switch to Postgres and run `db:setup:pg` interactively.
