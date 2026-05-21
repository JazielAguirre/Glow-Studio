const { pool } = require('../config/db');

async function getPaquetes() {
    const result = await pool.query(`
        SELECT id_paquete, nombre, cantidad_clases, precio, vigencia_dias
        FROM paquetes
        WHERE estado = 'activo'
        ORDER BY precio ASC
    `);
    return result.rows;
}

async function comprarPaquete(id_paquete, id_usuario) {
    const result = await pool.query(`
        WITH pkg AS (
            SELECT id_paquete, nombre, cantidad_clases, precio, vigencia_dias
            FROM paquetes
            WHERE id_paquete = $2 AND estado = 'activo'
        ),
        ins AS (
            INSERT INTO usuario_paquetes
                (id_usuario, id_paquete, clases_restantes, fecha_inicio, fecha_expiracion, estado)
            SELECT $1, pkg.id_paquete, pkg.cantidad_clases, CURRENT_DATE, CURRENT_DATE + pkg.vigencia_dias, 'activo'
            FROM pkg
            RETURNING id_usuario_paquete, id_paquete, clases_restantes, fecha_inicio, fecha_expiracion
        )
        SELECT ins.id_usuario_paquete,
               pkg.nombre,
               pkg.cantidad_clases,
               pkg.precio,
               TO_CHAR(ins.fecha_inicio,      'YYYY-MM-DD') AS fecha_inicio,
               TO_CHAR(ins.fecha_expiracion,  'YYYY-MM-DD') AS fecha_expiracion,
               ins.clases_restantes
        FROM ins JOIN pkg USING(id_paquete)
    `, [id_usuario, id_paquete]);

    if (result.rows.length === 0) {
        const err = new Error('Paquete no encontrado o inactivo');
        err.code = 'NOT_FOUND';
        throw err;
    }

    return result.rows[0];
}

async function getMisCompras(id_usuario) {
    const result = await pool.query(`
        SELECT up.id_usuario_paquete,
               p.nombre,
               p.cantidad_clases,
               p.precio,
               up.clases_restantes,
               TO_CHAR(up.fecha_inicio,     'YYYY-MM-DD') AS fecha_inicio,
               TO_CHAR(up.fecha_expiracion, 'YYYY-MM-DD') AS fecha_expiracion,
               up.estado
        FROM usuario_paquetes up
        JOIN paquetes p USING(id_paquete)
        WHERE up.id_usuario = $1
        ORDER BY up.fecha_inicio DESC
    `, [id_usuario]);
    return result.rows;
}

module.exports = { getPaquetes, comprarPaquete, getMisCompras };
