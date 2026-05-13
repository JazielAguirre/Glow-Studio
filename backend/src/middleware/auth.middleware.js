const jwt = require('jsonwebtoken');

function getJwtSecret() {
    return process.env.JWT_SECRET || 'dev_fallback_secret_change_in_prod';
}

function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ ok: false, error: 'Token requerido' });
    }

    const token = header.slice(7);
    try {
        const payload = jwt.verify(token, getJwtSecret());
        req.user = {
            id_usuario: payload.id_usuario,
            tipo_usuario: payload.tipo_usuario,
        };
        next();
    } catch {
        return res.status(401).json({ ok: false, error: 'Token inválido o expirado' });
    }
}

module.exports = { requireAuth };
