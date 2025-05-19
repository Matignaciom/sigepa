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
    console.log(`Administrador ID ${userId} está creando un nuevo gasto común`);

    // Parsear el cuerpo de la solicitud
    let data;
    try {
      data = JSON.parse(event.body);
      console.log('Datos del gasto recibidos:', data);
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

    // Extracción de campos específicos requeridos para la creación de gastos
    // Ignoramos campos que no existen en la tabla GastoComun
    const { 
      concepto, 
      montoTotal, 
      fechaVencimiento, 
      tipo, 
      estado = 'Pendiente',
      metodoDistribucion, 
      parcelas 
    } = data;
    
    console.log('Campos que serán utilizados:', { concepto, montoTotal, fechaVencimiento, tipo, estado });
    if (data.descripcion) {
      console.log('Campo descripcion recibido pero será ignorado ya que no existe en la tabla GastoComun');
    }

    if (!concepto || !montoTotal || !fechaVencimiento || !tipo) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Faltan campos requeridos para crear el gasto (concepto, montoTotal, fechaVencimiento, tipo)' 
        }),
      };
    }

    // Validar que montoTotal sea un número positivo
    const montoTotalNumerico = parseFloat(montoTotal);
    if (isNaN(montoTotalNumerico) || montoTotalNumerico <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'El monto total debe ser un número positivo' 
        }),
      };
    }

    // Validar que el tipo sea uno de los valores permitidos
    const tiposPermitidos = ['Cuota Ordinaria', 'Cuota Extraordinaria', 'Multa', 'Otro'];
    if (!tiposPermitidos.includes(tipo)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'El tipo de gasto no es válido. Valores permitidos: Cuota Ordinaria, Cuota Extraordinaria, Multa, Otro' 
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
      console.log(`Comunidad ID para el nuevo gasto: ${comunidadId}`);
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

    // Iniciar una transacción para crear el gasto común y sus distribuciones
    let gastoId;
    try {
      await connection.beginTransaction();
      
      // 1. Insertar el gasto común (solo campos existentes en la tabla)
      const insertQuery = `
        INSERT INTO GastoComun 
        (concepto, montoTotal, fechaVencimiento, tipo, estado, idComunidad)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await connection.execute(
        insertQuery,
        [concepto, montoTotalNumerico, fechaVencimiento, tipo, estado || 'Pendiente', comunidadId]
      );
      
      gastoId = result.insertId;
      console.log(`Gasto común creado con ID: ${gastoId}`);
      
      // 2. Obtener todas las parcelas de la comunidad si no se especificaron
      let parcelasDistribucion = parcelas;
      if (!parcelasDistribucion || !Array.isArray(parcelasDistribucion) || parcelasDistribucion.length === 0) {
        const [parcelasResult] = await connection.execute(
          'SELECT idParcela, area FROM Parcela WHERE idComunidad = ?',
          [comunidadId]
        );
        
        if (parcelasResult.length === 0) {
          throw new Error('No se encontraron parcelas en la comunidad para distribuir el gasto');
        }
        
        parcelasDistribucion = parcelasResult;
      }
      
      // 3. Distribuir el gasto entre las parcelas según el método especificado
      let montosPorParcela = [];
      
      switch (metodoDistribucion) {
        case 'equitativo':
          // Distribución equitativa entre todas las parcelas
          const montoPorParcela = montoTotalNumerico / parcelasDistribucion.length;
          montosPorParcela = parcelasDistribucion.map(parcela => ({
            idParcela: parcela.idParcela,
            monto: montoPorParcela
          }));
          break;
          
        case 'superficie':
          // Distribución proporcional a la superficie de cada parcela
          // Primero, calcular la superficie total
          const superficieTotal = parcelasDistribucion.reduce((sum, parcela) => sum + parseFloat(parcela.area || 0), 0);
          
          // Luego, calcular el monto para cada parcela
          montosPorParcela = parcelasDistribucion.map(parcela => {
            const porcentaje = superficieTotal > 0 ? parseFloat(parcela.area || 0) / superficieTotal : (1 / parcelasDistribucion.length);
            return {
              idParcela: parcela.idParcela,
              monto: montoTotalNumerico * porcentaje
            };
          });
          break;
          
        case 'personalizado':
          // Usar montos personalizados si vienen definidos
          if (Array.isArray(data.montosPorParcela) && data.montosPorParcela.length > 0) {
            montosPorParcela = data.montosPorParcela;
          } else {
            // Si no hay montos personalizados, usar equitativo
            const montoPorParcela = montoTotalNumerico / parcelasDistribucion.length;
            montosPorParcela = parcelasDistribucion.map(parcela => ({
              idParcela: parcela.idParcela,
              monto: montoPorParcela
            }));
          }
          break;
          
        default:
          // Por defecto, distribución equitativa
          const montoDefault = montoTotalNumerico / parcelasDistribucion.length;
          montosPorParcela = parcelasDistribucion.map(parcela => ({
            idParcela: parcela.idParcela,
            monto: montoDefault
          }));
      }
      
      // 4. Insertar las distribuciones en GastoParcela
      for (const distribucion of montosPorParcela) {
        await connection.execute(
          'INSERT INTO GastoParcela (idGasto, idParcela, monto_prorrateado, estado) VALUES (?, ?, ?, "Pendiente")',
          [gastoId, distribucion.idParcela, distribucion.monto]
        );
      }
      
      // 5. Confirmar la transacción
      await connection.commit();
      console.log('Transacción completada: gasto creado y distribuido');
      
    } catch (error) {
      // Si hay algún error, hacer rollback
      await connection.rollback();
      console.error('Error al crear el gasto común:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al crear el gasto común',
          error: error.message 
        }),
      };
    }

    // Obtener el gasto creado con todos sus detalles (solo campos existentes)
    let gastoCreado;
    try {
      const [gastos] = await connection.execute(
        'SELECT idGasto, concepto, montoTotal, fechaVencimiento, tipo, estado, idComunidad FROM GastoComun WHERE idGasto = ?',
        [gastoId]
      );
      
      if (gastos.length > 0) {
        gastoCreado = gastos[0];
      }
    } catch (error) {
      console.error('Error al obtener el gasto creado:', error);
      // No es un error crítico, continuamos
    }

    // Cerrar la conexión a la base de datos
    await connection.end();
    console.log('Conexión cerrada');

    // Devolver respuesta exitosa
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Gasto común creado exitosamente',
        data: gastoCreado || { idGasto: gastoId }
      }),
    };
  } catch (error) {
    console.error('Error general al crear gasto común:', error);
    
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