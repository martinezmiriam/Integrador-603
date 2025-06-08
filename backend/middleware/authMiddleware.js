// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');


exports.procesarCarrito = async (req, res) => {
  const { carrito, metodoPago, direccionEntrega } = req.body;

  // Validaciones básicas
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
        fecha_compra, 
        total, 
        estado, 
        metodo_pago, 
        direccion_entrega,
        id_autolavado
      ) VALUES (NOW(), ?, 'pendiente', ?, ?, ?)`,
      [
        total,
        metodoPago || 'efectivo',
        direccionEntrega || '',
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