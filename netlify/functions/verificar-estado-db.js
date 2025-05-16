const pool = require('./db');

exports.handler = async (event, context) => {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Manejar solicitudes OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Intentar conectar a la base de datos
    const connection = await pool.getConnection();
    
    try {
      // Realizar una consulta simple para verificar la conexión
      await connection.query('SELECT 1');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Conexión a la base de datos establecida correctamente'
        })
      };
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error al verificar la conexión:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Error al conectar con la base de datos'
      })
    };
  }
}; 