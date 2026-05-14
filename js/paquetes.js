document.addEventListener("DOMContentLoaded", async function () {
    var container = document.getElementById("paquetes-container");
    var balanceSection = document.getElementById("mis-paquetes-section");
    if (!container) return;

    var isLoggedIn = window.Auth && window.Auth.isLoggedIn();
    var token = isLoggedIn ? window.Auth.getToken() : null;

    async function renderBalance() {
        if (!balanceSection || !isLoggedIn) return;
        try {
            var res = await window.GlowAPI.getMisPaquetes(token);
            if (!res.ok || !res.paquetes.length) {
                balanceSection.innerHTML = "<p class=\"centrar-texto\">No tienes paquetes activos.</p>";
                return;
            }
            var html = "<p class=\"centrar-texto\"><strong>Tus paquetes activos:</strong></p><ul class=\"centrar-texto\">";
            res.paquetes.forEach(function (p) {
                html += "<li>" + p.nombre + " &mdash; " + p.clases_restantes +
                    " clase(s) restante(s), vence " + p.fecha_expiracion + "</li>";
            });
            html += "</ul>";
            balanceSection.innerHTML = html;
        } catch (_) {
            balanceSection.innerHTML = "";
        }
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
        btn.addEventListener("click", async function () {
            btn.disabled = true;
            btn.textContent = "Adquiriendo…";
            try {
                var res = await window.GlowAPI.comprarPaquete(paquete.id_paquete, token);
                if (res.ok) {
                    btn.textContent = "Adquirido ✓";
                    var msg = document.createElement("p");
                    msg.className = "centrar-texto";
                    msg.textContent = "¡Paquete adquirido! Ya puedes reservar clases.";
                    btn.parentNode.appendChild(msg);
                    await renderBalance();
                } else {
                    btn.textContent = "Adquirir paquete";
                    btn.disabled = false;
                    alert(res.message || "No se pudo adquirir el paquete.");
                }
            } catch (_) {
                btn.textContent = "Adquirir paquete";
                btn.disabled = false;
            }
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
