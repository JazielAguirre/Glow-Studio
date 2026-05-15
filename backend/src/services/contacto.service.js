const { pool } = require('../config/db');

async function guardarContacto({ nombre, telefono, correo, mensaje }) {
    const result = await pool.query(
        `INSERT INTO contactos (nombre, telefono, correo, mensaje)
         VALUES ($1, $2, $3, $4)
         RETURNING id_contacto`,
        [nombre, telefono || null, correo, mensaje]
    );
    return result.rows[0];
}

module.exports = { guardarContacto };
