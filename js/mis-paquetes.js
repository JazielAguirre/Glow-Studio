document.addEventListener("DOMContentLoaded", async function () {
    var container = document.getElementById('mis-paquetes-container');
    if (!container) return;

    var token = window.Auth && window.Auth.isLoggedIn() ? window.Auth.getToken() : null;

    if (!token) {
        container.innerHTML =
            '<div class="mp-empty">' +
            '<div class="mp-empty-icon">🔒</div>' +
            '<h3 class="mp-empty-title">Inicia sesión para continuar</h3>' +
            '<p class="mp-empty-sub">Necesitas una cuenta para ver tus compras.</p>' +
            '<a href="login.html" class="mp-empty-cta">Iniciar sesión</a>' +
            '</div>';
        return;
    }

    function escapeText(v) {
        return String(v !== null && v !== undefined ? v : '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function badgeClass(estado) {
        if (estado === 'activo')   return 'badge-activo';
        if (estado === 'vencido')  return 'badge-vencido';
        return 'badge-inactivo';
    }

    function badgeLabel(estado) {
        if (estado === 'activo')  return 'Activo';
        if (estado === 'vencido') return 'Vencido';
        return 'Inactivo';
    }

    function renderStats(compras) {
        var statsEl = document.getElementById('mp-stats');
        if (!statsEl) return;

        var activos  = compras.filter(function (c) { return c.estado === 'activo'; });
        var clasesDisp = activos.reduce(function (acc, c) { return acc + Number(c.clases_restantes || 0); }, 0);

        var proxVence = activos.reduce(function (acc, c) {
            if (!c.fecha_expiracion) return acc;
            return (!acc || c.fecha_expiracion < acc) ? c.fecha_expiracion : acc;
        }, null);

        statsEl.innerHTML =
            '<div class="mp-stat"><div class="mp-stat-val">' + activos.length + '</div><div class="mp-stat-label">Paquetes activos</div></div>' +
            '<div class="mp-stat"><div class="mp-stat-val">' + clasesDisp + '</div><div class="mp-stat-label">Clases disponibles</div></div>' +
            '<div class="mp-stat"><div class="mp-stat-val">' + (proxVence ? proxVence : '—') + '</div><div class="mp-stat-label">Próx. vencimiento</div></div>' +
            '<div class="mp-stat"><div class="mp-stat-val">' + compras.length + '</div><div class="mp-stat-label">Total de compras</div></div>';
    }

    function renderCards(compras) {
        if (!compras.length) {
            container.innerHTML =
                '<div class="mp-empty">' +
                '<div class="mp-empty-icon">🌿</div>' +
                '<h3 class="mp-empty-title">Sin paquetes aquí</h3>' +
                '<p class="mp-empty-sub">Prueba con otro filtro o adquiere tu primer paquete.</p>' +
                '<a href="paquetes.html" class="mp-empty-cta">Ver paquetes disponibles</a>' +
                '</div>';
            return;
        }

        var html = '';
        compras.forEach(function (c) {
            var fechaBase = (c.fecha_inicio || '').replace(/-/g, '');
            var folio     = 'GS-' + fechaBase + '-' + c.id_usuario_paquete;
            var isActivo  = c.estado === 'activo';
            var cardClass = isActivo ? 'estado-activo' : 'estado-inactivo';

            html += '<div class="compra-card ' + cardClass + '">' +
                '<div class="compra-header">' +
                '<span class="compra-folio">Folio: ' + escapeText(folio) + '</span>' +
                '<span class="compra-badge ' + badgeClass(c.estado) + '">' + badgeLabel(c.estado) + '</span>' +
                '</div>' +
                '<h3 class="compra-nombre">' + escapeText(c.nombre) + '</h3>' +
                '<div class="compra-detalle">' +
                '<div class="compra-detalle-item"><span>Precio</span><strong>$' + Number(c.precio).toLocaleString('es-MX') + ' MXN</strong></div>' +
                '<div class="compra-detalle-item"><span>Clases</span><strong>' + c.clases_restantes + ' / ' + c.cantidad_clases + '</strong></div>' +
                '<div class="compra-detalle-item"><span>Inicio</span><strong>' + escapeText(c.fecha_inicio || '—') + '</strong></div>' +
                '<div class="compra-detalle-item"><span>Vence</span><strong>' + escapeText(c.fecha_expiracion || '—') + '</strong></div>' +
                '</div>';

            if (isActivo && Number(c.clases_restantes) > 0) {
                html += '<div class="compra-footer"><a href="clases.html" class="compra-cta">Reservar una clase →</a></div>';
            }

            html += '</div>';
        });
        container.innerHTML = html;
    }

    var _allCompras = [];
    var _activeFilter = 'todos';

    function applyFilter(filter) {
        _activeFilter = filter;
        document.querySelectorAll('.mp-tab').forEach(function (t) {
            t.classList.toggle('active', t.dataset.filter === filter);
        });
        if (filter === 'todos') {
            renderCards(_allCompras);
        } else {
            renderCards(_allCompras.filter(function (c) { return c.estado === filter; }));
        }
    }

    document.querySelectorAll('.mp-tab').forEach(function (tab) {
        tab.addEventListener('click', function () { applyFilter(tab.dataset.filter); });
    });

    try {
        var res = await window.GlowAPI.getMisPaquetesHistorial(token);
        if (!res.ok) {
            container.innerHTML = '<p class="mp-loading">No se pudieron cargar tus compras.</p>';
            return;
        }
        _allCompras = res.compras || [];

        if (!_allCompras.length) {
            document.getElementById('mp-stats') && (document.getElementById('mp-stats').style.display = 'none');
            document.getElementById('mp-tabs')  && (document.getElementById('mp-tabs').style.display  = 'none');
            container.innerHTML =
                '<div class="mp-empty">' +
                '<div class="mp-empty-icon">✨</div>' +
                '<h3 class="mp-empty-title">Aún no tienes compras</h3>' +
                '<p class="mp-empty-sub">Adquiere un paquete para comenzar a reservar clases en Glow Studio.</p>' +
                '<a href="paquetes.html" class="mp-empty-cta">Ver paquetes disponibles</a>' +
                '</div>';
            return;
        }

        renderStats(_allCompras);
        renderCards(_allCompras);
    } catch (err) {
        container.innerHTML = '<p class="mp-loading">Error al cargar tus compras. Intenta de nuevo.</p>';
        console.warn('[mis-paquetes] Error:', err);
    }
});
