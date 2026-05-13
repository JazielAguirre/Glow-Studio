const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const healthRoutes = require('./routes/health.routes');
<<<<<<< ours
=======
const authRoutes = require('./routes/auth.routes');
>>>>>>> theirs
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/health', healthRoutes);
<<<<<<< ours
=======
app.use('/api/auth', authRoutes);
>>>>>>> theirs

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
