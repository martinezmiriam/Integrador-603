const db = require('./db');

const registrarUsuario = async (req, res) => {
    const { nombre, numero_telefono, correo_electronico, contrasena } = req.body;

    if (!nombre || !numero_telefono || !correo_electronico || !contrasena) {
        return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
    }

    try {
        const hash = await bcrypt.hash(contrasena, 10);
        const rol = 'cliente'; // Asignamos por defecto el rol 'cliente'

        const query = `
            INSERT INTO usuarios (nombre, numero_telefono, correo_electronico, contrasena)
            VALUES (?, ?, ?, ?, ?)`;

        db.query(query, [nombre, numero_telefono, correo_electronico, hash, rol], (err, result) => {
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

module.exports = registrarUsuario;

