function notFoundHandler(req, res, next) {
    res.status(404).json({
        ok: false,
        error: 'Not Found',
        path: req.originalUrl,
    });
}

function errorHandler(err, req, res, next) {
    const status = err.status || 500;
    const payload = {
        ok: false,
        error: err.message || 'Internal Server Error',
    };
    if (process.env.NODE_ENV !== 'production' && err.stack) {
        payload.stack = err.stack;
    }
    res.status(status).json(payload);
}

module.exports = { notFoundHandler, errorHandler };
