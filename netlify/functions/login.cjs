const pool = require('./db');
const crypto = require('crypto');

module.exports.handler = async (event, context) => {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Manejar preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Solo permitir método POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Método no permitido' })
    };
  }

  try {
    console.log('Body recibido:', event.body);
    const { email, password } = JSON.parse(event.body);

    // Validación más estricta de datos de entrada
    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Email y contraseña son requeridos' })
      };
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Formato de email inválido' })
      };
    }

    // Validar longitud mínima de contraseña
    if (password.length < 8) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'La contraseña debe tener al menos 8 caracteres' })
      };
    }

    // Hash de la contraseña usando SHA2 (256 bits)
    const hashedPassword = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    // Buscar usuario en la base de datos usando el pool
    const [user] = await pool.query(
      'SELECT idUsuario, nombreCompleto, email, rol, idComunidad FROM Usuario WHERE email = ? AND contrasena = ?',
      [email, hashedPassword]
    );

    if (!user || user.length === 0) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'Credenciales incorrectas' })
      };
    }

    // Generar token JWT (en producción usar una librería como jsonwebtoken)
    const token = crypto.randomBytes(32).toString('hex');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        token,
        user: {
          id: user[0].idUsuario,
          nombreCompleto: user[0].nombreCompleto,
          email: user[0].email,
          rol: user[0].rol,
          idComunidad: user[0].idComunidad
        }
      })
    };

  } catch (error) {
    console.error('Error en login:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
}; 