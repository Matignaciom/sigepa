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
    console.log(`Obteniendo actividades para el usuario ID: ${userId}, Rol: ${userRole}`);

    // Obtener el límite de registros, por defecto 10
    const limit = event.queryStringParameters?.limit || 10;
    
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

    // Array para almacenar todas las actividades de diferentes fuentes
    let allActivities = [];
    
    // 1. Obtener pagos recientes
    try {
      let pagosQuery;
      
      if (userRole === 'Copropietario') {
        pagosQuery = `
          SELECT 
            p.idPago as id,
            p.fechaPago as fecha,
            p.montoPagado as monto,
            p.estado,
            gc.concepto,
            gc.tipo,
            'pago' as tipoActividad,
            par.nombre as nombreParcela
          FROM Pago p
          JOIN GastoParcela gp ON p.idGasto = gp.idGasto AND p.idParcela = gp.idParcela
          JOIN GastoComun gc ON gp.idGasto = gc.idGasto
          JOIN Parcela par ON p.idParcela = par.idParcela
          WHERE p.idUsuario = ?
          ORDER BY p.fechaPago DESC
          LIMIT ?
        `;
        
        const [pagos] = await connection.execute(pagosQuery, [userId, limit]);
        
        // Formatear los datos de pagos
        const formattedPagos = pagos.map(pago => ({
          id: pago.id,
          fecha: new Date(pago.fecha).toISOString(),
          tipo: 'pago',
          icono: '💰',
          titulo: `Pago de ${pago.tipo.toLowerCase()}`,
          descripcion: `${pago.concepto} - ${pago.nombreParcela}`,
          detalles: {
            monto: pago.monto,
            estado: pago.estado,
            concepto: pago.concepto
          }
        }));
        
        allActivities = [...allActivities, ...formattedPagos];
      } else if (userRole === 'Administrador') {
        // Para administradores, mostrar los pagos recientes de la comunidad
        pagosQuery = `
          SELECT 
            p.idPago as id,
            p.fechaPago as fecha,
            p.montoPagado as monto,
            p.estado,
            gc.concepto,
            gc.tipo,
            'pago' as tipoActividad,
            u.nombreCompleto as nombreUsuario,
            par.nombre as nombreParcela
          FROM Pago p
          JOIN GastoParcela gp ON p.idGasto = gp.idGasto AND p.idParcela = gp.idParcela
          JOIN GastoComun gc ON gp.idGasto = gc.idGasto
          JOIN Usuario u ON p.idUsuario = u.idUsuario
          JOIN Parcela par ON p.idParcela = par.idParcela
          WHERE gc.idComunidad = ?
          ORDER BY p.fechaPago DESC
          LIMIT ?
        `;
        
        const [pagos] = await connection.execute(pagosQuery, [comunidadId, limit]);
        
        // Formatear los datos de pagos para administradores
        const formattedPagos = pagos.map(pago => ({
          id: pago.id,
          fecha: new Date(pago.fecha).toISOString(),
          tipo: 'pago',
          icono: '💰',
          titulo: `Pago registrado por ${pago.nombreUsuario}`,
          descripcion: `${pago.concepto} - ${pago.nombreParcela}`,
          detalles: {
            monto: pago.monto,
            estado: pago.estado,
            concepto: pago.concepto
          }
        }));
        
        allActivities = [...allActivities, ...formattedPagos];
      }
    } catch (error) {
      console.error('Error al obtener pagos recientes:', error);
    }

    // 2. Obtener avisos recientes
    try {
      let avisosQuery;
      
      if (userRole === 'Copropietario') {
        avisosQuery = `
          SELECT 
            a.idAviso as id,
            a.titulo,
            a.contenido,
            a.fechaPublicacion as fecha,
            a.tipo,
            'aviso' as tipoActividad,
            ua.leido,
            u.nombreCompleto as autor
          FROM Aviso a
          JOIN UsuarioAviso ua ON a.idAviso = ua.idAviso
          JOIN Usuario u ON a.idAutor = u.idUsuario
          WHERE ua.idUsuario = ?
          ORDER BY a.fechaPublicacion DESC
          LIMIT ?
        `;
        
        const [avisos] = await connection.execute(avisosQuery, [userId, limit]);
        
        // Formatear los datos de avisos
        const formattedAvisos = avisos.map(aviso => ({
          id: aviso.id,
          fecha: new Date(aviso.fecha).toISOString(),
          tipo: 'aviso',
          icono: '📣',
          titulo: `Nuevo aviso: ${aviso.titulo}`,
          descripcion: `Publicado por ${aviso.autor}`,
          detalles: {
            contenido: aviso.contenido,
            leido: aviso.leido === 1,
            tipo: aviso.tipo
          }
        }));
        
        allActivities = [...allActivities, ...formattedAvisos];
      } else if (userRole === 'Administrador') {
        // Para administradores, mostrar todos los avisos de la comunidad
        avisosQuery = `
          SELECT 
            a.idAviso as id,
            a.titulo,
            a.contenido,
            a.fechaPublicacion as fecha,
            a.tipo,
            'aviso' as tipoActividad,
            u.nombreCompleto as autor,
            COUNT(DISTINCT ua.idUsuario) as cantidadDestinatarios,
            SUM(ua.leido) as cantidadLeidos
          FROM Aviso a
          JOIN Usuario u ON a.idAutor = u.idUsuario
          LEFT JOIN UsuarioAviso ua ON a.idAviso = ua.idAviso
          WHERE a.idComunidad = ?
          GROUP BY a.idAviso
          ORDER BY a.fechaPublicacion DESC
          LIMIT ?
        `;
        
        const [avisos] = await connection.execute(avisosQuery, [comunidadId, limit]);
        
        // Formatear los datos de avisos para administradores
        const formattedAvisos = avisos.map(aviso => ({
          id: aviso.id,
          fecha: new Date(aviso.fecha).toISOString(),
          tipo: 'aviso',
          icono: '📣',
          titulo: `Aviso publicado: ${aviso.titulo}`,
          descripcion: `Autor: ${aviso.autor}`,
          detalles: {
            contenido: aviso.contenido,
            tipo: aviso.tipo,
            destinatarios: aviso.cantidadDestinatarios,
            leidos: aviso.cantidadLeidos
          }
        }));
        
        allActivities = [...allActivities, ...formattedAvisos];
      }
    } catch (error) {
      console.error('Error al obtener avisos recientes:', error);
    }

    // 3. Obtener actualizaciones de contratos
    try {
      let contratosQuery;
      
      if (userRole === 'Copropietario') {
        contratosQuery = `
          SELECT 
            c.idContrato as id,
            c.fechaInicio,
            c.fechaFin,
            c.estado,
            p.nombre as nombreParcela,
            'contrato' as tipoActividad
          FROM Contrato c
          JOIN Parcela p ON c.idParcela = p.idParcela
          WHERE c.idPropietario = ?
          ORDER BY 
            CASE 
              WHEN c.fechaInicio IS NULL THEN c.fechaFin
              ELSE c.fechaInicio
            END DESC
          LIMIT ?
        `;
        
        const [contratos] = await connection.execute(contratosQuery, [userId, limit]);
        
        // Formatear los datos de contratos
        const formattedContratos = contratos.map(contrato => ({
          id: contrato.id,
          fecha: new Date(contrato.fechaInicio || contrato.fechaFin).toISOString(),
          tipo: 'contrato',
          icono: '📝',
          titulo: `Actualización de contrato`,
          descripcion: `Parcela: ${contrato.nombreParcela} - Estado: ${contrato.estado}`,
          detalles: {
            fechaInicio: contrato.fechaInicio,
            fechaFin: contrato.fechaFin,
            estado: contrato.estado,
            parcela: contrato.nombreParcela
          }
        }));
        
        allActivities = [...allActivities, ...formattedContratos];
      } else if (userRole === 'Administrador') {
        // Para administradores, mostrar todas las actualizaciones de contratos de la comunidad
        contratosQuery = `
          SELECT 
            c.idContrato as id,
            c.fechaInicio,
            c.fechaFin,
            c.estado,
            p.nombre as nombreParcela,
            u.nombreCompleto as nombrePropietario,
            'contrato' as tipoActividad
          FROM Contrato c
          JOIN Parcela p ON c.idParcela = p.idParcela
          JOIN Usuario u ON c.idPropietario = u.idUsuario
          WHERE c.idComunidad = ?
          ORDER BY 
            CASE 
              WHEN c.fechaInicio IS NULL THEN c.fechaFin
              ELSE c.fechaInicio
            END DESC
          LIMIT ?
        `;
        
        const [contratos] = await connection.execute(contratosQuery, [comunidadId, limit]);
        
        // Formatear los datos de contratos para administradores
        const formattedContratos = contratos.map(contrato => ({
          id: contrato.id,
          fecha: new Date(contrato.fechaInicio || contrato.fechaFin).toISOString(),
          tipo: 'contrato',
          icono: '📝',
          titulo: `Contrato: ${contrato.nombreParcela}`,
          descripcion: `Propietario: ${contrato.nombrePropietario} - Estado: ${contrato.estado}`,
          detalles: {
            fechaInicio: contrato.fechaInicio,
            fechaFin: contrato.fechaFin,
            estado: contrato.estado,
            parcela: contrato.nombreParcela,
            propietario: contrato.nombrePropietario
          }
        }));
        
        allActivities = [...allActivities, ...formattedContratos];
      }
    } catch (error) {
      console.error('Error al obtener actualizaciones de contratos:', error);
    }

    // 4. Obtener notificaciones
    try {
      const notificacionesQuery = `
        SELECT 
          idNotificacion as id,
          tipo,
          contenido,
          fecha_envio as fecha,
          leida,
          'notificacion' as tipoActividad
        FROM Notificacion
        WHERE idUsuario = ?
        ORDER BY fecha_envio DESC
        LIMIT ?
      `;
      
      const [notificaciones] = await connection.execute(notificacionesQuery, [userId, limit]);
      
      // Formatear los datos de notificaciones
      const formattedNotificaciones = notificaciones.map(notificacion => ({
        id: notificacion.id,
        fecha: new Date(notificacion.fecha).toISOString(),
        tipo: 'notificacion',
        icono: '🔔',
        titulo: `Nueva notificación`,
        descripcion: notificacion.contenido,
        detalles: {
          tipo: notificacion.tipo,
          leida: notificacion.leida === 1
        }
      }));
      
      allActivities = [...allActivities, ...formattedNotificaciones];
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
    }

    // 5. Obtener actividades (de la tabla Actividad)
    try {
      let actividadesQuery;
      
      if (userRole === 'Copropietario') {
        actividadesQuery = `
          SELECT 
            a.idActividad as id,
            a.tipo,
            a.descripcion,
            a.fecha,
            p.nombre as nombreParcela,
            'actividad' as tipoActividad
          FROM Actividad a
          JOIN Parcela p ON a.idParcela = p.idParcela
          WHERE a.idUsuario = ?
          ORDER BY a.fecha DESC
          LIMIT ?
        `;
        
        const [actividades] = await connection.execute(actividadesQuery, [userId, limit]);
        
        // Formatear los datos de actividades
        const formattedActividades = actividades.map(actividad => ({
          id: actividad.id,
          fecha: new Date(actividad.fecha).toISOString(),
          tipo: 'actividad',
          icono: getIconoForTipoActividad(actividad.tipo),
          titulo: getTituloForTipoActividad(actividad.tipo),
          descripcion: `${actividad.descripcion} - Parcela: ${actividad.nombreParcela}`,
          detalles: {
            tipo: actividad.tipo,
            parcela: actividad.nombreParcela
          }
        }));
        
        allActivities = [...allActivities, ...formattedActividades];
      } else if (userRole === 'Administrador') {
        // Para administradores, mostrar todas las actividades de la comunidad
        actividadesQuery = `
          SELECT 
            a.idActividad as id,
            a.tipo,
            a.descripcion,
            a.fecha,
            p.nombre as nombreParcela,
            u.nombreCompleto as nombreUsuario,
            'actividad' as tipoActividad
          FROM Actividad a
          JOIN Parcela p ON a.idParcela = p.idParcela
          JOIN Usuario u ON a.idUsuario = u.idUsuario
          WHERE p.idComunidad = ?
          ORDER BY a.fecha DESC
          LIMIT ?
        `;
        
        const [actividades] = await connection.execute(actividadesQuery, [comunidadId, limit]);
        
        // Formatear los datos de actividades para administradores
        const formattedActividades = actividades.map(actividad => ({
          id: actividad.id,
          fecha: new Date(actividad.fecha).toISOString(),
          tipo: 'actividad',
          icono: getIconoForTipoActividad(actividad.tipo),
          titulo: getTituloForTipoActividad(actividad.tipo),
          descripcion: `${actividad.descripcion} - Usuario: ${actividad.nombreUsuario} - Parcela: ${actividad.nombreParcela}`,
          detalles: {
            tipo: actividad.tipo,
            parcela: actividad.nombreParcela,
            usuario: actividad.nombreUsuario
          }
        }));
        
        allActivities = [...allActivities, ...formattedActividades];
      }
    } catch (error) {
      console.error('Error al obtener actividades:', error);
    }
    
    // Ordenar todas las actividades por fecha (más recientes primero)
    allActivities.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    // Limitar al número deseado
    allActivities = allActivities.slice(0, limit);

    // Cerrar la conexión a la base de datos
    await connection.end();
    console.log('Conexión cerrada');

    // Devolver respuesta exitosa
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Actividades recientes obtenidas exitosamente',
        data: allActivities
      }),
    };
  } catch (error) {
    console.error('Error general al obtener actividades recientes:', error);
    
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

// Funciones auxiliares para asignar iconos y títulos según el tipo de actividad
function getIconoForTipoActividad(tipo) {
  switch (tipo) {
    case 'Pago':
      return '💰';
    case 'Documento':
      return '📄';
    case 'Notificación':
      return '🔔';
    case 'Otro':
      return '📋';
    default:
      return '📋';
  }
}

function getTituloForTipoActividad(tipo) {
  switch (tipo) {
    case 'Pago':
      return 'Pago registrado';
    case 'Documento':
      return 'Documento actualizado';
    case 'Notificación':
      return 'Notificación recibida';
    case 'Otro':
      return 'Actividad registrada';
    default:
      return 'Actividad registrada';
  }
} 