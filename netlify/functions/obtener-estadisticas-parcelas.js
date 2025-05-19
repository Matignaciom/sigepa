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
    console.log(`Usuario ID ${userId} con rol ${userRole} solicita estadísticas de parcelas`);

    // Verificar que el usuario sea un administrador
    if (userRole !== 'Administrador') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Acceso denegado. Esta función es solo para administradores.' 
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
      console.log(`ID de comunidad obtenido: ${comunidadId}`);
    } catch (error) {
      console.error('Error al obtener comunidad del administrador:', error);
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

    // Objeto para almacenar todas las estadísticas
    const estadisticas = {
      general: {
        total: 0,
        por_estado: {
          "Al día": 0,
          "Pendiente": 0,
          "Atrasado": 0
        },
        superficie_total: 0, // en hectáreas
        valor_catastral_total: 0,
      },
      pagos: {
        total_por_cobrar: 0,
        total_recaudado: 0,
        porcentaje_recaudacion: 0,
      },
      distribucion_geografica: {},
      historial_mensual: []
    };

    // 1. Obtener estadísticas generales de parcelas
    try {
      const [estatistGen] = await connection.execute(`
        SELECT 
          COUNT(*) as total_parcelas,
          SUM(CASE WHEN estado = 'Al día' THEN 1 ELSE 0 END) as parcelas_al_dia,
          SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) as parcelas_pendientes,
          SUM(CASE WHEN estado = 'Atrasado' THEN 1 ELSE 0 END) as parcelas_atrasadas,
          SUM(area) as superficie_total,
          SUM(valorCatastral) as valor_catastral_total,
          AVG(area) as superficie_promedio,
          AVG(valorCatastral) as valor_catastral_promedio
        FROM Parcela
        WHERE idComunidad = ?
      `, [comunidadId]);
      
      if (estatistGen.length > 0) {
        const datos = estatistGen[0];
        estadisticas.general.total = parseInt(datos.total_parcelas || 0);
        estadisticas.general.por_estado["Al día"] = parseInt(datos.parcelas_al_dia || 0);
        estadisticas.general.por_estado["Pendiente"] = parseInt(datos.parcelas_pendientes || 0);
        estadisticas.general.por_estado["Atrasado"] = parseInt(datos.parcelas_atrasadas || 0);
        estadisticas.general.superficie_total = parseFloat(datos.superficie_total || 0).toFixed(2);
        estadisticas.general.valor_catastral_total = parseFloat(datos.valor_catastral_total || 0);
        estadisticas.general.superficie_promedio = parseFloat(datos.superficie_promedio || 0).toFixed(2);
        estadisticas.general.valor_catastral_promedio = parseFloat(datos.valor_catastral_promedio || 0);
      }
      
      console.log('Estadísticas generales de parcelas obtenidas');
    } catch (error) {
      console.error('Error al obtener estadísticas generales:', error);
      // No es crítico, continuamos con las otras estadísticas
    }

    // 2. Obtener estadísticas de pagos
    try {
      // Total por cobrar (suma de gastos pendientes)
      const [porCobrar] = await connection.execute(`
        SELECT 
          SUM(gp.monto_prorrateado) as total_por_cobrar
        FROM GastoParcela gp
        JOIN Parcela p ON gp.idParcela = p.idParcela
        WHERE p.idComunidad = ? AND gp.estado != 'Pagado'
      `, [comunidadId]);
      
      // Total recaudado (suma de pagos realizados)
      const [recaudado] = await connection.execute(`
        SELECT 
          SUM(pa.montoPagado) as total_recaudado
        FROM Pago pa
        JOIN Parcela p ON pa.idParcela = p.idParcela
        WHERE p.idComunidad = ? AND pa.estado = 'Pagado'
      `, [comunidadId]);
      
      // Calcular totales
      const totalPorCobrar = parseFloat(porCobrar[0].total_por_cobrar || 0);
      const totalRecaudado = parseFloat(recaudado[0].total_recaudado || 0);
      
      estadisticas.pagos.total_por_cobrar = totalPorCobrar;
      estadisticas.pagos.total_recaudado = totalRecaudado;
      
      // Calcular porcentaje de recaudación
      const totalGeneral = totalPorCobrar + totalRecaudado;
      estadisticas.pagos.porcentaje_recaudacion = totalGeneral > 0 
        ? Math.round((totalRecaudado / totalGeneral) * 100) 
        : 0;
      
      console.log('Estadísticas de pagos obtenidas');
    } catch (error) {
      console.error('Error al obtener estadísticas de pagos:', error);
      // No es crítico, continuamos con las otras estadísticas
    }

    // 3. Obtener distribución geográfica (por direcciones)
    try {
      // Extraemos el primer término de cada dirección (podría ser la ciudad o sector)
      const [distribucion] = await connection.execute(`
        SELECT 
          SUBSTRING_INDEX(direccion, ',', 1) as zona,
          COUNT(*) as cantidad,
          SUM(CASE WHEN estado = 'Al día' THEN 1 ELSE 0 END) as al_dia,
          SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) as pendiente,
          SUM(CASE WHEN estado = 'Atrasado' THEN 1 ELSE 0 END) as atrasado
        FROM Parcela
        WHERE idComunidad = ?
        GROUP BY zona
        ORDER BY cantidad DESC
        LIMIT 10
      `, [comunidadId]);
      
      // Crear objeto con la distribución
      distribucion.forEach(d => {
        estadisticas.distribucion_geografica[d.zona] = {
          total: parseInt(d.cantidad),
          por_estado: {
            "Al día": parseInt(d.al_dia),
            "Pendiente": parseInt(d.pendiente),
            "Atrasado": parseInt(d.atrasado)
          }
        };
      });
      
      console.log('Distribución geográfica obtenida');
    } catch (error) {
      console.error('Error al obtener distribución geográfica:', error);
      // No es crítico, continuamos
    }

    // 4. Historial mensual de cambios de estado
    try {
      // Obtener historial de los últimos 6 meses
      const [historial] = await connection.execute(`
        SELECT 
          DATE_FORMAT(a.fecha, '%Y-%m') as mes,
          COUNT(*) as total_cambios,
          SUM(CASE WHEN p.estado = 'Al día' THEN 1 ELSE 0 END) as al_dia,
          SUM(CASE WHEN p.estado = 'Pendiente' THEN 1 ELSE 0 END) as pendiente,
          SUM(CASE WHEN p.estado = 'Atrasado' THEN 1 ELSE 0 END) as atrasado
        FROM Actividad a
        JOIN Parcela p ON a.idParcela = p.idParcela
        WHERE p.idComunidad = ?
          AND a.fecha >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
        GROUP BY mes
        ORDER BY mes DESC
      `, [comunidadId]);
      
      // Procesar historial
      historial.forEach(h => {
        const [anio, mes] = h.mes.split('-');
        const fecha = new Date(parseInt(anio), parseInt(mes) - 1);
        const nombreMes = fecha.toLocaleString('es', { month: 'long' });
        
        estadisticas.historial_mensual.push({
          mes: h.mes,
          nombre_mes: nombreMes,
          year: anio,
          total_cambios: parseInt(h.total_cambios),
          por_estado: {
            "Al día": parseInt(h.al_dia),
            "Pendiente": parseInt(h.pendiente),
            "Atrasado": parseInt(h.atrasado)
          }
        });
      });
      
      console.log('Historial mensual obtenido');
    } catch (error) {
      console.error('Error al obtener historial mensual:', error);
      // No es crítico, continuamos
    }

    // 5. Obtener información general de la comunidad
    let comunidadInfo;
    try {
      const [infoData] = await connection.execute(`
        SELECT 
          nombre, 
          direccion_administrativa,
          fecha_creacion
        FROM Comunidad
        WHERE idComunidad = ?
      `, [comunidadId]);
      
      if (infoData.length > 0) {
        comunidadInfo = infoData[0];
      }
      
      console.log('Información de comunidad obtenida');
    } catch (error) {
      console.error('Error al obtener información de comunidad:', error);
      // No es crítico, continuamos
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
        message: 'Estadísticas de parcelas obtenidas exitosamente',
        data: {
          comunidad: comunidadInfo,
          estadisticas: estadisticas
        }
      }),
    };
  } catch (error) {
    console.error('Error general al obtener estadísticas:', error);
    
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