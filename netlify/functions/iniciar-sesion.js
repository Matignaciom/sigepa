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

    const { email, password } = data;

    // Validar que se proporcionen email y password
    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Correo electrónico y contraseña son requeridos' 
        }),
      };
    }

    console.log(`Intento de inicio de sesión para: ${email}`);

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

    // Hashear la contraseña para comparar con la almacenada
    const hashedPassword = hashPassword(password);
    console.log('Contraseña hasheada para comparación');

    // Consulta para buscar al usuario
    let users;
    try {
      // Corregir los nombres de columnas para que coincidan con la estructura de la tabla Usuario
      const query = 'SELECT idUsuario AS id, nombreCompleto, email, rol, idComunidad FROM Usuario WHERE email = ? AND contrasena = ?';
      console.log('Ejecutando consulta:', query);
      console.log('Parámetros:', [email, hashedPassword]);
      
      [users] = await connection.execute(
        query,
        [email, hashedPassword]
      );
      
      console.log('Resultado de la consulta:', users.length > 0 ? 'Usuario encontrado' : 'Usuario no encontrado');
    } catch (error) {
      console.error('Error al ejecutar la consulta:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al buscar el usuario',
          error: error.message 
        }),
      };
    }

    // Cerrar la conexión a la base de datos
    await connection.end();
    console.log('Conexión cerrada');

    // Verificar si se encontró un usuario
    if (!users || users.length === 0) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Credenciales inválidas' 
        }),
      };
    }

    const user = users[0];
    console.log('Usuario autenticado:', user.email);

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
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Inicio de sesión exitoso',
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
    console.error('Error general en inicio de sesión:', error);
    
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