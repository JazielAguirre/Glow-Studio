const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const reservasController = require('../controllers/reservas.controller');

const router = express.Router();

router.get('/',         requireAuth, reservasController.getMisReservas);
router.post('/',        requireAuth, reservasController.crearReserva);
router.patch('/:id/cancelar', requireAuth, reservasController.cancelarReserva);

module.exports = router;
