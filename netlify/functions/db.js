const mysql = require('mysql2/promise');

// Configuración del pool de conexiones usando variables de entorno
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'sigepa_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Exportar el pool para usarlo en las funciones
module.exports = pool; 