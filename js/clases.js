document.addEventListener("DOMContentLoaded", async function () {
 ours
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
            btn.addEventListener("click", function () {
                alert("La reserva estará disponible próximamente");
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

    const schedule = document.getElementById("schedule");
    if (!schedule) return;

    const SUCCESS = "Conectado al backend de Glow Studio ✅";
    const FAILURE = "No se pudo conectar con el backend. Verifica que el servidor esté corriendo en el puerto 3010.";

    try {
        const data = await window.GlowAPI.getHealth();
        if (data && data.ok) {
            schedule.innerHTML = `<p class="centrar-texto">${SUCCESS}</p>`;
        } else {
            schedule.innerHTML = `<p class="centrar-texto">${FAILURE}</p>`;
        }
    } catch (err) {
        schedule.innerHTML = `<p class="centrar-texto">${FAILURE}</p>`;
        console.warn("[clases] Backend health check failed:", err);
 theirs
    }
});
