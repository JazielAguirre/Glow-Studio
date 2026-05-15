-- Run as superuser (e.g. postgres). glow_user lacks ALTER TABLE permission.

-- 1. Rename existing 'cliente' values to 'usuario'
UPDATE usuarios SET tipo_usuario = 'usuario' WHERE tipo_usuario = 'cliente';

-- 2. Change column default for future registrations
ALTER TABLE usuarios ALTER COLUMN tipo_usuario SET DEFAULT 'usuario';

-- 3. Add check constraint (idempotent: skipped if already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_tipo_usuario'
    ) THEN
        ALTER TABLE usuarios ADD CONSTRAINT chk_tipo_usuario
            CHECK (tipo_usuario IN ('usuario', 'admin'));
    END IF;
END
$$;

-- To promote a user to admin (run as superuser or a user with UPDATE on usuarios):
--   UPDATE usuarios SET tipo_usuario = 'admin' WHERE email = 'correo@ejemplo.com';
