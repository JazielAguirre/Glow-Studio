const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'glow_studio',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
});

async function ping() {
    const result = await pool.query('SELECT 1 AS ok');
    return result.rows[0].ok === 1;
}

module.exports = { pool, ping };
