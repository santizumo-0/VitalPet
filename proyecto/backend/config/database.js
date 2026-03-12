// ===================================
// CONEXIÓN A BASE DE DATOS MYSQL
// ===================================

const mysql = require('mysql2');
require('dotenv').config();

// Crear pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Manejo de errores
pool.on('error', (err) => {
  console.error('❌ Error en la conexión a la BD:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('La conexión a la BD fue perdida.');
  }
  if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
    console.error('Fatal error en la BD. Nueva conexión rechazada.');
  }
  if (err.code === 'PROTOCOL_ENQUEUE_AFTER_DESTROY') {
    console.error('La conexión a la BD fue destruida.');
  }
});

// Convertir callbacks a promesas para usar async/await
const poolPromise = pool.promise();

// Prueba de conexión
poolPromise.getConnection()
  .then(connection => {
    console.log('✅ Conexión a la BD exitosa');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Error al conectar a la BD:', err);
  });

// Exportar el pool
module.exports = poolPromise;
