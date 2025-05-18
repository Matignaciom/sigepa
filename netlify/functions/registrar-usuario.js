// Importamos las dependencias necesarias
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
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

// Clave secreta para firmar los tokens JWT
const JWT_SECRET = process.env.JWT_SECRET || 'sigepa_secret_key_development';

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

    const { nombreCompleto, email, password, rut, comunidad, rol = 'Copropietario' } = data;

    // Validar que se proporcionen todos los campos requeridos
    if (!nombreCompleto || !email || !password || !rut || !comunidad) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Todos los campos son requeridos (nombre, email, contraseña, RUT y comunidad)' 
        }),
      };
    }

    // Limpiar el RUT (eliminar puntos y guiones)
    const rutLimpio = rut.replace(/[.-]/g, '');

    console.log(`Intento de registro para: ${email}`);

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

    // Verificar si el correo ya está registrado
    try {
      const [existingUsers] = await connection.execute(
        'SELECT email FROM Usuario WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0) {
        await connection.end();
        return {
          statusCode: 409, // Conflict
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'El correo electrónico ya está registrado',
            errorCode: 'EMAIL_ALREADY_EXISTS'
          }),
        };
      }
    } catch (error) {
      console.error('Error al verificar usuario existente:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al verificar usuario existente',
          error: error.message 
        }),
      };
    }

    // Hashear la contraseña para almacenarla
    const hashedPassword = hashPassword(password);
    console.log('Contraseña hasheada para almacenamiento');

    // Insertar el nuevo usuario
    let result;
    try {
      const query = `
        INSERT INTO Usuario (nombreCompleto, email, contrasena, rut, rol, idComunidad) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      [result] = await connection.execute(
        query,
        [nombreCompleto, email, hashedPassword, rutLimpio, rol, comunidad]
      );
      
      console.log('Usuario registrado con éxito. ID:', result.insertId);
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al registrar usuario',
          error: error.message 
        }),
      };
    }

    // Obtener los datos del usuario recién creado
    let users;
    try {
      const query = 'SELECT idUsuario AS id, nombreCompleto, email, rol, idComunidad FROM Usuario WHERE idUsuario = ?';
      [users] = await connection.execute(query, [result.insertId]);
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Usuario registrado pero error al obtener sus datos',
          error: error.message 
        }),
      };
    }

    // Cerrar la conexión a la base de datos
    await connection.end();
    console.log('Conexión cerrada');

    const user = users[0];

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.rol 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Token JWT generado');

    // Devolver respuesta exitosa con token y datos del usuario
    return {
      statusCode: 201, // Created
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Usuario registrado exitosamente',
        token,
        user: {
          id: user.id,
          nombreCompleto: user.nombreCompleto,
          email: user.email,
          rol: user.rol,
          idComunidad: user.idComunidad
        }
      }),
    };
  } catch (error) {
    console.error('Error general en registro de usuario:', error);
    
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