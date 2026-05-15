# Glow Studio — Database

PostgreSQL schema, triggers, and seed data for the Glow Studio platform.

The schema is the source of truth — extracted from `docs/Script-Base-de-Datos.docx (2).pdf` and version-controlled here.

## Tables

| Table | Purpose |
|---|---|
| `usuarios`          | Customer accounts |
| `tipos_clase`       | Class disciplines (Yoga, Barre, Pilates) + cupo |
| `clases`            | Scheduled class instances |
| `reservas`          | User reservations for a class |
| `paquetes`          | Catalog of class packages |
| `usuario_paquetes`  | Packages purchased by a user (with balance + expiry) |
| `uso_paquete`       | Records each time a package class is consumed |
| `contactos`         | Contact form messages submitted by visitors   |

## Business rules (enforced via triggers)

| Trigger function               | Fires on                       | Enforces                                                    |
|--------------------------------|--------------------------------|-------------------------------------------------------------|
| `validar_cupo`                 | BEFORE INSERT on `reservas`    | Reservation count < class `cupo_maximo`                     |
| `validar_paquete`              | BEFORE INSERT on `uso_paquete` | Package active + classes remaining > 0 + not expired        |
| `descontar_clase`              | AFTER INSERT on `uso_paquete`  | Decrements `clases_restantes`                               |
| `procesar_cancelacion_reserva` | AFTER UPDATE on `reservas`     | Refunds the class to the package when reservation cancelled |

## Initial setup

```bash
# 1. Create the database
createdb glow_studio

# 2. Apply required migrations in order
psql -d glow_studio -f migrations/001_schema.sql   # Tables and constraints
psql -d glow_studio -f migrations/002_triggers.sql  # Business rule triggers
psql -d glow_studio -f migrations/003_seeds.sql     # Class types and package catalog
psql -d glow_studio -f migrations/004_clases_seed.sql  # Sample class schedule (upcoming dates)
psql -d glow_studio -f migrations/006_contactos.sql    # Contact form table + grants
psql -d glow_studio -f migrations/007_roles.sql        # Normalize tipo_usuario to usuario/admin
```

If your PostgreSQL user requires a password or runs on a non-standard port:

```bash
PGPASSWORD=yourpassword psql -h localhost -p 5432 -U youruser -d glow_studio -f migrations/001_schema.sql
# repeat for 002, 003, 004, 006, 007
```

> **Note:** Migrations `006_contactos.sql` and `007_roles.sql` must be run as a superuser (e.g. `postgres`) because they use DDL statements (CREATE TABLE, ALTER TABLE). `006` also grants INSERT/SELECT/UPDATE to `glow_user` automatically if that role exists.

## User roles

`usuarios.tipo_usuario` supports two values: `'usuario'` (default) and `'admin'`.

To promote an existing user to admin, run as superuser or a user with UPDATE on `usuarios`:

```sql
UPDATE usuarios SET tipo_usuario = 'admin' WHERE email = 'correo@ejemplo.com';
```

> **Note:** If your PostgreSQL runs on a port other than 5432 (for example 5433), update `DB_PORT` in `backend/.env` accordingly.

## Optional: development/demo seed

`005_dev_test_paquete.sql` is a **demo-only seed** — do **not** apply it in production.

It gives the first registered user an active 5-class package so reservations can be tested before implementing a real package purchase flow. It requires at least one user account to exist in the `usuarios` table (register through the app first).

```bash
# Only after registering at least one user through the app:
psql -d glow_studio -f migrations/005_dev_test_paquete.sql
```

The seed is idempotent — it will not insert a duplicate if that user already has an active package.

## Reset database

```bash
dropdb glow_studio && createdb glow_studio
# then re-apply migrations 001–004, 006, and 007
```

## Adding migrations

Follow the numeric prefix convention (`006_*.sql`, `007_*.sql`, …). Each file must be safely re-runnable on a fresh database. **Never modify a migration that has already been applied** — add a new one instead.

When a migration runner is adopted later (`node-pg-migrate`, `flyway`, etc.), these files port cleanly.
