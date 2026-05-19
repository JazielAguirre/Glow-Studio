-- ============================================================
-- Glow Studio — Demo refresh seed for "clases"
--
-- Purpose:
--   004_clases_seed.sql inserts demo classes using CURRENT_DATE + N
--   at the moment the migration runs. Those dates become past over
--   time, which makes clases.html show only one (or zero) day cards
--   because the API filters c.fecha >= CURRENT_DATE.
--
--   This migration refreshes the demo schedule with future dates
--   relative to today so the schedule page demonstrates the full
--   multi-day layout again.
--
-- Safety:
--   - Does NOT delete any existing classes (past or future).
--   - Does NOT touch reservations or any other table.
--   - Idempotent: re-running on the same day is a no-op for any
--     (id_tipo, fecha, hora_inicio) tuple that already exists,
--     thanks to NOT EXISTS guards.
--
-- id_tipo: 1 = Yoga, 2 = Barre, 3 = Pilates (per 003_seeds.sql)
-- ============================================================

-- Day +1
INSERT INTO clases (id_tipo, fecha, hora_inicio, hora_fin)
SELECT 1, CURRENT_DATE + 1, TIME '08:00', TIME '09:00'
WHERE NOT EXISTS (
    SELECT 1 FROM clases
    WHERE fecha = CURRENT_DATE + 1 AND hora_inicio = TIME '08:00' AND id_tipo = 1
);

INSERT INTO clases (id_tipo, fecha, hora_inicio, hora_fin)
SELECT 3, CURRENT_DATE + 1, TIME '10:00', TIME '11:00'
WHERE NOT EXISTS (
    SELECT 1 FROM clases
    WHERE fecha = CURRENT_DATE + 1 AND hora_inicio = TIME '10:00' AND id_tipo = 3
);

INSERT INTO clases (id_tipo, fecha, hora_inicio, hora_fin)
SELECT 2, CURRENT_DATE + 1, TIME '18:00', TIME '19:00'
WHERE NOT EXISTS (
    SELECT 1 FROM clases
    WHERE fecha = CURRENT_DATE + 1 AND hora_inicio = TIME '18:00' AND id_tipo = 2
);

-- Day +2
INSERT INTO clases (id_tipo, fecha, hora_inicio, hora_fin)
SELECT 3, CURRENT_DATE + 2, TIME '07:00', TIME '08:00'
WHERE NOT EXISTS (
    SELECT 1 FROM clases
    WHERE fecha = CURRENT_DATE + 2 AND hora_inicio = TIME '07:00' AND id_tipo = 3
);

INSERT INTO clases (id_tipo, fecha, hora_inicio, hora_fin)
SELECT 1, CURRENT_DATE + 2, TIME '17:00', TIME '18:00'
WHERE NOT EXISTS (
    SELECT 1 FROM clases
    WHERE fecha = CURRENT_DATE + 2 AND hora_inicio = TIME '17:00' AND id_tipo = 1
);

-- Day +3
INSERT INTO clases (id_tipo, fecha, hora_inicio, hora_fin)
SELECT 2, CURRENT_DATE + 3, TIME '08:00', TIME '09:00'
WHERE NOT EXISTS (
    SELECT 1 FROM clases
    WHERE fecha = CURRENT_DATE + 3 AND hora_inicio = TIME '08:00' AND id_tipo = 2
);

INSERT INTO clases (id_tipo, fecha, hora_inicio, hora_fin)
SELECT 3, CURRENT_DATE + 3, TIME '18:00', TIME '19:00'
WHERE NOT EXISTS (
    SELECT 1 FROM clases
    WHERE fecha = CURRENT_DATE + 3 AND hora_inicio = TIME '18:00' AND id_tipo = 3
);

-- Day +5
INSERT INTO clases (id_tipo, fecha, hora_inicio, hora_fin)
SELECT 1, CURRENT_DATE + 5, TIME '09:00', TIME '10:00'
WHERE NOT EXISTS (
    SELECT 1 FROM clases
    WHERE fecha = CURRENT_DATE + 5 AND hora_inicio = TIME '09:00' AND id_tipo = 1
);

INSERT INTO clases (id_tipo, fecha, hora_inicio, hora_fin)
SELECT 2, CURRENT_DATE + 5, TIME '11:00', TIME '12:00'
WHERE NOT EXISTS (
    SELECT 1 FROM clases
    WHERE fecha = CURRENT_DATE + 5 AND hora_inicio = TIME '11:00' AND id_tipo = 2
);

INSERT INTO clases (id_tipo, fecha, hora_inicio, hora_fin)
SELECT 3, CURRENT_DATE + 5, TIME '19:00', TIME '20:00'
WHERE NOT EXISTS (
    SELECT 1 FROM clases
    WHERE fecha = CURRENT_DATE + 5 AND hora_inicio = TIME '19:00' AND id_tipo = 3
);

-- Day +7
INSERT INTO clases (id_tipo, fecha, hora_inicio, hora_fin)
SELECT 1, CURRENT_DATE + 7, TIME '08:00', TIME '09:00'
WHERE NOT EXISTS (
    SELECT 1 FROM clases
    WHERE fecha = CURRENT_DATE + 7 AND hora_inicio = TIME '08:00' AND id_tipo = 1
);

INSERT INTO clases (id_tipo, fecha, hora_inicio, hora_fin)
SELECT 3, CURRENT_DATE + 7, TIME '10:00', TIME '11:00'
WHERE NOT EXISTS (
    SELECT 1 FROM clases
    WHERE fecha = CURRENT_DATE + 7 AND hora_inicio = TIME '10:00' AND id_tipo = 3
);
