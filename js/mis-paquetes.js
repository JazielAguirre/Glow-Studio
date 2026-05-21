document.addEventListener("DOMContentLoaded", async function () {
    var container = document.getElementById('mis-paquetes-container');
    if (!container) return;

    var token = window.Auth && window.Auth.isLoggedIn() ? window.Auth.getToken() : null;

    if (!token) {
        container.innerHTML = '<p class="compras-vacio">Debes <a href="login.html">iniciar sesión</a> para ver tus compras.</p>';
        return;
    }

    function escapeText(v) {
        return String(v !== null && v !== undefined ? v : '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    try {
        var res = await window.GlowAPI.getMisPaquetesHistorial(token);
        if (!res.ok) {
            container.innerHTML = '<p class="compras-vacio">No se pudieron cargar tus compras.</p>';
            return;
        }
        if (!res.compras || !res.compras.length) {
            container.innerHTML = '<p class="compras-vacio">No tienes compras registradas. ' +
                '<a href="paquetes.html">Ver paquetes disponibles</a></p>';
            return;
        }

        var html = '';
        res.compras.forEach(function (c) {
            var fechaBase = (c.fecha_inicio || '').replace(/-/g, '');
            var folio = 'GS-' + fechaBase + '-' + c.id_usuario_paquete;
            var isActivo = c.estado === 'activo';
            var stateClass = isActivo ? 'estado-activo' : 'estado-inactivo';
            var estadoLabel = isActivo ? 'Activo' : c.estado;

            html += '<div class="compra-card ' + stateClass + '">' +
                '<div class="compra-header">' +
                '<span class="compra-folio">Folio: ' + escapeText(folio) + '</span>' +
                '<span class="compra-estado">' + escapeText(estadoLabel) + '</span>' +
                '</div>' +
                '<h3 class="compra-nombre">' + escapeText(c.nombre) + '</h3>' +
                '<div class="compra-detalle">' +
                '<div><span>Precio</span><strong>$' + Number(c.precio).toLocaleString('es-MX') + ' MXN</strong></div>' +
                '<div><span>Clases restantes</span><strong>' + c.clases_restantes + ' / ' + c.cantidad_clases + '</strong></div>' +
                '<div><span>Inicio</span><strong>' + escapeText(c.fecha_inicio || '—') + '</strong></div>' +
                '<div><span>Vence</span><strong>' + escapeText(c.fecha_expiracion || '—') + '</strong></div>' +
                '</div>' +
                '</div>';
        });
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = '<p class="compras-vacio">Error al cargar tus compras. Intenta de nuevo.</p>';
        console.warn('[mis-paquetes] Error:', err);
    }
});
