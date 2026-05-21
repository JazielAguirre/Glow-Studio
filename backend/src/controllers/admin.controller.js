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

// ── Class management ───────────────────────────────────────────────────────────

async function tiposClase(req, res) {
    try {
        const data = await adminService.getTiposClase();
        return res.json({ ok: true, tipos: data });
    } catch (err) {
        console.error('[admin] tipos-clase error:', err.message);
        return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
}

async function adminClases(req, res) {
    try {
        const data = await adminService.getAdminClases();
        return res.json({ ok: true, clases: data });
    } catch (err) {
        console.error('[admin] clases error:', err.message);
        return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
}

function parseClaseBody(body) {
    const { id_tipo, fecha, hora_inicio, hora_fin } = body;
    const errors = [];

    const idTipo = parseInt(id_tipo, 10);
    if (!idTipo || isNaN(idTipo)) errors.push('id_tipo debe ser un entero válido');
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) errors.push('fecha requerida (YYYY-MM-DD)');
    if (!hora_inicio || !/^\d{2}:\d{2}$/.test(hora_inicio)) errors.push('hora_inicio requerida (HH:MM)');
    if (!hora_fin   || !/^\d{2}:\d{2}$/.test(hora_fin))   errors.push('hora_fin requerida (HH:MM)');

    if (errors.length === 0 && hora_fin <= hora_inicio) {
        errors.push('hora_fin debe ser mayor que hora_inicio');
    }

    return { idTipo, fecha, hora_inicio, hora_fin, errors };
}

async function crearClase(req, res) {
    const { idTipo, fecha, hora_inicio, hora_fin, errors } = parseClaseBody(req.body);
    if (errors.length) {
        return res.status(400).json({ ok: false, error: errors.join('; ') });
    }

    const today = new Date().toISOString().slice(0, 10);
    if (fecha < today) {
        return res.status(400).json({ ok: false, error: 'La fecha no puede ser en el pasado' });
    }

    try {
        const { pool } = require('../config/db');

        const tipoCheck = await pool.query(
            'SELECT id_tipo FROM tipos_clase WHERE id_tipo = $1', [idTipo]
        );
        if (!tipoCheck.rows.length) {
            return res.status(400).json({ ok: false, error: 'Disciplina (id_tipo) no existe' });
        }

        const dupCheck = await pool.query(
            `SELECT id_clase FROM clases
             WHERE id_tipo = $1 AND fecha = $2 AND hora_inicio = $3 AND estado = 'activa'`,
            [idTipo, fecha, hora_inicio]
        );
        if (dupCheck.rows.length) {
            return res.status(400).json({ ok: false, error: 'Ya existe una clase activa con esa disciplina, fecha y hora' });
        }

        const clase = await adminService.crearClase({ id_tipo: idTipo, fecha, hora_inicio, hora_fin });
        return res.status(201).json({ ok: true, clase });
    } catch (err) {
        console.error('[admin] crear-clase error:', err.message);
        return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
}

async function actualizarClase(req, res) {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) {
        return res.status(400).json({ ok: false, error: 'ID de clase inválido' });
    }

    const { idTipo, fecha, hora_inicio, hora_fin, errors } = parseClaseBody(req.body);
    if (errors.length) {
        return res.status(400).json({ ok: false, error: errors.join('; ') });
    }

    const today = new Date().toISOString().slice(0, 10);
    if (fecha < today) {
        return res.status(400).json({ ok: false, error: 'La fecha no puede ser en el pasado' });
    }

    try {
        const { pool } = require('../config/db');

        const tipoCheck = await pool.query(
            'SELECT id_tipo FROM tipos_clase WHERE id_tipo = $1', [idTipo]
        );
        if (!tipoCheck.rows.length) {
            return res.status(400).json({ ok: false, error: 'Disciplina (id_tipo) no existe' });
        }

        const dupCheck = await pool.query(
            `SELECT id_clase FROM clases
             WHERE id_tipo = $1 AND fecha = $2 AND hora_inicio = $3
               AND estado = 'activa' AND id_clase <> $4`,
            [idTipo, fecha, hora_inicio, id]
        );
        if (dupCheck.rows.length) {
            return res.status(400).json({ ok: false, error: 'Ya existe otra clase activa con esa disciplina, fecha y hora' });
        }

        const clase = await adminService.actualizarClase(id, { id_tipo: idTipo, fecha, hora_inicio, hora_fin });
        if (!clase) {
            return res.status(404).json({ ok: false, error: 'Clase no encontrada' });
        }
        return res.json({ ok: true, clase });
    } catch (err) {
        console.error('[admin] actualizar-clase error:', err.message);
        return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
}

async function deshabilitarClase(req, res) {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) {
        return res.status(400).json({ ok: false, error: 'ID de clase inválido' });
    }
    try {
        const result = await adminService.deshabilitarClase(id);
        if (!result) {
            return res.status(404).json({ ok: false, error: 'Clase no encontrada' });
        }
        const response = { ok: true, clase: result };
        if (result.reservas_activas > 0) {
            response.advertencia = `La clase tenía ${result.reservas_activas} reserva(s) activa(s)`;
        }
        return res.json(response);
    } catch (err) {
        console.error('[admin] deshabilitar-clase error:', err.message);
        return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
}

async function reactivarClase(req, res) {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) {
        return res.status(400).json({ ok: false, error: 'ID de clase inválido' });
    }
    try {
        const { pool } = require('../config/db');

        const claseCheck = await pool.query(
            'SELECT id_tipo, fecha, hora_inicio FROM clases WHERE id_clase = $1', [id]
        );
        if (!claseCheck.rows.length) {
            return res.status(404).json({ ok: false, error: 'Clase no encontrada' });
        }
        const { id_tipo, fecha, hora_inicio } = claseCheck.rows[0];

        const today = new Date().toISOString().slice(0, 10);
        const fechaStr = fecha instanceof Date
            ? fecha.toISOString().slice(0, 10)
            : String(fecha).slice(0, 10);
        if (fechaStr < today) {
            return res.status(400).json({ ok: false, error: 'No se puede reactivar una clase con fecha en el pasado' });
        }

        const dupCheck = await pool.query(
            `SELECT id_clase FROM clases
             WHERE id_tipo = $1 AND fecha = $2 AND hora_inicio = $3
               AND estado = 'activa' AND id_clase <> $4`,
            [id_tipo, fecha, hora_inicio, id]
        );
        if (dupCheck.rows.length) {
            return res.status(400).json({ ok: false, error: 'Ya existe una clase activa con esa disciplina, fecha y hora' });
        }

        const clase = await adminService.reactivarClase(id);
        return res.json({ ok: true, clase });
    } catch (err) {
        console.error('[admin] reactivar-clase error:', err.message);
        return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
}

// ── Package catalogue management ──────────────────────────────────────────────

async function paquetesCatalogo(req, res) {
    try {
        const data = await adminService.getPaquetesCatalogo();
        return res.json({ ok: true, paquetes: data });
    } catch (err) {
        console.error('[admin] paquetes-catalogo error:', err.message);
        return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
}

function parsePaqueteBody(body) {
    const { nombre, numero_clases, precio, vigencia_dias } = body;
    const errors = [];

    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) errors.push('nombre requerido');

    const cantidadClases = parseInt(numero_clases, 10);
    if (!cantidadClases || isNaN(cantidadClases) || cantidadClases <= 0)
        errors.push('numero_clases debe ser un entero mayor a 0');

    const precioNum = parseFloat(precio);
    if (precio === undefined || precio === null || precio === '' || isNaN(precioNum) || precioNum < 0)
        errors.push('precio debe ser un número mayor o igual a 0');

    const vigencia = parseInt(vigencia_dias, 10);
    if (!vigencia || isNaN(vigencia) || vigencia <= 0)
        errors.push('vigencia_dias debe ser un entero mayor a 0');

    return { nombre: nombre ? nombre.trim() : '', cantidadClases, precioNum, vigencia, errors };
}

async function crearAdminPaquete(req, res) {
    const { nombre, cantidadClases, precioNum, vigencia, errors } = parsePaqueteBody(req.body);
    if (errors.length) return res.status(400).json({ ok: false, error: errors.join('; ') });

    try {
        const { pool } = require('../config/db');
        const dupCheck = await pool.query(
            `SELECT id_paquete FROM paquetes WHERE LOWER(nombre) = LOWER($1) AND estado = 'activo'`,
            [nombre]
        );
        if (dupCheck.rows.length)
            return res.status(400).json({ ok: false, error: 'Ya existe un paquete activo con ese nombre' });

        const paquete = await adminService.crearPaquete({
            nombre, cantidad_clases: cantidadClases, precio: precioNum, vigencia_dias: vigencia,
        });
        return res.status(201).json({ ok: true, paquete });
    } catch (err) {
        console.error('[admin] crear-paquete error:', err.message);
        return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
}

async function actualizarAdminPaquete(req, res) {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) return res.status(400).json({ ok: false, error: 'ID de paquete inválido' });

    const { nombre, cantidadClases, precioNum, vigencia, errors } = parsePaqueteBody(req.body);
    if (errors.length) return res.status(400).json({ ok: false, error: errors.join('; ') });

    try {
        const { pool } = require('../config/db');
        const dupCheck = await pool.query(
            `SELECT id_paquete FROM paquetes
             WHERE LOWER(nombre) = LOWER($1) AND estado = 'activo' AND id_paquete <> $2`,
            [nombre, id]
        );
        if (dupCheck.rows.length)
            return res.status(400).json({ ok: false, error: 'Ya existe otro paquete activo con ese nombre' });

        const paquete = await adminService.actualizarPaquete(id, {
            nombre, cantidad_clases: cantidadClases, precio: precioNum, vigencia_dias: vigencia,
        });
        if (!paquete) return res.status(404).json({ ok: false, error: 'Paquete no encontrado' });
        return res.json({ ok: true, paquete });
    } catch (err) {
        console.error('[admin] actualizar-paquete error:', err.message);
        return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
}

async function deshabilitarAdminPaquete(req, res) {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) return res.status(400).json({ ok: false, error: 'ID de paquete inválido' });
    try {
        const result = await adminService.deshabilitarPaquete(id);
        if (!result) return res.status(404).json({ ok: false, error: 'Paquete no encontrado' });
        const response = { ok: true, paquete: result };
        if (result.veces_vendido > 0)
            response.advertencia = `El paquete fue adquirido ${result.veces_vendido} vez/veces — los paquetes existentes de usuarios no se ven afectados`;
        return res.json(response);
    } catch (err) {
        console.error('[admin] deshabilitar-paquete error:', err.message);
        return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
}

async function reactivarAdminPaquete(req, res) {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) return res.status(400).json({ ok: false, error: 'ID de paquete inválido' });
    try {
        const { pool } = require('../config/db');
        const pkgCheck = await pool.query('SELECT nombre FROM paquetes WHERE id_paquete = $1', [id]);
        if (!pkgCheck.rows.length) return res.status(404).json({ ok: false, error: 'Paquete no encontrado' });

        const { nombre } = pkgCheck.rows[0];
        const dupCheck = await pool.query(
            `SELECT id_paquete FROM paquetes
             WHERE LOWER(nombre) = LOWER($1) AND estado = 'activo' AND id_paquete <> $2`,
            [nombre, id]
        );
        if (dupCheck.rows.length)
            return res.status(400).json({ ok: false, error: 'Ya existe otro paquete activo con ese nombre' });

        const paquete = await adminService.reactivarPaquete(id);
        return res.json({ ok: true, paquete });
    } catch (err) {
        console.error('[admin] reactivar-paquete error:', err.message);
        return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
}

// ── User management ───────────────────────────────────────────────────────────

async function usuarioDetalle(req, res) {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) {
        return res.status(400).json({ ok: false, error: 'ID de usuario inválido' });
    }
    try {
        const detalle = await adminService.getUsuarioDetalle(id);
        if (!detalle) {
            return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
        }
        return res.json({ ok: true, ...detalle });
    } catch (err) {
        console.error('[admin] usuario-detalle error:', err.message);
        return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
}

async function cambiarRolHandler(req, res) {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) {
        return res.status(400).json({ ok: false, error: 'ID de usuario inválido' });
    }
    const { tipo_usuario } = req.body;
    if (!tipo_usuario || !['usuario', 'admin'].includes(tipo_usuario)) {
        return res.status(400).json({ ok: false, error: 'tipo_usuario debe ser "usuario" o "admin"' });
    }
    if (req.user.id_usuario === id) {
        return res.status(400).json({ ok: false, error: 'No puedes cambiar tu propio rol' });
    }
    try {
        const { pool } = require('../config/db');

        const targetRes = await pool.query(
            'SELECT tipo_usuario FROM usuarios WHERE id_usuario = $1',
            [id]
        );
        if (!targetRes.rows.length) {
            return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
        }

        if (targetRes.rows[0].tipo_usuario === 'admin' && tipo_usuario === 'usuario') {
            const countRes = await pool.query(
                "SELECT COUNT(*)::int AS cnt FROM usuarios WHERE tipo_usuario = 'admin' AND estado = 'activo'"
            );
            if (countRes.rows[0].cnt <= 1) {
                return res.status(400).json({ ok: false, error: 'No se puede degradar al único administrador activo' });
            }
        }

        const usuario = await adminService.cambiarRolUsuario(id, tipo_usuario);
        return res.json({ ok: true, usuario });
    } catch (err) {
        console.error('[admin] cambiar-rol error:', err.message);
        return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
}

async function deshabilitarUsuarioHandler(req, res) {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) {
        return res.status(400).json({ ok: false, error: 'ID de usuario inválido' });
    }
    if (req.user.id_usuario === id) {
        return res.status(400).json({ ok: false, error: 'No puedes deshabilitarte a ti mismo' });
    }
    try {
        const { pool } = require('../config/db');

        const targetRes = await pool.query(
            'SELECT tipo_usuario, estado FROM usuarios WHERE id_usuario = $1',
            [id]
        );
        if (!targetRes.rows.length) {
            return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
        }
        const target = targetRes.rows[0];

        if (target.tipo_usuario === 'admin' && target.estado === 'activo') {
            const countRes = await pool.query(
                "SELECT COUNT(*)::int AS cnt FROM usuarios WHERE tipo_usuario = 'admin' AND estado = 'activo'"
            );
            if (countRes.rows[0].cnt <= 1) {
                return res.status(400).json({ ok: false, error: 'No se puede deshabilitar al único administrador activo' });
            }
        }

        const usuario = await adminService.deshabilitarUsuario(id);
        if (!usuario) {
            return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
        }
        return res.json({ ok: true, usuario });
    } catch (err) {
        console.error('[admin] deshabilitar-usuario error:', err.message);
        return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
}

async function reactivarUsuarioHandler(req, res) {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) {
        return res.status(400).json({ ok: false, error: 'ID de usuario inválido' });
    }
    try {
        const usuario = await adminService.reactivarUsuario(id);
        if (!usuario) {
            return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
        }
        return res.json({ ok: true, usuario });
    } catch (err) {
        console.error('[admin] reactivar-usuario error:', err.message);
        return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
}

module.exports = {
    dashboard, usuarios, paquetes, reservas, clasesOcupacion, contactos, revisarContacto,
    tiposClase, adminClases, crearClase, actualizarClase, deshabilitarClase, reactivarClase,
    paquetesCatalogo, crearAdminPaquete, actualizarAdminPaquete, deshabilitarAdminPaquete, reactivarAdminPaquete,
    usuarioDetalle, cambiarRolHandler, deshabilitarUsuarioHandler, reactivarUsuarioHandler,
};
