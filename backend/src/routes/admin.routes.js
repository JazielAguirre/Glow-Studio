const express = require('express');
const {
    dashboard,
    usuarios,
    paquetes,
    reservas,
    clasesOcupacion,
    contactos,
    revisarContacto,
} = require('../controllers/admin.controller');

const router = express.Router();

router.get('/dashboard',        dashboard);
router.get('/usuarios',         usuarios);
router.get('/paquetes',         paquetes);
router.get('/reservas',         reservas);
router.get('/clases-ocupacion', clasesOcupacion);
router.get('/contactos',        contactos);
router.patch('/contactos/:id/revisar', revisarContacto);

module.exports = router;
