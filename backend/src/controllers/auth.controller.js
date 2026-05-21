const authService = require('../services/auth.service');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function register(req, res, next) {
    try {
        const { nombre, email, contrasena } = req.body;

        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ ok: false, error: 'El nombre es requerido' });
        }
        if (!email || !EMAIL_RE.test(email)) {
            return res.status(400).json({ ok: false, error: 'El correo no es válido' });
        }
        if (!contrasena || contrasena.length < 8) {
            return res.status(400).json({ ok: false, error: 'La contraseña debe tener al menos 8 caracteres' });
        }

        const existing = await authService.findByEmail(email);
        if (existing) {
            return res.status(409).json({ ok: false, error: 'El correo ya está registrado' });
        }

        const user = await authService.createUser(nombre.trim(), email, contrasena);

        return res.status(201).json({
            ok: true,
            message: 'Usuario registrado correctamente',
            user,
        });
    } catch (err) {
        next(err);
    }
}

async function login(req, res, next) {
    try {
        const { email, contrasena } = req.body;

        if (!email || !contrasena) {
            return res.status(400).json({ ok: false, error: 'Correo y contraseña son requeridos' });
        }

        const user = await authService.findByEmail(email);

        if (!user) {
            await authService.dummyCompare();
            return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
        }

        const valid = await authService.verifyPassword(contrasena, user.contrasena);
        if (!valid) {
            return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
        }

        if (user.estado !== 'activo') {
            return res.status(403).json({ ok: false, error: 'Cuenta inactiva' });
        }

        const token = authService.generateToken(user);
        const safeUser = authService.stripPassword(user);

        return res.json({ ok: true, token, user: safeUser });
    } catch (err) {
        next(err);
    }
}

async function me(req, res, next) {
    try {
        const user = await authService.findById(req.user.id_usuario);
        if (!user) {
            return res.status(401).json({ ok: false, error: 'Usuario no encontrado' });
        }
        return res.json({ ok: true, user });
    } catch (err) {
        next(err);
    }
}

async function forgotPassword(req, res, next) {
    try {
        const GENERIC_MSG = 'Si el correo existe, se generó un enlace de recuperación.';
        const { email } = req.body;

        if (!email || !EMAIL_RE.test(email)) {
            return res.json({ ok: true, message: GENERIC_MSG });
        }

        const rawToken = await authService.requestPasswordReset(email);
        const response = { ok: true, message: GENERIC_MSG };

        if (rawToken) {
            response.demo_reset_token = rawToken;
            response.demo_reset_url   = `/html/reset-password.html?token=${rawToken}`;
        }

        return res.json(response);
    } catch (err) {
        next(err);
    }
}

async function resetPasswordHandler(req, res, next) {
    try {
        const { token, nueva_contrasena } = req.body;
        await authService.resetPassword(token, nueva_contrasena);
        return res.json({ ok: true, message: 'Contraseña actualizada correctamente.' });
    } catch (err) {
        if (err.code === 'INVALID_TOKEN' || err.code === 'WEAK_PASSWORD') {
            return res.status(400).json({ ok: false, error: err.message });
        }
        next(err);
    }
}

module.exports = { register, login, me, forgotPassword, resetPasswordHandler };
