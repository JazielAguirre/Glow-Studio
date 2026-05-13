document.addEventListener("DOMContentLoaded", async function () {
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
    }
});
