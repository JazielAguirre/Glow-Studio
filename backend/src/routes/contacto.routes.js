const express = require('express');
const { crearContacto } = require('../controllers/contacto.controller');

const router = express.Router();

router.post('/', crearContacto);

module.exports = router;
