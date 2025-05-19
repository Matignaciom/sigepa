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

    const adminId = decodedToken.id;
    console.log(`Administrador ID ${adminId} está registrando un pago`);

    // Parsear el cuerpo de la solicitud
    let data;
    try {
      data = JSON.parse(event.body);
      console.log('Datos de pago recibidos:', data);
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

    // Validar los datos necesarios para registrar un pago
    const { idGasto, idParcela, idUsuario, montoPagado, metodoPago, descripcion, fechaPago } = data;

    if (!idGasto || !idParcela || !montoPagado) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Faltan campos requeridos para registrar el pago (idGasto, idParcela, montoPagado)' 
        }),
      };
    }

    // Validar que el monto sea un número positivo
    const montoNumerico = parseFloat(montoPagado);
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'El monto pagado debe ser un número positivo' 
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
        [adminId]
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

    // Verificar que el gasto y la parcela pertenezcan a la comunidad del administrador
    try {
      // Verificar gasto
      const [gastoData] = await connection.execute(
        'SELECT * FROM GastoComun WHERE idGasto = ? AND idComunidad = ?',
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
      
      // Verificar parcela
      const [parcelaData] = await connection.execute(
        'SELECT * FROM Parcela WHERE idParcela = ? AND idComunidad = ?',
        [idParcela, comunidadId]
      );
    
      if (parcelaData.length === 0) {
        await connection.end();
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'Parcela no encontrada o no pertenece a su comunidad' 
          }),
        };
      }
      
      // Si no se proporciona un idUsuario, usar el propietario de la parcela
      const usuarioId = idUsuario || parcelaData[0].idUsuario;
      
      if (!usuarioId) {
        await connection.end();
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'No se pudo determinar el usuario para registrar el pago' 
          }),
        };
      }
      
      console.log(`El pago será registrado para el usuario ID: ${usuarioId}`);
      
      // Verificar que existe la distribución del gasto para esta parcela
      const [gastoParcela] = await connection.execute(
        'SELECT * FROM GastoParcela WHERE idGasto = ? AND idParcela = ?',
        [idGasto, idParcela]
      );
      
      if (gastoParcela.length === 0) {
        await connection.end();
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'No existe distribución del gasto para esta parcela' 
          }),
        };
      }
      
      // Verificar si la parcela ya pagó este gasto
      if (gastoParcela[0].estado === 'Pagado') {
        await connection.end();
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'Esta parcela ya ha pagado este gasto' 
          }),
        };
      }
      
      // Verificar si el monto pagado es menor al monto prorrateado
      const montoProrra = parseFloat(gastoParcela[0].monto_prorrateado);
      if (montoNumerico < montoProrra) {
        console.log(`Advertencia: El monto pagado (${montoNumerico}) es menor al prorrateado (${montoProrra})`);
        // No es un error, sólo lo registramos para auditoría
      }
      
      // Registrar el pago
      const comprobante = generarComprobante();
      const fechaActual = fechaPago || new Date().toISOString().slice(0, 19).replace('T', ' ');
      const metodoPagoFinal = metodoPago || 'Efectivo';
      const descripcionFinal = descripcion || `Pago registrado por administrador`;
      
      // Iniciar transacción
      await connection.beginTransaction();
      
      try {
        // 1. Insertar registro en la tabla Pago
        const [resultPago] = await connection.execute(
          `INSERT INTO Pago (
            montoPagado, 
            fechaPago, 
            estado, 
            comprobante, 
            descripcion, 
            idUsuario, 
            idGasto, 
            idParcela,
            transaccion_id
          ) VALUES (?, ?, 'Pagado', ?, ?, ?, ?, ?, ?)`,
          [
            montoNumerico, 
            fechaActual, 
            comprobante, 
            descripcionFinal, 
            usuarioId, 
            idGasto, 
            idParcela,
            `REG-ADMIN-${adminId}`
          ]
        );
        
        const idPago = resultPago.insertId;
        console.log(`Pago registrado con ID: ${idPago}`);
        
        // 2. Actualizar estado en GastoParcela
        await connection.execute(
          'UPDATE GastoParcela SET estado = "Pagado" WHERE idGasto = ? AND idParcela = ?',
          [idGasto, idParcela]
        );
        
        console.log('Estado actualizado en GastoParcela');
        
        // 3. Verificar si todas las parcelas han pagado y actualizar el gasto
        const [pendientes] = await connection.execute(
          'SELECT COUNT(*) as pendientes FROM GastoParcela WHERE idGasto = ? AND estado != "Pagado"',
          [idGasto]
        );
        
        if (pendientes[0].pendientes === 0) {
          // Todas las parcelas han pagado, actualizar estado del gasto
          await connection.execute(
            'UPDATE GastoComun SET estado = "Cerrado" WHERE idGasto = ?',
            [idGasto]
          );
          console.log('Todas las parcelas han pagado, gasto marcado como Cerrado');
        }
        
        // 4. Confirmar la transacción
        await connection.commit();
        console.log('Transacción completada: pago registrado');
        
        // Obtener detalles del pago para la respuesta
        const [pagoInfo] = await connection.execute(
          `SELECT 
            p.idPago,
            p.montoPagado,
            p.fechaPago,
            p.estado,
            p.comprobante,
            p.descripcion,
            p.idUsuario,
            p.idGasto,
            p.idParcela,
            u.nombreCompleto as nombreUsuario,
            gc.concepto,
            gc.tipo,
            pa.nombre as nombreParcela
          FROM Pago p
          JOIN Usuario u ON p.idUsuario = u.idUsuario
          JOIN GastoComun gc ON p.idGasto = gc.idGasto
          JOIN Parcela pa ON p.idParcela = pa.idParcela
          WHERE p.idPago = ?`,
          [idPago]
        );
        
        // Cerrar la conexión a la base de datos
        await connection.end();
        console.log('Conexión cerrada');
        
        // Devolver respuesta exitosa
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Pago registrado exitosamente',
            data: pagoInfo[0] || { idPago }
          }),
        };
        
      } catch (error) {
        // Si hay error, hacer rollback
        await connection.rollback();
        console.error('Error al registrar el pago:', error);
        await connection.end();
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'Error al registrar el pago',
            error: error.message 
          }),
        };
      }
      
    } catch (error) {
      console.error('Error al verificar datos de pago:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al verificar datos de pago',
          error: error.message 
        }),
      };
    }
  } catch (error) {
    console.error('Error general al registrar pago:', error);
    
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