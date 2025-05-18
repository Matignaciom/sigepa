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
    const userRole = decodedToken.role;
    console.log(`Obteniendo pagos realizados para el usuario ID: ${userId}, Rol: ${userRole}`);

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

    // Variable para almacenar los resultados
    let resultado = {
      resumen: {
        cantidadPagos: 0,
        fechaUltimoPago: null,
        totalPagado: 0,
        totalTrimestre: 0
      },
      pagosRealizados: []
    };

    try {
      // Consulta para obtener todos los pagos realizados por el usuario
      const pagosQuery = `
        SELECT 
          p.idPago as id,
          p.idGasto,
          p.idParcela,
          gc.concepto,
          gc.tipo,
          p.fechaPago,
          p.montoPagado as monto,
          p.comprobante,
          p.transaccion_id,
          p.descripcion,
          par.nombre as nombreParcela
        FROM Pago p
        JOIN GastoComun gc ON p.idGasto = gc.idGasto
        JOIN Parcela par ON p.idParcela = par.idParcela
        LEFT JOIN GastoParcela gp ON p.idGasto = gp.idGasto AND p.idParcela = gp.idParcela
        WHERE p.idUsuario = ? AND p.estado = 'Pagado'
        ORDER BY p.fechaPago DESC
      `;

      console.log('Ejecutando consulta SQL para pagos realizados:', pagosQuery);
      console.log('Parámetros:', [userId]);
      
      const [pagos] = await connection.execute(pagosQuery, [userId]);
      console.log('Pagos realizados encontrados:', pagos.length, JSON.stringify(pagos));
      
      // Formatear los resultados
      if (pagos.length > 0) {
        // Calcular el resumen
        resultado.resumen.cantidadPagos = pagos.length;
        resultado.resumen.fechaUltimoPago = pagos[0].fechaPago;
        
        // Calcular el total pagado asegurando que sea numérico
        resultado.resumen.totalPagado = pagos.reduce((sum, pago) => {
          const montoNumerico = typeof pago.monto === 'string' ? 
            parseFloat(pago.monto) : pago.monto;
          return sum + montoNumerico;
        }, 0);
        
        // Calcular total pagado en el último trimestre
        const trimestreAtras = new Date();
        trimestreAtras.setMonth(trimestreAtras.getMonth() - 3);
        
        resultado.resumen.totalTrimestre = pagos
          .filter(pago => new Date(pago.fechaPago) >= trimestreAtras)
          .reduce((sum, pago) => {
            const montoNumerico = typeof pago.monto === 'string' ? 
              parseFloat(pago.monto) : pago.monto;
            return sum + montoNumerico;
          }, 0);
        
        // Formatear la lista de pagos realizados
        resultado.pagosRealizados = pagos.map(pago => {
          // Asegurar que los tipos de datos son correctos
          const fechaPago = pago.fechaPago instanceof Date ? 
            pago.fechaPago.toISOString() : pago.fechaPago;
          const monto = typeof pago.monto === 'string' ? 
            parseFloat(pago.monto) : pago.monto;
          
          return {
            id: pago.id,
            idGasto: pago.idGasto,
            idParcela: pago.idParcela,
            concepto: pago.concepto,
            tipo: pago.tipo || 'Cuota Ordinaria', // Valor por defecto en caso de null
            fechaPago: fechaPago,
            monto: monto,
            comprobante: pago.comprobante || '',
            transaccion_id: pago.transaccion_id || '',
            descripcion: pago.descripcion || '',
            nombreParcela: pago.nombreParcela || 'Parcela'
          };
        });
      }
      
      console.log('Resultado final pagos realizados:', JSON.stringify(resultado));
      
      // Si se solicita un comprobante específico
      const idComprobante = event.queryStringParameters?.idComprobante;
      if (idComprobante) {
        console.log('Buscando comprobante específico:', idComprobante);
        
        const comprobanteQuery = `
          SELECT 
            p.idPago as id,
            p.fechaPago,
            p.montoPagado as monto,
            p.comprobante,
            p.transaccion_id,
            p.descripcion,
            gc.concepto,
            gc.tipo,
            par.nombre as nombreParcela,
            u.nombreCompleto as nombreUsuario,
            u.email as emailUsuario
          FROM Pago p
          JOIN GastoParcela gp ON p.idGasto = gp.idGasto AND p.idParcela = gp.idParcela
          JOIN GastoComun gc ON gp.idGasto = gc.idGasto
          JOIN Parcela par ON p.idParcela = par.idParcela
          JOIN Usuario u ON p.idUsuario = u.idUsuario
          WHERE p.idPago = ? AND p.idUsuario = ?
        `;
        
        const [comprobantes] = await connection.execute(comprobanteQuery, [idComprobante, userId]);
        
        if (comprobantes.length > 0) {
          resultado.comprobante = comprobantes[0];
        }
      }
      
    } catch (error) {
      console.error('Error al obtener pagos realizados:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al obtener pagos realizados',
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
        data: resultado
      }),
    };
  } catch (error) {
    console.error('Error general al obtener pagos realizados:', error);
    
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