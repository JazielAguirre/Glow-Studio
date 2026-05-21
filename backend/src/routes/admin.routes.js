const express = require('express');
const {
    dashboard,
    usuarios,
    paquetes,
    reservas,
    clasesOcupacion,
    contactos,
    revisarContacto,
    tiposClase,
    adminClases,
    crearClase,
    actualizarClase,
    deshabilitarClase,
    reactivarClase,
    paquetesCatalogo,
    crearAdminPaquete,
    actualizarAdminPaquete,
    deshabilitarAdminPaquete,
    reactivarAdminPaquete,
    usuarioDetalle,
    cambiarRolHandler,
    deshabilitarUsuarioHandler,
    reactivarUsuarioHandler,
} = require('../controllers/admin.controller');

const router = express.Router();

router.get('/dashboard',        dashboard);
router.get('/usuarios',         usuarios);
router.get('/paquetes',         paquetes);
router.get('/reservas',         reservas);
router.get('/clases-ocupacion', clasesOcupacion);
router.get('/contactos',        contactos);
router.patch('/contactos/:id/revisar', revisarContacto);

// Class management
router.get('/tipos-clase',              tiposClase);
router.get('/clases',                   adminClases);
router.post('/clases',                  crearClase);
router.patch('/clases/:id',             actualizarClase);
router.patch('/clases/:id/deshabilitar', deshabilitarClase);
router.patch('/clases/:id/reactivar',   reactivarClase);

// Package catalogue management
router.get('/paquetes-catalogo',                        paquetesCatalogo);
router.post('/paquetes-catalogo',                       crearAdminPaquete);
router.patch('/paquetes-catalogo/:id',                  actualizarAdminPaquete);
router.patch('/paquetes-catalogo/:id/deshabilitar',     deshabilitarAdminPaquete);
router.patch('/paquetes-catalogo/:id/reactivar',        reactivarAdminPaquete);

// User management
router.get('/usuarios/:id/detalle',          usuarioDetalle);
router.patch('/usuarios/:id/rol',            cambiarRolHandler);
router.patch('/usuarios/:id/deshabilitar',   deshabilitarUsuarioHandler);
router.patch('/usuarios/:id/reactivar',      reactivarUsuarioHandler);

module.exports = router;
