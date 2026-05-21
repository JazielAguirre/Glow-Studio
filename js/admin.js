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

    function renderUsuarios(usuarios) {
        document.getElementById('tabla-usuarios-wrap').innerHTML = tabla(
            ['ID', 'Nombre', 'Correo', 'Rol', 'Estado', 'Registro'],
            usuarios,
            function (u) {
                return td(u.id_usuario) + td(u.nombre) + td(u.email) +
                    '<td>' + badge(u.tipo_usuario) + '</td>' +
                    '<td>' + badge(u.estado) + '</td>' +
                    td(fmt(u.fecha_registro));
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
        renderUsuarios(_data.usuarios.filter(function (u) {
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

    // ── Bootstrap ─────────────────────────────────────────────────────────────

    GlowAPI.me(token).then(function (data) {
        if (!data || !data.ok || data.user.tipo_usuario !== 'admin') {
            document.getElementById('acceso-denegado').style.display = 'block';
            return;
        }

        document.getElementById('admin-contenido').style.display = 'block';
        initFiltros();
        initClaseForm();
        initPaqueteForm();

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
        }).catch(function (err) {
            console.error('[admin] Error cargando datos:', err);
        });

    }).catch(function () {
        window.location.href = "login.html";
    });
})();
