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
       WHERE r.fecha_solicitada = ?
       ORDER BY r.hora_llegada ASC`,
      [fecha]
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
