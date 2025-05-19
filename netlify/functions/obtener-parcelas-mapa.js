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
    console.log(`Administrador ID ${userId} está solicitando datos del mapa`);
    
    // Obtener filtros de consulta de parámetros URL
    const { estado } = event.queryStringParameters || {};
    
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
          message: 'Error al obtener información del administrador',
          error: error.message 
        }),
      };
    }

    // Obtener información de la comunidad
    let comunidadInfo;
    try {
      const [comunidadData] = await connection.execute(
        'SELECT nombre, direccion_administrativa FROM Comunidad WHERE idComunidad = ?',
        [comunidadId]
      );
      
      if (comunidadData.length > 0) {
        comunidadInfo = comunidadData[0];
      }
    } catch (error) {
      console.error('Error al obtener información de la comunidad:', error);
      // No es un error crítico, continuamos
    }

    // Construir la consulta base para obtener parcelas
    let parcelasQuery = `
      SELECT 
        p.idParcela,
        p.nombre,
        p.direccion,
        ST_AsText(p.ubicacion) as ubicacion_texto,
        ST_X(p.ubicacion) as longitud,
        ST_Y(p.ubicacion) as latitud,
        p.area,
        p.estado,
        p.fechaAdquisicion,
        p.valorCatastral,
        u.idUsuario as idPropietario,
        u.nombreCompleto as nombrePropietario,
        u.email as emailPropietario,
        u.telefono as telefonoPropietario
      FROM Parcela p
      JOIN Usuario u ON p.idUsuario = u.idUsuario
      WHERE p.idComunidad = ?
    `;

    const queryParams = [comunidadId];

    // Añadir filtro de estado si se proporciona
    if (estado && ['Al día', 'Pendiente', 'Atrasado'].includes(estado)) {
      parcelasQuery += ' AND p.estado = ?';
      queryParams.push(estado);
    }

    parcelasQuery += ' ORDER BY p.nombre';
    
    // Ejecutar la consulta
    let parcelas;
    try {
      const [results] = await connection.execute(parcelasQuery, queryParams);
      console.log(`Se encontraron ${results.length} parcelas en la comunidad`);
      
      // Procesar las coordenadas geográficas
      parcelas = results.map(p => {
        // Extraer las coordenadas del formato WKT (Well-Known Text)
        let coordenadas = null;
        if (p.ubicacion_texto) {
          try {
            // Formato típico: 'POINT(longitud latitud)'
            const match = p.ubicacion_texto.match(/POINT\(([^ ]+) ([^)]+)\)/);
            if (match) {
              coordenadas = {
                lng: parseFloat(match[1]),
                lat: parseFloat(match[2])
              };
            } else if (p.longitud && p.latitud) {
              coordenadas = {
                lng: p.longitud,
                lat: p.latitud
              };
            }
          } catch (e) {
            console.error('Error al parsear coordenadas:', e);
          }
        } else if (p.longitud && p.latitud) {
          coordenadas = {
            lng: p.longitud,
            lat: p.latitud
          };
        }
        
        return {
          ...p,
          ubicacion: coordenadas,
          area: parseFloat(p.area || 0).toFixed(2)
        };
      });
      
      // Filtrar parcelas sin coordenadas válidas
      const parcelasConUbicacion = parcelas.filter(p => p.ubicacion !== null);
      if (parcelas.length > 0 && parcelasConUbicacion.length === 0) {
        console.warn('Ninguna parcela tiene coordenadas válidas para mostrar en el mapa');
      } else if (parcelas.length !== parcelasConUbicacion.length) {
        console.warn(`${parcelas.length - parcelasConUbicacion.length} parcelas no tienen coordenadas válidas`);
      }
      
      // Actualizar la lista de parcelas solo con las que tienen ubicación
      parcelas = parcelasConUbicacion;
    } catch (error) {
      console.error('Error al obtener parcelas de la comunidad:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al obtener parcelas',
          error: error.message 
        }),
      };
    }

    // Obtener estadísticas de parcelas
    let estadisticas = {
      total: 0,
      por_estado: {
        "Al día": 0,
        "Pendiente": 0,
        "Atrasado": 0
      }
    };

    try {
      const [estadisticasResult] = await connection.execute(`
        SELECT 
          COUNT(*) as total_parcelas,
          SUM(CASE WHEN estado = 'Al día' THEN 1 ELSE 0 END) as parcelas_al_dia,
          SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) as parcelas_pendientes,
          SUM(CASE WHEN estado = 'Atrasado' THEN 1 ELSE 0 END) as parcelas_atrasadas
        FROM Parcela
        WHERE idComunidad = ?
      `, [comunidadId]);
      
      if (estadisticasResult.length > 0) {
        const stats = estadisticasResult[0];
        estadisticas.total = stats.total_parcelas || 0;
        estadisticas.por_estado["Al día"] = stats.parcelas_al_dia || 0;
        estadisticas.por_estado["Pendiente"] = stats.parcelas_pendientes || 0;
        estadisticas.por_estado["Atrasado"] = stats.parcelas_atrasadas || 0;
      }
    } catch (error) {
      console.error('Error al obtener estadísticas de parcelas:', error);
      // No es un error crítico, continuamos
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
        message: 'Datos para el mapa obtenidos exitosamente',
        data: {
          comunidad: comunidadInfo,
          parcelas: parcelas,
          estadisticas: estadisticas
        }
      }),
    };
  } catch (error) {
    console.error('Error general al obtener datos para el mapa:', error);
    
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