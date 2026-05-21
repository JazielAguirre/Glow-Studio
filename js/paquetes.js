document.addEventListener("DOMContentLoaded", async function () {
    var container = document.getElementById("paquetes-container");
    var balanceSection = document.getElementById("mis-paquetes-section");
    if (!container) return;

    var isLoggedIn = window.Auth && window.Auth.isLoggedIn();
    var token = isLoggedIn ? window.Auth.getToken() : null;

    function escapeText(v) {
        return String(v !== null && v !== undefined ? v : '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    async function renderBalance() {
        if (!balanceSection || !isLoggedIn) return;
        try {
            var res = await window.GlowAPI.getMisPaquetes(token);
            if (!res.ok || !res.paquetes.length) {
                balanceSection.innerHTML = "<p class=\"centrar-texto\">No tienes paquetes activos. " +
                    "<a href=\"mis-paquetes.html\">Ver historial</a></p>";
                return;
            }
            var html = "<p class=\"centrar-texto\"><strong>Tus paquetes activos:</strong> " +
                "<a href=\"mis-paquetes.html\" style=\"font-size:1.3rem;\">Ver historial completo</a></p>" +
                "<ul class=\"centrar-texto\">";
            res.paquetes.forEach(function (p) {
                html += "<li>" + escapeText(p.nombre) + " &mdash; " + p.clases_restantes +
                    " clase(s) restante(s), vence " + p.fecha_expiracion + "</li>";
            });
            html += "</ul>";
            balanceSection.innerHTML = html;
        } catch (_) {
            balanceSection.innerHTML = "";
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
            '<p class="glow-confirm-nota">Pago demo · sin cargo real</p>' +
            '<div class="glow-confirm-actions">' +
            '<button class="glow-confirm-yes reserve-btn">Confirmar compra demo</button>' +
            '<button class="glow-confirm-cancel">Cancelar</button>' +
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
            noBtn.disabled = true;
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
                        '<span>Vence</span><strong>' + (up.fecha_expiracion || '—') + '</strong>' +
                        '<span>Fecha</span><strong>' + (up.fecha_inicio || '—') + '</strong>' +
                        '</div>' +
                        '<p class="glow-recibo-link">Ya puedes reservar clases. ' +
                        '<a href="mis-paquetes.html">Ver mis compras</a></p>' +
                        '</div>';

                    await renderBalance();
                } else {
                    yesBtn.disabled = false;
                    noBtn.disabled = false;
                    yesBtn.textContent = 'Confirmar compra demo';
                    msgEl.textContent = res.message || 'No se pudo adquirir el paquete.';
                    msgEl.style.color = '#c0392b';
                }
            } catch (_) {
                yesBtn.disabled = false;
                noBtn.disabled = false;
                yesBtn.textContent = 'Confirmar compra demo';
                msgEl.textContent = 'Error de conexión. Intenta de nuevo.';
                msgEl.style.color = '#c0392b';
            }
        });
    }

    function buildBtn(paquete) {
        if (!isLoggedIn) {
            var a = document.createElement("a");
            a.href = "login.html";
            a.className = "reserve-btn";
            a.textContent = "Iniciar sesión";
            return a;
        }

        var btn = document.createElement("button");
        btn.className = "reserve-btn";
        btn.textContent = "Adquirir paquete";
        btn.addEventListener("click", function () {
            showConfirmation(paquete, btn.closest('.paquete'), btn);
        });
        return btn;
    }

    function renderPaquetes(paquetes) {
        var fragment = document.createDocumentFragment();
        paquetes.forEach(function (p) {
            var card = document.createElement("div");
            card.className = "paquete";

            var vigencia = document.createElement("h5");
            vigencia.textContent = "Vigencia - " + p.vigencia_dias + " días";

            var nombre = document.createElement("h3");
            nombre.textContent = p.nombre;

            var flexMonto = document.createElement("div");
            flexMonto.className = "flex-monto";

            var precio = document.createElement("h4");
            precio.textContent = "$" + Number(p.precio).toLocaleString("es-MX") + " MXN";

            var arrow = document.createElement("span");
            arrow.textContent = "⟶";

            flexMonto.appendChild(precio);
            flexMonto.appendChild(arrow);
            flexMonto.appendChild(buildBtn(p));

            card.appendChild(vigencia);
            card.appendChild(nombre);
            card.appendChild(flexMonto);
            fragment.appendChild(card);
        });
        container.innerHTML = "";
        container.appendChild(fragment);
    }

    try {
        var data = await window.GlowAPI.getPaquetes();
        if (data && data.ok) {
            renderPaquetes(data.paquetes);
        } else {
            container.innerHTML = "<p class=\"centrar-texto\">No se pudieron cargar los paquetes.</p>";
        }
        await renderBalance();
    } catch (err) {
        container.innerHTML = "<p class=\"centrar-texto\">No se pudo conectar con el servidor.</p>";
        console.warn("[paquetes] Error:", err);
    }
});
