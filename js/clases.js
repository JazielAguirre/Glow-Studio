document.addEventListener("DOMContentLoaded", async function () {
    var schedule = document.getElementById("schedule");
    if (!schedule) return;

    var FAILURE = "No se pudo conectar con el backend. Verifica que el servidor esté corriendo en el puerto 3010.";
    var EMPTY   = "No hay clases programadas en este momento.";

    function formatTime(t) {
        return t ? t.slice(0, 5) : "";
    }

    function formatDate(fechaStr) {
        var d = new Date(fechaStr + "T12:00:00");
        return d.toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
        });
    }

    function buildReserveBtn(clase) {
        if (clase.cupos_disponibles <= 0) {
            var btn = document.createElement("button");
            btn.className = "reserve-btn";
            btn.textContent = "Lleno";
            btn.disabled = true;
            return btn;
        }

        if (window.Auth && window.Auth.isLoggedIn()) {
            var btn = document.createElement("button");
            btn.className = "reserve-btn";
            btn.textContent = "Reservar";
            btn.addEventListener("click", async function () {
                btn.disabled = true;
                btn.textContent = "Reservando…";
                try {
                    var token = window.Auth.getToken();
                    var res = await window.GlowAPI.reservar(clase.id_clase, token);
                    if (res.ok) {
                        btn.textContent = "Reservado ✓";
                    } else if (res.error === "SIN_PAQUETE") {
                        btn.textContent = "Reservar";
                        btn.disabled = false;
                        var msg = document.createElement("p");
                        msg.className = "centrar-texto";
                        msg.innerHTML = "Necesitas un paquete activo. <a href=\"paquetes.html\">Ver paquetes</a>.";
                        btn.parentNode.appendChild(msg);
                    } else if (res.error === "YA_RESERVADO") {
                        btn.textContent = "Ya reservada";
                    } else if (res.error === "CLASE_LLENA") {
                        btn.textContent = "Lleno";
                    } else {
                        btn.textContent = "Error";
                        btn.disabled = false;
                    }
                } catch (err) {
                    btn.textContent = "Reservar";
                    btn.disabled = false;
                    console.warn("[clases] Error al reservar:", err);
                }
            });
            return btn;
        }

        var a = document.createElement("a");
        a.className = "reserve-btn";
        a.href = "login.html";
        a.textContent = "Reservar";
        return a;
    }

    function renderClases(clases) {
        if (!clases.length) {
            schedule.innerHTML = '<p class="centrar-texto">' + EMPTY + "</p>";
            return;
        }

        var byDate = {};
        clases.forEach(function (c) {
            if (!byDate[c.fecha]) byDate[c.fecha] = [];
            byDate[c.fecha].push(c);
        });

        var fragment = document.createDocumentFragment();

        Object.keys(byDate).sort().forEach(function (fecha) {
            var card = document.createElement("div");
            card.className = "day-card";

            var title = document.createElement("div");
            title.className = "day-title";
            title.textContent = formatDate(fecha);
            card.appendChild(title);

            byDate[fecha].forEach(function (clase) {
                var item = document.createElement("div");
                item.className = "class-item";

                var name = document.createElement("div");
                name.className = "class-name";
                name.textContent = clase.disciplina;

                var time = document.createElement("div");
                time.className = "class-time";
                time.textContent =
                    formatTime(clase.hora_inicio) + " – " + formatTime(clase.hora_fin) +
                    " · " + clase.reservas_actuales + "/" + clase.cupo_maximo + " lugares";

                item.appendChild(name);
                item.appendChild(time);
                item.appendChild(buildReserveBtn(clase));
                card.appendChild(item);
            });

            fragment.appendChild(card);
        });

        schedule.innerHTML = "";
        schedule.appendChild(fragment);
    }

    try {
        var data = await window.GlowAPI.getClases();
        if (data && data.ok) {
            renderClases(data.clases);
        } else {
            schedule.innerHTML = '<p class="centrar-texto">' + FAILURE + "</p>";
        }
    } catch (err) {
        schedule.innerHTML = '<p class="centrar-texto">' + FAILURE + "</p>";
        console.warn("[clases] Error cargando clases:", err);
    }
});
