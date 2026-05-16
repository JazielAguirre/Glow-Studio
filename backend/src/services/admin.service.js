const { pool } = require('../config/db');

async function getDashboard() {
    const result = await pool.query(`
        SELECT
            (SELECT COUNT(*)                                   FROM usuarios)                                AS total_usuarios,
            (SELECT COUNT(*)                                   FROM usuario_paquetes WHERE estado = 'activo') AS paquetes_activos,
            (SELECT COALESCE(SUM(p.precio), 0)
               FROM usuario_paquetes up
               JOIN paquetes p USING(id_paquete))                                                           AS ingresos_estimados,
            (SELECT COUNT(*) FROM reservas WHERE estado = 'activa')                                         AS reservas_activas,
            (SELECT COUNT(*) FROM reservas WHERE estado = 'cancelada')                                      AS reservas_canceladas,
            (SELECT COUNT(*) FROM contactos WHERE estado = 'nuevo')                                         AS contactos_nuevos,
            (SELECT COUNT(*) FROM clases    WHERE fecha >= CURRENT_DATE)                                    AS clases_proximas
    `);
    return result.rows[0];
}

async function getUsuarios() {
    const result = await pool.query(`
        SELECT id_usuario, nombre, email, tipo_usuario, estado, fecha_registro
        FROM usuarios
        ORDER BY fecha_registro DESC
    `);
    return result.rows;
}

async function getPaquetes() {
    const result = await pool.query(`
        SELECT up.id_usuario_paquete,
               u.nombre   AS usuario,
               u.email,
               p.nombre   AS paquete,
               p.precio,
               up.clases_restantes,
               up.fecha_inicio,
               up.fecha_expiracion,
               up.estado
        FROM usuario_paquetes up
        JOIN usuarios u USING(id_usuario)
        JOIN paquetes  p USING(id_paquete)
        ORDER BY up.fecha_inicio DESC
    `);
    return result.rows;
}

async function getReservas() {
    const result = await pool.query(`
        SELECT r.id_reserva,
               u.nombre       AS usuario,
               u.email,
               tc.nombre      AS disciplina,
               c.fecha,
               c.hora_inicio,
               c.hora_fin,
               r.estado,
               r.fecha_reserva
        FROM reservas r
        JOIN usuarios    u  USING(id_usuario)
        JOIN clases      c  USING(id_clase)
        JOIN tipos_clase tc USING(id_tipo)
        ORDER BY c.fecha DESC, c.hora_inicio
    `);
    return result.rows;
}

async function getClasesOcupacion() {
    const result = await pool.query(`
        SELECT c.id_clase,
               tc.nombre      AS disciplina,
               c.fecha,
               c.hora_inicio,
               c.hora_fin,
               tc.cupo_maximo,
               COUNT(r.id_reserva) FILTER (WHERE r.estado = 'activa')                AS reservas_activas,
               tc.cupo_maximo - COUNT(r.id_reserva) FILTER (WHERE r.estado = 'activa') AS cupo_disponible,
               COALESCE(ROUND(
                   COUNT(r.id_reserva) FILTER (WHERE r.estado = 'activa') * 100.0
                   / NULLIF(tc.cupo_maximo, 0), 1
               ), 0) AS ocupacion_pct
        FROM clases c
        JOIN tipos_clase tc USING(id_tipo)
        LEFT JOIN reservas r USING(id_clase)
        GROUP BY c.id_clase, tc.nombre, c.fecha, c.hora_inicio, c.hora_fin, tc.cupo_maximo
        ORDER BY c.fecha, c.hora_inicio
    `);
    return result.rows;
}

async function getContactos() {
    const result = await pool.query(`
        SELECT id_contacto, nombre, correo, telefono, mensaje, estado, fecha_creacion
        FROM contactos
        ORDER BY fecha_creacion DESC
    `);
    return result.rows;
}

async function marcarContactoRevisado(id) {
    const result = await pool.query(
        `UPDATE contactos SET estado = 'revisado'
         WHERE id_contacto = $1
         RETURNING id_contacto, estado`,
        [id]
    );
    return result.rows[0] || null;
}

module.exports = {
    getDashboard,
    getUsuarios,
    getPaquetes,
    getReservas,
    getClasesOcupacion,
    getContactos,
    marcarContactoRevisado,
};
