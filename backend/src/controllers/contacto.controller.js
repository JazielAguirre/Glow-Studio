const { guardarContacto } = require('../services/contacto.service');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function crearContacto(req, res) {
    const { nombre, telefono, correo, mensaje } = req.body;

    if (!nombre || !correo || !mensaje) {
        return res.status(400).json({ ok: false, error: 'nombre, correo y mensaje son requeridos' });
    }

    if (!EMAIL_REGEX.test(correo)) {
        return res.status(400).json({ ok: false, error: 'Formato de correo inválido' });
    }

    try {
        await guardarContacto({ nombre, telefono, correo, mensaje });
        return res.status(201).json({ ok: true, message: 'Mensaje enviado correctamente' });
    } catch (err) {
        console.error('[contacto] Error al guardar:', err.message);
        return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
}

module.exports = { crearContacto };
