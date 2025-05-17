// Importamos las dependencias necesarias
const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config();

// Configuración de la base de datos desde variables de entorno
const dbConfig = {
  host: process.env.DB_HOST || 'sigepa-db-id.cfy6uk6aipzc.us-east-1.rds.amazonaws.com',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || '#SnKKerV!tH4gRf',
  database: process.env.DB_NAME || 'sigepa_db',
  port: parseInt(process.env.DB_PORT || '3306'),
};

// Función para hashear la contraseña con SHA-256
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Para depuración
console.log('Configuración de la DB:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port
});

exports.handler = async (event, context) => {
  // Configurar los headers CORS para permitir solicitudes desde cualquier origen
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  // Verificar que sea una petición POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Método no permitido' }),
    };
  }

  try {
    // Parsear el cuerpo de la solicitud
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

    const { email, oldPassword, newPassword, confirmPassword } = data;

    // Validar que se proporcionen todos los campos requeridos
    if (!email || !oldPassword || !newPassword || !confirmPassword) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Todos los campos son requeridos (email, contraseña actual, nueva contraseña y confirmación)' 
        }),
      };
    }

    // Verificar que la nueva contraseña y la confirmación coincidan
    if (newPassword !== confirmPassword) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'La nueva contraseña y la confirmación no coinciden' 
        }),
      };
    }

    console.log(`Intento de cambio de contraseña para: ${email}`);

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

    // Verificar si el usuario existe y la contraseña actual es correcta
    try {
      const hashedOldPassword = hashPassword(oldPassword);
      
      const [existingUsers] = await connection.execute(
        'SELECT idUsuario FROM Usuario WHERE email = ? AND contrasena = ?',
        [email, hashedOldPassword]
      );

      if (existingUsers.length === 0) {
        await connection.end();
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'Correo electrónico o contraseña actual incorrectos' 
          }),
        };
      }
    } catch (error) {
      console.error('Error al verificar credenciales:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al verificar credenciales',
          error: error.message 
        }),
      };
    }

    // Hashear la nueva contraseña
    const hashedPassword = hashPassword(newPassword);
    console.log('Nueva contraseña hasheada para almacenamiento');

    // Actualizar la contraseña del usuario
    try {
      await connection.execute(
        'UPDATE Usuario SET contrasena = ? WHERE email = ?',
        [hashedPassword, email]
      );
      
      console.log('Contraseña actualizada con éxito para:', email);
    } catch (error) {
      console.error('Error al actualizar contraseña:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al actualizar la contraseña',
          error: error.message 
        }),
      };
    }

    // Cerrar la conexión a la base de datos
    await connection.end();
    console.log('Conexión cerrada');

    // Devolver respuesta exitosa
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      }),
    };
  } catch (error) {
    console.error('Error general en cambio de contraseña:', error);
    
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