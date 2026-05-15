(function () {
    const form   = document.getElementById('contacto-form');
    const msgEl  = document.getElementById('contacto-msg');

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function mostrarMensaje(texto, exito) {
        msgEl.textContent = texto;
        msgEl.style.color = exito ? '#4caf50' : '#f06449';
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        mostrarMensaje('', false);

        const nombre   = document.getElementById('contacto-nombre').value.trim();
        const telefono = document.getElementById('contacto-telefono').value.trim();
        const correo   = document.getElementById('contacto-correo').value.trim();
        const mensaje  = document.getElementById('contacto-mensaje').value.trim();

        if (!nombre || !correo || !mensaje) {
            mostrarMensaje('Por favor completa nombre, correo y mensaje.', false);
            return;
        }

        if (!EMAIL_RE.test(correo)) {
            mostrarMensaje('Ingresa un correo válido.', false);
            return;
        }

        try {
            const data = await GlowAPI.enviarContacto({ nombre, telefono, correo, mensaje });
            if (data.ok) {
                mostrarMensaje('¡Mensaje enviado! Nos pondremos en contacto contigo pronto.', true);
                form.reset();
            } else {
                mostrarMensaje(data.error || 'No se pudo enviar el mensaje.', false);
            }
        } catch (_) {
            mostrarMensaje('Error de conexión. Intenta más tarde.', false);
        }
    });
})();
