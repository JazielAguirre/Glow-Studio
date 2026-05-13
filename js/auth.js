var Auth = (function () {
    var TOKEN_KEY = "glow_token";
    var _currentUser = null;

    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function setToken(token) {
        localStorage.setItem(TOKEN_KEY, token);
    }

    function clearToken() {
        localStorage.removeItem(TOKEN_KEY);
        _currentUser = null;
    }

    function isLoggedIn() {
        return !!getToken();
    }

    function getCurrentUser() {
        return _currentUser;
    }

    function logout() {
        clearToken();
        window.location.href = "index.html";
    }

    async function redirectIfLoggedIn(destination) {
        var token = getToken();
        if (!token) return;
        try {
            var data = await window.GlowAPI.me(token);
            if (data && data.ok) {
                window.location.href = destination;
            } else {
                clearToken();
            }
        } catch (_) {
            clearToken();
        }
    }

    async function updateNavAuthState() {
        var token = getToken();
        var link = document.getElementById("nav-user-link");
        if (!link || !token) return;

        try {
            var data = await window.GlowAPI.me(token);
            if (data && data.ok) {
                _currentUser = data.user;
                var firstName = data.user.nombre.split(" ")[0];

                var wrapper = document.createElement("div");

                var greeting = document.createElement("a");
                greeting.href = "#";
                greeting.textContent = "Hola, " + firstName;
                greeting.addEventListener("click", function (e) {
                    e.preventDefault();
                });

                var logoutBtn = document.createElement("a");
                logoutBtn.href = "#";
                logoutBtn.textContent = "Cerrar sesión";
                logoutBtn.addEventListener("click", function (e) {
                    e.preventDefault();
                    logout();
                });

                wrapper.appendChild(greeting);
                wrapper.appendChild(logoutBtn);
                link.parentNode.replaceChild(wrapper, link);
            } else {
                clearToken();
            }
        } catch (_) {
            clearToken();
        }
    }

    function handleLoginForm() {
        var form = document.getElementById("login-form");
        var errorEl = document.getElementById("login-error");
        if (!form) return;

        form.addEventListener("submit", async function (e) {
            e.preventDefault();
            var email = document.getElementById("email-input").value.trim();
            var contrasena = document.getElementById("password-input").value;
            if (errorEl) errorEl.textContent = "";

            try {
                var data = await window.GlowAPI.login(email, contrasena);
                if (data.ok) {
                    setToken(data.token);
                    window.location.href = "index.html";
                } else {
                    if (errorEl) errorEl.textContent = data.error || "Error al iniciar sesión";
                }
            } catch (err) {
                if (errorEl) errorEl.textContent = "No se pudo conectar con el servidor";
                console.warn("[auth] login error:", err);
            }
        });
    }

    function handleRegisterForm() {
        var form = document.getElementById("register-form");
        var errorEl = document.getElementById("register-error");
        var successEl = document.getElementById("register-success");
        if (!form) return;

        form.addEventListener("submit", async function (e) {
            e.preventDefault();
            var nombre = document.getElementById("nombre-input").value.trim();
            var email = document.getElementById("email-input").value.trim();
            var contrasena = document.getElementById("password-input").value;
            var confirmar = document.getElementById("confirm-input").value;

            if (errorEl) errorEl.textContent = "";
            if (successEl) successEl.textContent = "";

            if (contrasena !== confirmar) {
                if (errorEl) errorEl.textContent = "Las contraseñas no coinciden";
                return;
            }

            try {
                var data = await window.GlowAPI.register(nombre, email, contrasena);
                if (data.ok) {
                    if (successEl) successEl.textContent = "Cuenta creada. Redirigiendo...";
                    setTimeout(function () {
                        window.location.href = "login.html";
                    }, 1500);
                } else {
                    if (errorEl) errorEl.textContent = data.error || "Error al registrar";
                }
            } catch (err) {
                if (errorEl) errorEl.textContent = "No se pudo conectar con el servidor";
                console.warn("[auth] register error:", err);
            }
        });
    }

    return {
        getToken,
        setToken,
        clearToken,
        isLoggedIn,
        getCurrentUser,
        logout,
        redirectIfLoggedIn,
        updateNavAuthState,
        handleLoginForm,
        handleRegisterForm,
    };
})();
