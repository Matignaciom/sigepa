// Importamos las dependencias necesarias
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos desde variables de entorno
const dbConfig = {
  host: process.env.DB_HOST || 'sigepa-db-id.cfy6uk6aipzc.us-east-1.rds.amazonaws.com',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || '#SnKKerV!tH4gRf',
  database: process.env.DB_NAME || 'sigepa_db',
  port: parseInt(process.env.DB_PORT || '3306'),
};

exports.handler = async (event, context) => {
  // Configurar los headers CORS para permitir solicitudes desde cualquier origen
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Manejar la solicitud OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Preflight exitoso' }),
    };
  }

  // Verificar que sea una petición GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Método no permitido' }),
    };
  }

  try {
    // Obtener el ID de la comunidad de los query parameters
    const idComunidad = event.queryStringParameters?.idComunidad || 2; // Por defecto, comunidad 2

    console.log(`Obteniendo usuarios de la comunidad: ${idComunidad}`);

    // Conectar a la base de datos
    let connection;
    try {
      connection = await mysql.createConnection(dbConfig);
      console.log('Conexión a la base de datos establecida');
    } catch (error) {
      console.error('Error al conectar a la base de datos:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al conectar a la base de datos',
          error: error.message 
        }),
      };
    }

    // Consulta para obtener los usuarios de la comunidad
    let usuarios;
    try {
      const query = `
        SELECT idUsuario, nombreCompleto, email, rol 
        FROM Usuario 
        WHERE idComunidad = ?
        ORDER BY nombreCompleto
      `;
      
      [usuarios] = await connection.execute(query, [idComunidad]);
      
      console.log(`Usuarios de la comunidad ${idComunidad} obtenidos:`, usuarios.length);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al obtener los usuarios',
          error: error.message 
        }),
      };
    }

    // Cerrar la conexión a la base de datos
    await connection.end();
    console.log('Conexión cerrada');

    // Devolver respuesta exitosa con la lista de usuarios
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Usuarios obtenidos exitosamente',
        usuarios: usuarios
      }),
    };
  } catch (error) {
    console.error('Error general al obtener usuarios:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        message: 'Error interno del servidor',
        error: error.message 
      }),
    };
  }
}; 