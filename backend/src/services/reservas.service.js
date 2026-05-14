const { pool } = require('../config/db');

async function getMisReservas(id_usuario) {
    const result = await pool.query(`
        SELECT
            r.id_reserva,
            r.id_clase,
            tc.nombre                                     AS disciplina,
            TO_CHAR(c.fecha, 'YYYY-MM-DD')                AS fecha,
            c.hora_inicio,
            c.hora_fin,
            r.estado,
            TO_CHAR(r.fecha_reserva, 'YYYY-MM-DD')        AS fecha_reserva,
            p.nombre                                      AS nombre_paquete
        FROM reservas r
        JOIN clases c           ON r.id_clase  = c.id_clase
        JOIN tipos_clase tc     ON c.id_tipo   = tc.id_tipo
        LEFT JOIN uso_paquete uso
               ON uso.id_reserva        = r.id_reserva
              AND uso.estado            = 'aplicado'
        LEFT JOIN usuario_paquetes up   ON uso.id_usuario_paquete = up.id_usuario_paquete
        LEFT JOIN paquetes p            ON up.id_paquete          = p.id_paquete
        WHERE r.id_usuario = $1
        ORDER BY c.fecha DESC, c.hora_inicio DESC
    `, [id_usuario]);
    return result.rows;
}

async function getMisPaquetes(id_usuario) {
    const result = await pool.query(`
        SELECT
            up.id_usuario_paquete,
            p.nombre,
            up.clases_restantes,
            TO_CHAR(up.fecha_expiracion, 'YYYY-MM-DD') AS fecha_expiracion
        FROM usuario_paquetes up
        JOIN paquetes p ON up.id_paquete = p.id_paquete
        WHERE up.id_usuario        = $1
          AND up.estado            = 'activo'
          AND up.clases_restantes  > 0
          AND up.fecha_expiracion >= CURRENT_DATE
        ORDER BY up.fecha_expiracion ASC
    `, [id_usuario]);
    return result.rows;
}

async function crearReserva(id_usuario, id_clase) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Lock the soonest-expiring active package to prevent race conditions.
        const paqueteResult = await client.query(`
            SELECT id_usuario_paquete
            FROM usuario_paquetes
            WHERE id_usuario        = $1
              AND estado            = 'activo'
              AND clases_restantes  > 0
              AND fecha_expiracion >= CURRENT_DATE
            ORDER BY fecha_expiracion ASC
            LIMIT 1
            FOR UPDATE
        `, [id_usuario]);

        if (paqueteResult.rows.length === 0) {
            await client.query('ROLLBACK');
            const err = new Error('Necesitas un paquete activo para reservar');
            err.code = 'SIN_PAQUETE';
            throw err;
        }

        const id_usuario_paquete = paqueteResult.rows[0].id_usuario_paquete;

        // INSERT INTO reservas — trigger_validar_cupo fires here.
        const reservaResult = await client.query(`
            INSERT INTO reservas (id_usuario, id_clase)
            VALUES ($1, $2)
            RETURNING id_reserva, id_clase, estado
        `, [id_usuario, id_clase]);

        const { id_reserva } = reservaResult.rows[0];

        // INSERT INTO uso_paquete — trigger_validar_paquete + trigger_descontar_clase fire here.
        await client.query(`
            INSERT INTO uso_paquete (id_usuario_paquete, id_reserva)
            VALUES ($1, $2)
        `, [id_usuario_paquete, id_reserva]);

        await client.query('COMMIT');
        return reservaResult.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

async function cancelarReserva(id_reserva, id_usuario) {
    // Verify ownership and current state before updating.
    const check = await pool.query(`
        SELECT id_reserva, estado
        FROM reservas
        WHERE id_reserva = $1 AND id_usuario = $2
    `, [id_reserva, id_usuario]);

    if (check.rows.length === 0) {
        const err = new Error('Reserva no encontrada');
        err.code = 'NOT_FOUND';
        throw err;
    }

    if (check.rows[0].estado === 'cancelada') {
        const err = new Error('La reserva ya está cancelada');
        err.code = 'YA_CANCELADA';
        throw err;
    }

    // UPDATE to 'cancelada' — trigger_cancelacion_reserva fires here and refunds the class.
    const result = await pool.query(`
        UPDATE reservas
        SET estado = 'cancelada'
        WHERE id_reserva = $1 AND id_usuario = $2
        RETURNING id_reserva, estado
    `, [id_reserva, id_usuario]);

    return result.rows[0];
}

module.exports = { getMisReservas, getMisPaquetes, crearReserva, cancelarReserva };
