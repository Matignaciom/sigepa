// Importamos las dependencias necesarias
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Configuración de la base de datos desde variables de entorno
const dbConfig = {
  host: process.env.DB_HOST || 'sigepa-db-id.cfy6uk6aipzc.us-east-1.rds.amazonaws.com',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || '#SnKKerV!tH4gRf',
  database: process.env.DB_NAME || 'sigepa_db',
  port: parseInt(process.env.DB_PORT || '3306'),
};

// Clave secreta para verificar los tokens JWT
const JWT_SECRET = process.env.JWT_SECRET || 'sigepa_secret_key_development';

exports.handler = async (event, context) => {
  // Configurar los headers CORS para permitir solicitudes desde cualquier origen
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
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

  // Verificar que sea una petición PUT
  if (event.httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Método no permitido' }),
    };
  }

  try {
    // Obtener el token de autorización del header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Token de autenticación no proporcionado o formato inválido' 
        }),
      };
    }
    
    const token = authHeader.split(' ')[1];
    console.log('Token recibido:', token ? 'Sí' : 'No');
    
    // Verificar y decodificar el token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET);
      console.log('Token decodificado:', decodedToken);
    } catch (error) {
      console.error('Error al verificar el token:', error);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Token inválido o expirado',
          error: error.message 
        }),
      };
    }

    // Verificar que el usuario sea un copropietario
    if (decodedToken.role !== 'Copropietario') {
      console.log(`Acceso denegado. Rol esperado: Copropietario, rol obtenido: ${decodedToken.role}`);
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Acceso denegado. Solo los copropietarios pueden editar su perfil usando esta función.' 
        }),
      };
    }

    const userId = decodedToken.id;
    console.log(`Editando perfil para el usuario ID: ${userId}`);

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

    // Extraer los campos del cuerpo
    const { nombreCompleto, email, telefono, direccion } = data;

    // Validar campos requeridos
    if (!nombreCompleto || !email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'El nombre completo y el email son requeridos' 
        }),
      };
    }

    // Validar formato de email
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

    // Verificar si el correo está siendo usado por otro usuario
    if (email) {
      try {
        const [existingUsers] = await connection.execute(
          'SELECT idUsuario FROM Usuario WHERE email = ? AND idUsuario != ?',
          [email, userId]
        );
      
        if (existingUsers.length > 0) {
          await connection.end();
          return {
            statusCode: 409, // Conflict
            headers,
            body: JSON.stringify({ 
              success: false, 
              message: 'El correo electrónico ya está siendo utilizado por otro usuario' 
            }),
          };
        }
      } catch (error) {
        console.error('Error al verificar email:', error);
        await connection.end();
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'Error al verificar correo electrónico',
            error: error.message 
          }),
        };
      }
    }

    // Actualizar los datos del usuario
    try {
      const updateQuery = `
        UPDATE Usuario 
        SET 
          nombreCompleto = ?,
          email = ?,
          telefono = ?,
          direccion = ?
        WHERE idUsuario = ?
      `;
      
      await connection.execute(
        updateQuery,
        [nombreCompleto, email, telefono || null, direccion || null, userId]
      );
      
      console.log(`Perfil actualizado para el usuario ID: ${userId}`);
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al actualizar perfil',
          error: error.message 
        }),
      };
    }

    // Obtener los datos actualizados para devolverlos
    let userData;
    try {
      const [users] = await connection.execute(
        'SELECT idUsuario, nombreCompleto, email, rol, telefono, direccion FROM Usuario WHERE idUsuario = ?',
        [userId]
      );
      
      if (users.length === 0) {
        throw new Error('Usuario no encontrado después de actualización');
      }
      
      userData = users[0];
    } catch (error) {
      console.error('Error al obtener datos actualizados:', error);
      // No retornamos error, ya que la actualización fue exitosa
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
        message: 'Perfil actualizado exitosamente',
        data: userData
      }),
    };
  } catch (error) {
    console.error('Error general al editar perfil:', error);
    
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