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

## Business rules (enforced via triggers)

<<<<<<< ours
| Trigger function               | Fires on                          | Enforces                                                  |
|--------------------------------|-----------------------------------|-----------------------------------------------------------|
| `validar_cupo`                 | BEFORE INSERT on `reservas`       | Reservation count < class `cupo_maximo`                   |
| `validar_paquete`              | BEFORE INSERT on `uso_paquete`    | Package active + classes remaining > 0 + not expired      |
| `descontar_clase`              | AFTER INSERT on `uso_paquete`     | Decrements `clases_restantes`                             |
| `procesar_cancelacion_reserva` | AFTER UPDATE on `reservas`        | Refunds the class to the package when reservation cancelled |
=======
| Trigger function               | Fires on                       | Enforces                                                    |
|--------------------------------|--------------------------------|-------------------------------------------------------------|
| `validar_cupo`                 | BEFORE INSERT on `reservas`    | Reservation count < class `cupo_maximo`                     |
| `validar_paquete`              | BEFORE INSERT on `uso_paquete` | Package active + classes remaining > 0 + not expired        |
| `descontar_clase`              | AFTER INSERT on `uso_paquete`  | Decrements `clases_restantes`                               |
| `procesar_cancelacion_reserva` | AFTER UPDATE on `reservas`     | Refunds the class to the package when reservation cancelled |
>>>>>>> theirs

## Initial setup

```bash
# 1. Create the database
createdb glow_studio

# 2. Apply migrations in order
psql -d glow_studio -f migrations/001_schema.sql
psql -d glow_studio -f migrations/002_triggers.sql
psql -d glow_studio -f migrations/003_seeds.sql
```

To reset:

```bash
dropdb glow_studio && createdb glow_studio
# then re-apply the migrations above
```

## Adding migrations

<<<<<<< ours
Follow the numeric prefix convention (`004_*.sql`, `005_*.sql`, …). Each file must be safely re-runnable on a fresh database. **Never modify a migration that has already been applied** — add a new one instead.

When a migration runner is adopted later (`node-pg-migrate`, `flyway`, etc.), these files port cleanly.
=======
Follow the numeric prefix convention (`004_*.sql`, `005_*.sql`, …).
Never modify an already-applied migration — add a new one instead.
>>>>>>> theirs
