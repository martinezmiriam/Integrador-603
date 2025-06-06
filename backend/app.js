// Servidor Node.js simple para manejar el registro de usuarios
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();
const port = 3000;


// Configuración para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',        // Cambia esto por tu usuario de MySQL
  password: '', // Cambia esto por tu contraseña de MySQL
  database: 'usuarios_db'  // Cambia esto por el nombre de tu base de datos
};

// Conexión a la base de datos
async function connectDB() {
  try {
    return await mysql.createConnection(dbConfig);
  } catch (err) {
    console.error('Error al conectar a la base de datos:', err);
    throw err;
  }
}

// Endpoint para registrar usuario
app.post('/api/register', async (req, res) => {
  const { nombre, telefono, usuario, password } = req.body;
  
  // Validar que todos los campos estén presentes
  if (!nombre || !telefono || !usuario || !password) {
    return res.status(400).json({ 
      error: true, 
      message: 'Todos los campos son obligatorios' 
    });
  }
  
  // Validar formato de contraseña
  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[.\-?]).{10,12}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ 
      error: true, 
      message: 'La contraseña debe tener entre 10-12 caracteres, incluir mayúsculas, minúsculas, números y al menos un símbolo (., -, ?)' 
    });
  }
  
  try {
    // Conectar a la base de datos
    const connection = await connectDB();
    
    // Verificar si el usuario ya existe
    const [existingUsers] = await connection.execute(
      'SELECT * FROM usuarios WHERE email = ?', 
      [usuario]
    );
    
    if (existingUsers.length > 0) {
      await connection.end();
      return res.status(409).json({ 
        error: true, 
        message: 'Este correo electrónico ya está registrado' 
      });
    }
    
    // Hash de la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insertar el nuevo usuario
    await connection.execute(
      'INSERT INTO usuarios (nombre, telefono, email, password) VALUES (?, ?, ?, ?)',
      [nombre, telefono, usuario, hashedPassword]
    );
    
    // Cerrar la conexión
    await connection.end();
    
    // Responder con éxito
    res.status(201).json({ 
      error: false, 
      message: 'Usuario registrado exitosamente' 
    });
    
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ 
      error: true, 
      message: 'Error del servidor al registrar el usuario' 
    });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${port}`);
});