const paquetesService = require('../services/paquetes.service');
const { pool } = require('../config/db');

async function getPaquetes(req, res, next) {
    try {
        const paquetes = await paquetesService.getPaquetes();
        res.json({ ok: true, paquetes });
    } catch (err) {
        next(err);
    }
}

async function comprarPaquete(req, res, next) {
    const id_paquete = Number(req.params.id);
    if (!Number.isInteger(id_paquete) || id_paquete <= 0) {
        return res.status(400).json({ ok: false, error: 'INVALID_INPUT', message: 'ID de paquete inválido' });
    }

    try {
        const userRes = await pool.query(
            'SELECT estado FROM usuarios WHERE id_usuario = $1',
            [req.user.id_usuario]
        );
        if (!userRes.rows.length || userRes.rows[0].estado !== 'activo') {
            return res.status(403).json({ ok: false, error: 'INACTIVE_USER', message: 'Cuenta inactiva' });
        }
    } catch (err) {
        return next(err);
    }

    try {
        const usuario_paquete = await paquetesService.comprarPaquete(id_paquete, req.user.id_usuario);
        res.status(201).json({ ok: true, usuario_paquete });
    } catch (err) {
        if (err.code === 'NOT_FOUND') {
            return res.status(404).json({ ok: false, error: 'NOT_FOUND', message: err.message });
        }
        next(err);
    }
}

async function getMisCompras(req, res, next) {
    try {
        const compras = await paquetesService.getMisCompras(req.user.id_usuario);
        res.json({ ok: true, compras });
    } catch (err) {
        next(err);
    }
}

module.exports = { getPaquetes, comprarPaquete, getMisCompras };
