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
    console.log(`Obteniendo resumen para el usuario ID: ${userId}, Rol: ${userRole}`);

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

    // Obtener la comunidad del usuario
    let comunidadId;
    try {
      const [comunidadResult] = await connection.execute(
        'SELECT idComunidad FROM Usuario WHERE idUsuario = ?',
        [userId]
      );
      
      if (comunidadResult.length === 0) {
        throw new Error('No se encontró información del usuario');
      }
      
      comunidadId = comunidadResult[0].idComunidad;
      console.log(`ID de comunidad obtenido: ${comunidadId}`);
    } catch (error) {
      console.error('Error al obtener comunidad del usuario:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al obtener información del usuario',
          error: error.message 
        }),
      };
    }

    // 1. Obtener estado de cuenta del usuario
    let estadoCuenta = "Al día"; // Por defecto
    let parcelasInfo = { total: 0, alDia: 0, pendientes: 0 };
    
    try {
      // Si es copropietario, obtenemos el estado de sus parcelas
      if (userRole === 'Copropietario') {
        const [parcelas] = await connection.execute(
          'SELECT idParcela, estado FROM Parcela WHERE idUsuario = ?',
          [userId]
        );
        
        parcelasInfo.total = parcelas.length;
        
        // Contar parcelas por estado
        parcelas.forEach(parcela => {
          if (parcela.estado === 'Al día') {
            parcelasInfo.alDia++;
          } else {
            parcelasInfo.pendientes++;
          }
        });
        
        // Determinar estado general
        if (parcelasInfo.pendientes > 0) {
          estadoCuenta = "Pendiente";
        }
        if (parcelas.some(p => p.estado === 'Atrasado')) {
          estadoCuenta = "Atrasado";
        }
      } else if (userRole === 'Administrador') {
        // Para administradores, obtenemos estadísticas generales de parcelas
        const [totalParcelas] = await connection.execute(
          'SELECT COUNT(*) as total FROM Parcela WHERE idComunidad = ?',
          [comunidadId]
        );
        
        const [parcelasAlDia] = await connection.execute(
          'SELECT COUNT(*) as alDia FROM Parcela WHERE idComunidad = ? AND estado = "Al día"',
          [comunidadId]
        );
        
        const [parcelasPendientes] = await connection.execute(
          'SELECT COUNT(*) as pendientes FROM Parcela WHERE idComunidad = ? AND estado != "Al día"',
          [comunidadId]
        );
        
        parcelasInfo = {
          total: totalParcelas[0].total,
          alDia: parcelasAlDia[0].alDia,
          pendientes: parcelasPendientes[0].pendientes
        };
        
        // Administrador siempre al día (no tiene parcelas personales)
        estadoCuenta = "Administrador";
      }
      
      console.log('Estado de cuenta determinado:', estadoCuenta);
      console.log('Información de parcelas:', parcelasInfo);
    } catch (error) {
      console.error('Error al obtener estado de cuenta:', error);
      estadoCuenta = "Error al determinar";
    }

    // 2. Obtener próximo pago
    let proximoPago = {
      fecha: "No disponible",
      monto: "0",
      concepto: "No hay pagos pendientes"
    };
    
    try {
      // Consulta para obtener el próximo gasto pendiente
      let gastoQuery;
      
      if (userRole === 'Copropietario') {
        gastoQuery = `
          SELECT 
            g.idGasto,
            g.concepto,
            g.fechaVencimiento,
            g.tipo,
            gp.monto_prorrateado as monto
          FROM GastoComun g
          JOIN GastoParcela gp ON g.idGasto = gp.idGasto
          JOIN Parcela p ON gp.idParcela = p.idParcela
          WHERE p.idUsuario = ? 
            AND gp.estado = 'Pendiente'
            AND g.fechaVencimiento >= CURDATE()
          ORDER BY g.fechaVencimiento ASC
          LIMIT 1
        `;
        
        const [gastos] = await connection.execute(gastoQuery, [userId]);
        
        if (gastos.length > 0) {
          const gasto = gastos[0];
          proximoPago = {
            fecha: new Date(gasto.fechaVencimiento).toLocaleDateString('es-ES'),
            monto: `$${gasto.monto.toLocaleString('es-CL')}`,
            concepto: `${gasto.tipo} - ${gasto.concepto}`
          };
        }
      } else if (userRole === 'Administrador') {
        // Para administradores, mostrar el próximo gasto común general
        gastoQuery = `
          SELECT 
            idGasto,
            concepto,
            fechaVencimiento,
            tipo,
            montoTotal as monto
          FROM GastoComun
          WHERE idComunidad = ? 
            AND fechaVencimiento >= CURDATE()
            AND estado != 'Cerrado'
          ORDER BY fechaVencimiento ASC
          LIMIT 1
        `;
        
        const [gastos] = await connection.execute(gastoQuery, [comunidadId]);
        
        if (gastos.length > 0) {
          const gasto = gastos[0];
          proximoPago = {
            fecha: new Date(gasto.fechaVencimiento).toLocaleDateString('es-ES'),
            monto: `$${gasto.monto.toLocaleString('es-CL')}`,
            concepto: `${gasto.tipo} - ${gasto.concepto}`
          };
        }
      }
      
      console.log('Información de próximo pago:', proximoPago);
    } catch (error) {
      console.error('Error al obtener próximo pago:', error);
    }

    // 3. Obtener conteos de pendientes
    let gastosPendientes = 0;
    let notificaciones = 0;
    let avisos = 0;
    
    try {
      // Gastos pendientes
      let gastosQuery;
      
      if (userRole === 'Copropietario') {
        gastosQuery = `
          SELECT COUNT(*) as conteo
          FROM GastoParcela gp
          JOIN Parcela p ON gp.idParcela = p.idParcela
          WHERE p.idUsuario = ? AND gp.estado = 'Pendiente'
        `;
        
        const [gastosResult] = await connection.execute(gastosQuery, [userId]);
        gastosPendientes = gastosResult[0].conteo;
      } else if (userRole === 'Administrador') {
        gastosQuery = `
          SELECT COUNT(*) as conteo
          FROM GastoComun
          WHERE idComunidad = ? AND estado = 'Pendiente'
        `;
        
        const [gastosResult] = await connection.execute(gastosQuery, [comunidadId]);
        gastosPendientes = gastosResult[0].conteo;
      }
      
      // Notificaciones no leídas
      const [notificacionesResult] = await connection.execute(
        'SELECT COUNT(*) as conteo FROM Notificacion WHERE idUsuario = ? AND leida = 0',
        [userId]
      );
      notificaciones = notificacionesResult[0].conteo;
      
      // Avisos no leídos
      const [avisosResult] = await connection.execute(`
        SELECT COUNT(*) as conteo 
        FROM UsuarioAviso ua
        JOIN Aviso a ON ua.idAviso = a.idAviso
        WHERE ua.idUsuario = ? AND ua.leido = 0
      `, [userId]);
      avisos = avisosResult[0].conteo;
      
      console.log('Conteos de pendientes:', { gastosPendientes, notificaciones, avisos });
    } catch (error) {
      console.error('Error al obtener conteos de pendientes:', error);
    }

    // Cerrar la conexión a la base de datos
    await connection.end();
    console.log('Conexión cerrada');

    // Construir el objeto de respuesta
    const resumenData = {
      estadoCuenta,
      proximoPago,
      parcelas: parcelasInfo,
      gastosPendientes,
      notificaciones,
      avisos
    };

    // Devolver respuesta exitosa
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Resumen del dashboard obtenido exitosamente',
        data: resumenData
      }),
    };
  } catch (error) {
    console.error('Error general al obtener resumen del dashboard:', error);
    
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