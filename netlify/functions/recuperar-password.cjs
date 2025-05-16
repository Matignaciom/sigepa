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
    const { email, newPassword } = JSON.parse(event.body);

    // Validar datos de entrada
    if (!email || !newPassword) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Email y nueva contraseña son requeridos' })
      };
    }

    // Verificar si el email existe
    const [user] = await pool.query(
      'SELECT idUsuario FROM Usuario WHERE email = ?',
      [email]
    );

    if (!user || user.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Email no encontrado' })
      };
    }

    // Hash de la nueva contraseña
    const hashedPassword = crypto
      .createHash('sha256')
      .update(newPassword)
      .digest('hex');

    // Actualizar contraseña
    await pool.query(
      'UPDATE Usuario SET contrasena = ? WHERE email = ?',
      [hashedPassword, email]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Contraseña actualizada correctamente' })
    };

  } catch (error) {
    console.error('Error en recuperación de contraseña:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error interno del servidor' })
    };
  }
}; 