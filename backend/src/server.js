require('dotenv').config();

const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 3000;
<<<<<<< ours
=======
const isProd = process.env.NODE_ENV === 'production';

if (!process.env.JWT_SECRET) {
    if (isProd) {
        console.error('[server] FATAL: JWT_SECRET is not set in production. Exiting.');
        process.exit(1);
    } else {
        console.warn('[server] WARNING: JWT_SECRET is not set. Using insecure fallback for development.');
    }
}
>>>>>>> theirs

(async () => {
    try {
        await db.ping();
        console.log('[db] Connection OK');
    } catch (err) {
        console.warn('[db] Connection failed — server will still start:', err.message);
    }

    app.listen(PORT, () => {
        console.log(`[server] Glow Studio API listening on http://localhost:${PORT}`);
    });
})();
