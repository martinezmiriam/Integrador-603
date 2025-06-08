// controllers/compraController.js
const db = require('../db');

exports.procesarCarrito = async (req, res) => {
  const { carrito, metodoPago, direccionEntrega, userId } = req.body;

  // Validaciones básicas
  if (!userId) {
    return res.status(400).json({ error: 'ID de usuario no proporcionado' });
  }

  if (!carrito || carrito.length === 0) {
    return res.status(400).json({ error: 'El carrito está vacío' });
  }

  // Separar promoción (autolavado) y servicios
  const promocion = carrito.find(item => item.isPromo);
  const servicios = carrito.filter(item => !item.isPromo);

  // Calcular total
  const total = carrito.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  try {
    // Iniciar transacción
    await db.query('START TRANSACTION');

    // 1. Crear registro de compra principal
const [compraResult] = await db.query(
  `INSERT INTO compra (
    id_cliente, 
    fecha_compra, 
    total_pago, 
    estado, 
    id_autolavado
  ) VALUES (?, NOW(), ?, 'pendiente', ?)`,

  [
    userId,
    total,
    promocion ? promocion.id.replace('promo-', '') : null
  ]
);



    const compraId = compraResult.insertId;

    // 2. Procesar servicios (si hay)
    if (servicios.length > 0) {
      for (const servicio of servicios) {
        await db.query(
          `INSERT INTO detalle_servicios_compra (
            id_compra, 
            id_servicio, 
            cantidad, 
            precio_unitario
          ) VALUES (?, ?, ?, ?)`,
          [
            compraId,
            servicio.id,
            servicio.quantity,
            servicio.price
          ]
        );
      }
    }

    // Confirmar transacción
    await db.query('COMMIT');

    res.json({
      success: true,
      message: 'Compra procesada correctamente',
      compraId
    });

  } catch (error) {
    // Revertir transacción en caso de error
    await db.query('ROLLBACK');
    console.error('Error al procesar carrito:', error);
    res.status(500).json({ 
      error: 'Error al procesar la compra',
      details: error.message 
    });
  }
};

exports.obtenerHistorialCliente = async (req, res) => {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({ error: 'ID de usuario no proporcionado' });
  }

  try {
    // 1. Obtener compras del cliente
    const [compras] = await db.query(
      `SELECT id_compra, fecha_compra, total_pago, estado, id_autolavado 
       FROM compra 
       WHERE id_cliente = ? 
       ORDER BY fecha_compra DESC`,
      [userId]
    );

    // 2. Para cada compra, obtener detalles de servicios y promoción (si aplica)
    for (const compra of compras) {
      // 2.1 Detalles de servicios
      const [servicios] = await db.query(
        `SELECT dsc.id_servicio, s.nombre AS servicio_nombre, dsc.cantidad, dsc.precio_unitario
         FROM detalle_servicios_compra dsc
         JOIN servicios s ON dsc.id_servicio = s.id_servicios
         WHERE dsc.id_compra = ?`,
        [compra.id_compra]
      );
      compra.servicios = servicios;

      // 2.2 Información de promoción usada (si aplica)
      if (compra.id_autolavado) {
        const [promo] = await db.query(
          `SELECT id_autolavado, nombre_paquete AS nombre, descripcion 
           FROM autolavado 
           WHERE id_autolavado = ?`,
          [compra.id_autolavado]
        );
        compra.promocion = promo.length ? promo[0] : null;
      } else {
        compra.promocion = null;
      }
    }

    // Enviar el historial
    res.json({ compras });

  } catch (error) {
    console.error('Error al obtener historial del cliente:', error);
    res.status(500).json({ error: 'Error al obtener historial del cliente' });
  }
};



