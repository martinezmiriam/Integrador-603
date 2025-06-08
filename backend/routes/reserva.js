const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');

router.post('/', reservaController.crearReserva);
router.get('/', reservaController.obtenerTodasLasReservas);
router.get('/:id_cliente', reservaController.obtenerReservasPorCliente);
router.get('/conteo', (req, res, next) => {
  console.log('Ruta /conteo llamada con fecha:', req.query.fecha);
  next();
}, reservaController.obtenerReservasPorFecha);


module.exports = router;
