//raiz db.js
const mysql = require('mysql');

// Crear conexión
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',     // Reemplaza con tu usuario de MySQL
  password: '',     // Reemplaza con tu contraseña
  database: 'usuarios_db'
});

// Conectar
connection.connect(err => {
  if (err) {
    console.error('Error de conexión:', err);
    return;
  }
  console.log('Conexión exitosa a la base de datos');
});

// Función para ejecutar consultas
function query(sql, params, callback) {
  return connection.query(sql, params, callback);
}

module.exports = {
  connection,
  query
};