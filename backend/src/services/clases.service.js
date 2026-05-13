const { pool } = require('../config/db');

async function getAllClases() {
    const result = await pool.query(`
        SELECT
            c.id_clase,
            c.id_tipo,
            tc.nombre                                                          AS disciplina,
            TO_CHAR(c.fecha, 'YYYY-MM-DD')                                     AS fecha,
            c.hora_inicio,
            c.hora_fin,
            c.estado,
            tc.cupo_maximo,
            COUNT(r.id_reserva) FILTER (WHERE r.estado = 'activa')::int       AS reservas_actuales,
            (tc.cupo_maximo - COUNT(r.id_reserva) FILTER (WHERE r.estado = 'activa'))::int AS cupos_disponibles
        FROM clases c
        JOIN tipos_clase tc ON c.id_tipo = tc.id_tipo
        LEFT JOIN reservas r ON r.id_clase = c.id_clase
        WHERE c.estado = 'activa'
          AND c.fecha >= CURRENT_DATE
        GROUP BY c.id_clase, tc.id_tipo, tc.nombre, tc.cupo_maximo
        ORDER BY c.fecha ASC, c.hora_inicio ASC
    `);
    return result.rows;
}

module.exports = { getAllClases };
