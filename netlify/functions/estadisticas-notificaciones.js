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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  // Verificar que sea una petición GET
  if (event.httpMethod !== 'GET') {
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

      // Obtener fecha de inicio del mes actual
      const fechaActual = new Date();
      const inicioMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
      const inicioMesFormatted = inicioMes.toISOString().slice(0, 10);

      // 1. Total de notificaciones enviadas por el administrador
      const [totalNotificaciones] = await connection.execute(
        `SELECT COUNT(*) AS total FROM Aviso 
        WHERE idAutor = ? AND idComunidad = ?`,
        [decodedToken.id, idComunidad]
      );

      // 2. Total de notificaciones enviadas este mes
      const [notificacionesMes] = await connection.execute(
        `SELECT COUNT(*) AS total FROM Aviso 
        WHERE idAutor = ? AND idComunidad = ? AND fechaPublicacion >= ?`,
        [decodedToken.id, idComunidad, inicioMesFormatted]
      );

      // 3. Tasa de apertura (porcentaje de notificaciones leídas)
      const [tasaApertura] = await connection.execute(
        `SELECT 
          COUNT(DISTINCT ua.idAviso) AS avisos_leidos,
          COUNT(DISTINCT a.idAviso) AS total_avisos,
          IFNULL(COUNT(DISTINCT ua.idAviso) / COUNT(DISTINCT a.idAviso) * 100, 0) AS tasa
        FROM Aviso a
        LEFT JOIN UsuarioAviso ua ON a.idAviso = ua.idAviso AND ua.leido = 1
        WHERE a.idAutor = ? AND a.idComunidad = ?`,
        [decodedToken.id, idComunidad]
      );

      // 4. Tiempo promedio de respuesta
      const [tiempoRespuesta] = await connection.execute(
        `SELECT 
          AVG(TIMESTAMPDIFF(HOUR, a.fechaPublicacion, ua.fechaRespuesta)) AS promedio_horas
        FROM Aviso a
        JOIN UsuarioAviso ua ON a.idAviso = ua.idAviso
        WHERE a.idAutor = ? AND a.idComunidad = ? AND ua.respondido = 1 AND ua.fechaRespuesta IS NOT NULL`,
        [decodedToken.id, idComunidad]
      );

      // 5. Estadísticas por tipo de notificación
      const [estadisticasTipo] = await connection.execute(
        `SELECT 
          tipo,
          COUNT(*) AS total,
          SUM(CASE WHEN fechaPublicacion >= ? THEN 1 ELSE 0 END) AS total_mes
        FROM Aviso
        WHERE idAutor = ? AND idComunidad = ?
        GROUP BY tipo`,
        [inicioMesFormatted, decodedToken.id, idComunidad]
      );

      // 6. Notificaciones más recientes
      const [notificacionesRecientes] = await connection.execute(
        `SELECT 
          a.idAviso, a.titulo, a.fechaPublicacion, a.tipo,
          COUNT(ua.idUsuario) AS total_destinatarios,
          SUM(CASE WHEN ua.leido = 1 THEN 1 ELSE 0 END) AS total_leidas,
          SUM(CASE WHEN ua.respondido = 1 THEN 1 ELSE 0 END) AS total_respondidas
        FROM Aviso a
        LEFT JOIN UsuarioAviso ua ON a.idAviso = ua.idAviso
        WHERE a.idAutor = ? AND a.idComunidad = ?
        GROUP BY a.idAviso, a.titulo, a.fechaPublicacion, a.tipo
        ORDER BY a.fechaPublicacion DESC
        LIMIT 5`,
        [decodedToken.id, idComunidad]
      );

      await connection.end();
      console.log('Conexión cerrada');

      // Calcular tasa de apertura formateada
      const tasaAperturaValue = tasaApertura[0].total_avisos > 0 
        ? Math.round(tasaApertura[0].tasa) 
        : 0;

      // Calcular tiempo promedio de respuesta formateado
      const tiempoRespuestaValue = tiempoRespuesta[0].promedio_horas
        ? parseFloat(tiempoRespuesta[0].promedio_horas).toFixed(1)
        : 0;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          estadisticas: {
            total: {
              enviadas: totalNotificaciones[0].total,
              este_mes: notificacionesMes[0].total
            },
            tasa_apertura: tasaAperturaValue,
            tiempo_respuesta: tiempoRespuestaValue,
            por_tipo: estadisticasTipo,
            recientes: notificacionesRecientes
          },
          mensaje: `Notificaciones enviadas: ${totalNotificaciones[0].total} (${notificacionesMes[0].total} este mes)\nTasa de apertura: ${tasaAperturaValue}%\nTiempo de respuesta promedio: ${tiempoRespuestaValue}h`
        }),
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al obtener estadísticas de notificaciones',
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