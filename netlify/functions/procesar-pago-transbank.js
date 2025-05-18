// Importamos las dependencias necesarias
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
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

// Esta función simula la generación de un token de transacción con Transbank
// En un ambiente real, aquí se integraría con la API de Transbank
const generarTokenTransaccion = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Esta función genera un comprobante de pago único
const generarComprobante = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SIGEPA-${timestamp}-${random}`;
};

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
    console.log(`Procesando pago Transbank para el usuario ID: ${userId}, Rol: ${userRole}`);

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

    // Validar los datos del pago
    const { idGasto, idParcela, monto, descripcion, pagarTodos } = data;

    if (pagarTodos !== true && (!idGasto || !idParcela || !monto)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Datos del pago incompletos. Se requiere idGasto, idParcela y monto' 
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

    try {
      // Si es pagar todos, obtenemos la lista de pagos pendientes
      if (pagarTodos) {
        // Obtener parcelas del usuario
        const [parcelas] = await connection.execute(
          'SELECT idParcela FROM Parcela WHERE idUsuario = ?',
          [userId]
        );

        if (parcelas.length === 0) {
          await connection.end();
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({
              success: false,
              message: 'No se encontraron parcelas asociadas al usuario'
            }),
          };
        }

        // Obtener IDs de parcelas
        const idsParcelas = parcelas.map(p => p.idParcela);
        const parcelasIn = idsParcelas.join(',');

        // Obtener todos los pagos pendientes
        const pagosPendientesQuery = `
          SELECT 
            gp.idGasto,
            gp.idParcela,
            gp.monto_prorrateado as monto
          FROM GastoParcela gp
          WHERE gp.idParcela IN (${parcelasIn})
          AND (gp.estado = 'Pendiente' OR gp.estado = 'Próximo' OR gp.estado = 'Atrasado')
        `;

        const [pagosPendientes] = await connection.execute(pagosPendientesQuery);

        if (pagosPendientes.length === 0) {
          await connection.end();
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({
              success: false,
              message: 'No se encontraron pagos pendientes'
            }),
          };
        }

        // Generar información para procesar el pago
        const montoTotal = pagosPendientes.reduce((sum, pago) => sum + pago.monto, 0);
        const transaccion_id = generarTokenTransaccion();
        const comprobante = generarComprobante();
        const fechaPago = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // Registrar los pagos en la base de datos
        await connection.beginTransaction();

        for (const pago of pagosPendientes) {
          await connection.execute(
            `INSERT INTO Pago (montoPagado, fechaPago, estado, transaccion_id, comprobante, descripcion, idUsuario, idGasto, idParcela)
             VALUES (?, ?, 'Pagado', ?, ?, ?, ?, ?, ?)`,
            [
              pago.monto,
              fechaPago,
              transaccion_id,
              comprobante,
              descripcion || 'Pago múltiple con Transbank',
              userId,
              pago.idGasto,
              pago.idParcela
            ]
          );

          // Actualizar el estado del GastoParcela a 'Pagado'
          await connection.execute(
            `UPDATE GastoParcela SET estado = 'Pagado' WHERE idGasto = ? AND idParcela = ?`,
            [pago.idGasto, pago.idParcela]
          );
        }

        await connection.commit();

        // Devolver información del pago exitoso
        await connection.end();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Pago múltiple procesado exitosamente',
            data: {
              transaccion_id,
              comprobante,
              monto: parseFloat(montoTotal),
              fechaPago,
              cantidadPagosRealizados: pagosPendientes.length
            }
          }),
        };
      } else {
        // Caso de pago único

        // Verificar que el gasto exista y esté pendiente
        const [gastoParcela] = await connection.execute(
          'SELECT monto_prorrateado, estado FROM GastoParcela WHERE idGasto = ? AND idParcela = ?',
          [idGasto, idParcela]
        );

        if (gastoParcela.length === 0) {
          await connection.end();
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({
              success: false,
              message: 'Gasto no encontrado para la parcela especificada'
            }),
          };
        }

        // Aceptar pagos que estén pendientes, próximos o atrasados
        if (gastoParcela[0].estado !== 'Pendiente' && 
            gastoParcela[0].estado !== 'Próximo' && 
            gastoParcela[0].estado !== 'Atrasado') {
          await connection.end();
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              message: 'El gasto ya ha sido pagado o no está en un estado que permita el pago'
            }),
          };
        }

        // Verificar que la parcela pertenezca al usuario
        const [parcela] = await connection.execute(
          'SELECT idParcela FROM Parcela WHERE idParcela = ? AND idUsuario = ?',
          [idParcela, userId]
        );

        if (parcela.length === 0) {
          await connection.end();
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({
              success: false,
              message: 'La parcela no pertenece al usuario actual'
            }),
          };
        }

        // Generar información para procesar el pago
        const transaccion_id = generarTokenTransaccion();
        const comprobante = generarComprobante();
        const fechaPago = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // Registrar el pago en la base de datos
        await connection.beginTransaction();

        await connection.execute(
          `INSERT INTO Pago (montoPagado, fechaPago, estado, transaccion_id, comprobante, descripcion, idUsuario, idGasto, idParcela)
           VALUES (?, ?, 'Pagado', ?, ?, ?, ?, ?, ?)`,
          [
            monto,
            fechaPago,
            transaccion_id,
            comprobante,
            descripcion || 'Pago con Transbank',
            userId,
            idGasto,
            idParcela
          ]
        );

        // Actualizar el estado del GastoParcela a 'Pagado'
        await connection.execute(
          `UPDATE GastoParcela SET estado = 'Pagado' WHERE idGasto = ? AND idParcela = ?`,
          [idGasto, idParcela]
        );

        await connection.commit();

        // Devolver información del pago exitoso
        await connection.end();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Pago procesado exitosamente',
            data: {
              transaccion_id,
              comprobante,
              monto: parseFloat(monto),
              fechaPago
            }
          }),
        };
      }
    } catch (error) {
      // Si hay algún error, hacemos rollback
      if (connection) {
        await connection.rollback();
        await connection.end();
      }
      
      console.error('Error al procesar el pago:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Error al procesar el pago',
          error: error.message
        }),
      };
    }
  } catch (error) {
    console.error('Error general al procesar pago Transbank:', error);
    
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