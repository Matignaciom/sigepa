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
    console.log(`Obteniendo perfil de administrador para el usuario ID: ${userId}`);

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

    // Consulta para obtener los datos del administrador con detalles adicionales
    let adminData = null;
    let comunidadData = null;
    
    try {
      // Consulta principal para obtener datos básicos del administrador
      const adminQuery = `
        SELECT 
          u.idUsuario as id, 
          u.nombreCompleto, 
          u.email, 
          u.rol, 
          u.idComunidad, 
          u.telefono, 
          u.direccion,
          u.fecha_registro,
          u.ultimo_acceso,
          c.nombre as comunidad_nombre, 
          c.direccion_administrativa as comunidad_direccion,
          c.telefono_contacto as comunidad_telefono,
          c.email_contacto as comunidad_email,
          c.sitio_web as comunidad_sitio_web
        FROM Usuario u
        JOIN Comunidad c ON u.idComunidad = c.idComunidad
        WHERE u.idUsuario = ? AND u.rol = 'Administrador'
      `;
      
      const [admins] = await connection.execute(adminQuery, [userId]);
      
      if (admins.length === 0) {
        await connection.end();
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'Administrador no encontrado' 
          }),
        };
      }
      
      adminData = admins[0];
      console.log('Datos de administrador obtenidos');
      
      // Obtener estadísticas adicionales de la comunidad
      const comunidadStatsQuery = `
        SELECT 
          c.idComunidad,
          c.nombre,
          c.fecha_creacion,
          c.direccion_administrativa,
          c.telefono_contacto,
          c.email_contacto,
          c.sitio_web,
          (SELECT COUNT(*) FROM Parcela WHERE idComunidad = c.idComunidad) as total_parcelas,
          (SELECT COUNT(*) FROM Usuario WHERE idComunidad = c.idComunidad) as usuarios_registrados,
          (SELECT COUNT(*) FROM Usuario WHERE idComunidad = c.idComunidad AND rol = 'Copropietario') as total_copropietarios,
          (SELECT COUNT(*) FROM Usuario WHERE idComunidad = c.idComunidad AND rol = 'Administrador') as total_administradores,
          (SELECT COUNT(*) FROM GastoComun WHERE idComunidad = c.idComunidad AND estado = 'Pendiente') as gastos_pendientes,
          (SELECT COUNT(*) FROM GastoComun WHERE idComunidad = c.idComunidad AND fechaVencimiento < CURDATE() AND estado != 'Cerrado') as gastos_vencidos
        FROM Comunidad c
        WHERE c.idComunidad = ?
      `;
      
      const [comunidadStats] = await connection.execute(comunidadStatsQuery, [adminData.idComunidad]);
      
      if (comunidadStats.length > 0) {
        comunidadData = comunidadStats[0];
        console.log('Estadísticas de comunidad obtenidas');
      }
    } catch (error) {
      console.error('Error al obtener datos del administrador:', error);
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
      informacion_personal: {
        id: adminData.id,
        nombreCompleto: adminData.nombreCompleto,
        email: adminData.email,
        rol: adminData.rol,
        telefono: adminData.telefono || '',
        direccion: adminData.direccion || ''
      },
      actividad_cuenta: {
        fecha_registro: adminData.fecha_registro,
        ultimo_acceso: adminData.ultimo_acceso,
        comunidad: adminData.comunidad_nombre
      },
      comunidad: comunidadData
    };

    // Devolver respuesta exitosa con los datos del perfil
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Perfil de administrador obtenido exitosamente',
        data: perfilCompleto
      }),
    };
  } catch (error) {
    console.error('Error general al obtener perfil de administrador:', error);
    
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