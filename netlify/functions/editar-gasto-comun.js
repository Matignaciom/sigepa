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
    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
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

  // Verificar que sea una petición PUT
  if (event.httpMethod !== 'PUT') {
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
    console.log(`Administrador ID ${userId} está editando un gasto común`);

    // Parsear el cuerpo de la solicitud
    let data;
    try {
      data = JSON.parse(event.body);
      console.log('Datos recibidos para editar el gasto:', data);
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

    // Validar los datos necesarios para editar un gasto
    const { idGasto, concepto, montoTotal, fechaVencimiento, tipo, estado } = data;
    
    // Ignoro explícitamente el campo descripcion si está presente
    if (data.descripcion !== undefined) {
      console.log('Campo descripcion recibido pero será ignorado ya que no existe en la tabla GastoComun');
    }

    if (!idGasto) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Falta el ID del gasto a editar' 
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
      console.log(`Comunidad ID del administrador: ${comunidadId}`);
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

    // Verificar que el gasto pertenezca a la comunidad del administrador
    try {
      const [gastoData] = await connection.execute(
        'SELECT * FROM GastoComun WHERE idGasto = ? AND idComunidad = ?',
        [idGasto, comunidadId]
      );
    
      if (gastoData.length === 0) {
        await connection.end();
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'Gasto no encontrado o no pertenece a su comunidad' 
          }),
        };
      }
      
      console.log('Gasto encontrado, procediendo a editar');
    } catch (error) {
      console.error('Error al verificar el gasto:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al verificar el gasto',
          error: error.message 
        }),
      };
    }

    // Validar los campos a actualizar
    const updateFields = [];
    const updateValues = [];
    
    if (concepto) {
      updateFields.push('concepto = ?');
      updateValues.push(concepto);
    }
    
    if (montoTotal !== undefined) {
      const montoTotalNumerico = parseFloat(montoTotal);
      if (isNaN(montoTotalNumerico) || montoTotalNumerico <= 0) {
        await connection.end();
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'El monto total debe ser un número positivo' 
          }),
        };
      }
      updateFields.push('montoTotal = ?');
      updateValues.push(montoTotalNumerico);
    }
    
    if (fechaVencimiento) {
      updateFields.push('fechaVencimiento = ?');
      updateValues.push(fechaVencimiento);
    }
    
    if (tipo) {
      const tiposPermitidos = ['Cuota Ordinaria', 'Cuota Extraordinaria', 'Multa', 'Otro'];
      if (!tiposPermitidos.includes(tipo)) {
        await connection.end();
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'El tipo de gasto no es válido. Valores permitidos: Cuota Ordinaria, Cuota Extraordinaria, Multa, Otro' 
          }),
        };
      }
      updateFields.push('tipo = ?');
      updateValues.push(tipo);
    }
    
    if (estado) {
      const estadosPermitidos = ['Pendiente', 'Activo', 'Cerrado'];
      if (!estadosPermitidos.includes(estado)) {
        await connection.end();
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'El estado no es válido. Valores permitidos: Pendiente, Activo, Cerrado' 
          }),
        };
      }
      updateFields.push('estado = ?');
      updateValues.push(estado);
    }
    
    // Si no hay campos para actualizar, retornar error
    if (updateFields.length === 0) {
      await connection.end();
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'No se proporcionaron campos para actualizar' 
        }),
      };
    }
    
    // Actualizar el gasto en la base de datos
    try {
      const updateQuery = `
        UPDATE GastoComun 
        SET ${updateFields.join(', ')} 
        WHERE idGasto = ?
      `;
      
      updateValues.push(idGasto);
      
      await connection.execute(updateQuery, updateValues);
      console.log('Gasto actualizado correctamente');
      
      // Si se actualizó el estado a 'Cerrado', actualizar también los GastoParcela correspondientes
      if (estado === 'Cerrado') {
        await connection.execute(
          `UPDATE GastoParcela 
           SET estado = 'Cerrado' 
           WHERE idGasto = ? AND estado != 'Pagado'`,
          [idGasto]
        );
        console.log('Estado de GastoParcelas actualizado a Cerrado');
      }
      
      // Si se actualizó el montoTotal, calcular la distribución entre parcelas
      if (montoTotal !== undefined && parseFloat(montoTotal) > 0) {
        // 1. Obtener todas las parcelas que tienen asignación de este gasto
        const [gastosParcela] = await connection.execute(
          `SELECT idParcela, estado FROM GastoParcela WHERE idGasto = ?`,
          [idGasto]
        );
        
        // 2. Obtener información de área para calcular proporciones (si fuera necesario en el futuro)
        const idsParcelas = gastosParcela.map(gp => gp.idParcela);
        
        if (idsParcelas.length > 0) {
          const [parcelas] = await connection.execute(
            `SELECT idParcela, area FROM Parcela WHERE idParcela IN (?)`,
            [idsParcelas]
          );
          
          const parcelasMap = new Map();
          parcelas.forEach(p => {
            // Guardamos el area por si se usa en futuras lógicas de distribución más complejas
            parcelasMap.set(p.idParcela, { idParcela: p.idParcela, area: p.area });
          });
          
          // 3. Recalcular montos proporcionalmente y actualizar
          const montoTotalNumerico = parseFloat(montoTotal);
          const cantidadParcelas = gastosParcela.length;
          
          // Distribución equitativa por defecto al editar el monto total
          // Si se necesitara otro método de distribución aquí, se debería pasar como parámetro
          // y usar `parcelasMap` para obtener el `area`.
          const montoPorParcela = cantidadParcelas > 0 ? montoTotalNumerico / cantidadParcelas : 0;
          
          for (const gp of gastosParcela) {
            // Solo actualizar montos para parcelas que no han pagado
            if (gp.estado !== 'Pagado') {
              await connection.execute(
                `UPDATE GastoParcela SET monto_prorrateado = ? WHERE idGasto = ? AND idParcela = ?`,
                [montoPorParcela, idGasto, gp.idParcela]
              );
            }
          }
          
          console.log('Montos prorrateados actualizados para las parcelas');
        }
      }
    } catch (error) {
      console.error('Error al actualizar el gasto:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al actualizar el gasto',
          error: error.message 
        }),
      };
    }

    // Obtener el gasto actualizado para devolverlo en la respuesta
    let gastoActualizado;
    try {
      const [gastos] = await connection.execute(
        'SELECT * FROM GastoComun WHERE idGasto = ?',
        [idGasto]
      );
      
      if (gastos.length > 0) {
        gastoActualizado = gastos[0];
      }
    } catch (error) {
      console.error('Error al obtener el gasto actualizado:', error);
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
        message: 'Gasto común actualizado exitosamente',
        data: gastoActualizado || { idGasto }
      }),
    };
  } catch (error) {
    console.error('Error general al editar gasto común:', error);
    
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