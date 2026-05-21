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

async function getTiposClase() {
    const result = await pool.query(
        `SELECT id_tipo, nombre, cupo_maximo FROM tipos_clase ORDER BY id_tipo`
    );
    return result.rows;
}

async function getAdminClases() {
    const result = await pool.query(`
        SELECT c.id_clase,
               c.id_tipo,
               tc.nombre   AS disciplina,
               c.fecha,
               c.hora_inicio,
               c.hora_fin,
               c.estado,
               tc.cupo_maximo,
               COUNT(r.id_reserva) FILTER (WHERE r.estado = 'activa')::int AS reservas_activas,
               (tc.cupo_maximo - COUNT(r.id_reserva) FILTER (WHERE r.estado = 'activa'))::int AS cupo_disponible
        FROM clases c
        JOIN tipos_clase tc USING(id_tipo)
        LEFT JOIN reservas r USING(id_clase)
        GROUP BY c.id_clase, c.id_tipo, tc.nombre, c.fecha, c.hora_inicio, c.hora_fin, c.estado, tc.cupo_maximo
        ORDER BY c.fecha DESC, c.hora_inicio
    `);
    return result.rows;
}

async function crearClase({ id_tipo, fecha, hora_inicio, hora_fin }) {
    const result = await pool.query(
        `INSERT INTO clases (id_tipo, fecha, hora_inicio, hora_fin)
         VALUES ($1, $2, $3, $4)
         RETURNING id_clase, id_tipo, fecha, hora_inicio, hora_fin, estado`,
        [id_tipo, fecha, hora_inicio, hora_fin]
    );
    return result.rows[0];
}

async function actualizarClase(id, { id_tipo, fecha, hora_inicio, hora_fin }) {
    const result = await pool.query(
        `UPDATE clases
         SET id_tipo = $1, fecha = $2, hora_inicio = $3, hora_fin = $4
         WHERE id_clase = $5
         RETURNING id_clase, id_tipo, fecha, hora_inicio, hora_fin, estado`,
        [id_tipo, fecha, hora_inicio, hora_fin, id]
    );
    return result.rows[0] || null;
}

async function deshabilitarClase(id) {
    const countRes = await pool.query(
        `SELECT COUNT(*)::int AS reservas_activas FROM reservas
         WHERE id_clase = $1 AND estado = 'activa'`,
        [id]
    );
    const reservas_activas = countRes.rows[0].reservas_activas;

    const result = await pool.query(
        `UPDATE clases SET estado = 'inactiva'
         WHERE id_clase = $1
         RETURNING id_clase, estado`,
        [id]
    );
    if (!result.rows[0]) return null;
    return { ...result.rows[0], reservas_activas };
}

async function reactivarClase(id) {
    const result = await pool.query(
        `UPDATE clases SET estado = 'activa'
         WHERE id_clase = $1
         RETURNING id_clase, estado`,
        [id]
    );
    return result.rows[0] || null;
}

async function getPaquetesCatalogo() {
    const result = await pool.query(`
        SELECT p.id_paquete,
               p.nombre,
               p.cantidad_clases,
               p.precio,
               p.vigencia_dias,
               p.estado,
               COUNT(up.id_usuario_paquete)::int              AS veces_vendido,
               COALESCE(COUNT(up.id_usuario_paquete) * p.precio, 0) AS ingresos_estimados
        FROM paquetes p
        LEFT JOIN usuario_paquetes up USING(id_paquete)
        GROUP BY p.id_paquete
        ORDER BY p.precio ASC
    `);
    return result.rows;
}

async function crearPaquete({ nombre, cantidad_clases, precio, vigencia_dias }) {
    const result = await pool.query(
        `INSERT INTO paquetes (nombre, cantidad_clases, precio, vigencia_dias)
         VALUES ($1, $2, $3, $4)
         RETURNING id_paquete, nombre, cantidad_clases, precio, vigencia_dias, estado`,
        [nombre, cantidad_clases, precio, vigencia_dias]
    );
    return result.rows[0];
}

async function actualizarPaquete(id, { nombre, cantidad_clases, precio, vigencia_dias }) {
    const result = await pool.query(
        `UPDATE paquetes SET nombre = $1, cantidad_clases = $2, precio = $3, vigencia_dias = $4
         WHERE id_paquete = $5
         RETURNING id_paquete, nombre, cantidad_clases, precio, vigencia_dias, estado`,
        [nombre, cantidad_clases, precio, vigencia_dias, id]
    );
    return result.rows[0] || null;
}

async function deshabilitarPaquete(id) {
    const countRes = await pool.query(
        `SELECT COUNT(*)::int AS veces_vendido FROM usuario_paquetes WHERE id_paquete = $1`,
        [id]
    );
    const veces_vendido = countRes.rows[0].veces_vendido;

    const result = await pool.query(
        `UPDATE paquetes SET estado = 'inactivo'
         WHERE id_paquete = $1
         RETURNING id_paquete, nombre, estado`,
        [id]
    );
    if (!result.rows[0]) return null;
    return { ...result.rows[0], veces_vendido };
}

async function reactivarPaquete(id) {
    const result = await pool.query(
        `UPDATE paquetes SET estado = 'activo'
         WHERE id_paquete = $1
         RETURNING id_paquete, nombre, estado`,
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
    getTiposClase,
    getAdminClases,
    crearClase,
    actualizarClase,
    deshabilitarClase,
    reactivarClase,
    getPaquetesCatalogo,
    crearPaquete,
    actualizarPaquete,
    deshabilitarPaquete,
    reactivarPaquete,
};
