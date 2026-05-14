const reservasService = require('../services/reservas.service');

// Maps PostgreSQL trigger RAISE EXCEPTION messages to stable error keys.
function translatePgError(err) {
    if (err.code === 'SIN_PAQUETE') {
        return { status: 422, error: 'SIN_PAQUETE', message: err.message };
    }
    if (err.code === 'NOT_FOUND') {
        return { status: 404, error: 'NOT_FOUND', message: err.message };
    }
    if (err.code === 'YA_CANCELADA') {
        return { status: 422, error: 'YA_CANCELADA', message: err.message };
    }

    // PostgreSQL RAISE EXCEPTION without SQLSTATE uses P0001.
    if (err.code === 'P0001') {
        const msg = err.message || '';
        if (msg.includes('cupos')) {
            return { status: 422, error: 'CLASE_LLENA', message: 'No hay cupos disponibles para esta clase' };
        }
        if (msg.includes('vencido')) {
            return { status: 422, error: 'PAQUETE_VENCIDO', message: 'Tu paquete está vencido' };
        }
        if (msg.includes('disponibles en tu paquete')) {
            return { status: 422, error: 'PAQUETE_AGOTADO', message: 'No tienes clases disponibles en tu paquete' };
        }
        if (msg.includes('no se encuentra activo')) {
            return { status: 422, error: 'PAQUETE_INACTIVO', message: 'El paquete no se encuentra activo' };
        }
        return { status: 422, error: 'DB_ERROR', message: msg };
    }

    // Unique constraint: UNIQUE (id_usuario, id_clase)
    // Known limitation: a cancelled reservation blocks re-booking the same class.
    // This is enforced by the schema constraint and intentionally not bypassed here.
    // Future improvement: allow re-booking after cancellation.
    if (err.code === '23505') {
        return { status: 422, error: 'YA_RESERVADO', message: 'Ya tienes una reserva para esta clase' };
    }

    return null;
}

async function getMisReservas(req, res, next) {
    try {
        const reservas = await reservasService.getMisReservas(req.user.id_usuario);
        res.json({ ok: true, reservas });
    } catch (err) {
        next(err);
    }
}

async function getMisPaquetes(req, res, next) {
    try {
        const paquetes = await reservasService.getMisPaquetes(req.user.id_usuario);
        res.json({ ok: true, paquetes });
    } catch (err) {
        next(err);
    }
}

async function crearReserva(req, res, next) {
    const { id_clase } = req.body;
    if (!id_clase || !Number.isInteger(Number(id_clase))) {
        return res.status(400).json({ ok: false, error: 'INVALID_INPUT', message: 'id_clase es requerido y debe ser un número' });
    }

    try {
        const reserva = await reservasService.crearReserva(req.user.id_usuario, Number(id_clase));
        res.status(201).json({ ok: true, reserva });
    } catch (err) {
        const translated = translatePgError(err);
        if (translated) {
            return res.status(translated.status).json({ ok: false, error: translated.error, message: translated.message });
        }
        next(err);
    }
}

async function cancelarReserva(req, res, next) {
    const id_reserva = Number(req.params.id);
    if (!Number.isInteger(id_reserva) || id_reserva <= 0) {
        return res.status(400).json({ ok: false, error: 'INVALID_INPUT', message: 'id de reserva inválido' });
    }

    try {
        const reserva = await reservasService.cancelarReserva(id_reserva, req.user.id_usuario);
        res.json({ ok: true, reserva });
    } catch (err) {
        const translated = translatePgError(err);
        if (translated) {
            return res.status(translated.status).json({ ok: false, error: translated.error, message: translated.message });
        }
        next(err);
    }
}

module.exports = { getMisReservas, getMisPaquetes, crearReserva, cancelarReserva };
