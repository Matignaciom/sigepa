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

// Función auxiliar para mapear el tipo de actividad desde la base de datos al enum del frontend
function mapearTipoActividad(tipo) {
  switch (tipo) {
    case 'Pago':
      return 'pago';
    case 'Documento':
      return 'documento';
    case 'Notificación':
      return 'notificacion';
    default:
      return 'otro';
  }
}

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
    
    // Imprimir headers para depuración
    console.log('Headers recibidos:', JSON.stringify(event.headers));
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Token de autenticación no proporcionado o formato inválido',
          data: {
            resumenData: {
              totalUsuarios: 0,
              totalParcelas: 0,
              parcelasActivas: 0,
              pagosPendientes: 0,
              pagosPagados: 0,
              montoRecaudadoMes: 0,
              nombreComunidad: "Sin comunidad",
              totalCopropietarios: 0,
              contratosVigentes: 0,
              contratosProximosVencer: 0,
              alertasActivas: 0,
              avisosRecientes: 0
            },
            actividadesRecientes: []
          }
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
          error: error.message,
          data: {
            resumenData: {
              totalUsuarios: 0,
              totalParcelas: 0,
              parcelasActivas: 0,
              pagosPendientes: 0,
              pagosPagados: 0,
              montoRecaudadoMes: 0,
              nombreComunidad: "Error de autenticación",
              totalCopropietarios: 0,
              contratosVigentes: 0,
              contratosProximosVencer: 0,
              alertasActivas: 0,
              avisosRecientes: 0
            },
            actividadesRecientes: []
          }
        }),
      };
    }

    // Verificar que el usuario sea un administrador
    // En el front tenemos usuario.role pero en el token podría estar como usuario.rol
    const userRole = decodedToken.role || decodedToken.rol;
    if (userRole !== 'Administrador' && userRole !== 'administrador') {
      console.log(`Acceso denegado. Rol esperado: Administrador, rol obtenido: ${userRole}`);
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Acceso denegado. Esta función es solo para administradores.',
          data: {
            resumenData: {
              totalUsuarios: 0,
              totalParcelas: 0,
              parcelasActivas: 0,
              pagosPendientes: 0,
              pagosPagados: 0,
              montoRecaudadoMes: 0,
              nombreComunidad: "Acceso denegado",
              totalCopropietarios: 0,
              contratosVigentes: 0,
              contratosProximosVencer: 0,
              alertasActivas: 0,
              avisosRecientes: 0
            },
            actividadesRecientes: []
          }
        }),
      };
    }

    const userId = decodedToken.id;
    console.log(`Obteniendo resumen del dashboard para el administrador ID: ${userId}`);

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
          error: error.message,
          data: {
            resumenData: {
              totalUsuarios: 0,
              totalParcelas: 0,
              parcelasActivas: 0,
              pagosPendientes: 0,
              pagosPagados: 0,
              montoRecaudadoMes: 0,
              nombreComunidad: "Error de conexión",
              totalCopropietarios: 0,
              contratosVigentes: 0,
              contratosProximosVencer: 0,
              alertasActivas: 0,
              avisosRecientes: 0
            },
            actividadesRecientes: []
          }
        }),
      };
    }

    // Obtener el ID de la comunidad del administrador
    let comunidadId;
    let comunidadNombre = "Sin comunidad";
    try {
      const [adminData] = await connection.execute(
        `SELECT u.idComunidad, c.nombre as nombreComunidad 
         FROM Usuario u
         JOIN Comunidad c ON u.idComunidad = c.idComunidad
         WHERE u.idUsuario = ? AND u.rol = 'Administrador'`,
        [userId]
      );
    
      if (adminData.length === 0) {
        await connection.end();
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'No se encontró el administrador o no tiene comunidad asignada',
            data: {
              resumenData: {
                totalUsuarios: 0,
                totalParcelas: 0,
                parcelasActivas: 0,
                pagosPendientes: 0,
                pagosPagados: 0,
                montoRecaudadoMes: 0,
                nombreComunidad: "Administrador sin comunidad",
                totalCopropietarios: 0,
                contratosVigentes: 0,
                contratosProximosVencer: 0,
                alertasActivas: 0,
                avisosRecientes: 0
              },
              actividadesRecientes: []
            }
          }),
        };
      }
      
      comunidadId = adminData[0].idComunidad;
      comunidadNombre = adminData[0].nombreComunidad || "Sin nombre";
      console.log(`Obteniendo datos para la comunidad ID: ${comunidadId} - ${comunidadNombre}`);
    } catch (error) {
      console.error('Error al obtener comunidad del administrador:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al obtener la comunidad del administrador',
          error: error.message,
          data: {
            resumenData: {
              totalUsuarios: 0,
              totalParcelas: 0,
              parcelasActivas: 0,
              pagosPendientes: 0,
              pagosPagados: 0,
              montoRecaudadoMes: 0,
              nombreComunidad: "Error al obtener comunidad",
              totalCopropietarios: 0,
              contratosVigentes: 0,
              contratosProximosVencer: 0,
              alertasActivas: 0,
              avisosRecientes: 0
            },
            actividadesRecientes: []
          }
        }),
      };
    }

    // Estructura para almacenar el resumen
    let resumenData = {
      // Información general
      totalUsuarios: 0,
      totalParcelas: 0,
      parcelasActivas: 0,

      // Información de pagos
      pagosPendientes: 0,
      pagosPagados: 0,
      montoRecaudadoMes: 0,

      // Información de comunidad
      nombreComunidad: comunidadNombre,
      totalCopropietarios: 0,

      // Información de contratos
      contratosVigentes: 0,
      contratosProximosVencer: 0,

      // Alertas y avisos
      alertasActivas: 0,
      avisosRecientes: 0
    };

    try {
      // 1. Obtener información de usuarios
      const [usuariosResult] = await connection.execute(
        `SELECT 
          COUNT(*) as totalUsuarios,
          SUM(CASE WHEN rol = 'Copropietario' THEN 1 ELSE 0 END) as totalCopropietarios
         FROM Usuario 
         WHERE idComunidad = ?`,
        [comunidadId]
      );
      
      if (usuariosResult.length > 0) {
        resumenData.totalUsuarios = parseInt(usuariosResult[0].totalUsuarios || 0);
        resumenData.totalCopropietarios = parseInt(usuariosResult[0].totalCopropietarios || 0);
      }
      console.log('Información de usuarios obtenida');

      // 2. Obtener información de parcelas
      const [parcelasResult] = await connection.execute(
        `SELECT 
          COUNT(*) as totalParcelas,
          SUM(CASE WHEN estado = 'Al día' THEN 1 ELSE 0 END) as parcelasActivas
         FROM Parcela 
         WHERE idComunidad = ?`,
        [comunidadId]
      );
      
      if (parcelasResult.length > 0) {
        resumenData.totalParcelas = parseInt(parcelasResult[0].totalParcelas || 0);
        resumenData.parcelasActivas = parseInt(parcelasResult[0].parcelasActivas || 0);
      }
      console.log('Información de parcelas obtenida');

      // 3. Obtener información de pagos
      // Pagos pendientes
      const [pagosPendientesResult] = await connection.execute(
        `SELECT COUNT(*) as totalPendientes
         FROM GastoParcela gp
         JOIN Parcela p ON gp.idParcela = p.idParcela
         WHERE p.idComunidad = ? AND gp.estado = 'Pendiente'`,
        [comunidadId]
      );
      
      if (pagosPendientesResult.length > 0) {
        resumenData.pagosPendientes = parseInt(pagosPendientesResult[0].totalPendientes || 0);
      }
      
      // Pagos realizados
      const [pagosPagadosResult] = await connection.execute(
        `SELECT COUNT(*) as totalPagados
         FROM Pago pg
         JOIN Parcela p ON pg.idParcela = p.idParcela
         WHERE p.idComunidad = ? AND pg.estado = 'Pagado'`,
        [comunidadId]
      );
      
      if (pagosPagadosResult.length > 0) {
        resumenData.pagosPagados = parseInt(pagosPagadosResult[0].totalPagados || 0);
      }
      
      // Monto recaudado en el mes actual
      const [montoRecaudadoResult] = await connection.execute(
        `SELECT SUM(montoPagado) as montoTotal
         FROM Pago pg
         JOIN Parcela p ON pg.idParcela = p.idParcela
         WHERE p.idComunidad = ? 
           AND pg.estado = 'Pagado'
           AND MONTH(pg.fechaPago) = MONTH(CURRENT_DATE())
           AND YEAR(pg.fechaPago) = YEAR(CURRENT_DATE())`,
        [comunidadId]
      );
      
      if (montoRecaudadoResult.length > 0) {
        resumenData.montoRecaudadoMes = parseFloat(montoRecaudadoResult[0].montoTotal || 0);
      }
      console.log('Información de pagos obtenida');

      // 4. Obtener información de contratos
      const [contratosResult] = await connection.execute(
        `SELECT 
          SUM(CASE WHEN estado = 'Vigente' THEN 1 ELSE 0 END) as vigentes,
          SUM(CASE 
                WHEN estado = 'Vigente' AND fechaFin <= DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY) 
                THEN 1 ELSE 0 
              END) as proximosVencer
         FROM Contrato
         WHERE idComunidad = ?`,
        [comunidadId]
      );
      
      if (contratosResult.length > 0) {
        resumenData.contratosVigentes = parseInt(contratosResult[0].vigentes || 0);
        resumenData.contratosProximosVencer = parseInt(contratosResult[0].proximosVencer || 0);
      }
      console.log('Información de contratos obtenida');

      // 5. Obtener información de alertas y avisos
      // Alertas activas (gastos atrasados)
      const [alertasResult] = await connection.execute(
        `SELECT COUNT(*) as totalAlertas
         FROM GastoParcela gp
         JOIN Parcela p ON gp.idParcela = p.idParcela
         JOIN GastoComun gc ON gp.idGasto = gc.idGasto
         WHERE p.idComunidad = ? 
           AND gp.estado = 'Atrasado'
           AND gc.fechaVencimiento < CURRENT_DATE()`,
        [comunidadId]
      );
      
      if (alertasResult.length > 0) {
        resumenData.alertasActivas = parseInt(alertasResult[0].totalAlertas || 0);
      }
      
      // Avisos recientes
      const [avisosResult] = await connection.execute(
        `SELECT COUNT(*) as totalAvisos
         FROM Aviso
         WHERE idComunidad = ?
           AND fechaPublicacion >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)`,
        [comunidadId]
      );
      
      if (avisosResult.length > 0) {
        resumenData.avisosRecientes = parseInt(avisosResult[0].totalAvisos || 0);
      }
      console.log('Información de alertas y avisos obtenida');

    } catch (error) {
      console.error('Error al obtener datos del resumen:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al obtener datos del resumen del dashboard',
          error: error.message 
        }),
      };
    }

    // Obtener actividades recientes
    let actividadesRecientes = [];
    try {
      // Consulta para obtener actividades recientes
      const actividadesQuery = `
        SELECT 
          a.idActividad as id,
          a.tipo,
          a.descripcion,
          a.fecha,
          u.nombreCompleto as usuario,
          p.idParcela as parcelaId,
          p.nombre as nombreParcela
        FROM Actividad a
        JOIN Usuario u ON a.idUsuario = u.idUsuario
        JOIN Parcela p ON a.idParcela = p.idParcela
        WHERE p.idComunidad = ?
        ORDER BY a.fecha DESC
        LIMIT 5
      `;
      
      const [actividades] = await connection.execute(actividadesQuery, [comunidadId]);
      
      // Formatear los datos de actividades
      if (actividades && actividades.length > 0) {
        actividadesRecientes = actividades.map(act => {
          // Calcular tiempo relativo
          const fechaActividad = new Date(act.fecha);
          const ahora = new Date();
          const diferenciaMs = ahora.getTime() - fechaActividad.getTime();
          const diferenciaHoras = Math.floor(diferenciaMs / (1000 * 60 * 60));
          const diferenciaDias = Math.floor(diferenciaHoras / 24);
          
          let fechaRelativa;
          if (diferenciaHoras < 1) {
            fechaRelativa = 'Hace menos de una hora';
          } else if (diferenciaHoras < 24) {
            fechaRelativa = `Hace ${diferenciaHoras} ${diferenciaHoras === 1 ? 'hora' : 'horas'}`;
          } else {
            fechaRelativa = `Hace ${diferenciaDias} ${diferenciaDias === 1 ? 'día' : 'días'}`;
          }
          
          return {
            id: parseInt(act.id),
            tipo: mapearTipoActividad(act.tipo),
            descripcion: act.descripcion,
            fecha: fechaRelativa,
            usuario: act.usuario,
            parcelaId: parseInt(act.parcelaId)
          };
        });
      }
      
      console.log('Actividades recientes obtenidas');
    } catch (error) {
      console.error('Error al obtener actividades recientes:', error);
      // No devolvemos error porque las actividades no son críticas
      actividadesRecientes = [];
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
        message: 'Resumen del dashboard obtenido exitosamente',
        data: {
          resumenData: {
            // Asegurar que todos los valores sean del tipo correcto
            totalUsuarios: parseInt(resumenData.totalUsuarios || 0),
            totalParcelas: parseInt(resumenData.totalParcelas || 0),
            parcelasActivas: parseInt(resumenData.parcelasActivas || 0),
            pagosPendientes: parseInt(resumenData.pagosPendientes || 0),
            pagosPagados: parseInt(resumenData.pagosPagados || 0),
            montoRecaudadoMes: parseFloat(resumenData.montoRecaudadoMes || 0),
            nombreComunidad: resumenData.nombreComunidad || "Sin nombre",
            totalCopropietarios: parseInt(resumenData.totalCopropietarios || 0),
            contratosVigentes: parseInt(resumenData.contratosVigentes || 0),
            contratosProximosVencer: parseInt(resumenData.contratosProximosVencer || 0),
            alertasActivas: parseInt(resumenData.alertasActivas || 0),
            avisosRecientes: parseInt(resumenData.avisosRecientes || 0)
          },
          actividadesRecientes: actividadesRecientes || []
        }
      }),
    };
  } catch (error) {
    console.error('Error general en la función:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Error interno del servidor',
        error: error.message,
        data: {
          resumenData: {
            totalUsuarios: 0,
            totalParcelas: 0,
            parcelasActivas: 0,
            pagosPendientes: 0,
            pagosPagados: 0,
            montoRecaudadoMes: 0,
            nombreComunidad: "Error",
            totalCopropietarios: 0,
            contratosVigentes: 0,
            contratosProximosVencer: 0,
            alertasActivas: 0,
            avisosRecientes: 0
          },
          actividadesRecientes: []
        }
      }),
    };
  }
}; 