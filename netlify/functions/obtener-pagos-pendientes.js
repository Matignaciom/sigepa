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
    console.log(`Obteniendo pagos pendientes para el usuario ID: ${userId}, Rol: ${userRole}`);

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
      proximoVencimiento: {
        fecha: null,
        concepto: "No hay próximos vencimientos",
        tipo: "",
        monto: 0
      },
      totalPendiente: {
        monto: 0,
        cantidadCuotas: 0
      },
      pagosPendientes: []
    };

    try {
      // Obtener las parcelas del usuario
      const [parcelas] = await connection.execute(
        'SELECT idParcela FROM Parcela WHERE idUsuario = ?',
        [userId]
      );

      console.log('Parcelas encontradas:', parcelas.length, parcelas);

      if (parcelas.length === 0) {
        // Si no tiene parcelas, devolver la respuesta vacía
        await connection.end();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: resultado
          }),
        };
      }

      // Obtener IDs de parcelas
      const idsParcelas = parcelas.map(p => p.idParcela);
      const parcelasIn = idsParcelas.join(',');

      console.log('IDs de parcelas:', idsParcelas);

      // Consulta modificada para obtener pagos pendientes
      const pagosPendientesQuery = `
        SELECT 
          gp.idGasto,
          gp.idParcela,
          gc.concepto,
          gc.fechaVencimiento,
          gc.tipo,
          gp.monto_prorrateado as monto,
          gp.estado,
          p.nombre as nombreParcela,
          CASE 
            WHEN gc.fechaVencimiento < CURDATE() THEN 'Atrasado'
            WHEN gc.fechaVencimiento <= DATE_ADD(CURDATE(), INTERVAL 10 DAY) THEN 'Próximo'
            ELSE 'Pendiente'
          END as estadoCalculado
        FROM GastoParcela gp
        JOIN GastoComun gc ON gp.idGasto = gc.idGasto
        JOIN Parcela p ON gp.idParcela = p.idParcela
        WHERE gp.idParcela IN (${parcelasIn})
        AND (gp.estado = 'Pendiente' OR gp.estado = 'Atrasado')
        ORDER BY gc.fechaVencimiento ASC
      `;

      console.log('Ejecutando consulta SQL para pagos pendientes:', pagosPendientesQuery);
      const [pagosPendientes] = await connection.execute(pagosPendientesQuery);
      console.log('Pagos pendientes encontrados:', pagosPendientes.length, JSON.stringify(pagosPendientes));
      
      // Si hay pagos pendientes, construir el resultado
      if (pagosPendientes.length > 0) {
        // Ordenar por proximidad de vencimiento (el más cercano primero)
        pagosPendientes.sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));

        // Próximo vencimiento es el primero (el más cercano)
        resultado.proximoVencimiento = {
          fecha: pagosPendientes[0].fechaVencimiento,
          concepto: pagosPendientes[0].concepto,
          tipo: pagosPendientes[0].tipo,
          monto: parseFloat(pagosPendientes[0].monto)
        };

        // Total pendiente - Corregido para asegurar que el monto es numérico
        const montoTotal = pagosPendientes.reduce((sum, pago) => {
          const montoNumerico = typeof pago.monto === 'string' ? 
            parseFloat(pago.monto) : pago.monto;
          return sum + montoNumerico;
        }, 0);
        
        resultado.totalPendiente = {
          monto: montoTotal,
          cantidadCuotas: pagosPendientes.length
        };

        // Formatear la lista de pagos pendientes para la respuesta
        resultado.pagosPendientes = pagosPendientes.map(pago => {
          // Asegurar que la fecha es ISO y el monto es numérico
          const fechaVencimiento = pago.fechaVencimiento instanceof Date ? 
            pago.fechaVencimiento.toISOString() : pago.fechaVencimiento;
          const monto = typeof pago.monto === 'string' ? 
            parseFloat(pago.monto) : pago.monto;
            
          return {
            id: pago.idGasto,
            idGasto: pago.idGasto,
            idParcela: pago.idParcela,
            concepto: pago.concepto,
            fechaVencimiento: fechaVencimiento,
            monto: monto, 
            tipo: pago.tipo,
            estado: pago.estadoCalculado,
            nombreParcela: pago.nombreParcela
          };
        });
      }

      console.log('Resultado final:', JSON.stringify(resultado));
      
    } catch (error) {
      console.error('Error al obtener pagos pendientes:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al obtener pagos pendientes',
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
    console.error('Error general al obtener pagos pendientes:', error);
    
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