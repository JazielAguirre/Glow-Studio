document.addEventListener("DOMContentLoaded", async function () {
    if (!window.Auth || !window.Auth.isLoggedIn()) {
        window.location.href = "login.html";
        return;
    }

    var container = document.getElementById("mis-reservas");
    if (!container) return;

    var token = window.Auth.getToken();

    function capitalize(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : str; }

    function formatDate(fechaStr) {
        var d = new Date(fechaStr + "T12:00:00");
        return capitalize(d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" }));
    }

    function formatTime(t) { return t ? t.slice(0, 5) : ""; }

    // ── Active packages balance ───────────────────────────────────────────────
    function renderPaquetes(paquetes) {
        var section = document.getElementById("mis-paquetes");
        if (!section) return;

        if (!paquetes || !paquetes.length) {
            section.innerHTML =
                '<div style="text-align:center;padding:0.8rem 0 1.2rem;font-size:1.35rem;color:#8c7168;">' +
                'No tienes paquetes activos. <a href="paquetes.html" style="color:#c9956a;font-weight:600;">Ver paquetes →</a>' +
                '</div>';
            return;
        }

        var chips = paquetes.map(function (p) {
            return '<div class="paquetes-balance-chip">' +
                p.nombre + ' — <strong>' + p.clases_restantes + ' clases</strong></div>';
        }).join('');

        section.innerHTML =
            '<div class="paquetes-balance-bar">' +
            '<span class="paquetes-balance-label">Balance activo</span>' +
            '<div class="paquetes-balance-chips">' + chips + '</div>' +
            '<a href="mis-paquetes.html" class="paquetes-balance-link">Ver historial →</a>' +
            '</div>';
    }

    // ── Summary stats ─────────────────────────────────────────────────────────
    function renderStats(reservas) {
        var statsEl = document.getElementById('mr-stats');
        if (!statsEl) return;

        var activas   = reservas.filter(function (r) { return r.estado === 'activa'; });
        var canceladas = reservas.filter(function (r) { return r.estado === 'cancelada'; });

        var proxFecha = activas.reduce(function (acc, r) {
            if (!r.fecha) return acc;
            return (!acc || r.fecha < acc) ? r.fecha : acc;
        }, null);
        var proxLabel = proxFecha
            ? (new Date(proxFecha + 'T12:00:00')).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
            : '—';

        statsEl.innerHTML =
            '<div class="mr-stat"><div class="mr-stat-val">' + activas.length + '</div><div class="mr-stat-label">Activas</div></div>' +
            '<div class="mr-stat"><div class="mr-stat-val">' + canceladas.length + '</div><div class="mr-stat-label">Canceladas</div></div>' +
            '<div class="mr-stat"><div class="mr-stat-val">' + proxLabel + '</div><div class="mr-stat-label">Próxima clase</div></div>';
    }

    // ── Reservation cards ─────────────────────────────────────────────────────
    async function cancelar(id_reserva, btn, card, allReservas) {
        btn.disabled = true;
        btn.textContent = "Cancelando…";
        try {
            var res = await window.GlowAPI.cancelarReserva(id_reserva, token);
            if (res.ok) {
                var r = allReservas.find(function (x) { return Number(x.id_reserva) === id_reserva; });
                if (r) r.estado = 'cancelada';
                card.classList.add('cancelada');
                var badgeEl = card.querySelector('.reserva-badge');
                if (badgeEl) { badgeEl.className = 'reserva-badge badge-cancelada'; badgeEl.textContent = 'Cancelada'; }
                btn.remove();
                renderStats(allReservas);
                var paquetesRes = await window.GlowAPI.getMisPaquetes(token);
                if (paquetesRes.ok) renderPaquetes(paquetesRes.paquetes);
            } else {
                btn.textContent = "Cancelar";
                btn.disabled = false;
                alert(res.message || "No se pudo cancelar la reserva.");
            }
        } catch (err) {
            btn.textContent = "Cancelar";
            btn.disabled = false;
            console.warn("[reservas] Error al cancelar:", err);
        }
    }

    function renderReservas(reservas, allReservas) {
        if (!reservas.length) {
            container.innerHTML =
                '<div class="mr-empty">' +
                '<div class="mr-empty-icon">📅</div>' +
                '<h3 class="mr-empty-title">Sin reservas aquí</h3>' +
                '<p class="mr-empty-sub">Prueba otro filtro o reserva tu primera clase.</p>' +
                '<a href="clases.html" class="mr-empty-cta">Ver clases disponibles</a>' +
                '</div>';
            return;
        }

        var fragment = document.createDocumentFragment();
        reservas.forEach(function (r) {
            var card = document.createElement('div');
            card.className = 'reserva-card' + (r.estado === 'cancelada' ? ' cancelada' : '');

            var info = document.createElement('div');
            info.className = 'reserva-info';
            info.innerHTML =
                '<div class="reserva-disciplina">' + r.disciplina + '</div>' +
                '<div class="reserva-fecha">' + formatDate(r.fecha) + ' · ' +
                formatTime(r.hora_inicio) + '–' + formatTime(r.hora_fin) + '</div>';

            var badge = document.createElement('span');
            badge.className = 'reserva-badge badge-' + r.estado;
            badge.textContent = r.estado === 'activa' ? 'Activa' : 'Cancelada';

            card.appendChild(info);
            card.appendChild(badge);

            if (r.estado === 'activa') {
                var cancelBtn = document.createElement('button');
                cancelBtn.className = 'reserva-cancel-btn';
                cancelBtn.textContent = 'Cancelar';
                (function (id, btn, c) {
                    btn.addEventListener('click', function () { cancelar(id, btn, c, allReservas); });
                })(r.id_reserva, cancelBtn, card);
                card.appendChild(cancelBtn);
            }

            fragment.appendChild(card);
        });

        container.innerHTML = '';
        container.appendChild(fragment);
    }

    // ── Filter tabs ───────────────────────────────────────────────────────────
    var _allReservas = [];

    function applyFilter(filter) {
        document.querySelectorAll('.mr-tab').forEach(function (t) {
            t.classList.toggle('active', t.dataset.filter === filter);
        });
        var filtered = filter === 'todas'
            ? _allReservas
            : _allReservas.filter(function (r) { return r.estado === filter; });
        renderReservas(filtered, _allReservas);
    }

    document.querySelectorAll('.mr-tab').forEach(function (tab) {
        tab.addEventListener('click', function () { applyFilter(tab.dataset.filter); });
    });

    // ── Load ──────────────────────────────────────────────────────────────────
    container.innerHTML = '<p style="text-align:center;color:#8c7168;font-size:1.4rem;padding:2rem 0;">Cargando reservas...</p>';

    try {
        var results = await Promise.all([
            window.GlowAPI.getMisReservas(token),
            window.GlowAPI.getMisPaquetes(token),
        ]);
        var reservasRes  = results[0];
        var paquetesRes  = results[1];

        if (paquetesRes.ok) renderPaquetes(paquetesRes.paquetes);

        if (!reservasRes.ok) {
            container.innerHTML = '<p style="text-align:center;color:#c0392b;font-size:1.4rem;">No se pudieron cargar tus reservas.</p>';
            return;
        }

        _allReservas = reservasRes.reservas || [];

        if (!_allReservas.length) {
            var statsEl = document.getElementById('mr-stats');
            var tabsEl  = document.getElementById('mr-tabs');
            if (statsEl) statsEl.style.display = 'none';
            if (tabsEl)  tabsEl.style.display  = 'none';
            container.innerHTML =
                '<div class="mr-empty">' +
                '<div class="mr-empty-icon">✨</div>' +
                '<h3 class="mr-empty-title">Aún no tienes reservas</h3>' +
                '<p class="mr-empty-sub">Adquiere un paquete y reserva tu primera clase en Glow Studio.</p>' +
                '<a href="clases.html" class="mr-empty-cta">Explorar clases</a>' +
                '</div>';
            return;
        }

        renderStats(_allReservas);
        renderReservas(_allReservas, _allReservas);
    } catch (err) {
        container.innerHTML = '<p style="text-align:center;color:#c0392b;font-size:1.4rem;">No se pudo conectar con el servidor.</p>';
        console.warn("[reservas] Error:", err);
    }
});
