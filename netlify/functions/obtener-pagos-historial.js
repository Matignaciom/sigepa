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

    const userId = decodedToken.id;
    console.log(`Obteniendo historial de pagos para el usuario ID: ${userId}`);

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

    // Obtener historial de pagos
    let historialPagos;
    try {
      // Consulta para obtener todos los pagos históricos (realizados y pendientes)
      const query = `
        SELECT 
          p.idPago as id,
          p.montoPagado,
          p.fechaPago,
          p.estado,
          p.comprobante,
          p.descripcion,
          gc.concepto,
          gc.tipo,
          par.nombre as nombreParcela
        FROM Pago p
        JOIN GastoComun gc ON p.idGasto = gc.idGasto
        JOIN Parcela par ON p.idParcela = par.idParcela
        WHERE p.idUsuario = ?
        ORDER BY p.fechaPago DESC
      `;
      
      console.log('Ejecutando consulta:', query);
      console.log('Parámetros:', [userId]);
      
      [historialPagos] = await connection.execute(query, [userId]);
      
      console.log('Pagos obtenidos:', historialPagos.length);
    } catch (error) {
      console.error('Error al obtener historial de pagos:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al obtener historial de pagos',
          error: error.message 
        }),
      };
    }

    // Formatear los resultados
    const pagosFormateados = historialPagos.map(pago => ({
      id: pago.id,
      montoPagado: parseFloat(pago.montoPagado || 0),
      fechaPago: pago.fechaPago,
      estado: pago.estado,
      comprobante: pago.comprobante,
      descripcion: pago.descripcion,
      concepto: pago.concepto,
      tipo: pago.tipo,
      nombreParcela: pago.nombreParcela
    }));

    // Cerrar la conexión a la base de datos
    await connection.end();
    console.log('Conexión cerrada');

    // Devolver respuesta exitosa
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: pagosFormateados
      }),
    };
  } catch (error) {
    console.error('Error general al obtener historial de pagos:', error);
    
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