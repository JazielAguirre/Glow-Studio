document.addEventListener("DOMContentLoaded", async function () {
    // Gate: redirect to login if not authenticated.
    if (!window.Auth || !window.Auth.isLoggedIn()) {
        window.location.href = "login.html";
        return;
    }

    var container = document.getElementById("mis-reservas");
    if (!container) return;

    var token = window.Auth.getToken();

    function formatDate(fechaStr) {
        var d = new Date(fechaStr + "T12:00:00");
        return d.toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
        });
    }

    function formatTime(t) {
        return t ? t.slice(0, 5) : "";
    }

    function renderPaquetes(paquetes) {
        var section = document.getElementById("mis-paquetes");
        if (!section) return;
        if (!paquetes.length) {
            section.innerHTML = "<p class=\"centrar-texto\">No tienes paquetes activos. <a href=\"paquetes.html\">Ver paquetes</a>.</p>";
            return;
        }
        var html = "<ul class=\"paquetes-list\">";
        paquetes.forEach(function (p) {
            html += "<li><strong>" + p.nombre + "</strong> — " +
                p.clases_restantes + " clase(s) restante(s), vence " + p.fecha_expiracion + "</li>";
        });
        html += "</ul>";
        section.innerHTML = html;
    }

    async function cancelar(id_reserva, btn, item) {
        btn.disabled = true;
        btn.textContent = "Cancelando…";
        try {
            var res = await window.GlowAPI.cancelarReserva(id_reserva, token);
            if (res.ok) {
                item.querySelector(".reserva-estado").textContent = "cancelada";
                btn.remove();
                // Reload packages section to reflect refund.
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

    function renderReservas(reservas) {
        if (!reservas.length) {
            container.innerHTML = "<p class=\"centrar-texto\">No tienes reservas todavía.</p>";
            return;
        }

        var fragment = document.createDocumentFragment();

        reservas.forEach(function (r) {
            var item = document.createElement("div");
            item.className = "class-item";

            var name = document.createElement("div");
            name.className = "class-name";
            name.textContent = r.disciplina;

            var time = document.createElement("div");
            time.className = "class-time";
            time.textContent =
                formatDate(r.fecha) + " · " +
                formatTime(r.hora_inicio) + " – " + formatTime(r.hora_fin);

            var estado = document.createElement("div");
            estado.className = "class-time";
            estado.innerHTML = "Estado: <span class=\"reserva-estado\">" + r.estado + "</span>";
            if (r.nombre_paquete) {
                estado.innerHTML += " · Paquete: " + r.nombre_paquete;
            }

            item.appendChild(name);
            item.appendChild(time);
            item.appendChild(estado);

            if (r.estado === "activa") {
                var cancelBtn = document.createElement("button");
                cancelBtn.className = "reserve-btn";
                cancelBtn.textContent = "Cancelar";
                cancelBtn.addEventListener("click", function () {
                    cancelar(r.id_reserva, cancelBtn, item);
                });
                item.appendChild(cancelBtn);
            }

            fragment.appendChild(item);
        });

        container.innerHTML = "";
        container.appendChild(fragment);
    }

    try {
        var reservasRes = await window.GlowAPI.getMisReservas(token);
        if (reservasRes.ok) {
            renderReservas(reservasRes.reservas);
        } else {
            container.innerHTML = "<p class=\"centrar-texto\">No se pudieron cargar tus reservas.</p>";
        }

        var paquetesRes = await window.GlowAPI.getMisPaquetes(token);
        if (paquetesRes.ok) renderPaquetes(paquetesRes.paquetes);
    } catch (err) {
        container.innerHTML = "<p class=\"centrar-texto\">No se pudo conectar con el servidor.</p>";
        console.warn("[reservas] Error:", err);
    }
});
