const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'autolavado_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Función para probar conexión
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Conexión exitosa a la base de datos');
    connection.release(); // liberá la conexión al pool
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error.message);
  }
}

// Ejecutamos la prueba al cargar el módulo
testConnection();

module.exports = pool;
