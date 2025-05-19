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

    // Verificar que el usuario sea un administrador
    if (decodedToken.role !== 'Administrador') {
      console.log(`Acceso denegado. Rol esperado: Administrador, rol obtenido: ${decodedToken.role}`);
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Acceso denegado. Esta función es solo para administradores.' 
        }),
      };
    }

    const userId = decodedToken.id;
    console.log(`Obteniendo información de comunidad para el administrador ID: ${userId}`);

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

    // Obtener el ID de la comunidad asociada al administrador
    let comunidadId;
    try {
      const [adminData] = await connection.execute(
        'SELECT idComunidad FROM Usuario WHERE idUsuario = ? AND rol = "Administrador"',
        [userId]
      );
    
      if (adminData.length === 0) {
        await connection.end();
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'No se encontró el administrador o no tiene comunidad asignada' 
          }),
        };
      }
      
      comunidadId = adminData[0].idComunidad;
      console.log(`Consultando información para la comunidad ID: ${comunidadId}`);
    } catch (error) {
      console.error('Error al obtener comunidad del administrador:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al obtener la comunidad asociada al administrador',
          error: error.message 
        }),
      };
    }

    // Obtener la información detallada de la comunidad
    let comunidadData;
    try {
      const query = `
        SELECT 
          c.idComunidad,
          c.nombre,
          c.fecha_creacion,
          c.direccion_administrativa,
          c.telefono_contacto,
          c.email_contacto,
          c.sitio_web,
          (SELECT COUNT(*) FROM Parcela WHERE idComunidad = c.idComunidad) as total_parcelas,
          (SELECT COUNT(*) FROM Usuario WHERE idComunidad = c.idComunidad) as usuarios_registrados,
          (SELECT COUNT(*) FROM Usuario WHERE idComunidad = c.idComunidad AND rol = 'Copropietario') as total_copropietarios,
          (SELECT COUNT(*) FROM Usuario WHERE idComunidad = c.idComunidad AND rol = 'Administrador') as total_administradores,
          (SELECT COUNT(*) FROM GastoComun WHERE idComunidad = c.idComunidad AND estado = 'Pendiente') as gastos_pendientes,
          (SELECT COUNT(*) FROM GastoComun WHERE idComunidad = c.idComunidad AND fechaVencimiento < CURDATE() AND estado != 'Cerrado') as gastos_vencidos,
          (SELECT SUM(montoTotal) FROM GastoComun WHERE idComunidad = c.idComunidad AND YEAR(fechaVencimiento) = YEAR(CURDATE())) as monto_total_anual,
          (SELECT COUNT(*) FROM GastoParcela gp
           JOIN Parcela p ON gp.idParcela = p.idParcela
           WHERE p.idComunidad = c.idComunidad AND gp.estado = 'Atrasado') as pagos_atrasados,
          (SELECT COUNT(*) FROM Pago pa
           JOIN Parcela p ON pa.idParcela = p.idParcela
           WHERE p.idComunidad = c.idComunidad AND pa.estado = 'Pagado') as pagos_realizados
        FROM Comunidad c
        WHERE c.idComunidad = ?
      `;
      
      const [comunidades] = await connection.execute(query, [comunidadId]);
      
      if (comunidades.length === 0) {
        await connection.end();
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'Comunidad no encontrada' 
          }),
        };
      }
      
      comunidadData = comunidades[0];
      
      // Agregar estadísticas avanzadas a la respuesta
      comunidadData.estadisticas = {
        monto_total_anual: comunidadData.monto_total_anual || 0,
        pagos_atrasados: comunidadData.pagos_atrasados || 0,
        pagos_realizados: comunidadData.pagos_realizados || 0
      };
      
      // Eliminar propiedades redundantes
      delete comunidadData.monto_total_anual;
      delete comunidadData.pagos_atrasados;
      delete comunidadData.pagos_realizados;
      
      console.log('Información de comunidad obtenida');
    } catch (error) {
      console.error('Error al obtener información de la comunidad:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al obtener información de la comunidad',
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
        message: 'Información de la comunidad obtenida exitosamente',
        data: comunidadData
      }),
    };
  } catch (error) {
    console.error('Error general al obtener información de comunidad:', error);
    
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