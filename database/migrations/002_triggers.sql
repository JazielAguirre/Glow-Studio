-- ============================================================
-- Glow Studio — Triggers
-- Business rules enforced at the database layer.
-- Source of truth: docs/Script-Base-de-Datos.docx (2).pdf
-- ============================================================

-- ============================================
-- FUNCIÓN: validar_cupo
-- Refuses a reservation when the class is full.
-- ============================================
CREATE OR REPLACE FUNCTION validar_cupo()
RETURNS TRIGGER AS $$
DECLARE
    cupo_max       INT;
    total_reservas INT;
BEGIN
    SELECT tc.cupo_maximo INTO cupo_max
    FROM clases c
    JOIN tipos_clase tc ON c.id_tipo = tc.id_tipo
    WHERE c.id_clase = NEW.id_clase;

    SELECT COUNT(*) INTO total_reservas
    FROM reservas
    WHERE id_clase = NEW.id_clase
      AND estado = 'activa';

    IF total_reservas >= cupo_max THEN
        RAISE EXCEPTION 'No hay cupos disponibles para esta clase';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validar_cupo ON reservas;
CREATE TRIGGER trigger_validar_cupo
    BEFORE INSERT ON reservas
    FOR EACH ROW
    EXECUTE FUNCTION validar_cupo();

-- ============================================
-- FUNCIÓN: validar_paquete
-- Refuses consumption when the package is inactive, exhausted, or expired.
-- ============================================
CREATE OR REPLACE FUNCTION validar_paquete()
RETURNS TRIGGER AS $$
DECLARE
    clases_rest    INT;
    fecha_exp      DATE;
    paquete_estado VARCHAR(20);
BEGIN
    SELECT clases_restantes, fecha_expiracion, estado
      INTO clases_rest, fecha_exp, paquete_estado
    FROM usuario_paquetes
    WHERE id_usuario_paquete = NEW.id_usuario_paquete;

    IF paquete_estado != 'activo' THEN
        RAISE EXCEPTION 'El paquete no se encuentra activo';
    END IF;

    IF clases_rest <= 0 THEN
        RAISE EXCEPTION 'No tienes clases disponibles en tu paquete';
    END IF;

    IF fecha_exp < CURRENT_DATE THEN
        RAISE EXCEPTION 'El paquete está vencido';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validar_paquete ON uso_paquete;
CREATE TRIGGER trigger_validar_paquete
    BEFORE INSERT ON uso_paquete
    FOR EACH ROW
    EXECUTE FUNCTION validar_paquete();

-- ============================================
-- FUNCIÓN: descontar_clase
-- Decrements the user package's remaining class count when consumed.
-- ============================================
CREATE OR REPLACE FUNCTION descontar_clase()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE usuario_paquetes
       SET clases_restantes = clases_restantes - 1
     WHERE id_usuario_paquete = NEW.id_usuario_paquete;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_descontar_clase ON uso_paquete;
CREATE TRIGGER trigger_descontar_clase
    AFTER INSERT ON uso_paquete
    FOR EACH ROW
    EXECUTE FUNCTION descontar_clase();

-- ============================================
-- FUNCIÓN: procesar_cancelacion_reserva
-- Refunds the class to the user's package when a reservation is cancelled.
-- ============================================
CREATE OR REPLACE FUNCTION procesar_cancelacion_reserva()
RETURNS TRIGGER AS $$
DECLARE
    v_id_usuario_paquete INT;
BEGIN
    IF NEW.estado = 'cancelada' AND OLD.estado = 'activa' THEN
        SELECT id_usuario_paquete INTO v_id_usuario_paquete
        FROM uso_paquete
        WHERE id_reserva = NEW.id_reserva
          AND estado = 'aplicado';

        IF FOUND THEN
            UPDATE usuario_paquetes
               SET clases_restantes = clases_restantes + 1
             WHERE id_usuario_paquete = v_id_usuario_paquete;

            UPDATE uso_paquete
               SET estado = 'revertido'
             WHERE id_reserva = NEW.id_reserva;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cancelacion_reserva ON reservas;
CREATE TRIGGER trigger_cancelacion_reserva
    AFTER UPDATE ON reservas
    FOR EACH ROW
    EXECUTE FUNCTION procesar_cancelacion_reserva();
