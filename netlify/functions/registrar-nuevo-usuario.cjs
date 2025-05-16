const pool = require('./db');
const crypto = require('crypto');

exports.handler = async (event, context) => {
  // Solo permitir método POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Método no permitido' })
    };
  }

  try {
    const { nombreCompleto, email, password, rut, comunidad, rol } = JSON.parse(event.body);

    // Validar datos de entrada
    if (!nombreCompleto || !email || !password || !rut || !comunidad || !rol) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Todos los campos son requeridos' })
      };
    }

    // Verificar si el email ya existe
    const [existingUser] = await pool.query(
      'SELECT idUsuario FROM Usuario WHERE email = ?',
      [email]
    );

    if (existingUser && existingUser.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'El email ya está registrado' })
      };
    }

    // Hash de la contraseña y RUT
    const hashedPassword = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    const hashedRut = crypto
      .createHash('sha256')
      .update(rut)
      .digest('hex');

    // Obtener idComunidad
    const [comunidadResult] = await pool.query(
      'SELECT idComunidad FROM Comunidad WHERE nombre = ?',
      [comunidad]
    );

    if (!comunidadResult || comunidadResult.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Comunidad no encontrada' })
      };
    }

    const idComunidad = comunidadResult[0].idComunidad;

    // Insertar nuevo usuario
    const [result] = await pool.query(
      'INSERT INTO Usuario (nombreCompleto, email, contrasena, rol, rut, idComunidad) VALUES (?, ?, ?, ?, ?, ?)',
      [nombreCompleto, email, hashedPassword, rol, hashedRut, idComunidad]
    );

    // Generar token JWT
    const token = crypto.randomBytes(32).toString('hex');

    return {
      statusCode: 200,
      body: JSON.stringify({
        token,
        user: {
          id: result.insertId,
          nombreCompleto,
          email,
          rol,
          idComunidad
        }
      })
    };

  } catch (error) {
    console.error('Error en registro:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error interno del servidor' })
    };
  }
}; 