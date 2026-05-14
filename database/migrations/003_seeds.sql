-- ============================================================
-- Glow Studio — Seeds
-- ============================================================

-- ============================================
-- tipos_clase
-- ============================================
INSERT INTO tipos_clase (nombre, cupo_maximo) VALUES
    ('Yoga',    15),
    ('Barre',   15),
    ('Pilates',  5);

-- ============================================
-- paquetes — mirrored from html/paquetes.html
-- ============================================
INSERT INTO paquetes (nombre, cantidad_clases, precio, vigencia_dias) VALUES
    ('1 Clase',    1,  200.00,  7),
    ('5 Clases',   5,  899.00, 15),
    ('8 Clases',   8, 1399.00, 20),
    ('12 Clases', 12, 1799.00, 60),
    ('20 Clases', 20, 2799.00, 60),
    ('90 Clases', 90, 5999.00, 90);