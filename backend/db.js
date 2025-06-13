const mysql = require('mysql2/promise');
const { URL } = require('url');

// Supón que la URL está en variable de entorno DB_URL
const dbUrl = process.env.BD_URL; // ✅ nombre correcto de la variable

// Parsear la URL
const url = new URL(dbUrl);

const pool = mysql.createPool({
  host: url.hostname,
  user: url.username,
  password: url.password,
  database: url.pathname.replace(/^\//, ''), // quitar la barra inicial
  port: url.port || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Prueba conexión igual que antes...
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Conexión exitosa a la base de datos');
    connection.release();
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error.message);
  }
}

testConnection();

module.exports = pool;
