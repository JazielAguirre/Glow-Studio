const bcrypt = require('bcryptjs');
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

module.exports = {
    findByEmail,
    createUser,
    verifyPassword,
    generateToken,
    findById,
    dummyCompare,
    stripPassword,
};
