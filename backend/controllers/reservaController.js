const db = require("../db"); // o donde tengas tu conexión

// Crear una nueva reserva
exports.crearReserva = async (req, res) => {
  const {
    id_cliente,
    correo,
    nombre,
    telefono,
    fecha_solicitada,
    hora_llegada,
    duracion_estimada,
    tipo_vehiculo,
    matricula,
    mensaje,
  } = req.body;

  // Validación rápida
  if (
    !id_cliente ||
    !correo ||
    !nombre ||
    !telefono ||
    !fecha_solicitada ||
    !hora_llegada ||
    !duracion_estimada ||
    !tipo_vehiculo ||
    !matricula
  ) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
    const fecha_creacion = new Date().toISOString();

    await db.query(
      `INSERT INTO reserva (
        id_cliente, correo, nombre, telefono,
        fecha_solicitada, hora_llegada, duracion_estimada,
        tipo_vehiculo, matricula, mensaje, fecha_creacion, estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_cliente,
        correo,
        nombre,
        telefono,
        fecha_solicitada,
        hora_llegada,
        duracion_estimada,
        tipo_vehiculo,
        matricula,
        mensaje || null,
        fecha_creacion,
        "pendiente",
      ]
    );

    res.status(201).json({ message: "Reserva creada exitosamente" });
  } catch (error) {
    console.error("Error al crear reserva:", error);
    res.status(500).json({ error: "Error al crear la reserva" });
  }
};

exports.obtenerTodasLasReservas = async (req, res) => {
  try {
    const [reservas] = await db.query(
      `SELECT r.*, u.nombre AS nombre_cliente
       FROM reserva r
       JOIN usuario u ON r.id_cliente = u.id
       ORDER BY r.fecha_solicitada DESC`
    );

    res.json({ reservas });
  } catch (error) {
    console.error("Error al obtener reservas:", error);
    res.status(500).json({ error: "Error al obtener reservas" });
  }
};

exports.obtenerReservasPorCliente = async (req, res) => {
  const { id_cliente } = req.params;

  try {
    const [reservas] = await db.query(
      `SELECT * FROM reserva
       WHERE id_cliente = ?
       ORDER BY fecha_solicitada DESC`,
      [id_cliente]
    );

    res.json({ reservas });
  } catch (error) {
    console.error("Error al obtener reservas por cliente:", error);
    res.status(500).json({ error: "Error al obtener reservas del cliente" });
  }
};

// Obtener reservas filtrando por fecha (ejemplo: fecha actual)
exports.obtenerReservasPorFecha = async (req, res) => {
  const { fecha } = req.query; // fecha: 'YYYY-MM-DD'

  if (!fecha) {
    return res.status(400).json({ error: "Falta la fecha para filtrar" });
  }

  const CAPACIDAD_MAXIMA = 50; // Total de espacios disponibles

  try {
    // Obtener reservas del día
    const [reservas] = await db.query(
      `SELECT r.*, u.nombre AS nombre_cliente
   FROM reserva r
   JOIN usuario u ON r.id_cliente = u.id
   WHERE r.fecha_solicitada LIKE ?
   ORDER BY r.hora_llegada ASC`,
      [`${fecha}%`] // así matchea '2025-06-09' o '2025-06-09 10:00' etc.
    );

    // 👇 Log para ver en consola lo que se obtuvo
    console.log(`Reservas para la fecha ${fecha}:`, reservas);

    const ocupados = reservas.length;
    const disponibles = CAPACIDAD_MAXIMA - ocupados;

    const reservasLimitadas = reservas.slice(0, CAPACIDAD_MAXIMA);

    res.json({
      fecha,
      capacidad_total: CAPACIDAD_MAXIMA,
      ocupados,
      disponibles,
      reservas: reservasLimitadas,
    });
  } catch (error) {
    console.error("Error al obtener reservas por fecha:", error);
    res.status(500).json({ error: "Error al obtener reservas por fecha" });
  }
};

// Obtener conteo de reservas para estacionamiento
exports.obtenerConteoReservas = async (req, res) => {
  const { fecha } = req.query;
  const CAPACIDAD_MAXIMA = 50;

  if (!fecha) {
    return res.status(400).json({ error: "Se requiere la fecha para obtener el conteo" });
  }

  try {
    const [result] = await db.query(
      `SELECT COUNT(*) as total FROM reserva 
       WHERE fecha_solicitada LIKE ? 
       AND duracion_estimada IS NOT NULL
       AND estado != 'cancelada'`,
      [`${fecha}%`]
    );

    const ocupados = result[0].total;
    const disponibles = Math.max(0, CAPACIDAD_MAXIMA - ocupados);

    console.log('Conteo reservas:', {
      capacidad_total: CAPACIDAD_MAXIMA,
      ocupados,
      disponibles,
      fecha,
    });

    res.json({
      capacidad_total: CAPACIDAD_MAXIMA,
      ocupados,
      disponibles,
      fecha,
    });
  } catch (error) {
    console.error("Error al obtener conteo de reservas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};


// Obtener todas las reservas
exports.obtenerTodasLasReservas = async (req, res) => {
  try {
    const [reservas] = await db.query(
      `SELECT r.*, u.nombre as nombre_cliente
             FROM reserva r
             JOIN usuario u ON r.id_cliente = u.id
             ORDER BY r.fecha_solicitada DESC, r.hora_llegada DESC`
    );

    res.json({ reservas });
  } catch (error) {
    console.error("Error al obtener reservas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Buscar reservas con filtros
exports.buscarReservas = async (req, res) => {
  const { nombre, servicio, pago } = req.query;

  try {
    let query = `
            SELECT r.*, u.nombre as nombre_cliente
            FROM reserva r
            JOIN usuario u ON r.id_cliente = u.id
            WHERE 1=1
        `;

    const params = [];

    if (nombre) {
      query += ` AND u.nombre LIKE ?`;
      params.push(`%${nombre}%`);
    }

    if (servicio === "carwash") {
      query += ` AND r.tipo_vehiculo IS NOT NULL`;
    } else if (servicio === "parking") {
      query += ` AND r.duracion_estimada IS NOT NULL`;
    } else if (servicio === "both") {
      query += ` AND r.tipo_vehiculo IS NOT NULL AND r.duracion_estimada IS NOT NULL`;
    }

    if (pago === "paid") {
      query += ` AND r.estado_pago = 'completado'`;
    } else if (pago === "unpaid") {
      query += ` AND (r.estado_pago IS NULL OR r.estado_pago != 'completado')`;
    }

    query += ` ORDER BY r.fecha_solicitada DESC, r.hora_llegada DESC`;

    const [reservas] = await db.query(query, params);
    res.json({ reservas });
  } catch (error) {
    console.error("Error al buscar reservas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Eliminar una reserva
exports.eliminarReserva = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(`DELETE FROM reserva WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    res.json({ message: "Reserva eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar reserva:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Actualizar estado de pago de una reserva
exports.actualizarEstadoPago = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      `UPDATE reserva SET estado = 'completado' WHERE id_reserva = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    res.json({ message: "Estado de pago actualizado a 'completado'" });
  } catch (error) {
    console.error("Error al actualizar estado de pago:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
