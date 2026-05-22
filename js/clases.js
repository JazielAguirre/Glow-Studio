document.addEventListener("DOMContentLoaded", async function () {
    var schedule = document.getElementById("schedule");
    if (!schedule) return;

    function formatTime(t) { return t ? t.slice(0, 5) : ""; }

    function formatDate(fechaStr) {
        var d = new Date(fechaStr + "T12:00:00");
        return d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
    }

    function capitalize(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : str; }

    function buildCapacityBar(actuales, maximo) {
        var pct = maximo > 0 ? Math.min(100, Math.round(actuales / maximo * 100)) : 0;
        var full = pct >= 100;
        var wrap = document.createElement('div');
        wrap.className = 'class-capacity';
        wrap.innerHTML =
            '<div class="class-capacity-bar"><div class="class-capacity-fill' + (full ? ' full' : '') +
            '" style="width:' + pct + '%"></div></div>' +
            '<div class="class-capacity-text">' + actuales + ' / ' + maximo + ' lugares</div>';
        return wrap;
    }

    function updateCapacityBar(item, clase) {
        var existing = item.querySelector('.class-capacity');
        if (!existing) return;
        var updated = buildCapacityBar(clase.reservas_actuales, clase.cupo_maximo);
        existing.parentNode.replaceChild(updated, existing);
    }

    function showSuccess(item, clase) {
        var prev = item.querySelector('.reserva-success');
        if (prev) prev.remove();
        var success = document.createElement('div');
        success.className = 'reserva-success';
        success.innerHTML =
            '<strong>¡Reserva confirmada! ✓</strong>' +
            capitalize(formatDate(clase.fecha)) + ' · ' +
            formatTime(clase.hora_inicio) + '–' + formatTime(clase.hora_fin) +
            '<br><a href="mis-reservas.html">Ver mis reservas →</a>';
        item.appendChild(success);
    }

    function showSinPaquete(item) {
        var prev = item.querySelector('.sin-paquete-msg');
        if (prev) prev.remove();
        var msg = document.createElement('div');
        msg.className = 'sin-paquete-msg';
        msg.innerHTML = 'Necesitas un paquete activo para reservar. <a href="paquetes.html">Ver paquetes →</a>';
        item.appendChild(msg);
    }

    function buildReserveBtn(clase, item) {
        var disponibles = clase.cupos_disponibles !== undefined
            ? clase.cupos_disponibles
            : (clase.cupo_maximo - clase.reservas_actuales);

        if (disponibles <= 0) {
            var btn = document.createElement("button");
            btn.className = "reserve-btn";
            btn.textContent = "Sin cupo";
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
                    var res   = await window.GlowAPI.reservar(clase.id_clase, token);
                    if (res.ok) {
                        clase.reservas_actuales = (clase.reservas_actuales || 0) + 1;
                        if (clase.cupos_disponibles !== undefined) {
                            clase.cupos_disponibles = Math.max(0, clase.cupos_disponibles - 1);
                        }
                        updateCapacityBar(item, clase);
                        btn.remove();
                        showSuccess(item, clase);
                    } else if (res.error === "SIN_PAQUETE") {
                        btn.textContent = "Reservar";
                        btn.disabled = false;
                        showSinPaquete(item);
                    } else if (res.error === "YA_RESERVADO") {
                        btn.textContent = "Ya reservada";
                        btn.disabled = true;
                    } else if (res.error === "CLASE_LLENA") {
                        btn.textContent = "Sin cupo";
                        btn.disabled = true;
                    } else {
                        btn.textContent = "Reservar";
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
        a.textContent = "Iniciar sesión";
        return a;
    }

    function renderClases(clases) {
        if (!clases.length) {
            schedule.innerHTML =
                '<div class="clases-empty">' +
                '<span class="clases-empty-icon">🗓</span>' +
                'No hay clases programadas próximamente.' +
                '</div>';
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
            title.textContent = capitalize(formatDate(fecha));
            card.appendChild(title);

            byDate[fecha].forEach(function (clase) {
                var item = document.createElement("div");
                item.className = "class-item";

                var name = document.createElement("div");
                name.className = "class-name";
                name.textContent = clase.disciplina;

                var time = document.createElement("div");
                time.className = "class-time";
                time.textContent = formatTime(clase.hora_inicio) + " – " + formatTime(clase.hora_fin);

                var cap = buildCapacityBar(clase.reservas_actuales, clase.cupo_maximo);

                item.appendChild(name);
                item.appendChild(time);
                item.appendChild(cap);
                item.appendChild(buildReserveBtn(clase, item));
                card.appendChild(item);
            });

            fragment.appendChild(card);
        });

        schedule.innerHTML = "";
        schedule.appendChild(fragment);
    }

    schedule.innerHTML =
        '<div class="clases-empty">' +
        '<span class="clases-empty-icon">⏳</span>Cargando clases...</div>';

    try {
        var data = await window.GlowAPI.getClases();
        if (data && data.ok) {
            renderClases(data.clases);
        } else {
            schedule.innerHTML =
                '<div class="clases-empty">' +
                '<span class="clases-empty-icon">⚠️</span>' +
                'No se pudieron cargar las clases. Verifica que el servidor esté activo.' +
                '</div>';
        }
    } catch (err) {
        schedule.innerHTML =
            '<div class="clases-empty">' +
            '<span class="clases-empty-icon">⚠️</span>' +
            'No se pudo conectar con el servidor.' +
            '</div>';
        console.warn("[clases] Error cargando clases:", err);
    }
});
