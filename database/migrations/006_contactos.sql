CREATE TABLE IF NOT EXISTS contactos (
    id_contacto    SERIAL PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL,
    telefono       VARCHAR(20),
    correo         VARCHAR(150) NOT NULL,
    mensaje        TEXT NOT NULL,
    estado         VARCHAR(20) DEFAULT 'nuevo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'glow_user') THEN
        GRANT SELECT, INSERT, UPDATE ON contactos TO glow_user;
        GRANT USAGE, SELECT ON SEQUENCE contactos_id_contacto_seq TO glow_user;
    END IF;
END
$$;
