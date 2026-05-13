(function () {
    const API_BASE_URL = "http://localhost:3010/api";

    async function getHealth() {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
    }

    async function register(nombre, email, contrasena) {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, email, contrasena }),
        });
        return response.json();
    }

    async function login(email, contrasena) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, contrasena }),
        });
        return response.json();
    }

    async function me(token) {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { "Authorization": `Bearer ${token}` },
        });
        return response.json();
    }

    window.GlowAPI = { API_BASE_URL, getHealth, register, login, me };
})();
