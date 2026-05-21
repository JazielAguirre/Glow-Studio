document.addEventListener("DOMContentLoaded", async function () {
    var container     = document.getElementById("paquetes-container");
    var balanceSection = document.getElementById("mis-paquetes-section");
    if (!container) return;

    var isLoggedIn = window.Auth && window.Auth.isLoggedIn();
    var token      = isLoggedIn ? window.Auth.getToken() : null;

    function escapeText(v) {
        return String(v !== null && v !== undefined ? v : '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    async function renderBalance() {
        if (!balanceSection || !isLoggedIn) return;
        try {
            var res = await window.GlowAPI.getMisPaquetes(token);
            if (!res.ok || !res.paquetes || !res.paquetes.length) {
                balanceSection.innerHTML =
                    '<p style="text-align:center;color:#8c7168;font-size:1.4rem;margin:0 0 1.4rem;">' +
                    'No tienes paquetes activos. Adquiere uno para empezar a reservar.' +
                    '</p>';
                return;
            }
            var chips = res.paquetes.map(function (p) {
                return '<div class="balance-chip">' +
                    escapeText(p.nombre) +
                    ' &mdash; <strong>' + p.clases_restantes + ' clase(s)</strong>' +
                    ', vence <strong>' + escapeText(p.fecha_expiracion) + '</strong>' +
                    '</div>';
            }).join('');
            balanceSection.innerHTML =
                '<div class="balance-wrap">' +
                '<p class="balance-heading">Tus paquetes activos</p>' +
                '<div class="balance-chips">' + chips + '</div>' +
                '<div class="balance-actions">' +
                '<a href="mis-paquetes.html" class="balance-link">Ver historial</a>' +
                '<a href="clases.html" class="balance-link">Reservar clase</a>' +
                '</div>' +
                '</div>';
        } catch (_) {
            balanceSection.innerHTML = '';
        }
    }

    function showConfirmation(paquete, card, triggerBtn) {
        var existing = card.querySelector('.glow-confirm-overlay');
        if (existing) { existing.remove(); triggerBtn.style.display = ''; return; }

        var overlay = document.createElement('div');
        overlay.className = 'glow-confirm-overlay';

        var precio = '$' + Number(paquete.precio).toLocaleString('es-MX') + ' MXN';
        overlay.innerHTML =
            '<div class="glow-confirm-card">' +
            '<h4 class="glow-confirm-title">Confirmar adquisición</h4>' +
            '<p class="glow-confirm-pkg">' + escapeText(paquete.nombre) + '</p>' +
            '<ul class="glow-confirm-details">' +
            '<li><span>Clases incluidas</span><strong>' + paquete.cantidad_clases + '</strong></li>' +
            '<li><span>Precio</span><strong>' + precio + '</strong></li>' +
            '<li><span>Vigencia</span><strong>' + paquete.vigencia_dias + ' días</strong></li>' +
            '</ul>' +
            '<p class="glow-confirm-nota">📋 Compra demo · sin cargo real · académico</p>' +
            '<div class="glow-confirm-actions">' +
            '<button class="glow-confirm-yes reserve-btn" type="button">Confirmar compra demo</button>' +
            '<button class="glow-confirm-cancel" type="button">Cancelar</button>' +
            '</div>' +
            '<p class="glow-confirm-msg"></p>' +
            '</div>';

        card.appendChild(overlay);
        triggerBtn.style.display = 'none';

        var yesBtn = overlay.querySelector('.glow-confirm-yes');
        var noBtn  = overlay.querySelector('.glow-confirm-cancel');
        var msgEl  = overlay.querySelector('.glow-confirm-msg');

        noBtn.addEventListener('click', function () {
            overlay.remove();
            triggerBtn.style.display = '';
        });

        yesBtn.addEventListener('click', async function () {
            yesBtn.disabled = true;
            noBtn.disabled  = true;
            yesBtn.textContent = 'Procesando...';
            try {
                var res = await window.GlowAPI.comprarPaquete(paquete.id_paquete, token);
                if (res.ok) {
                    var up = res.usuario_paquete;
                    var fechaBase = (up.fecha_inicio || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
                    var folio = 'GS-' + fechaBase + '-' + up.id_usuario_paquete;
                    var precioRec = '$' + Number(up.precio || paquete.precio).toLocaleString('es-MX') + ' MXN';

                    overlay.innerHTML =
                        '<div class="glow-recibo-card">' +
                        '<div class="glow-recibo-check">✓</div>' +
                        '<h4 class="glow-recibo-title">¡Paquete adquirido!</h4>' +
                        '<div class="glow-recibo-grid">' +
                        '<span>Folio</span><strong>' + escapeText(folio) + '</strong>' +
                        '<span>Paquete</span><strong>' + escapeText(up.nombre || paquete.nombre) + '</strong>' +
                        '<span>Precio</span><strong>' + precioRec + '</strong>' +
                        '<span>Clases</span><strong>' + (up.cantidad_clases || up.clases_restantes) + '</strong>' +
                        '<span>Vence</span><strong>' + escapeText(up.fecha_expiracion || '—') + '</strong>' +
                        '</div>' +
                        '<div class="glow-recibo-actions">' +
                        '<a href="clases.html" class="glow-recibo-btn glow-recibo-btn-primary">Reservar una clase →</a>' +
                        '<a href="mis-paquetes.html" class="glow-recibo-btn glow-recibo-btn-secondary">Ver mis paquetes</a>' +
                        '</div>' +
                        '</div>';

                    await renderBalance();
                } else {
                    yesBtn.disabled    = false;
                    noBtn.disabled     = false;
                    yesBtn.textContent = 'Confirmar compra demo';
                    msgEl.textContent  = res.message || 'No se pudo adquirir el paquete.';
                    msgEl.style.color  = '#c0392b';
                }
            } catch (_) {
                yesBtn.disabled    = false;
                noBtn.disabled     = false;
                yesBtn.textContent = 'Confirmar compra demo';
                msgEl.textContent  = 'Error de conexión. Intenta de nuevo.';
                msgEl.style.color  = '#c0392b';
            }
        });
    }

    function buildBtn(paquete) {
        if (!isLoggedIn) {
            var a = document.createElement('a');
            a.href = 'login.html';
            a.className = 'reserve-btn';
            a.textContent = 'Iniciar sesión';
            return a;
        }
        var btn = document.createElement('button');
        btn.className = 'reserve-btn';
        btn.textContent = 'Adquirir paquete';
        btn.addEventListener('click', function () {
            showConfirmation(paquete, btn.closest('.paquete'), btn);
        });
        return btn;
    }

    function renderPaquetes(paquetes) {
        var fragment = document.createDocumentFragment();
        paquetes.forEach(function (p) {
            var card = document.createElement('div');
            card.className = 'paquete';

            var vigencia = document.createElement('h5');
            vigencia.textContent = 'Vigencia · ' + p.vigencia_dias + ' días';

            var nombre = document.createElement('h3');
            nombre.textContent = p.nombre;

            var flexMonto = document.createElement('div');
            flexMonto.className = 'flex-monto';

            var precio = document.createElement('h4');
            precio.textContent = '$' + Number(p.precio).toLocaleString('es-MX') + ' MXN';

            var arrow = document.createElement('span');
            arrow.textContent = '⟶';

            flexMonto.appendChild(precio);
            flexMonto.appendChild(arrow);
            flexMonto.appendChild(buildBtn(p));

            var demoNote = document.createElement('p');
            demoNote.className = 'pkg-demo-note';
            demoNote.textContent = 'Compra demo · sin cargo real';

            card.appendChild(vigencia);
            card.appendChild(nombre);
            card.appendChild(flexMonto);
            if (isLoggedIn) card.appendChild(demoNote);
            fragment.appendChild(card);
        });
        container.innerHTML = '';
        container.appendChild(fragment);
    }

    // ── Load ──────────────────────────────────────────────────────────────────
    container.innerHTML = '<p style="text-align:center;color:#8c7168;font-size:1.4rem;padding:2rem 0;">Cargando paquetes...</p>';
    try {
        var data = await window.GlowAPI.getPaquetes();
        if (data && data.ok && data.paquetes.length) {
            renderPaquetes(data.paquetes);
        } else if (data && data.ok) {
            container.innerHTML = '<p style="text-align:center;color:#8c7168;font-size:1.5rem;padding:3rem 0;">No hay paquetes disponibles en este momento.</p>';
        } else {
            container.innerHTML = '<p style="text-align:center;color:#c0392b;font-size:1.4rem;padding:2rem 0;">No se pudieron cargar los paquetes. Verifica tu conexión.</p>';
        }
        await renderBalance();
    } catch (err) {
        container.innerHTML = '<p style="text-align:center;color:#c0392b;font-size:1.4rem;padding:2rem 0;">No se pudo conectar con el servidor.</p>';
        console.warn('[paquetes] Error:', err);
    }
});
