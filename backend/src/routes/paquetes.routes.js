const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const paquetesController = require('../controllers/paquetes.controller');

const router = express.Router();

router.get('/', paquetesController.getPaquetes);
router.post('/:id/comprar', requireAuth, paquetesController.comprarPaquete);

module.exports = router;
