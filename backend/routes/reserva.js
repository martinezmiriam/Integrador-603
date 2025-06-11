const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');

router.post('/', reservaController.crearReserva);
router.get('/', reservaController.obtenerTodasLasReservas);
router.get('/conteo', (req, res, next) => {
  console.log('Ruta /conteo llamada con fecha:', req.query.fecha);
  next();
}, reservaController.obtenerConteoReservas);
router.get('/:id_cliente', reservaController.obtenerReservasPorCliente);




router.put('/:id/pago', reservaController.actualizarEstadoPago);


module.exports = router;
