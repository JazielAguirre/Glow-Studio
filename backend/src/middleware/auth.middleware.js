const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

function getJwtSecret() {
    return process.env.JWT_SECRET || 'dev_fallback_secret_change_in_prod';
}

async function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ ok: false, error: 'Token requerido' });
    }

    const token = header.slice(7);
    let payload;
    try {
        payload = jwt.verify(token, getJwtSecret());
    } catch {
        return res.status(401).json({ ok: false, error: 'Token inválido o expirado' });
    }

    // Verify user still exists and is active; read role from DB so changes take effect immediately.
    try {
        const result = await pool.query(
            "SELECT id_usuario, tipo_usuario FROM usuarios WHERE id_usuario = $1 AND estado = 'activo'",
            [payload.id_usuario]
        );
        if (!result.rows.length) {
            return res.status(401).json({ ok: false, error: 'No autorizado' });
        }
        req.user = {
            id_usuario: result.rows[0].id_usuario,
            tipo_usuario: result.rows[0].tipo_usuario,
        };
        next();
    } catch (err) {
        next(err);
    }
}

module.exports = { requireAuth };
