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
    console.log(`Obteniendo perfil para el usuario ID: ${userId}`);

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

    // Consulta para obtener los datos del usuario
    let userData;
    let comunidadData;
    let parcelaData = null;
    
    try {
      // Consulta principal para obtener datos básicos del usuario
      const userQuery = `
        SELECT 
          u.idUsuario as id, 
          u.nombreCompleto, 
          u.email, 
          u.rol, 
          u.idComunidad, 
          u.telefono, 
          u.direccion, 
          c.nombre as comunidad, 
          c.direccion_administrativa as direccionComunidad
        FROM Usuario u
        JOIN Comunidad c ON u.idComunidad = c.idComunidad
        WHERE u.idUsuario = ?
      `;
      
      const [users] = await connection.execute(userQuery, [userId]);
      
      if (users.length === 0) {
        await connection.end();
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'Usuario no encontrado' 
          }),
        };
      }
      
      userData = users[0];
      console.log('Datos de usuario obtenidos');
      
      // Si el usuario es un Copropietario, obtener información de su parcela
      if (userData.rol === 'Copropietario') {
        const parcelaQuery = `
          SELECT 
            p.idParcela as id, 
            p.nombre, 
            p.direccion, 
            p.area as superficie, 
            p.fechaAdquisicion, 
            p.valorCatastral, 
            p.estado,
            c.idContrato as contratoId,
            c.estado as contratoEstado
          FROM Parcela p
          LEFT JOIN Contrato c ON p.idParcela = c.idParcela 
          WHERE p.idUsuario = ?
          LIMIT 1
        `;
        
        const [parcelas] = await connection.execute(parcelaQuery, [userId]);
        
        if (parcelas.length > 0) {
          parcelaData = parcelas[0];
          
          // Formatear la parcela para incluir el contrato como un objeto anidado
          if (parcelaData.contratoId) {
            parcelaData.contrato = {
              id: parcelaData.contratoId,
              estado: parcelaData.contratoEstado
            };
          }
          
          // Eliminar campos redundantes
          delete parcelaData.contratoId;
          delete parcelaData.contratoEstado;
          
          console.log('Datos de parcela obtenidos');
        }
      }
      
      // Si el usuario es un Administrador, obtener estadísticas de la comunidad
      if (userData.rol === 'Administrador') {
        const comunidadStatsQuery = `
          SELECT 
            (SELECT COUNT(*) FROM Parcela WHERE idComunidad = ?) as total_parcelas,
            (SELECT COUNT(*) FROM Usuario WHERE idComunidad = ?) as usuarios_registrados
        `;
        
        const [stats] = await connection.execute(comunidadStatsQuery, [userData.idComunidad, userData.idComunidad]);
        
        if (stats.length > 0) {
          userData.comunidadStats = stats[0];
          console.log('Estadísticas de comunidad obtenidas');
        }
      }
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al obtener datos del perfil',
          error: error.message 
        }),
      };
    }

    // Cerrar la conexión a la base de datos
    await connection.end();
    console.log('Conexión cerrada');

    // Preparar los datos completos del perfil
    const perfilCompleto = {
      ...userData,
      parcela: parcelaData
    };

    // Devolver respuesta exitosa con los datos del perfil
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Perfil obtenido exitosamente',
        data: perfilCompleto
      }),
    };
  } catch (error) {
    console.error('Error general al obtener perfil:', error);
    
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