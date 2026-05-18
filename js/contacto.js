(function () {
    const form       = document.getElementById('contacto-form');
    const msgEl      = document.getElementById('contacto-msg');
    const textareaEl = document.getElementById('contacto-mensaje');
    const charCount  = document.getElementById('contacto-char-count');
    const submitBtn  = document.getElementById('contacto-submit');
    const MAX_CHARS  = 500;

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let submitting = false;

    function mostrarMensaje(texto, exito) {
        msgEl.textContent = texto;
        msgEl.style.color = exito ? '#4caf50' : '#f06449';
    }

    textareaEl.addEventListener('input', function () {
        charCount.textContent = textareaEl.value.length + '/' + MAX_CHARS;
    });

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (submitting) return;
        mostrarMensaje('', false);

        const nombre   = document.getElementById('contacto-nombre').value.trim();
        const telefono = document.getElementById('contacto-telefono').value.trim();
        const correo   = document.getElementById('contacto-correo').value.trim();
        const mensaje  = textareaEl.value.trim();

        if (!nombre || !correo || !mensaje) {
            mostrarMensaje('Por favor completa nombre, correo y mensaje.', false);
            return;
        }

        if (!EMAIL_RE.test(correo)) {
            mostrarMensaje('Ingresa un correo válido.', false);
            return;
        }

        submitting = true;
        submitBtn.disabled = true;
        submitBtn.value = 'Enviando...';

        try {
            const data = await GlowAPI.enviarContacto({ nombre, telefono, correo, mensaje });
            if (data.ok) {
                mostrarMensaje('¡Mensaje enviado! Nos pondremos en contacto contigo pronto.', true);
                form.reset();
                charCount.textContent = '0/' + MAX_CHARS;
            } else {
                mostrarMensaje(data.error || 'No se pudo enviar el mensaje.', false);
            }
        } catch (_) {
            mostrarMensaje('Error de conexión. Intenta más tarde.', false);
        } finally {
            submitting = false;
            submitBtn.disabled = false;
            submitBtn.value = 'Enviar';
        }
    });
})();
