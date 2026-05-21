// Handles both forgot-password.html and reset-password.html
(function () {

    // ── Forgot password page ──────────────────────────────────────────────────

    var forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
        var forgotEmail  = document.getElementById('forgot-email');
        var forgotMsg    = document.getElementById('forgot-msg');
        var forgotSubmit = document.getElementById('forgot-submit');
        var demoLinkWrap = document.getElementById('forgot-demo-link');

        forgotForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            forgotMsg.textContent = '';
            forgotMsg.style.color = '#555';
            forgotSubmit.disabled = true;
            forgotSubmit.value = 'Enviando...';

            try {
                var email = forgotEmail.value.trim();
                var data  = await window.GlowAPI.solicitarRecuperacionPassword(email);

                if (data.ok) {
                    forgotMsg.textContent = data.message;
                    forgotMsg.style.color = '#155724';
                    forgotForm.reset();

                    if (data.demo_reset_url && demoLinkWrap) {
                        var link = document.createElement('a');
                        link.href = data.demo_reset_url;
                        link.textContent = 'Abrir enlace de recuperación (demo)';
                        link.style.display = 'block';
                        link.style.marginTop = '1rem';
                        demoLinkWrap.innerHTML = '';
                        demoLinkWrap.appendChild(link);
                    }
                } else {
                    forgotMsg.textContent = 'No se pudo procesar la solicitud.';
                    forgotMsg.style.color = '#f06449';
                }
            } catch (_) {
                forgotMsg.textContent = 'Error de conexión. Intenta más tarde.';
                forgotMsg.style.color = '#f06449';
            } finally {
                forgotSubmit.disabled = false;
                forgotSubmit.value = 'Enviar enlace';
            }
        });
    }

    // ── Reset password page ───────────────────────────────────────────────────

    var resetContainer = document.getElementById('reset-container');
    if (resetContainer) {
        var params     = new URLSearchParams(window.location.search);
        var resetToken = params.get('token');
        var noTokenMsg = document.getElementById('reset-no-token');
        var resetForm  = document.getElementById('reset-form');
        var resetMsg   = document.getElementById('reset-msg');

        if (!resetToken) {
            if (noTokenMsg) noTokenMsg.style.display = 'block';
            if (resetForm)  resetForm.style.display  = 'none';
        } else {
            if (noTokenMsg) noTokenMsg.style.display = 'none';
            if (resetForm)  resetForm.style.display  = 'block';

            var resetSubmit  = document.getElementById('reset-submit');
            var newPassInput = document.getElementById('reset-password');
            var confPassInput = document.getElementById('reset-confirm');

            resetForm.addEventListener('submit', async function (e) {
                e.preventDefault();
                resetMsg.textContent = '';
                resetMsg.style.color = '#555';

                var nueva    = newPassInput.value;
                var confirma = confPassInput.value;

                if (!nueva || nueva.length < 8) {
                    resetMsg.textContent = 'La contraseña debe tener al menos 8 caracteres.';
                    resetMsg.style.color = '#f06449';
                    return;
                }
                if (nueva !== confirma) {
                    resetMsg.textContent = 'Las contraseñas no coinciden.';
                    resetMsg.style.color = '#f06449';
                    return;
                }

                resetSubmit.disabled = true;
                resetSubmit.value = 'Actualizando...';

                try {
                    var data = await window.GlowAPI.restablecerPassword(resetToken, nueva);
                    if (data.ok) {
                        resetForm.style.display = 'none';
                        resetMsg.innerHTML = data.message + ' <a href="login.html">Iniciar sesión</a>.';
                        resetMsg.style.color = '#155724';
                    } else {
                        resetMsg.textContent = data.error || 'No se pudo actualizar la contraseña.';
                        resetMsg.style.color = '#f06449';
                        resetSubmit.disabled = false;
                        resetSubmit.value = 'Actualizar contraseña';
                    }
                } catch (_) {
                    resetMsg.textContent = 'Error de conexión. Intenta más tarde.';
                    resetMsg.style.color = '#f06449';
                    resetSubmit.disabled = false;
                    resetSubmit.value = 'Actualizar contraseña';
                }
            });
        }
    }

})();
