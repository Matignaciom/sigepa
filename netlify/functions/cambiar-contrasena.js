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

// Función para validar la fortaleza de la contraseña
const validatePasswordStrength = (password) => {
  const minLength = 6;
  const maxLength = 50;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);

  if (password.length < minLength) {
    return { isValid: false, message: 'La contraseña debe tener al menos 6 caracteres' };
  }
  
  if (password.length > maxLength) {
    return { isValid: false, message: 'La contraseña no debe exceder los 50 caracteres' };
  }
  
  if (!hasUppercase) {
    return { isValid: false, message: 'La contraseña debe contener al menos una letra mayúscula' };
  }
  
  if (!hasLowercase) {
    return { isValid: false, message: 'La contraseña debe contener al menos una letra minúscula' };
  }
  
  if (!hasDigit) {
    return { isValid: false, message: 'La contraseña debe contener al menos un número' };
  }
  
  return { isValid: true };
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

    const { email, newPassword, confirmPassword } = data;

    // Validar campos requeridos actualizados
    if (!email || !newPassword || !confirmPassword) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Todos los campos son requeridos (email, nueva contraseña y confirmación)' 
        }),
      };
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Formato de correo electrónico inválido' 
        }),
      };
    }

    console.log(`Solicitud de cambio de contraseña para: ${email}`);

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

    // Validar la fortaleza de la contraseña
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: passwordValidation.message 
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

    // Verificar si el usuario existe
    try {
      const [existingUsers] = await connection.execute(
        'SELECT idUsuario FROM Usuario WHERE email = ?',
        [email]
      );
    
      if (existingUsers.length === 0) {
        await connection.end();
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'Usuario no encontrado' 
          }),
        };
      }
    } catch (error) {
      console.error('Error al verificar usuario:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al verificar usuario',
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