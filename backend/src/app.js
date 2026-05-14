const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const clasesRoutes = require('./routes/clases.routes');
const reservasRoutes = require('./routes/reservas.routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/clases', clasesRoutes);
app.use('/api/reservas', reservasRoutes);

const { requireAuth } = require('./middleware/auth.middleware');
const { getMisPaquetes } = require('./controllers/reservas.controller');
app.get('/api/usuario-paquetes', requireAuth, getMisPaquetes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
