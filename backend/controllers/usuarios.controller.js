// backend/controllers/usuarios.controller.js
const db = require('../db'); // o '../db/conexion' si lo tienes en una carpeta
const bcrypt = require('bcrypt');

const registrarUsuario = async (req, res) => {
    const { nombre, numero_telefono, correo_electronico, contrasena } = req.body;

    if (!nombre || !numero_telefono || !correo_electronico || !contrasena) {
        return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
    }

    try {
        const hash = await bcrypt.hash(contrasena, 10);

        const query = `
            INSERT INTO usuarios (nombre, numero_telefono, correo_electronico, contrasena)
            VALUES (?, ?, ?, ?)`;

        db.query(query, [nombre, numero_telefono, correo_electronico, hash], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ mensaje: 'El correo ya está registrado.' });
                }
                return res.status(500).json({ mensaje: 'Error en el servidor.', error: err });
            }
            res.status(201).json({ mensaje: 'Usuario registrado con éxito.', id: result.insertId });
        });
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al encriptar la contraseña.', error: err });
    }
};


const loginUsuario = (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({
      success: false,
      message: 'Por favor ingresa nombre de usuario y contraseña',
    });
  }

  const query = 'SELECT * FROM usuario WHERE usuario = ? LIMIT 1';

  db.query(query, [usuario], async (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error en el servidor', error: err });
    }

    if (results.length === 0) {
      return res.status(400).json({ success: false, message: 'Usuario no encontrado' });
    }

    const user = results[0];

const passwordMatch = password === user.password;

    if (!passwordMatch) {
      return res.status(400).json({ success: false, message: 'Contraseña incorrecta' });
    }

    return res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      user: {
        nombre: user.nombre,
        usuario: user.usuario,
      },
    });
  });
};



// 👇 Esto es lo que asegura que `registrarUsuario` esté disponible en otros archivos
module.exports = { registrarUsuario, loginUsuario };
