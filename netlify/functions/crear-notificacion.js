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

    const { titulo, mensaje, tipo = 'informacion', destinatarios = 'todos', usuariosSeleccionados = [] } = data;

    // Validar que se proporcionen los datos requeridos
    if (!titulo || !mensaje) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'El título y el mensaje son requeridos' 
        }),
      };
    }

    // Validar el tipo de notificación
    const tiposValidos = ['informacion', 'alerta', 'pago', 'sistema'];
    if (!tiposValidos.includes(tipo)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Tipo de notificación no válido' 
        }),
      };
    }

    // Validar los destinatarios
    if (destinatarios !== 'todos' && destinatarios !== 'seleccionados') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Valor de destinatarios no válido' 
        }),
      };
    }

    // Si son destinatarios seleccionados, validar que se hayan proporcionado
    if (destinatarios === 'seleccionados' && (!usuariosSeleccionados || usuariosSeleccionados.length === 0)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Debe seleccionar al menos un usuario' 
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

      const idComunidad = usuario.idComunidad;

      // Si son destinatarios seleccionados, verificar que pertenezcan a la misma comunidad
      if (destinatarios === 'seleccionados' && usuariosSeleccionados.length > 0) {
        const placeholders = usuariosSeleccionados.map(() => '?').join(',');
        const [usuariosVerificados] = await connection.execute(
          `SELECT idUsuario, idComunidad FROM Usuario WHERE idUsuario IN (${placeholders})`,
          usuariosSeleccionados
        );

        // Verificar que todos los usuarios seleccionados existan
        if (usuariosVerificados.length !== usuariosSeleccionados.length) {
          await connection.end();
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, message: 'Uno o más usuarios seleccionados no existen' }),
          };
        }

        // Verificar que todos los usuarios pertenezcan a la misma comunidad que el administrador
        const usuariosOtraComunidad = usuariosVerificados.filter(u => u.idComunidad !== idComunidad);
        if (usuariosOtraComunidad.length > 0) {
          await connection.end();
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ 
              success: false, 
              message: 'No puede enviar notificaciones a usuarios de otras comunidades' 
            }),
          };
        }
      }

      // Iniciar transacción
      await connection.beginTransaction();

      try {
        // Insertar el aviso
        const [resultAviso] = await connection.execute(
          'INSERT INTO Aviso (titulo, contenido, idComunidad, tipo, idAutor, destinatarios) VALUES (?, ?, ?, ?, ?, ?)',
          [titulo, mensaje, idComunidad, tipo, decodedToken.id, destinatarios]
        );

        const idAviso = resultAviso.insertId;

        // Asignar el aviso a los usuarios apropiados
        if (destinatarios === 'todos') {
          // Si es para todos, obtener todos los usuarios de la comunidad
          const [usuariosComunidad] = await connection.execute(
            'SELECT idUsuario FROM Usuario WHERE idComunidad = ?',
            [idComunidad]
          );

          // Crear registros en UsuarioAviso para cada usuario
          if (usuariosComunidad.length > 0) {
            const values = usuariosComunidad.map(u => [u.idUsuario, idAviso]);
            await connection.query(
              'INSERT INTO UsuarioAviso (idUsuario, idAviso) VALUES ?',
              [values]
            );
          }
        } else {
          // Si es para usuarios seleccionados, crear registros solo para ellos
          const values = usuariosSeleccionados.map(idUsuario => [idUsuario, idAviso]);
          await connection.query(
            'INSERT INTO UsuarioAviso (idUsuario, idAviso) VALUES ?',
            [values]
          );
        }

        // Confirmar la transacción
        await connection.commit();

        // Obtener los detalles del aviso creado para devolverlos
        const [avisos] = await connection.execute(
          `SELECT a.idAviso, a.titulo, a.contenido, a.tipo, a.fechaPublicacion, a.destinatarios,
                  u.nombreCompleto as autor
           FROM Aviso a
           JOIN Usuario u ON a.idAutor = u.idUsuario
           WHERE a.idAviso = ?`,
          [idAviso]
        );

        // Obtener lista de destinatarios
        let destinatariosInfo = [];
        if (destinatarios === 'seleccionados') {
          const [usuarios] = await connection.execute(
            `SELECT u.idUsuario, u.nombreCompleto, u.email
             FROM Usuario u
             JOIN UsuarioAviso ua ON u.idUsuario = ua.idUsuario
             WHERE ua.idAviso = ?`,
            [idAviso]
          );
          destinatariosInfo = usuarios;
        }

        await connection.end();
        console.log('Conexión cerrada');

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Notificación creada exitosamente',
            aviso: {
              ...avisos[0],
              destinatariosInfo: destinatarios === 'seleccionados' ? destinatariosInfo : 'Todos los usuarios de la comunidad'
            }
          }),
        };
      } catch (error) {
        // Revertir la transacción en caso de error
        await connection.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error al crear notificación:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al crear la notificación',
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