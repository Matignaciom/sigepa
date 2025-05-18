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
    console.log(`Obteniendo parcelas para el usuario ID: ${userId}, Rol: ${userRole}`);

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

    // Determinar si es necesario obtener el ID de comunidad
    let comunidadId = null;
    if (userRole === 'Administrador') {
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
    }

    // Variables para almacenar las parcelas y las estadísticas
    let parcelas = [];
    let estadisticas = {
      total: 0,
      por_estado: {
        "Al día": 0,
        "Pendiente": 0,
        "Atrasado": 0
      }
    };

    // Consulta diferente dependiendo del rol del usuario
    if (userRole === 'Copropietario') {
      try {
        // Para copropietarios, obtener sus propias parcelas
        const parcelasQuery = `
          SELECT 
            p.idParcela,
            p.nombre,
            p.direccion,
            ST_AsText(p.ubicacion) as ubicacion_texto,
            p.area,
            p.estado,
            p.fechaAdquisicion,
            p.valorCatastral,
            c.idContrato,
            c.estado as estadoContrato,
            c.fechaInicio as fechaInicioContrato,
            c.fechaFin as fechaFinContrato
          FROM Parcela p
          LEFT JOIN Contrato c ON p.idParcela = c.idParcela
          WHERE p.idUsuario = ?
          ORDER BY p.nombre
        `;
        
        const [results] = await connection.execute(parcelasQuery, [userId]);
        console.log(`Se encontraron ${results.length} parcelas para el usuario`);
        
        // Procesamos los resultados
        parcelas = results.map(parcela => {
          // Extraer coordenadas si están disponibles
          let coordenadas = null;
          if (parcela.ubicacion_texto) {
            const match = /POINT\(([^ ]+) ([^)]+)\)/.exec(parcela.ubicacion_texto);
            if (match) {
              coordenadas = {
                longitud: parseFloat(match[1]),
                latitud: parseFloat(match[2])
              };
            }
          }
          
          // Construir objeto de contrato si existe
          let contrato = null;
          if (parcela.idContrato) {
            contrato = {
              id: parcela.idContrato,
              estado: parcela.estadoContrato,
              fechaInicio: parcela.fechaInicioContrato,
              fechaFin: parcela.fechaFinContrato
            };
          }
          
          // Contar por estado para estadísticas
          estadisticas.total++;
          estadisticas.por_estado[parcela.estado]++;
          
          // Retornar objeto formateado
          return {
            id: parcela.idParcela,
            nombre: parcela.nombre,
            direccion: parcela.direccion,
            area: parcela.area,
            estado: parcela.estado,
            fechaAdquisicion: parcela.fechaAdquisicion,
            valorCatastral: parcela.valorCatastral,
            ubicacion: coordenadas,
            contrato: contrato
          };
        });
      } catch (error) {
        console.error('Error al obtener parcelas del usuario:', error);
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
    } else if (userRole === 'Administrador') {
      try {
        // Para administradores, obtener todas las parcelas de la comunidad
        const parcelasQuery = `
          SELECT 
            p.idParcela,
            p.nombre,
            p.direccion,
            ST_AsText(p.ubicacion) as ubicacion_texto,
            p.area,
            p.estado,
            p.fechaAdquisicion,
            p.valorCatastral,
            u.idUsuario as idPropietario,
            u.nombreCompleto as nombrePropietario,
            c.idContrato,
            c.estado as estadoContrato,
            c.fechaInicio as fechaInicioContrato,
            c.fechaFin as fechaFinContrato
          FROM Parcela p
          JOIN Usuario u ON p.idUsuario = u.idUsuario
          LEFT JOIN Contrato c ON p.idParcela = c.idParcela
          WHERE p.idComunidad = ?
          ORDER BY p.nombre
        `;
        
        const [results] = await connection.execute(parcelasQuery, [comunidadId]);
        console.log(`Se encontraron ${results.length} parcelas en la comunidad`);
        
        // Procesamos los resultados
        parcelas = results.map(parcela => {
          // Extraer coordenadas si están disponibles
          let coordenadas = null;
          if (parcela.ubicacion_texto) {
            const match = /POINT\(([^ ]+) ([^)]+)\)/.exec(parcela.ubicacion_texto);
            if (match) {
              coordenadas = {
                longitud: parseFloat(match[1]),
                latitud: parseFloat(match[2])
              };
            }
          }
          
          // Construir objeto de contrato si existe
          let contrato = null;
          if (parcela.idContrato) {
            contrato = {
              id: parcela.idContrato,
              estado: parcela.estadoContrato,
              fechaInicio: parcela.fechaInicioContrato,
              fechaFin: parcela.fechaFinContrato
            };
          }
          
          // Contar por estado para estadísticas
          estadisticas.total++;
          estadisticas.por_estado[parcela.estado]++;
          
          // Retornar objeto formateado
          return {
            id: parcela.idParcela,
            nombre: parcela.nombre,
            direccion: parcela.direccion,
            area: parcela.area,
            estado: parcela.estado,
            fechaAdquisicion: parcela.fechaAdquisicion,
            valorCatastral: parcela.valorCatastral,
            propietario: {
              id: parcela.idPropietario,
              nombre: parcela.nombrePropietario
            },
            ubicacion: coordenadas,
            contrato: contrato
          };
        });
        
        // Obtener estadísticas adicionales para administradores
        const [estadisticasResult] = await connection.execute(`
          SELECT 
            COUNT(*) as total_parcelas,
            SUM(CASE WHEN estado = 'Al día' THEN 1 ELSE 0 END) as parcelas_al_dia,
            SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) as parcelas_pendientes,
            SUM(CASE WHEN estado = 'Atrasado' THEN 1 ELSE 0 END) as parcelas_atrasadas,
            AVG(area) as area_promedio,
            SUM(area) as area_total
          FROM Parcela
          WHERE idComunidad = ?
        `, [comunidadId]);
        
        if (estadisticasResult.length > 0) {
          const stats = estadisticasResult[0];
          
          // Añadir estadísticas adicionales
          estadisticas.area_promedio = stats.area_promedio;
          estadisticas.area_total = stats.area_total;
        }
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
        message: 'Parcelas obtenidas exitosamente',
        data: {
          parcelas: parcelas,
          estadisticas: estadisticas
        }
      }),
    };
  } catch (error) {
    console.error('Error general al obtener parcelas:', error);
    
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