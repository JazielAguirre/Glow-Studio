function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ ok: false, error: 'Token requerido' });
    }
    if (req.user.tipo_usuario !== 'admin') {
        return res.status(403).json({ ok: false, error: 'Acceso denegado' });
    }
    next();
}

module.exports = { requireAdmin };
