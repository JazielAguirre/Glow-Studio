(function () {
    var token = Auth.getToken();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    var _data = { usuarios: [], paquetes: [], reservas: [], ocupacion: [], contactos: [] };
    var _filtros = { busqueda: '', contactoEstado: 'todos', reservaEstado: 'todas' };

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

    GlowAPI.me(token).then(function (data) {
        if (!data || !data.ok || data.user.tipo_usuario !== 'admin') {
            document.getElementById('acceso-denegado').style.display = 'block';
            return;
        }

        document.getElementById('admin-contenido').style.display = 'block';
        initFiltros();

        Promise.all([
            GlowAPI.getAdminDashboard(token),
            GlowAPI.getAdminUsuarios(token),
            GlowAPI.getAdminPaquetes(token),
            GlowAPI.getAdminReservas(token),
            GlowAPI.getAdminClasesOcupacion(token),
            GlowAPI.getAdminContactos(token),
        ]).then(function (results) {
            if (results[0].ok) renderDashboard(results[0].dashboard);
            if (results[1].ok) _data.usuarios  = results[1].usuarios;
            if (results[2].ok) _data.paquetes  = results[2].paquetes;
            if (results[3].ok) _data.reservas  = results[3].reservas;
            if (results[4].ok) _data.ocupacion = results[4].clases;
            if (results[5].ok) _data.contactos = results[5].contactos;
            aplicarFiltros();
        }).catch(function (err) {
            console.error('[admin] Error cargando datos:', err);
        });

    }).catch(function () {
        window.location.href = "login.html";
    });
})();
