const db = require('../db');

exports.createUser = (req, res) => {
    const { nombre, telefono, usuario, password } = req.body;

    const query = 'INSERT INTO usuario (nombre, telefono, usuario, password) VALUES (?, ?, ?, ?)';
    db.query(query, [nombre, telefono, usuario, password], (err, _result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'usuario_existente' });
            }
            return res.status(500).json({ error: 'conexion' });
        }

        res.status(200).json({ message: 'registro exitoso' });
    });
};
