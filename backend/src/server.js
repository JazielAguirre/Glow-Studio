require('dotenv').config();

const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 3000;

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
