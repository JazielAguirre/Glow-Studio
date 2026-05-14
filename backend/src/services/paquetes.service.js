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
        INSERT INTO usuario_paquetes
            (id_usuario, id_paquete, clases_restantes, fecha_inicio, fecha_expiracion, estado)
        SELECT
            $1,
            p.id_paquete,
            p.cantidad_clases,
            CURRENT_DATE,
            CURRENT_DATE + p.vigencia_dias,
            'activo'
        FROM paquetes p
        WHERE p.id_paquete = $2
          AND p.estado = 'activo'
        RETURNING
            id_usuario_paquete,
            clases_restantes,
            TO_CHAR(fecha_expiracion, 'YYYY-MM-DD') AS fecha_expiracion
    `, [id_usuario, id_paquete]);

    if (result.rows.length === 0) {
        const err = new Error('Paquete no encontrado o inactivo');
        err.code = 'NOT_FOUND';
        throw err;
    }

    return result.rows[0];
}

module.exports = { getPaquetes, comprarPaquete };
