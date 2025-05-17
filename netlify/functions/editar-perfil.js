// Importamos las dependencias necesarias
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'sigepa-db-id.cfy6uk6aipzc.us-east-1.rds.amazonaws.com',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || '#SnKKerV!tH4gRf',
  database: process.env.DB_NAME || 'sigepa_db',
  port: parseInt(process.env.DB_PORT || '3306'),
};

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Preflight exitoso' }),
    };
  }

  if (event.httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Método no permitido' }),
    };
  }

  try {
    let data;
    try {
      data = JSON.parse(event.body);
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al parsear el cuerpo de la solicitud' 
        }),
      };
    }

    const { idUsuario, nombreCompleto, email, direccion, telefono, rol } = data;

    // Validación básica
    if (!idUsuario || !nombreCompleto || !email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Todos los campos son requeridos' 
        }),
      };
    }

    let connection;
    try {
      connection = await mysql.createConnection(dbConfig);
    } catch (error) {
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

    try {
      // Query actualizado para incluir dirección y teléfono
      const query = 'UPDATE Usuario SET nombreCompleto = ?, email = ?, direccion = ?, telefono = ? WHERE idUsuario = ?';
      const params = [nombreCompleto, email, direccion, telefono, idUsuario];

      await connection.execute(query, params);
    } catch (error) {
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al actualizar el perfil',
          error: error.message 
        }),
      };
    }

    await connection.end();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Perfil actualizado exitosamente'
      }),
    };
  } catch (error) {
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