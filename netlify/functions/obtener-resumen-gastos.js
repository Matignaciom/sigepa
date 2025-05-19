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
    console.log(`Obteniendo resumen de gastos para el administrador ID: ${userId}`);

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
      console.log(`Consultando resumen de gastos para la comunidad ID: ${comunidadId}`);
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

    // Obtener estadísticas de gastos
    let resumenGastos = {
      totalGastos: 0,
      montoTotal: 0,
      gastosActivos: 0,
      gastosPendientes: 0,
      gastosCerrados: 0,
      pagosRecibidos: 0,
      montoPagado: 0,
      montoPendiente: 0
    };

    try {
      // 1. Obtener conteo de gastos y montos totales
      const totalesQuery = `
        SELECT 
          COUNT(*) as totalGastos,
          SUM(montoTotal) as montoTotal,
          SUM(CASE WHEN estado = 'Activo' THEN 1 ELSE 0 END) as gastosActivos,
          SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) as gastosPendientes,
          SUM(CASE WHEN estado = 'Cerrado' THEN 1 ELSE 0 END) as gastosCerrados
        FROM GastoComun
        WHERE idComunidad = ?
      `;
      
      const [totalesResult] = await connection.execute(totalesQuery, [comunidadId]);
      
      if (totalesResult.length > 0) {
        resumenGastos.totalGastos = totalesResult[0].totalGastos || 0;
        resumenGastos.montoTotal = parseFloat(totalesResult[0].montoTotal || 0);
        resumenGastos.gastosActivos = totalesResult[0].gastosActivos || 0;
        resumenGastos.gastosPendientes = totalesResult[0].gastosPendientes || 0;
        resumenGastos.gastosCerrados = totalesResult[0].gastosCerrados || 0;
      }
      
      // 2. Obtener información de pagos
      const pagosQuery = `
        SELECT 
          COUNT(DISTINCT p.idPago) as pagosRecibidos,
          SUM(p.montoPagado) as montoPagado
        FROM Pago p
        JOIN Parcela par ON p.idParcela = par.idParcela
        WHERE par.idComunidad = ? AND p.estado = 'Pagado'
      `;
      
      const [pagosResult] = await connection.execute(pagosQuery, [comunidadId]);
      
      if (pagosResult.length > 0) {
        resumenGastos.pagosRecibidos = pagosResult[0].pagosRecibidos || 0;
        resumenGastos.montoPagado = parseFloat(pagosResult[0].montoPagado || 0);
      }
      
      // 3. Calcular monto pendiente
      const pendienteQuery = `
        SELECT 
          SUM(gp.monto_prorrateado) as montoPendiente
        FROM GastoParcela gp
        JOIN Parcela p ON gp.idParcela = p.idParcela
        WHERE p.idComunidad = ? AND gp.estado != 'Pagado'
      `;
      
      const [pendienteResult] = await connection.execute(pendienteQuery, [comunidadId]);
      
      if (pendienteResult.length > 0) {
        resumenGastos.montoPendiente = parseFloat(pendienteResult[0].montoPendiente || 0);
      }
      
      console.log('Resumen de gastos obtenido:', resumenGastos);
    } catch (error) {
      console.error('Error al obtener estadísticas de gastos:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al obtener estadísticas de gastos',
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
        data: resumenGastos
      }),
    };
  } catch (error) {
    console.error('Error general al obtener resumen de gastos:', error);
    
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