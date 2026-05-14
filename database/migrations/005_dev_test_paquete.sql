-- ============================================================
-- Glow Studio — DEV/DEMO SEED ONLY
-- DO NOT apply in production.
-- Purpose: give the first registered user an active 5-class
--          package so reservations can be tested before the
--          package-purchase feature is implemented.
-- ============================================================

-- Inserts only if the user does not already have an active package
-- (safe to run more than once on a clean dev database).
INSERT INTO usuario_paquetes (id_usuario, id_paquete, clases_restantes, fecha_inicio, fecha_expiracion, estado)
SELECT
    u.id_usuario,
    p.id_paquete,
    5,
    CURRENT_DATE,
    CURRENT_DATE + 30,
    'activo'
FROM usuarios u
CROSS JOIN paquetes p
WHERE p.nombre = '5 Clases'
  AND NOT EXISTS (
      SELECT 1 FROM usuario_paquetes up2
      WHERE up2.id_usuario = u.id_usuario
        AND up2.estado = 'activo'
  )
ORDER BY u.id_usuario ASC
LIMIT 1;
