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

    const userId = decodedToken.id;
    console.log(`Administrador ID ${userId} está actualizando coordenadas de parcela`);

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

    // Validar los datos necesarios
    const { idParcela, latitud, longitud } = data;
    
    if (!idParcela || latitud === undefined || longitud === undefined) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Faltan datos requeridos (idParcela, latitud, longitud)' 
        }),
      };
    }

    // Validar que las coordenadas sean números válidos
    if (isNaN(parseFloat(latitud)) || isNaN(parseFloat(longitud))) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Las coordenadas deben ser números válidos' 
        }),
      };
    }

    // Validar rango de coordenadas
    if (parseFloat(latitud) < -90 || parseFloat(latitud) > 90 || 
        parseFloat(longitud) < -180 || parseFloat(longitud) > 180) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Coordenadas fuera de rango. Latitud: -90 a 90, Longitud: -180 a 180' 
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
          message: 'Error al obtener información del administrador',
          error: error.message 
        }),
      };
    }

    // Verificar que la parcela pertenezca a la comunidad del administrador
    try {
      const [parcelaData] = await connection.execute(
        'SELECT idParcela, nombre FROM Parcela WHERE idParcela = ? AND idComunidad = ?',
        [idParcela, comunidadId]
      );
    
      if (parcelaData.length === 0) {
        await connection.end();
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'La parcela no pertenece a su comunidad o no existe' 
          }),
        };
      }
      
      console.log(`Parcela encontrada: ${parcelaData[0].nombre} (ID: ${parcelaData[0].idParcela})`);
    } catch (error) {
      console.error('Error al verificar la parcela:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al verificar la parcela',
          error: error.message 
        }),
      };
    }

    // Actualizar las coordenadas de la parcela
    try {
      // Usamos la función ST_GeomFromText para crear un punto a partir de las coordenadas
      // POINT(longitud latitud) en formato WKT (Well-Known Text)
      const coordenadas = `POINT(${parseFloat(longitud)} ${parseFloat(latitud)})`;
      
      const updateQuery = `
        UPDATE Parcela 
        SET ubicacion = ST_GeomFromText(?, 4326)
        WHERE idParcela = ?
      `;
      
      await connection.execute(updateQuery, [coordenadas, idParcela]);
      console.log(`Coordenadas actualizadas para parcela ID ${idParcela}`);
      
      // Registrar la actividad
      const actividadQuery = `
        INSERT INTO Actividad (tipo, descripcion, idUsuario, idParcela)
        VALUES ('Otro', 'Actualización de coordenadas geográficas', ?, ?)
      `;
      
      await connection.execute(actividadQuery, [userId, idParcela]);
      console.log('Actividad registrada correctamente');
    } catch (error) {
      console.error('Error al actualizar coordenadas:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al actualizar coordenadas de la parcela',
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
        message: 'Coordenadas de parcela actualizadas exitosamente',
        data: {
          idParcela,
          latitud: parseFloat(latitud),
          longitud: parseFloat(longitud)
        }
      }),
    };
  } catch (error) {
    console.error('Error general al actualizar coordenadas de parcela:', error);
    
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