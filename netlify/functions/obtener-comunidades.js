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
    // Obtener todas las comunidades
    const [rows] = await pool.query(
      'SELECT idComunidad, nombre FROM Comunidad ORDER BY nombre'
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        comunidades: rows
      })
    };
  } catch (error) {
    console.error('Error al obtener comunidades:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Error al obtener las comunidades'
      })
    };
  }
}; 