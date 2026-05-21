(function () {
    var token = Auth.getToken();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    var _data = {
        usuarios: [], paquetes: [], reservas: [],
        ocupacion: [], contactos: [],
        clases: [], tiposClase: [],
        paquetesCatalogo: [],
    };
    var _filtros = { busqueda: '', contactoEstado: 'todos', reservaEstado: 'todas' };
    var _editingClaseId    = null;
    var _editingPaqueteId  = null;
    var _currentAdminId    = null;
    var _detalleUsuarioId  = null;

    function escapeHTML(value) {
        return String(value !== null && value !== undefined ? value : '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function badge(valor) {
        var v = escapeHTML(valor);
        return '<span class="badge badge-' + v + '">' + v + '</span>';
    }

    function fmt(fecha) {
        if (!fecha) return '—';
        return new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    function tabla(columnas, filas, renderFila) {
        if (!filas || filas.length === 0) return '<p class="centrar-texto">Sin datos.</p>';
        var html = '<table class="admin-table"><thead><tr>';
        columnas.forEach(function (c) { html += '<th>' + escapeHTML(c) + '</th>'; });
        html += '</tr></thead><tbody>';
        filas.forEach(function (f) { html += '<tr>' + renderFila(f) + '</tr>'; });
        html += '</tbody></table>';
        return html;
    }

    function td(v) {
        var safe = (v !== null && v !== undefined) ? escapeHTML(v) : '—';
        return '<td>' + safe + '</td>';
    }

    function match(str) {
        if (!_filtros.busqueda) return true;
        return String(str || '').toLowerCase().includes(_filtros.busqueda);
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────

    function renderDashboard(d) {
        var items = [
            { valor: d.total_usuarios,       etiqueta: 'Usuarios' },
            { valor: d.paquetes_activos,      etiqueta: 'Paquetes activos' },
            { valor: '$' + Number(d.ingresos_estimados).toFixed(2), etiqueta: 'Ingresos estimados' },
            { valor: d.reservas_activas,      etiqueta: 'Reservas activas' },
            { valor: d.reservas_canceladas,   etiqueta: 'Reservas canceladas' },
            { valor: d.contactos_nuevos,      etiqueta: 'Mensajes nuevos' },
            { valor: d.clases_proximas,       etiqueta: 'Clases próximas' },
        ];
        var el = document.getElementById('admin-dashboard');
        el.innerHTML = items.map(function (i) {
            return '<div class="admin-card"><div class="valor">' + escapeHTML(i.valor) +
                   '</div><div class="etiqueta">' + escapeHTML(i.etiqueta) + '</div></div>';
        }).join('');
    }

    // ── Report tables (with filters) ──────────────────────────────────────────

    function renderGestionUsuarios(usuarios) {
        var isSelf = function (u) { return Number(u.id_usuario) === Number(_currentAdminId); };
        document.getElementById('tabla-usuarios-wrap').innerHTML = tabla(
            ['ID', 'Nombre', 'Correo', 'Rol', 'Estado', 'Registro', 'Acciones'],
            usuarios,
            function (u) {
                var id = Number(u.id_usuario);
                var self = isSelf(u);
                var isAdmin = u.tipo_usuario === 'admin';
                var isActivo = u.estado === 'activo';

                var btnDetalle = '<button class="admin-btn admin-btn-edit" onclick="window._verDetalleUsuario(' + id + ', this)">' +
                    (Number(_detalleUsuarioId) === id ? 'Cerrar' : 'Ver detalle') + '</button>';

                var btnRol = '';
                if (!self) {
                    btnRol = isAdmin
                        ? '<button class="admin-btn admin-btn-disable" onclick="window._cambiarRolUsuario(' + id + ',\'usuario\',this)">Hacer usuario</button>'
                        : '<button class="admin-btn admin-btn-reactivate" onclick="window._cambiarRolUsuario(' + id + ',\'admin\',this)">Hacer admin</button>';
                }

                var btnEstado = '';
                if (!self) {
                    btnEstado = isActivo
                        ? '<button class="admin-btn admin-btn-disable" onclick="window._deshabilitarUsuario(' + id + ',this)">Deshabilitar</button>'
                        : '<button class="admin-btn admin-btn-reactivate" onclick="window._reactivarUsuario(' + id + ',this)">Reactivar</button>';
                }

                return td(u.id_usuario) + td(u.nombre) + td(u.email) +
                    '<td>' + badge(u.tipo_usuario) + '</td>' +
                    '<td>' + badge(u.estado) + '</td>' +
                    td(fmt(u.fecha_registro)) +
                    '<td>' + btnDetalle + btnRol + btnEstado + '</td>';
            }
        );
    }

    function renderPaquetes(paquetes) {
        document.getElementById('tabla-paquetes-wrap').innerHTML = tabla(
            ['Usuario', 'Correo', 'Paquete', 'Precio', 'Clases rest.', 'Inicio', 'Vence', 'Estado'],
            paquetes,
            function (p) {
                return td(p.usuario) + td(p.email) + td(p.paquete) +
                    td('$' + Number(p.precio).toFixed(2)) +
                    td(p.clases_restantes) + td(fmt(p.fecha_inicio)) +
                    td(fmt(p.fecha_expiracion)) +
                    '<td>' + badge(p.estado) + '</td>';
            }
        );
    }

    function renderReservas(reservas) {
        document.getElementById('tabla-reservas-wrap').innerHTML = tabla(
            ['Usuario', 'Correo', 'Disciplina', 'Fecha', 'Hora', 'Estado', 'Reservado'],
            reservas,
            function (r) {
                var hora = r.hora_inicio ? escapeHTML(r.hora_inicio.slice(0, 5)) + '–' + escapeHTML(r.hora_fin.slice(0, 5)) : '—';
                return td(r.usuario) + td(r.email) + td(r.disciplina) +
                    td(fmt(r.fecha)) + '<td>' + hora + '</td>' +
                    '<td>' + badge(r.estado) + '</td>' +
                    td(fmt(r.fecha_reserva));
            }
        );
    }

    function renderOcupacion(clases) {
        document.getElementById('tabla-ocupacion-wrap').innerHTML = tabla(
            ['Disciplina', 'Fecha', 'Horario', 'Cupo máx.', 'Activas', 'Disponible', 'Ocupación %'],
            clases,
            function (c) {
                var hora = c.hora_inicio ? escapeHTML(c.hora_inicio.slice(0, 5)) + '–' + escapeHTML(c.hora_fin.slice(0, 5)) : '—';
                return td(c.disciplina) + td(fmt(c.fecha)) + '<td>' + hora + '</td>' +
                    td(c.cupo_maximo) + td(c.reservas_activas) +
                    td(c.cupo_disponible) + td(c.ocupacion_pct + '%');
            }
        );
    }

    function renderContactos(contactos) {
        document.getElementById('tabla-contactos-wrap').innerHTML = tabla(
            ['Nombre', 'Correo', 'Teléfono', 'Mensaje', 'Estado', 'Fecha', 'Acción'],
            contactos,
            function (c) {
                var accion = c.estado !== 'revisado'
                    ? '<button class="boton" onclick="window._revisarContacto(' + Number(c.id_contacto) + ', this)">Marcar revisado</button>'
                    : '—';
                return td(c.nombre) + td(c.correo) + td(c.telefono) +
                    '<td>' + escapeHTML(c.mensaje) + '</td>' +
                    '<td>' + badge(c.estado) + '</td>' +
                    td(fmt(c.fecha_creacion)) +
                    '<td>' + accion + '</td>';
            }
        );
    }

    function aplicarFiltros() {
        renderGestionUsuarios(_data.usuarios.filter(function (u) {
            return match(u.nombre) || match(u.email);
        }));

        renderPaquetes(_data.paquetes.filter(function (p) {
            return match(p.usuario) || match(p.email) || match(p.paquete);
        }));

        renderReservas(_data.reservas.filter(function (r) {
            var estadoOk = _filtros.reservaEstado === 'todas' || r.estado === _filtros.reservaEstado;
            return estadoOk && (match(r.usuario) || match(r.email) || match(r.disciplina));
        }));

        renderOcupacion(_data.ocupacion.filter(function (c) {
            return match(c.disciplina);
        }));

        renderContactos(_data.contactos.filter(function (c) {
            var estadoOk = _filtros.contactoEstado === 'todos' || c.estado === _filtros.contactoEstado;
            return estadoOk && (match(c.nombre) || match(c.correo) || match(c.mensaje));
        }));
    }

    window._revisarContacto = async function (id, btn) {
        btn.disabled = true;
        btn.textContent = '...';
        try {
            var data = await GlowAPI.marcarContactoRevisado(id, token);
            if (data.ok) {
                var c = _data.contactos.find(function (c) { return Number(c.id_contacto) === id; });
                if (c) c.estado = 'revisado';
                aplicarFiltros();
            } else {
                btn.disabled = false;
                btn.textContent = 'Marcar revisado';
                alert(data.error || 'Error al actualizar');
            }
        } catch (_) {
            btn.disabled = false;
            btn.textContent = 'Marcar revisado';
            alert('Error de conexión');
        }
    };

    function initFiltros() {
        var busqEl     = document.getElementById('filtro-busqueda');
        var contactoEl = document.getElementById('filtro-contactos');
        var reservaEl  = document.getElementById('filtro-reservas');
        var limpiarBtn = document.getElementById('filtro-limpiar');

        busqEl.addEventListener('input', function () {
            _filtros.busqueda = busqEl.value.trim().toLowerCase();
            aplicarFiltros();
        });

        contactoEl.addEventListener('change', function () {
            _filtros.contactoEstado = contactoEl.value;
            aplicarFiltros();
        });

        reservaEl.addEventListener('change', function () {
            _filtros.reservaEstado = reservaEl.value;
            aplicarFiltros();
        });

        limpiarBtn.addEventListener('click', function () {
            busqEl.value = '';
            contactoEl.value = 'todos';
            reservaEl.value = 'todas';
            _filtros.busqueda = '';
            _filtros.contactoEstado = 'todos';
            _filtros.reservaEstado = 'todas';
            aplicarFiltros();
        });
    }

    // ── Class management ──────────────────────────────────────────────────────

    function renderGestionClases(clases) {
        document.getElementById('tabla-clases-wrap').innerHTML = tabla(
            ['ID', 'Disciplina', 'Fecha', 'Horario', 'Estado', 'Res. activas', 'Acciones'],
            clases,
            function (c) {
                var hora = c.hora_inicio
                    ? escapeHTML(c.hora_inicio.slice(0, 5)) + '–' + escapeHTML(c.hora_fin.slice(0, 5))
                    : '—';
                var acciones = '<button class="admin-btn admin-btn-edit" onclick="window._editarClase(' +
                    Number(c.id_clase) + ')">Editar</button> ';
                if (c.estado === 'activa') {
                    acciones += '<button class="admin-btn admin-btn-disable" onclick="window._deshabilitarClase(' +
                        Number(c.id_clase) + ', this)">Deshabilitar</button>';
                } else {
                    acciones += '<button class="admin-btn admin-btn-reactivate" onclick="window._reactivarClase(' +
                        Number(c.id_clase) + ', this)">Reactivar</button>';
                }
                return td(c.id_clase) + td(c.disciplina) + td(fmt(c.fecha)) +
                    '<td>' + hora + '</td>' +
                    '<td>' + badge(c.estado) + '</td>' +
                    td(c.reservas_activas) +
                    '<td>' + acciones + '</td>';
            }
        );
    }

    function poblarTiposSelect(tipos) {
        var sel = document.getElementById('clase-id-tipo');
        sel.innerHTML = tipos.map(function (t) {
            return '<option value="' + Number(t.id_tipo) + '">' + escapeHTML(t.nombre) + '</option>';
        }).join('');
    }

    function claseFormMsg(texto, exito) {
        var el = document.getElementById('clase-form-msg');
        el.textContent = texto;
        el.style.color = exito ? '#155724' : '#721c24';
    }

    function resetClaseForm() {
        document.getElementById('clase-fecha').value = '';
        document.getElementById('clase-hora-inicio').value = '';
        document.getElementById('clase-hora-fin').value = '';
        document.getElementById('clase-id-tipo').selectedIndex = 0;
        document.getElementById('clase-cancel').style.display = 'none';
        document.getElementById('clase-submit').textContent = 'Guardar';
        claseFormMsg('', true);
        _editingClaseId = null;
    }

    function initClaseForm() {
        var submitBtn = document.getElementById('clase-submit');
        var cancelBtn = document.getElementById('clase-cancel');

        cancelBtn.addEventListener('click', function () {
            resetClaseForm();
        });

        submitBtn.addEventListener('click', async function () {
            var id_tipo     = parseInt(document.getElementById('clase-id-tipo').value, 10);
            var fecha       = document.getElementById('clase-fecha').value;
            var hora_inicio = document.getElementById('clase-hora-inicio').value;
            var hora_fin    = document.getElementById('clase-hora-fin').value;

            if (!id_tipo || !fecha || !hora_inicio || !hora_fin) {
                claseFormMsg('Completa todos los campos.', false);
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = _editingClaseId ? 'Actualizando...' : 'Guardando...';

            try {
                var datos = { id_tipo, fecha, hora_inicio, hora_fin };
                var data = _editingClaseId
                    ? await GlowAPI.actualizarAdminClase(_editingClaseId, datos, token)
                    : await GlowAPI.crearAdminClase(datos, token);

                if (data.ok) {
                    claseFormMsg(_editingClaseId ? 'Clase actualizada.' : 'Clase creada.', true);
                    resetClaseForm();
                    var res = await GlowAPI.getAdminClases(token);
                    if (res.ok) {
                        _data.clases = res.clases;
                        renderGestionClases(_data.clases);
                    }
                } else {
                    claseFormMsg(data.error || 'Error al guardar.', false);
                }
            } catch (_) {
                claseFormMsg('Error de conexión.', false);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = _editingClaseId ? 'Actualizar' : 'Guardar';
            }
        });
    }

    window._editarClase = function (id) {
        var c = _data.clases.find(function (c) { return Number(c.id_clase) === id; });
        if (!c) return;
        _editingClaseId = id;
        document.getElementById('clase-id-tipo').value     = c.id_tipo;
        document.getElementById('clase-fecha').value       = String(c.fecha).slice(0, 10);
        document.getElementById('clase-hora-inicio').value = String(c.hora_inicio).slice(0, 5);
        document.getElementById('clase-hora-fin').value    = String(c.hora_fin).slice(0, 5);
        document.getElementById('clase-cancel').style.display = '';
        document.getElementById('clase-submit').textContent = 'Actualizar';
        claseFormMsg('Editando clase #' + id, true);
        document.getElementById('admin-gestion-clases').scrollIntoView({ behavior: 'smooth' });
    };

    window._deshabilitarClase = async function (id, btn) {
        btn.disabled = true;
        btn.textContent = '...';
        try {
            var data = await GlowAPI.deshabilitarAdminClase(id, token);
            if (data.ok) {
                var c = _data.clases.find(function (c) { return Number(c.id_clase) === id; });
                if (c) c.estado = 'inactiva';
                renderGestionClases(_data.clases);
                if (data.advertencia) alert(data.advertencia);
            } else {
                btn.disabled = false;
                btn.textContent = 'Deshabilitar';
                alert(data.error || 'Error al deshabilitar');
            }
        } catch (_) {
            btn.disabled = false;
            btn.textContent = 'Deshabilitar';
            alert('Error de conexión');
        }
    };

    window._reactivarClase = async function (id, btn) {
        btn.disabled = true;
        btn.textContent = '...';
        try {
            var data = await GlowAPI.reactivarAdminClase(id, token);
            if (data.ok) {
                var c = _data.clases.find(function (c) { return Number(c.id_clase) === id; });
                if (c) c.estado = 'activa';
                renderGestionClases(_data.clases);
            } else {
                btn.disabled = false;
                btn.textContent = 'Reactivar';
                alert(data.error || 'Error al reactivar');
            }
        } catch (_) {
            btn.disabled = false;
            btn.textContent = 'Reactivar';
            alert('Error de conexión');
        }
    };

    // ── Package management ────────────────────────────────────────────────────

    function renderGestionPaquetes(paquetes) {
        document.getElementById('tabla-paquetes-catalogo-wrap').innerHTML = tabla(
            ['ID', 'Nombre', 'Clases', 'Precio', 'Vigencia', 'Estado', 'Vendido', 'Ingresos est.', 'Acciones'],
            paquetes,
            function (p) {
                var acciones = '<button class="admin-btn admin-btn-edit" onclick="window._editarPaquete(' +
                    Number(p.id_paquete) + ')">Editar</button> ';
                if (p.estado === 'activo') {
                    acciones += '<button class="admin-btn admin-btn-disable" onclick="window._deshabilitarPaquete(' +
                        Number(p.id_paquete) + ', this)">Deshabilitar</button>';
                } else {
                    acciones += '<button class="admin-btn admin-btn-reactivate" onclick="window._reactivarPaquete(' +
                        Number(p.id_paquete) + ', this)">Reactivar</button>';
                }
                return td(p.id_paquete) + td(p.nombre) + td(p.cantidad_clases) +
                    td('$' + Number(p.precio).toFixed(2)) +
                    td(p.vigencia_dias + ' días') +
                    '<td>' + badge(p.estado) + '</td>' +
                    td(p.veces_vendido) +
                    td('$' + Number(p.ingresos_estimados).toFixed(2)) +
                    '<td>' + acciones + '</td>';
            }
        );
    }

    function paqueteFormMsg(texto, exito) {
        var el = document.getElementById('paquete-form-msg');
        el.textContent = texto;
        el.style.color = exito ? '#155724' : '#721c24';
    }

    function resetPaqueteForm() {
        document.getElementById('paquete-nombre').value    = '';
        document.getElementById('paquete-clases').value   = '';
        document.getElementById('paquete-precio').value   = '';
        document.getElementById('paquete-vigencia').value = '';
        document.getElementById('paquete-cancel').style.display = 'none';
        document.getElementById('paquete-submit').textContent  = 'Guardar';
        paqueteFormMsg('', true);
        _editingPaqueteId = null;
    }

    function initPaqueteForm() {
        var submitBtn = document.getElementById('paquete-submit');
        var cancelBtn = document.getElementById('paquete-cancel');

        cancelBtn.addEventListener('click', function () { resetPaqueteForm(); });

        submitBtn.addEventListener('click', async function () {
            var nombre        = document.getElementById('paquete-nombre').value.trim();
            var numero_clases = document.getElementById('paquete-clases').value;
            var precio        = document.getElementById('paquete-precio').value;
            var vigencia_dias = document.getElementById('paquete-vigencia').value;

            if (!nombre || !numero_clases || precio === '' || !vigencia_dias) {
                paqueteFormMsg('Completa todos los campos.', false);
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = _editingPaqueteId ? 'Actualizando...' : 'Guardando...';

            try {
                var datos = { nombre, numero_clases, precio, vigencia_dias };
                var data = _editingPaqueteId
                    ? await GlowAPI.actualizarAdminPaquete(_editingPaqueteId, datos, token)
                    : await GlowAPI.crearAdminPaquete(datos, token);

                if (data.ok) {
                    paqueteFormMsg(_editingPaqueteId ? 'Paquete actualizado.' : 'Paquete creado.', true);
                    resetPaqueteForm();
                    var res = await GlowAPI.getAdminPaquetesCatalogo(token);
                    if (res.ok) {
                        _data.paquetesCatalogo = res.paquetes;
                        renderGestionPaquetes(_data.paquetesCatalogo);
                    }
                } else {
                    paqueteFormMsg(data.error || 'Error al guardar.', false);
                }
            } catch (_) {
                paqueteFormMsg('Error de conexión.', false);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = _editingPaqueteId ? 'Actualizar' : 'Guardar';
            }
        });
    }

    window._editarPaquete = function (id) {
        var p = _data.paquetesCatalogo.find(function (p) { return Number(p.id_paquete) === id; });
        if (!p) return;
        _editingPaqueteId = id;
        document.getElementById('paquete-nombre').value    = p.nombre;
        document.getElementById('paquete-clases').value   = p.cantidad_clases;
        document.getElementById('paquete-precio').value   = Number(p.precio).toFixed(2);
        document.getElementById('paquete-vigencia').value = p.vigencia_dias;
        document.getElementById('paquete-cancel').style.display = '';
        document.getElementById('paquete-submit').textContent   = 'Actualizar';
        paqueteFormMsg('Editando paquete #' + id, true);
        document.getElementById('admin-gestion-paquetes').scrollIntoView({ behavior: 'smooth' });
    };

    window._deshabilitarPaquete = async function (id, btn) {
        btn.disabled = true;
        btn.textContent = '...';
        try {
            var data = await GlowAPI.deshabilitarAdminPaquete(id, token);
            if (data.ok) {
                var p = _data.paquetesCatalogo.find(function (p) { return Number(p.id_paquete) === id; });
                if (p) p.estado = 'inactivo';
                renderGestionPaquetes(_data.paquetesCatalogo);
                if (data.advertencia) alert(data.advertencia);
            } else {
                btn.disabled = false;
                btn.textContent = 'Deshabilitar';
                alert(data.error || 'Error al deshabilitar');
            }
        } catch (_) {
            btn.disabled = false;
            btn.textContent = 'Deshabilitar';
            alert('Error de conexión');
        }
    };

    window._reactivarPaquete = async function (id, btn) {
        btn.disabled = true;
        btn.textContent = '...';
        try {
            var data = await GlowAPI.reactivarAdminPaquete(id, token);
            if (data.ok) {
                var p = _data.paquetesCatalogo.find(function (p) { return Number(p.id_paquete) === id; });
                if (p) p.estado = 'activo';
                renderGestionPaquetes(_data.paquetesCatalogo);
            } else {
                btn.disabled = false;
                btn.textContent = 'Reactivar';
                alert(data.error || 'Error al reactivar');
            }
        } catch (_) {
            btn.disabled = false;
            btn.textContent = 'Reactivar';
            alert('Error de conexión');
        }
    };

    // ── Reports ───────────────────────────────────────────────────────────────

    var _reportFiltros = { fechaInicio: '', fechaFin: '', estadoReserva: 'todas', disciplina: '', paqueteNombre: '' };

    function parseDateOnly(dateStr) {
        return dateStr ? String(dateStr).slice(0, 10) : '';
    }

    function inDateRange(dateStr, inicio, fin) {
        var d = parseDateOnly(dateStr);
        if (!d) return true;
        if (inicio && d < inicio) return false;
        if (fin   && d > fin)    return false;
        return true;
    }

    function csvEscape(v) {
        var s = v !== null && v !== undefined ? String(v) : '';
        if (/[,"\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
    }

    function toCSV(headers, rows) {
        var lines = [headers.map(csvEscape).join(',')];
        rows.forEach(function (row) { lines.push(row.map(csvEscape).join(',')); });
        return lines.join('\r\n');
    }

    function downloadCSV(filename, csv) {
        var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
    }

    function filteredReservas() {
        var f = _reportFiltros;
        return _data.reservas.filter(function (r) {
            if (!inDateRange(r.fecha, f.fechaInicio, f.fechaFin)) return false;
            if (f.estadoReserva !== 'todas' && r.estado !== f.estadoReserva) return false;
            if (f.disciplina && r.disciplina !== f.disciplina) return false;
            return true;
        });
    }

    function filteredPaquetes() {
        var f = _reportFiltros;
        return _data.paquetes.filter(function (p) {
            if (!inDateRange(p.fecha_inicio, f.fechaInicio, f.fechaFin)) return false;
            if (f.paqueteNombre && p.paquete !== f.paqueteNombre) return false;
            return true;
        });
    }

    function renderReportSummary(paqList, resList) {
        var el = document.getElementById('reporte-resumen');
        if (!el) return;
        var ingresos = paqList.reduce(function (acc, p) { return acc + Number(p.precio || 0); }, 0);
        var activas   = resList.filter(function (r) { return r.estado === 'activa'; }).length;
        var canceladas = resList.filter(function (r) { return r.estado === 'cancelada'; }).length;
        var discCount = {}, pkgCount = {};
        resList.forEach(function (r) { discCount[r.disciplina] = (discCount[r.disciplina] || 0) + 1; });
        paqList.forEach(function (p) { pkgCount[p.paquete] = (pkgCount[p.paquete] || 0) + 1; });
        var topDisc = Object.keys(discCount).sort(function (a, b) { return discCount[b] - discCount[a]; })[0] || '—';
        var topPkg  = Object.keys(pkgCount).sort(function (a, b) { return pkgCount[b] - pkgCount[a]; })[0] || '—';
        var items = [
            { valor: '$' + ingresos.toLocaleString('es-MX', { minimumFractionDigits: 2 }), etiqueta: 'Ingresos estimados' },
            { valor: paqList.length, etiqueta: 'Paquetes vendidos' },
            { valor: resList.length, etiqueta: 'Reservas totales' },
            { valor: activas,     etiqueta: 'Reservas activas' },
            { valor: canceladas,  etiqueta: 'Reservas canceladas' },
            { valor: topDisc, etiqueta: 'Disciplina más reservada' },
            { valor: topPkg,  etiqueta: 'Paquete más vendido' },
        ];
        el.innerHTML = items.map(function (i) {
            return '<div class="admin-card"><div class="valor">' + escapeHTML(String(i.valor)) +
                   '</div><div class="etiqueta">' + escapeHTML(i.etiqueta) + '</div></div>';
        }).join('');
    }

    function renderReportReservas(resList) {
        var el = document.getElementById('reporte-tabla-reservas');
        if (!el) return;
        if (!resList.length) { el.innerHTML = '<p style="color:#9a7060;font-size:1.3rem;">Sin resultados para los filtros seleccionados.</p>'; return; }
        el.innerHTML = tabla(
            ['Usuario', 'Correo', 'Disciplina', 'Fecha', 'Hora', 'Estado'],
            resList,
            function (r) {
                return td(r.usuario) + td(r.email) + td(r.disciplina) + td(fmt(r.fecha)) +
                    td(r.hora_inicio ? r.hora_inicio.slice(0, 5) : '—') +
                    '<td>' + badge(r.estado) + '</td>';
            }
        );
    }

    function renderReportPaquetes(paqList) {
        var el = document.getElementById('reporte-tabla-paquetes');
        if (!el) return;
        if (!paqList.length) { el.innerHTML = '<p style="color:#9a7060;font-size:1.3rem;">Sin resultados para los filtros seleccionados.</p>'; return; }
        el.innerHTML = tabla(
            ['Usuario', 'Correo', 'Paquete', 'Precio', 'Clases rest.', 'Inicio', 'Vence', 'Estado'],
            paqList,
            function (p) {
                return td(p.usuario) + td(p.email) + td(p.paquete) +
                    td('$' + Number(p.precio).toFixed(2)) + td(p.clases_restantes) +
                    td(fmt(p.fecha_inicio)) + td(fmt(p.fecha_expiracion)) +
                    '<td>' + badge(p.estado) + '</td>';
            }
        );
    }

    function applyReportFilters() {
        var paqList = filteredPaquetes();
        var resList = filteredReservas();
        renderReportSummary(paqList, resList);
        renderReportReservas(resList);
        renderReportPaquetes(paqList);
    }

    function initReportes() {
        var discSel = document.getElementById('reporte-disciplina');
        var pkgSel  = document.getElementById('reporte-paquete');
        var fi      = document.getElementById('reporte-fecha-inicio');
        var ff      = document.getElementById('reporte-fecha-fin');
        var er      = document.getElementById('reporte-estado-reserva');
        var lb      = document.getElementById('reporte-limpiar');
        var btnResCSV = document.getElementById('reporte-export-reservas');
        var btnPkgCSV = document.getElementById('reporte-export-paquetes');
        var btnSumCSV = document.getElementById('reporte-export-resumen');

        var discs = [];
        _data.reservas.forEach(function (r) { if (r.disciplina && discs.indexOf(r.disciplina) === -1) discs.push(r.disciplina); });
        discs.sort();
        if (discSel) discSel.innerHTML = '<option value="">Disciplina: Todas</option>' +
            discs.map(function (d) { return '<option value="' + escapeHTML(d) + '">' + escapeHTML(d) + '</option>'; }).join('');

        var pkgNames = [];
        _data.paquetesCatalogo.forEach(function (p) { if (p.nombre && pkgNames.indexOf(p.nombre) === -1) pkgNames.push(p.nombre); });
        pkgNames.sort();
        if (pkgSel) pkgSel.innerHTML = '<option value="">Paquete: Todos</option>' +
            pkgNames.map(function (n) { return '<option value="' + escapeHTML(n) + '">' + escapeHTML(n) + '</option>'; }).join('');

        function onChange() { applyReportFilters(); }
        if (fi) fi.addEventListener('input', function () { _reportFiltros.fechaInicio = fi.value; onChange(); });
        if (ff) ff.addEventListener('input', function () { _reportFiltros.fechaFin = ff.value; onChange(); });
        if (er) er.addEventListener('change', function () { _reportFiltros.estadoReserva = er.value; onChange(); });
        if (discSel) discSel.addEventListener('change', function () { _reportFiltros.disciplina = discSel.value; onChange(); });
        if (pkgSel)  pkgSel.addEventListener('change',  function () { _reportFiltros.paqueteNombre = pkgSel.value; onChange(); });

        if (lb) lb.addEventListener('click', function () {
            _reportFiltros = { fechaInicio: '', fechaFin: '', estadoReserva: 'todas', disciplina: '', paqueteNombre: '' };
            if (fi) fi.value = ''; if (ff) ff.value = '';
            if (er) er.value = 'todas';
            if (discSel) discSel.value = ''; if (pkgSel) pkgSel.value = '';
            onChange();
        });

        if (btnResCSV) btnResCSV.addEventListener('click', function () {
            var resList = filteredReservas();
            if (!resList.length) { alert('Sin reservas para exportar con los filtros actuales.'); return; }
            var today = new Date().toISOString().slice(0, 10);
            downloadCSV('glow-reservas-' + today + '.csv', toCSV(
                ['ID', 'Usuario', 'Correo', 'Disciplina', 'Fecha', 'Hora inicio', 'Hora fin', 'Estado', 'Fecha reserva'],
                resList.map(function (r) {
                    return [r.id_reserva, r.usuario, r.email, r.disciplina, parseDateOnly(r.fecha),
                            r.hora_inicio || '', r.hora_fin || '', r.estado, parseDateOnly(r.fecha_reserva)];
                })
            ));
        });

        if (btnPkgCSV) btnPkgCSV.addEventListener('click', function () {
            var paqList = filteredPaquetes();
            if (!paqList.length) { alert('Sin paquetes para exportar con los filtros actuales.'); return; }
            var today = new Date().toISOString().slice(0, 10);
            downloadCSV('glow-paquetes-' + today + '.csv', toCSV(
                ['ID', 'Usuario', 'Correo', 'Paquete', 'Precio', 'Clases rest.', 'Inicio', 'Vence', 'Estado'],
                paqList.map(function (p) {
                    return [p.id_usuario_paquete, p.usuario, p.email, p.paquete, p.precio,
                            p.clases_restantes, parseDateOnly(p.fecha_inicio), parseDateOnly(p.fecha_expiracion), p.estado];
                })
            ));
        });

        if (btnSumCSV) btnSumCSV.addEventListener('click', function () {
            var paqList = filteredPaquetes();
            var resList = filteredReservas();
            var ingresos = paqList.reduce(function (acc, p) { return acc + Number(p.precio || 0); }, 0);
            var activas = resList.filter(function (r) { return r.estado === 'activa'; }).length;
            var canceladas = resList.filter(function (r) { return r.estado === 'cancelada'; }).length;
            var today = new Date().toISOString().slice(0, 10);
            downloadCSV('glow-resumen-' + today + '.csv', toCSV(
                ['Métrica', 'Valor'],
                [
                    ['Ingresos estimados', ingresos.toFixed(2)],
                    ['Paquetes vendidos', paqList.length],
                    ['Reservas totales', resList.length],
                    ['Reservas activas', activas],
                    ['Reservas canceladas', canceladas],
                    ['Fecha inicio filtro', _reportFiltros.fechaInicio || 'Sin filtro'],
                    ['Fecha fin filtro',    _reportFiltros.fechaFin    || 'Sin filtro'],
                    ['Generado', today],
                ]
            ));
        });

        applyReportFilters();
    }

    // ── User management actions ───────────────────────────────────────────────

    function renderUsuarioDetalle(detalle) {
        var u = detalle.usuario;
        var html = '<div class="admin-detalle-card">';
        html += '<p class="admin-subsection-title">Detalle: ' + escapeHTML(u.nombre) + '</p>';
        html += '<div class="admin-detalle-meta">';
        html += '<span><strong>Email:</strong> ' + escapeHTML(u.email) + '</span>';
        html += '<span><strong>Rol:</strong> ' + badge(u.tipo_usuario) + '</span>';
        html += '<span><strong>Estado:</strong> ' + badge(u.estado) + '</span>';
        html += '<span><strong>Registro:</strong> ' + escapeHTML(fmt(u.fecha_registro)) + '</span>';
        html += '</div>';
        html += '<div class="admin-detalle-resumen">';
        html += '<span class="admin-detalle-stat"><strong>' + detalle.resumen.total_reservas + '</strong> reservas</span>';
        html += '<span class="admin-detalle-stat"><strong>' + detalle.resumen.reservas_activas + '</strong> activas</span>';
        html += '<span class="admin-detalle-stat"><strong>' + detalle.resumen.paquetes_activos + '</strong> paquetes activos</span>';
        html += '</div>';

        if (detalle.paquetes.length) {
            html += '<p class="admin-subsection-title" style="margin-top:1.2rem;">Paquetes adquiridos</p>';
            html += tabla(
                ['Paquete', 'Clases rest.', 'Inicio', 'Vence', 'Estado'],
                detalle.paquetes,
                function (p) {
                    return td(p.paquete) + td(p.clases_restantes) +
                        td(fmt(p.fecha_inicio)) + td(fmt(p.fecha_expiracion)) +
                        '<td>' + badge(p.estado) + '</td>';
                }
            );
        } else {
            html += '<p style="color:#9a7060;font-size:1.2rem;margin-top:1rem;">Sin paquetes adquiridos.</p>';
        }

        if (detalle.reservas.length) {
            html += '<p class="admin-subsection-title" style="margin-top:1.2rem;">Reservas</p>';
            html += tabla(
                ['Disciplina', 'Fecha', 'Hora', 'Estado'],
                detalle.reservas,
                function (r) {
                    return td(r.disciplina) + td(fmt(r.fecha)) +
                        td(r.hora_inicio ? r.hora_inicio.slice(0, 5) : '—') +
                        '<td>' + badge(r.estado) + '</td>';
                }
            );
        } else {
            html += '<p style="color:#9a7060;font-size:1.2rem;margin-top:1rem;">Sin reservas.</p>';
        }

        html += '</div>';
        document.getElementById('admin-usuario-detalle-wrap').innerHTML = html;
    }

    window._verDetalleUsuario = async function (id, btn) {
        var wrap = document.getElementById('admin-usuario-detalle-wrap');
        if (Number(_detalleUsuarioId) === id) {
            _detalleUsuarioId = null;
            wrap.innerHTML = '';
            renderGestionUsuarios(_data.usuarios);
            return;
        }
        _detalleUsuarioId = id;
        renderGestionUsuarios(_data.usuarios);
        btn.textContent = '...';
        btn.disabled = true;
        try {
            var data = await GlowAPI.getAdminUsuarioDetalle(id, token);
            if (data.ok) {
                renderUsuarioDetalle(data);
            } else {
                wrap.innerHTML = '<p style="color:#c0392b;font-size:1.3rem;">' + escapeHTML(data.error || 'Error al cargar detalle') + '</p>';
            }
        } catch (_) {
            wrap.innerHTML = '<p style="color:#c0392b;font-size:1.3rem;">Error de conexión</p>';
        }
    };

    window._cambiarRolUsuario = async function (id, nuevoRol, btn) {
        btn.disabled = true;
        btn.textContent = '...';
        try {
            var data = await GlowAPI.actualizarAdminUsuarioRol(id, nuevoRol, token);
            if (data.ok) {
                var u = _data.usuarios.find(function (u) { return Number(u.id_usuario) === id; });
                if (u) u.tipo_usuario = data.usuario.tipo_usuario;
                renderGestionUsuarios(_data.usuarios);
                if (Number(_detalleUsuarioId) === id) {
                    GlowAPI.getAdminUsuarioDetalle(id, token).then(function (d) {
                        if (d.ok) renderUsuarioDetalle(d);
                    });
                }
            } else {
                btn.disabled = false;
                btn.textContent = nuevoRol === 'admin' ? 'Hacer admin' : 'Hacer usuario';
                alert(data.error || 'Error al cambiar rol');
            }
        } catch (_) {
            btn.disabled = false;
            btn.textContent = nuevoRol === 'admin' ? 'Hacer admin' : 'Hacer usuario';
            alert('Error de conexión');
        }
    };

    window._deshabilitarUsuario = async function (id, btn) {
        btn.disabled = true;
        btn.textContent = '...';
        try {
            var data = await GlowAPI.deshabilitarAdminUsuario(id, token);
            if (data.ok) {
                var u = _data.usuarios.find(function (u) { return Number(u.id_usuario) === id; });
                if (u) u.estado = 'inactivo';
                renderGestionUsuarios(_data.usuarios);
            } else {
                btn.disabled = false;
                btn.textContent = 'Deshabilitar';
                alert(data.error || 'Error al deshabilitar');
            }
        } catch (_) {
            btn.disabled = false;
            btn.textContent = 'Deshabilitar';
            alert('Error de conexión');
        }
    };

    window._reactivarUsuario = async function (id, btn) {
        btn.disabled = true;
        btn.textContent = '...';
        try {
            var data = await GlowAPI.reactivarAdminUsuario(id, token);
            if (data.ok) {
                var u = _data.usuarios.find(function (u) { return Number(u.id_usuario) === id; });
                if (u) u.estado = 'activo';
                renderGestionUsuarios(_data.usuarios);
            } else {
                btn.disabled = false;
                btn.textContent = 'Reactivar';
                alert(data.error || 'Error al reactivar');
            }
        } catch (_) {
            btn.disabled = false;
            btn.textContent = 'Reactivar';
            alert('Error de conexión');
        }
    };

    // ── Admin module overlay system ───────────────────────────────────────────

    var ADMIN_MODULES = {
        usuarios:  { title: 'Gestión de usuarios',    desc: 'Roles, acceso y estado de cuentas',                 sectionIds: ['admin-usuarios'],                                        hash: 'admin-usuarios' },
        clases:    { title: 'Gestión de clases',       desc: 'Crear, editar y administrar clases programadas',    sectionIds: ['admin-gestion-clases'],                                  hash: 'admin-gestion-clases' },
        paquetes:  { title: 'Gestión de paquetes',     desc: 'Catálogo de paquetes y disponibilidad',             sectionIds: ['admin-gestion-paquetes'],                                hash: 'admin-gestion-paquetes' },
        reportes:  { title: 'Reportes',                desc: 'Filtros, métricas del período y exportación CSV',   sectionIds: ['admin-reportes'],                                        hash: 'admin-reportes' },
        historial: { title: 'Reservas e historial',    desc: 'Paquetes adquiridos, reservas y ocupación',         sectionIds: ['admin-filtros', 'admin-paquetes', 'admin-reservas', 'admin-ocupacion'], hash: 'admin-reservas' },
        contactos: { title: 'Contactos',               desc: 'Mensajes del formulario de contacto',               sectionIds: ['admin-contactos'],                                       hash: 'admin-contactos' },
    };

    var HASH_TO_MODULE = {
        'admin-usuarios':         'usuarios',
        'admin-gestion-clases':   'clases',
        'admin-gestion-paquetes': 'paquetes',
        'admin-reportes':         'reportes',
        'admin-reservas':         'historial',
        'admin-paquetes':         'historial',
        'admin-ocupacion':        'historial',
        'admin-contactos':        'contactos',
    };

    var _activeModule = null;

    function openAdminModule(key) {
        var config = ADMIN_MODULES[key];
        if (!config) return;
        _activeModule = key;

        var pool    = document.getElementById('admin-sections-pool');
        var body    = document.getElementById('admin-module-body');
        var overlay = document.getElementById('admin-module-overlay');

        // Return any sections currently in the overlay body back to pool
        while (body.firstChild) {
            pool.appendChild(body.firstChild);
        }

        // Move target sections into overlay body
        config.sectionIds.forEach(function (id) {
            var section = document.getElementById(id);
            if (section) body.appendChild(section);
        });

        // Set header text
        document.getElementById('admin-module-title').textContent    = config.title;
        document.getElementById('admin-module-subtitle').textContent = config.desc;

        // Show overlay, scroll to top
        overlay.classList.add('is-open');
        overlay.scrollTop = 0;
        body.scrollTop    = 0;

        // Active card state
        document.querySelectorAll('.admin-module-card').forEach(function (c) {
            c.classList.toggle('is-active', c.dataset.module === key);
        });

        // Update URL hash without scroll-jump
        history.pushState(null, null, '#' + config.hash);
    }

    function closeAdminModule() {
        var pool    = document.getElementById('admin-sections-pool');
        var body    = document.getElementById('admin-module-body');
        var overlay = document.getElementById('admin-module-overlay');

        // Return sections to pool
        while (body.firstChild) {
            pool.appendChild(body.firstChild);
        }

        overlay.classList.remove('is-open');
        _activeModule = null;

        document.querySelectorAll('.admin-module-card').forEach(function (c) {
            c.classList.remove('is-active');
        });

        // Clear hash
        history.pushState(null, null, window.location.pathname + window.location.search);
    }

    function bindAdminModuleCards() {
        document.querySelectorAll('.admin-module-card').forEach(function (card) {
            var key = card.dataset.module;
            card.querySelector('.admin-module-open').addEventListener('click', function () {
                openAdminModule(key);
            });
        });

        var closeBtn = document.getElementById('admin-module-close');
        if (closeBtn) closeBtn.addEventListener('click', closeAdminModule);

        // Backdrop click closes overlay
        var overlay = document.getElementById('admin-module-overlay');
        if (overlay) overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeAdminModule();
        });

        // Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && _activeModule) closeAdminModule();
        });
    }

    function handleAdminHash() {
        var hash = window.location.hash.slice(1);
        var moduleKey = HASH_TO_MODULE[hash];
        if (moduleKey) openAdminModule(moduleKey);
    }

    // ── Bootstrap ─────────────────────────────────────────────────────────────

    GlowAPI.me(token).then(function (data) {
        if (!data || !data.ok || data.user.tipo_usuario !== 'admin') {
            document.getElementById('acceso-denegado').style.display = 'block';
            return;
        }

        _currentAdminId = data.user.id_usuario;
        document.getElementById('admin-contenido').style.display = 'block';
        initFiltros();
        initClaseForm();
        initPaqueteForm();
        bindAdminModuleCards();

        Promise.all([
            GlowAPI.getAdminDashboard(token),
            GlowAPI.getAdminUsuarios(token),
            GlowAPI.getAdminPaquetes(token),
            GlowAPI.getAdminReservas(token),
            GlowAPI.getAdminClasesOcupacion(token),
            GlowAPI.getAdminContactos(token),
            GlowAPI.getTiposClase(token),
            GlowAPI.getAdminClases(token),
            GlowAPI.getAdminPaquetesCatalogo(token),
        ]).then(function (results) {
            if (results[0].ok) renderDashboard(results[0].dashboard);
            if (results[1].ok) _data.usuarios          = results[1].usuarios;
            if (results[2].ok) _data.paquetes          = results[2].paquetes;
            if (results[3].ok) _data.reservas          = results[3].reservas;
            if (results[4].ok) _data.ocupacion         = results[4].clases;
            if (results[5].ok) _data.contactos         = results[5].contactos;
            if (results[6].ok) {
                _data.tiposClase = results[6].tipos;
                poblarTiposSelect(_data.tiposClase);
            }
            if (results[7].ok) {
                _data.clases = results[7].clases;
                renderGestionClases(_data.clases);
            }
            if (results[8].ok) {
                _data.paquetesCatalogo = results[8].paquetes;
                renderGestionPaquetes(_data.paquetesCatalogo);
            }
            aplicarFiltros();
            initReportes();
            handleAdminHash();
        }).catch(function (err) {
            console.error('[admin] Error cargando datos:', err);
        });

    }).catch(function () {
        window.location.href = "login.html";
    });
})();
