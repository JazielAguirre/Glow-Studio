const express = require('express');
const clasesController = require('../controllers/clases.controller');

const router = express.Router();

router.get('/', clasesController.getClases);

module.exports = router;
