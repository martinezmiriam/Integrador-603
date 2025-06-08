// routes/compraRoutes.js
const express = require('express');
const router = express.Router();
const compraController = require('../controllers/compraController');

// Ruta simplificada sin autenticación
router.post("/", compraController.procesarCarrito);
router.get('/historial/:userId', compraController.obtenerHistorialCliente);


module.exports = router;