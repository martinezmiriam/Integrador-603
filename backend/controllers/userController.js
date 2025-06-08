const db = require("../db"); // tu conexión a MySQL
const bcrypt = require("bcryptjs");

// Registrar usuario
exports.registerUser = async (req, res) => {
  const { nombre, correo, telefono, password } = req.body;

  // Verifica campos vacíos o undefined
  if (!nombre || !correo || !telefono || !password) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO usuario (nombre, correo, telefono, password) VALUES (?, ?, ?, ?)',
      [nombre, correo, telefono, hashedPassword]
    );
    res.status(201).json({ message: 'Usuario registrado con éxito', id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Correo ya registrado' });
    }
    console.error("Error detallado:", error); // <-- esto es clave para debug
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};


const jwt = require("jsonwebtoken");

// Clave fija para desarrollo (NO usar en producción)
const JWT_SECRET = "dev_secret_super_simple_123";

// Login de usuario
exports.loginUser = async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ message: "Correo y contraseña son obligatorios" });
  }

  try {
    const [rows] = await db.execute("SELECT * FROM usuario WHERE correo = ?", [correo]);
    if (rows.length === 0) 
      return res.status(401).json({ message: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(password, rows[0].password);
    if (!isMatch) 
      return res.status(401).json({ message: "Contraseña incorrecta" });

    const esAdmin = (correo || "").toLowerCase().includes("admin");

    // Generar JWT con payload mínimo
    const token = jwt.sign(
      { id: rows[0].id, correo: rows[0].correo, esAdmin }, 
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Inicio de sesión exitoso",
      user: rows[0],
      esAdmin,
      token,  // <-- enviamos el token al cliente
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error en el login" });
  }
};

// Obtener datos de usuario por ID
exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.execute('SELECT id, nombre, correo, telefono FROM usuario WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};


// Actualizar datos de usuario
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { nombre, correo, telefono, password } = req.body;

  try {
    // Verificar si usuario existe
    const [existingUser] = await db.execute('SELECT * FROM usuario WHERE id = ?', [id]);
    if (existingUser.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Actualizar password solo si viene en la petición
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Construir query dinámica para actualizar solo campos recibidos
    let query = "UPDATE usuario SET nombre = ?, correo = ?, telefono = ?";
    let params = [nombre, correo, telefono];

    if (hashedPassword) {
      query += ", password = ?";
      params.push(hashedPassword);
    }

    query += " WHERE id = ?";
    params.push(id);

    await db.execute(query, params);

    res.json({ message: "Usuario actualizado correctamente" });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "El correo ya está en uso" });
    }
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

