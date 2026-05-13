const clasesService = require('../services/clases.service');

async function getClases(req, res, next) {
    try {
        const clases = await clasesService.getAllClases();
        res.json({ ok: true, clases });
    } catch (err) {
        next(err);
    }
}

module.exports = { getClases };
