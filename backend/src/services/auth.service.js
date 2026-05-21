const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const SALT_ROUNDS = 10;
const DUMMY_HASH = '$2a$10$dummyhashusedtopreventtimingattacksXXXXXXXXXXXXXXXXXXX';

function getJwtSecret() {
    return process.env.JWT_SECRET || 'dev_fallback_secret_change_in_prod';
}

function stripPassword(user) {
    const { contrasena, ...safe } = user;
    return safe;
}

async function findByEmail(email) {
    const result = await pool.query(
        'SELECT * FROM usuarios WHERE email = $1',
        [email]
    );
    return result.rows[0] || null;
}

async function createUser(nombre, email, contrasena) {
    const hashed = await bcrypt.hash(contrasena, SALT_ROUNDS);
    const result = await pool.query(
        `INSERT INTO usuarios (nombre, email, contrasena)
         VALUES ($1, $2, $3)
         RETURNING id_usuario, nombre, email, tipo_usuario, estado, fecha_registro`,
        [nombre, email, hashed]
    );
    return result.rows[0];
}

async function verifyPassword(plain, hashed) {
    return bcrypt.compare(plain, hashed);
}

function generateToken(user) {
    const payload = {
        id_usuario: user.id_usuario,
        tipo_usuario: user.tipo_usuario,
    };
    return jwt.sign(payload, getJwtSecret(), {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
}

async function findById(id) {
    const result = await pool.query(
        'SELECT id_usuario, nombre, email, tipo_usuario, estado, fecha_registro FROM usuarios WHERE id_usuario = $1',
        [id]
    );
    return result.rows[0] || null;
}

// Runs a dummy bcrypt compare so timing is consistent whether the user exists or not.
async function dummyCompare() {
    await bcrypt.compare('dummy', DUMMY_HASH);
}

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

async function requestPasswordReset(email) {
    const userRes = await pool.query(
        "SELECT id_usuario FROM usuarios WHERE email = $1 AND estado = 'activo'",
        [email]
    );
    if (!userRes.rows.length) return null;

    const id_usuario = userRes.rows[0].id_usuario;

    // Invalidate previous unused tokens for this user
    await pool.query(
        "UPDATE password_reset_tokens SET usado = true WHERE id_usuario = $1 AND usado = false",
        [id_usuario]
    );

    const rawToken  = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    await pool.query(
        `INSERT INTO password_reset_tokens (id_usuario, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [id_usuario, tokenHash, expiresAt]
    );

    return rawToken;
}

async function resetPassword(token, nuevaContrasena) {
    if (!token) {
        const err = new Error('Token requerido');
        err.code = 'INVALID_TOKEN';
        throw err;
    }

    if (!nuevaContrasena || nuevaContrasena.length < 8) {
        const err = new Error('La contraseña debe tener al menos 8 caracteres');
        err.code = 'WEAK_PASSWORD';
        throw err;
    }

    const tokenHash = hashToken(token);
    const result = await pool.query(
        `SELECT id_reset, id_usuario FROM password_reset_tokens
         WHERE token_hash = $1 AND usado = false AND expires_at > NOW()`,
        [tokenHash]
    );

    if (!result.rows.length) {
        const err = new Error('Token inválido o expirado');
        err.code = 'INVALID_TOKEN';
        throw err;
    }

    const { id_reset, id_usuario } = result.rows[0];
    const hashed = await bcrypt.hash(nuevaContrasena, SALT_ROUNDS);

    await pool.query('UPDATE usuarios SET contrasena = $1 WHERE id_usuario = $2', [hashed, id_usuario]);
    await pool.query('UPDATE password_reset_tokens SET usado = true WHERE id_reset = $1', [id_reset]);

    return true;
}

module.exports = {
    findByEmail,
    createUser,
    verifyPassword,
    generateToken,
    findById,
    dummyCompare,
    stripPassword,
    requestPasswordReset,
    resetPassword,
};
