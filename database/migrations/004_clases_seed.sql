-- ============================================================
-- Glow Studio — Seed: clases
-- Sample weekly schedule using relative dates so data stays
-- "upcoming" regardless of when the migration is applied.
-- id_tipo: 1 = Yoga, 2 = Barre, 3 = Pilates (per 003_seeds.sql)
-- ============================================================

INSERT INTO clases (id_tipo, fecha, hora_inicio, hora_fin) VALUES
    -- Day +1
    (1, CURRENT_DATE + 1, '08:00', '09:00'),
    (3, CURRENT_DATE + 1, '10:00', '11:00'),
    (2, CURRENT_DATE + 1, '18:00', '19:00'),
    -- Day +2
    (3, CURRENT_DATE + 2, '07:00', '08:00'),
    (1, CURRENT_DATE + 2, '17:00', '18:00'),
    -- Day +3
    (2, CURRENT_DATE + 3, '08:00', '09:00'),
    (3, CURRENT_DATE + 3, '18:00', '19:00'),
    -- Day +5
    (1, CURRENT_DATE + 5, '09:00', '10:00'),
    (2, CURRENT_DATE + 5, '11:00', '12:00'),
    (3, CURRENT_DATE + 5, '19:00', '20:00'),
    -- Day +7
    (1, CURRENT_DATE + 7, '08:00', '09:00'),
    (3, CURRENT_DATE + 7, '10:00', '11:00');
