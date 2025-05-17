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
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
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

  // Verificar que sea una petición DELETE
  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Método no permitido' }),
    };
  }

  try {
    // Verificar autenticación
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: 'No autorizado' }),
      };
    }
    
    const token = authHeader.split(' ')[1];
    let decodedToken;
    
    try {
      decodedToken = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: 'Token inválido' }),
      };
    }

    // Obtener el ID del aviso de los parámetros de la consulta
    const params = event.queryStringParameters;
    const idAviso = params && params.id;

    if (!idAviso) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Se requiere el ID de la notificación' 
        }),
      };
    }

    // Conectar a la base de datos
    const connection = await mysql.createConnection(dbConfig);
    console.log('Conexión a la base de datos establecida');

    try {
      // Verificar que el usuario sea administrador
      const [usuarios] = await connection.execute(
        'SELECT rol, idComunidad FROM Usuario WHERE idUsuario = ?',
        [decodedToken.id]
      );

      if (usuarios.length === 0) {
        await connection.end();
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ success: false, message: 'Usuario no encontrado' }),
        };
      }

      const usuario = usuarios[0];
      if (usuario.rol !== 'Administrador') {
        await connection.end();
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ success: false, message: 'Acceso denegado. Se requiere rol de Administrador' }),
        };
      }

      // Verificar que el aviso exista y pertenezca al administrador
      const [avisos] = await connection.execute(
        'SELECT idAviso, idAutor, titulo FROM Aviso WHERE idAviso = ?',
        [idAviso]
      );

      if (avisos.length === 0) {
        await connection.end();
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ success: false, message: 'Notificación no encontrada' }),
        };
      }

      const aviso = avisos[0];
      
      // Verificar que el administrador sea el autor del aviso
      if (aviso.idAutor !== decodedToken.id) {
        await connection.end();
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ success: false, message: 'No tiene permiso para eliminar esta notificación' }),
        };
      }
      
      // Verificar que la notificación no haya sido leída por ningún usuario
      const [lecturas] = await connection.execute(
        'SELECT COUNT(*) as total FROM UsuarioAviso WHERE idAviso = ? AND leido = 1',
        [idAviso]
      );
      
      if (lecturas[0].total > 0) {
        await connection.end();
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'No se puede eliminar una notificación que ya ha sido leída por los usuarios' 
          }),
        };
      }

      // Iniciar transacción
      await connection.beginTransaction();

      try {
        // La tabla UsuarioAviso tiene una restricción ON DELETE CASCADE,
        // por lo que al eliminar el aviso se eliminarán automáticamente las relaciones
        
        // Eliminar el aviso
        await connection.execute(
          'DELETE FROM Aviso WHERE idAviso = ?',
          [idAviso]
        );

        // Confirmar la transacción
        await connection.commit();

        await connection.end();
        console.log('Conexión cerrada');

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: `Notificación "${aviso.titulo}" eliminada exitosamente`
          }),
        };
      } catch (error) {
        // Revertir la transacción en caso de error
        await connection.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al eliminar la notificación',
          error: error.message 
        }),
      };
    }
  } catch (error) {
    console.error('Error general:', error);
    
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