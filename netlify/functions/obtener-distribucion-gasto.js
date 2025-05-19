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
    console.log(`Administrador ID ${userId} está consultando la distribución de un gasto`);

    // Obtener el ID del gasto de los parámetros de la URL
    const idGasto = event.queryStringParameters?.idGasto;
    
    if (!idGasto) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'El parámetro idGasto es requerido' 
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
      console.log(`Comunidad ID del administrador: ${comunidadId}`);
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

    // Verificar que el gasto pertenezca a la comunidad del administrador
    let gastoInfo;
    try {
      const [gastoData] = await connection.execute(
        `SELECT 
          idGasto, 
          concepto, 
          montoTotal, 
          fechaVencimiento, 
          tipo, 
          estado 
        FROM GastoComun 
        WHERE idGasto = ? AND idComunidad = ?`,
        [idGasto, comunidadId]
      );
    
      if (gastoData.length === 0) {
        await connection.end();
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'Gasto no encontrado o no pertenece a su comunidad' 
          }),
        };
      }
      
      gastoInfo = gastoData[0];
      console.log('Información del gasto obtenida');
    } catch (error) {
      console.error('Error al verificar el gasto:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al verificar el gasto',
          error: error.message 
        }),
      };
    }

    // Obtener la distribución del gasto por parcelas
    let distribucion;
    try {
      const query = `
        SELECT 
          gp.idGasto,
          gp.idParcela,
          p.nombre as nombreParcela,
          u.nombreCompleto as propietario,
          gp.monto_prorrateado,
          gp.estado,
          p.superficie
        FROM GastoParcela gp
        JOIN Parcela p ON gp.idParcela = p.idParcela
        LEFT JOIN Usuario u ON p.idUsuario = u.idUsuario
        WHERE gp.idGasto = ?
        ORDER BY p.nombre
      `;
      
      [distribucion] = await connection.execute(query, [idGasto]);
      
      if (distribucion.length === 0) {
        console.log('No se encontró distribución del gasto');
      } else {
        console.log(`Distribución obtenida: ${distribucion.length} parcelas`);
      }
      
      // Calcular estadísticas de la distribución
      let estadisticas = {
        parcelasAsignadas: distribucion.length,
        montoTotal: gastoInfo.montoTotal,
        montoPagado: 0,
        montoPendiente: 0,
        parcelasPagadas: 0,
        parcelasPendientes: 0
      };
      
      distribucion.forEach(item => {
        if (item.estado === 'Pagado') {
          estadisticas.montoPagado += parseFloat(item.monto_prorrateado);
          estadisticas.parcelasPagadas++;
        } else {
          estadisticas.montoPendiente += parseFloat(item.monto_prorrateado);
          estadisticas.parcelasPendientes++;
        }
      });
      
      // Formatear los datos numéricos
      distribucion = distribucion.map(item => ({
        ...item,
        monto_prorrateado: parseFloat(item.monto_prorrateado),
        superficie: parseFloat(item.superficie || 0)
      }));
      
    } catch (error) {
      console.error('Error al obtener la distribución del gasto:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al obtener la distribución del gasto',
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
        data: {
          gasto: gastoInfo,
          distribucion: distribucion,
          estadisticas: {
            parcelasAsignadas: distribucion.length,
            montoTotal: parseFloat(gastoInfo.montoTotal),
            montoPagado: distribucion.reduce((sum, item) => item.estado === 'Pagado' ? sum + item.monto_prorrateado : sum, 0),
            montoPendiente: distribucion.reduce((sum, item) => item.estado !== 'Pagado' ? sum + item.monto_prorrateado : sum, 0),
            parcelasPagadas: distribucion.filter(item => item.estado === 'Pagado').length,
            parcelasPendientes: distribucion.filter(item => item.estado !== 'Pagado').length
          }
        }
      }),
    };
  } catch (error) {
    console.error('Error general al obtener distribución de gasto:', error);
    
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