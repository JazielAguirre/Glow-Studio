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

    async function getClases() {
        const response = await fetch(`${API_BASE_URL}/clases`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
    }

    async function reservar(id_clase, token) {
        const response = await fetch(`${API_BASE_URL}/reservas`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ id_clase }),
        });
        return response.json();
    }

    async function getMisReservas(token) {
        const response = await fetch(`${API_BASE_URL}/reservas`, {
            headers: { "Authorization": `Bearer ${token}` },
        });
        return response.json();
    }

    async function cancelarReserva(id_reserva, token) {
        const response = await fetch(`${API_BASE_URL}/reservas/${id_reserva}/cancelar`, {
            method: "PATCH",
            headers: { "Authorization": `Bearer ${token}` },
        });
        return response.json();
    }

    async function getMisPaquetes(token) {
        const response = await fetch(`${API_BASE_URL}/usuario-paquetes`, {
            headers: { "Authorization": `Bearer ${token}` },
        });
        return response.json();
    }

    async function getPaquetes() {
        const response = await fetch(`${API_BASE_URL}/paquetes`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    async function comprarPaquete(id_paquete, token) {
        const response = await fetch(`${API_BASE_URL}/paquetes/${id_paquete}/comprar`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
        });
        return response.json();
    }

    async function enviarContacto(datos) {
        const response = await fetch(`${API_BASE_URL}/contacto`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos),
        });
        return response.json();
    }

    function authHeader(token) {
        return { "Authorization": `Bearer ${token}` };
    }

    async function getAdminDashboard(token) {
        const response = await fetch(`${API_BASE_URL}/admin/dashboard`, { headers: authHeader(token) });
        return response.json();
    }

    async function getAdminUsuarios(token) {
        const response = await fetch(`${API_BASE_URL}/admin/usuarios`, { headers: authHeader(token) });
        return response.json();
    }

    async function getAdminPaquetes(token) {
        const response = await fetch(`${API_BASE_URL}/admin/paquetes`, { headers: authHeader(token) });
        return response.json();
    }

    async function getAdminReservas(token) {
        const response = await fetch(`${API_BASE_URL}/admin/reservas`, { headers: authHeader(token) });
        return response.json();
    }

    async function getAdminClasesOcupacion(token) {
        const response = await fetch(`${API_BASE_URL}/admin/clases-ocupacion`, { headers: authHeader(token) });
        return response.json();
    }

    async function getAdminContactos(token) {
        const response = await fetch(`${API_BASE_URL}/admin/contactos`, { headers: authHeader(token) });
        return response.json();
    }

    async function marcarContactoRevisado(id, token) {
        const response = await fetch(`${API_BASE_URL}/admin/contactos/${id}/revisar`, {
            method: "PATCH",
            headers: authHeader(token),
        });
        return response.json();
    }

    async function getTiposClase(token) {
        const response = await fetch(`${API_BASE_URL}/admin/tipos-clase`, { headers: authHeader(token) });
        return response.json();
    }

    async function getAdminClases(token) {
        const response = await fetch(`${API_BASE_URL}/admin/clases`, { headers: authHeader(token) });
        return response.json();
    }

    async function crearAdminClase(datos, token) {
        const response = await fetch(`${API_BASE_URL}/admin/clases`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeader(token) },
            body: JSON.stringify(datos),
        });
        return response.json();
    }

    async function actualizarAdminClase(id, datos, token) {
        const response = await fetch(`${API_BASE_URL}/admin/clases/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...authHeader(token) },
            body: JSON.stringify(datos),
        });
        return response.json();
    }

    async function deshabilitarAdminClase(id, token) {
        const response = await fetch(`${API_BASE_URL}/admin/clases/${id}/deshabilitar`, {
            method: "PATCH",
            headers: authHeader(token),
        });
        return response.json();
    }

    async function reactivarAdminClase(id, token) {
        const response = await fetch(`${API_BASE_URL}/admin/clases/${id}/reactivar`, {
            method: "PATCH",
            headers: authHeader(token),
        });
        return response.json();
    }

    async function solicitarRecuperacionPassword(email) {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });
        return response.json();
    }

    async function restablecerPassword(token, nueva_contrasena) {
        const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, nueva_contrasena }),
        });
        return response.json();
    }

    async function getAdminPaquetesCatalogo(token) {
        const response = await fetch(`${API_BASE_URL}/admin/paquetes-catalogo`, { headers: authHeader(token) });
        return response.json();
    }

    async function crearAdminPaquete(datos, token) {
        const response = await fetch(`${API_BASE_URL}/admin/paquetes-catalogo`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeader(token) },
            body: JSON.stringify(datos),
        });
        return response.json();
    }

    async function actualizarAdminPaquete(id, datos, token) {
        const response = await fetch(`${API_BASE_URL}/admin/paquetes-catalogo/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...authHeader(token) },
            body: JSON.stringify(datos),
        });
        return response.json();
    }

    async function deshabilitarAdminPaquete(id, token) {
        const response = await fetch(`${API_BASE_URL}/admin/paquetes-catalogo/${id}/deshabilitar`, {
            method: "PATCH",
            headers: authHeader(token),
        });
        return response.json();
    }

    async function reactivarAdminPaquete(id, token) {
        const response = await fetch(`${API_BASE_URL}/admin/paquetes-catalogo/${id}/reactivar`, {
            method: "PATCH",
            headers: authHeader(token),
        });
        return response.json();
    }

    window.GlowAPI = {
        API_BASE_URL,
        getHealth,
        register,
        login,
        me,
        getClases,
        reservar,
        getMisReservas,
        cancelarReserva,
        getMisPaquetes,
        getPaquetes,
        comprarPaquete,
        enviarContacto,
        getAdminDashboard,
        getAdminUsuarios,
        getAdminPaquetes,
        getAdminReservas,
        getAdminClasesOcupacion,
        getAdminContactos,
        marcarContactoRevisado,
        getTiposClase,
        getAdminClases,
        crearAdminClase,
        actualizarAdminClase,
        deshabilitarAdminClase,
        reactivarAdminClase,
        solicitarRecuperacionPassword,
        restablecerPassword,
        getAdminPaquetesCatalogo,
        crearAdminPaquete,
        actualizarAdminPaquete,
        deshabilitarAdminPaquete,
        reactivarAdminPaquete,
    };
})();
