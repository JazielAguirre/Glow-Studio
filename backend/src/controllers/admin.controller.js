const adminService = require('../services/admin.service');

async function dashboard(req, res) {
    try {
        const data = await adminService.getDashboard();
        return res.json({ ok: true, dashboard: data });
    } catch (err) {
        console.error('[admin] dashboard error:', err.message);
        return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
}

async function usuarios(req, res) {
    try {
        const data = await adminService.getUsuarios();
        return res.json({ ok: true, usuarios: data });
    } catch (err) {
        console.error('[admin] usuarios error:', err.message);
        return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
}

async function paquetes(req, res) {
    try {
        const data = await adminService.getPaquetes();
        return res.json({ ok: true, paquetes: data });
    } catch (err) {
        console.error('[admin] paquetes error:', err.message);
        return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
}

async function reservas(req, res) {
    try {
        const data = await adminService.getReservas();
        return res.json({ ok: true, reservas: data });
    } catch (err) {
        console.error('[admin] reservas error:', err.message);
        return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
}

async function clasesOcupacion(req, res) {
    try {
        const data = await adminService.getClasesOcupacion();
        return res.json({ ok: true, clases: data });
    } catch (err) {
        console.error('[admin] clases-ocupacion error:', err.message);
        return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
}

async function contactos(req, res) {
    try {
        const data = await adminService.getContactos();
        return res.json({ ok: true, contactos: data });
    } catch (err) {
        console.error('[admin] contactos error:', err.message);
        return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
}

async function revisarContacto(req, res) {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) {
        return res.status(400).json({ ok: false, error: 'ID de contacto inválido' });
    }
    try {
        const contacto = await adminService.marcarContactoRevisado(id);
        if (!contacto) {
            return res.status(404).json({ ok: false, error: 'Contacto no encontrado' });
        }
        return res.json({ ok: true, contacto });
    } catch (err) {
        console.error('[admin] revisar-contacto error:', err.message);
        return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
}

module.exports = { dashboard, usuarios, paquetes, reservas, clasesOcupacion, contactos, revisarContacto };
