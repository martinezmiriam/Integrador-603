const express = require('express');
const cors = require('cors');
const path = require('path');

const usuarioRoutes = require('./routes/usuarios.routes');
const createUser = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para permitir CORS
const corsOptions = {
  origin: "http://localhost:3000/", // Permite solicitudes desde este origen
  methods: ["GET", "POST"], // Permite estos métodos
  allowedHeaders: ["Content-Type"], // Permite este encabezado
};

app.use(cors(corsOptions)); // Aquí defines CORS correctamente

// Middleware para manejar JSON
app.use(express.json()); // Solo una vez, aquí

// Middleware para manejar URL-encoded
app.use(express.urlencoded({ extended: true }));

// Rutas de usuarios
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/usuarios', createUser);




// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../fronted')));

// Ruta raíz para verificar que el servidor está funcionando
app.get('/api', (req, res) => {
  res.json({ message: 'Servidor de registro de usuarios activo' });
});

// Ruta para iniciar sesión
app.post('/api/usuarios/login', (req, res) => {
  try {
    const { correo_electronico, contrasena } = req.body;

    // Verificar si los campos están presentes
    if (!correo_electronico || !contrasena) {
      return res.status(400).json({
        success: false,
        message: 'Por favor ingresa correo electrónico y contraseña',
      });
    }

    // Buscar el usuario por correo electrónico
    const user = usuarios.find(user => user.correo === correo_electronico);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    // Verificar la contraseña
    if (user.password !== contrasena) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña incorrecta',
      });
    }

    // Si todo está bien, responder con éxito
    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      user: {
        nombre: user.nombre,
        correo: user.correo,
      },
    });

  } catch (error) {
    console.error('Error en loginUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: error.message,
    });
  }
});



// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
  console.log(`Accede a la aplicación en: http://localhost:${PORT}`);
});
