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
    console.log(`Obteniendo estadísticas para el usuario ID: ${userId}, Rol: ${userRole}`);

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

    // Obtener la comunidad del usuario y parcelas asociadas
    let comunidadId;
    let parcelasIds = [];
    
    try {
      // Obtener la comunidad del usuario
      const [comunidadResult] = await connection.execute(
        'SELECT idComunidad FROM Usuario WHERE idUsuario = ?',
        [userId]
      );
      
      if (comunidadResult.length === 0) {
        throw new Error('No se encontró información del usuario');
      }
      
      comunidadId = comunidadResult[0].idComunidad;
      console.log(`ID de comunidad obtenido: ${comunidadId}`);
      
      // Obtener parcelas del usuario (solo para copropietarios)
      if (userRole === 'Copropietario') {
        const [parcelasResult] = await connection.execute(
          'SELECT idParcela FROM Parcela WHERE idUsuario = ?',
          [userId]
        );
        
        if (parcelasResult.length === 0) {
          console.log('El usuario no tiene parcelas asociadas');
        } else {
          parcelasIds = parcelasResult.map(p => p.idParcela);
          console.log(`Parcelas asociadas: ${parcelasIds.join(', ')}`);
        }
      }
    } catch (error) {
      console.error('Error al obtener información del usuario:', error);
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

    // Estructura para almacenar los resultados
    let estadisticas = {
      pagosRealizados: 0,
      montoTotalPagado: 0,
      pagosPuntuales: 0,
      pagosAtrasados: 0,
      puntualidad: 0,
      saldoPendiente: 0,
      
      historialPagosMensuales: [],
      distribucionPagosEstado: {
        alDia: 0,
        pendiente: 0,
        atrasado: 0
      },
      evolucionPuntualidad: [],
      
      distribucionGastosPorTipo: {
        ordinaria: 0,
        extraordinaria: 0,
        multa: 0,
        otro: 0
      },
      
      proximoPago: {
        fecha: null,
        monto: 0,
        concepto: "No hay próximos vencimientos"
      }
    };

    try {
      // 1. Obtener datos de pagos realizados
      let pagosQuery;
      
      if (userRole === 'Copropietario') {
        if (parcelasIds.length === 0) {
          // Si no tiene parcelas, no hay pagos
          console.log('El usuario no tiene parcelas, no hay pagos para mostrar');
        } else {
          const parcelasIn = parcelasIds.join(',');
          pagosQuery = `
            SELECT 
              p.idPago,
              p.montoPagado,
              p.fechaPago,
              gc.fechaVencimiento,
              CASE 
                WHEN p.fechaPago <= gc.fechaVencimiento THEN 1 
                ELSE 0 
              END as puntual
            FROM Pago p
            JOIN GastoComun gc ON p.idGasto = gc.idGasto
            WHERE p.idParcela IN (${parcelasIn})
              AND p.estado = 'Pagado'
          `;
          
          const [pagos] = await connection.execute(pagosQuery);
          
          estadisticas.pagosRealizados = pagos.length;
          estadisticas.montoTotalPagado = pagos.reduce((sum, p) => sum + parseFloat(p.montoPagado), 0);
          estadisticas.pagosPuntuales = pagos.filter(p => p.puntual === 1).length;
          estadisticas.pagosAtrasados = pagos.filter(p => p.puntual === 0).length;
          
          // Calcular puntualidad (porcentaje de pagos puntuales)
          estadisticas.puntualidad = pagos.length > 0 ? 
            Math.round((estadisticas.pagosPuntuales / pagos.length) * 100) : 0;
            
          console.log('Datos de pagos realizados obtenidos');
        }
      } else if (userRole === 'Administrador') {
        // Para administradores, mostrar pagos de toda la comunidad
        pagosQuery = `
          SELECT 
            p.idPago,
            p.montoPagado,
            p.fechaPago,
            gc.fechaVencimiento,
            CASE 
              WHEN p.fechaPago <= gc.fechaVencimiento THEN 1 
              ELSE 0 
            END as puntual
          FROM Pago p
          JOIN GastoComun gc ON p.idGasto = gc.idGasto
          JOIN Parcela par ON p.idParcela = par.idParcela
          WHERE par.idComunidad = ?
            AND p.estado = 'Pagado'
        `;
        
        const [pagos] = await connection.execute(pagosQuery, [comunidadId]);
        
        estadisticas.pagosRealizados = pagos.length;
        estadisticas.montoTotalPagado = pagos.reduce((sum, p) => sum + parseFloat(p.montoPagado), 0);
        estadisticas.pagosPuntuales = pagos.filter(p => p.puntual === 1).length;
        estadisticas.pagosAtrasados = pagos.filter(p => p.puntual === 0).length;
        
        // Calcular puntualidad (porcentaje de pagos puntuales)
        estadisticas.puntualidad = pagos.length > 0 ? 
          Math.round((estadisticas.pagosPuntuales / pagos.length) * 100) : 0;
          
        console.log('Datos de pagos realizados obtenidos (admin)');
      }

      // 2. Calcular saldo pendiente
      let saldoPendienteQuery;
      
      if (userRole === 'Copropietario') {
        if (parcelasIds.length === 0) {
          // Si no tiene parcelas, no hay saldo pendiente
          estadisticas.saldoPendiente = 0;
        } else {
          const parcelasIn = parcelasIds.join(',');
          saldoPendienteQuery = `
            SELECT SUM(monto_prorrateado) as saldoPendiente
            FROM GastoParcela
            WHERE idParcela IN (${parcelasIn})
              AND estado != 'Pagado'
          `;
          
          const [saldoResult] = await connection.execute(saldoPendienteQuery);
          
          estadisticas.saldoPendiente = saldoResult[0].saldoPendiente || 0;
          console.log('Saldo pendiente calculado');
        }
      } else if (userRole === 'Administrador') {
        // Para administradores, mostrar saldo pendiente de toda la comunidad
        saldoPendienteQuery = `
          SELECT SUM(gp.monto_prorrateado) as saldoPendiente
          FROM GastoParcela gp
          JOIN Parcela p ON gp.idParcela = p.idParcela
          WHERE p.idComunidad = ?
            AND gp.estado != 'Pagado'
        `;
        
        const [saldoResult] = await connection.execute(saldoPendienteQuery, [comunidadId]);
        
        estadisticas.saldoPendiente = saldoResult[0].saldoPendiente || 0;
        console.log('Saldo pendiente calculado (admin)');
      }

      // 3. Obtener datos para historial de pagos mensuales (últimos 12 meses)
      let historialQuery;
      
      if (userRole === 'Copropietario') {
        if (parcelasIds.length === 0) {
          // Si no tiene parcelas, historial vacío
          estadisticas.historialPagosMensuales = [];
        } else {
          const parcelasIn = parcelasIds.join(',');
          historialQuery = `
            SELECT 
              DATE_FORMAT(fechaPago, '%m') as mes,
              DATE_FORMAT(fechaPago, '%Y') as año,
              CONCAT(DATE_FORMAT(fechaPago, '%b'), ' ', DATE_FORMAT(fechaPago, '%Y')) as etiqueta,
              SUM(montoPagado) as monto
            FROM Pago
            WHERE idParcela IN (${parcelasIn})
              AND estado = 'Pagado'
              AND fechaPago >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY año, mes
            ORDER BY año, mes
          `;
          
          const [historial] = await connection.execute(historialQuery);
          
          // Asegurar que hay datos para todos los meses (completar con ceros si es necesario)
          const mesesCompletos = completarMesesFaltantes(historial);
          estadisticas.historialPagosMensuales = mesesCompletos;
          console.log('Historial de pagos mensuales obtenido');
        }
      } else if (userRole === 'Administrador') {
        // Para administradores, mostrar historial de toda la comunidad
        historialQuery = `
          SELECT 
            DATE_FORMAT(p.fechaPago, '%m') as mes,
            DATE_FORMAT(p.fechaPago, '%Y') as año,
            CONCAT(DATE_FORMAT(p.fechaPago, '%b'), ' ', DATE_FORMAT(p.fechaPago, '%Y')) as etiqueta,
            SUM(p.montoPagado) as monto
          FROM Pago p
          JOIN Parcela par ON p.idParcela = par.idParcela
          WHERE par.idComunidad = ?
            AND p.estado = 'Pagado'
            AND p.fechaPago >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
          GROUP BY año, mes
          ORDER BY año, mes
        `;
        
        const [historial] = await connection.execute(historialQuery, [comunidadId]);
        
        // Asegurar que hay datos para todos los meses (completar con ceros si es necesario)
        const mesesCompletos = completarMesesFaltantes(historial);
        estadisticas.historialPagosMensuales = mesesCompletos;
        console.log('Historial de pagos mensuales obtenido (admin)');
      }

      // 4. Obtener distribución de pagos por estado
      let distribucionQuery;
      
      if (userRole === 'Copropietario') {
        if (parcelasIds.length === 0) {
          // Si no tiene parcelas, todos los valores son cero
          estadisticas.distribucionPagosEstado = { alDia: 0, pendiente: 0, atrasado: 0 };
        } else {
          const parcelasIn = parcelasIds.join(',');
          distribucionQuery = `
            SELECT
              estado,
              COUNT(*) as cantidad
            FROM GastoParcela
            WHERE idParcela IN (${parcelasIn})
            GROUP BY estado
          `;
          
          const [distribucion] = await connection.execute(distribucionQuery);
          
          // Inicializar valores por defecto
          let distribucionMap = { 'Pagado': 0, 'Pendiente': 0, 'Atrasado': 0 };
          
          // Actualizar con los valores de la consulta
          distribucion.forEach(item => {
            distribucionMap[item.estado] = item.cantidad;
          });
          
          estadisticas.distribucionPagosEstado = {
            alDia: distribucionMap['Pagado'] || 0,
            pendiente: distribucionMap['Pendiente'] || 0,
            atrasado: distribucionMap['Atrasado'] || 0
          };
          
          console.log('Distribución de pagos por estado obtenida');
        }
      } else if (userRole === 'Administrador') {
        // Para administradores, mostrar distribución de toda la comunidad
        distribucionQuery = `
          SELECT
            gp.estado,
            COUNT(*) as cantidad
          FROM GastoParcela gp
          JOIN Parcela p ON gp.idParcela = p.idParcela
          WHERE p.idComunidad = ?
          GROUP BY gp.estado
        `;
        
        const [distribucion] = await connection.execute(distribucionQuery, [comunidadId]);
        
        // Inicializar valores por defecto
        let distribucionMap = { 'Pagado': 0, 'Pendiente': 0, 'Atrasado': 0 };
        
        // Actualizar con los valores de la consulta
        distribucion.forEach(item => {
          distribucionMap[item.estado] = item.cantidad;
        });
        
        estadisticas.distribucionPagosEstado = {
          alDia: distribucionMap['Pagado'] || 0,
          pendiente: distribucionMap['Pendiente'] || 0,
          atrasado: distribucionMap['Atrasado'] || 0
        };
        
        console.log('Distribución de pagos por estado obtenida (admin)');
      }

      // 4.5 Obtener distribución de gastos por tipo
      let distribucionTipoQuery;
      
      if (userRole === 'Copropietario') {
        if (parcelasIds.length === 0) {
          // Si no tiene parcelas, todos los valores son cero
          estadisticas.distribucionGastosPorTipo = { ordinaria: 0, extraordinaria: 0, multa: 0, otro: 0 };
        } else {
          const parcelasIn = parcelasIds.join(',');
          distribucionTipoQuery = `
            SELECT
              gc.tipo,
              COUNT(*) as cantidad
            FROM GastoComun gc
            JOIN GastoParcela gp ON gc.idGasto = gp.idGasto
            WHERE gp.idParcela IN (${parcelasIn})
            GROUP BY gc.tipo
          `;
          
          const [distribucionTipo] = await connection.execute(distribucionTipoQuery);
          
          // Inicializar valores por defecto
          let distribucionMap = { 
            'Cuota Ordinaria': 0, 
            'Cuota Extraordinaria': 0, 
            'Multa': 0, 
            'Otro': 0 
          };
          
          // Actualizar con los valores de la consulta
          distribucionTipo.forEach(item => {
            distribucionMap[item.tipo] = item.cantidad;
          });
          
          estadisticas.distribucionGastosPorTipo = {
            ordinaria: distribucionMap['Cuota Ordinaria'] || 0,
            extraordinaria: distribucionMap['Cuota Extraordinaria'] || 0,
            multa: distribucionMap['Multa'] || 0,
            otro: distribucionMap['Otro'] || 0
          };
          
          console.log('Distribución de gastos por tipo obtenida');
        }
      } else if (userRole === 'Administrador') {
        // Para administradores, mostrar distribución de toda la comunidad
        distribucionTipoQuery = `
          SELECT
            gc.tipo,
            COUNT(*) as cantidad
          FROM GastoComun gc
          WHERE gc.idComunidad = ?
          GROUP BY gc.tipo
        `;
        
        const [distribucionTipo] = await connection.execute(distribucionTipoQuery, [comunidadId]);
        
        // Inicializar valores por defecto
        let distribucionMap = { 
          'Cuota Ordinaria': 0, 
          'Cuota Extraordinaria': 0, 
          'Multa': 0, 
          'Otro': 0 
        };
        
        // Actualizar con los valores de la consulta
        distribucionTipo.forEach(item => {
          distribucionMap[item.tipo] = item.cantidad;
        });
        
        estadisticas.distribucionGastosPorTipo = {
          ordinaria: distribucionMap['Cuota Ordinaria'] || 0,
          extraordinaria: distribucionMap['Cuota Extraordinaria'] || 0,
          multa: distribucionMap['Multa'] || 0,
          otro: distribucionMap['Otro'] || 0
        };
        
        console.log('Distribución de gastos por tipo obtenida (admin)');
      }

      // 5. Calcular evolución de puntualidad (últimos 6 meses)
      let evolucionQuery;
      
      if (userRole === 'Copropietario') {
        if (parcelasIds.length === 0) {
          // Si no tiene parcelas, evolución vacía
          estadisticas.evolucionPuntualidad = [];
        } else {
          const parcelasIn = parcelasIds.join(',');
          evolucionQuery = `
            SELECT 
              DATE_FORMAT(p.fechaPago, '%m') as mes,
              DATE_FORMAT(p.fechaPago, '%Y') as año,
              CONCAT(DATE_FORMAT(p.fechaPago, '%b'), ' ', DATE_FORMAT(p.fechaPago, '%Y')) as etiqueta,
              SUM(CASE WHEN p.fechaPago <= gc.fechaVencimiento THEN 1 ELSE 0 END) as puntuales,
              COUNT(*) as total
            FROM Pago p
            JOIN GastoComun gc ON p.idGasto = gc.idGasto
            WHERE p.idParcela IN (${parcelasIn})
              AND p.estado = 'Pagado'
              AND p.fechaPago >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY año, mes
            ORDER BY año, mes
          `;
          
          const [evolucion] = await connection.execute(evolucionQuery);
          
          // Calcular porcentaje de puntualidad para cada mes
          const evolucionPorcentajes = evolucion.map(mes => ({
            mes: mes.mes,
            año: mes.año,
            etiqueta: mes.etiqueta,
            porcentaje: mes.total > 0 ? Math.round((mes.puntuales / mes.total) * 100) : 0
          }));
          
          // Asegurar que hay datos para todos los meses (últimos 6)
          const mesesCompletos = completarMesesFaltantes(evolucionPorcentajes, 6, 'porcentaje');
          estadisticas.evolucionPuntualidad = mesesCompletos;
          console.log('Evolución de puntualidad calculada');
        }
      } else if (userRole === 'Administrador') {
        // Para administradores, mostrar evolución de toda la comunidad
        evolucionQuery = `
          SELECT 
            DATE_FORMAT(p.fechaPago, '%m') as mes,
            DATE_FORMAT(p.fechaPago, '%Y') as año,
            CONCAT(DATE_FORMAT(p.fechaPago, '%b'), ' ', DATE_FORMAT(p.fechaPago, '%Y')) as etiqueta,
            SUM(CASE WHEN p.fechaPago <= gc.fechaVencimiento THEN 1 ELSE 0 END) as puntuales,
            COUNT(*) as total
          FROM Pago p
          JOIN GastoComun gc ON p.idGasto = gc.idGasto
          JOIN Parcela par ON p.idParcela = par.idParcela
          WHERE par.idComunidad = ?
            AND p.estado = 'Pagado'
            AND p.fechaPago >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
          GROUP BY año, mes
          ORDER BY año, mes
        `;
        
        const [evolucion] = await connection.execute(evolucionQuery, [comunidadId]);
        
        // Calcular porcentaje de puntualidad para cada mes
        const evolucionPorcentajes = evolucion.map(mes => ({
          mes: mes.mes,
          año: mes.año,
          etiqueta: mes.etiqueta,
          porcentaje: mes.total > 0 ? Math.round((mes.puntuales / mes.total) * 100) : 0
        }));
        
        // Asegurar que hay datos para todos los meses (últimos 6)
        const mesesCompletos = completarMesesFaltantes(evolucionPorcentajes, 6, 'porcentaje');
        estadisticas.evolucionPuntualidad = mesesCompletos;
        console.log('Evolución de puntualidad calculada (admin)');
      }
      
      // 6. Obtener próximo pago
      let proximoPagoQuery;
      
      if (userRole === 'Copropietario') {
        if (parcelasIds.length === 0) {
          // Si no tiene parcelas, no hay próximo pago
          estadisticas.proximoPago = {
            fecha: null,
            monto: 0,
            concepto: "No hay próximos vencimientos"
          };
        } else {
          const parcelasIn = parcelasIds.join(',');
          proximoPagoQuery = `
            SELECT 
              gc.fechaVencimiento as fecha,
              gp.monto_prorrateado as monto,
              CONCAT(gc.tipo, ' - ', gc.concepto) as concepto
            FROM GastoParcela gp
            JOIN GastoComun gc ON gp.idGasto = gc.idGasto
            WHERE gp.idParcela IN (${parcelasIn})
              AND gp.estado != 'Pagado'
              AND gc.fechaVencimiento >= CURDATE()
            ORDER BY gc.fechaVencimiento ASC
            LIMIT 1
          `;
          
          const [proximoPago] = await connection.execute(proximoPagoQuery);
          
          if (proximoPago.length > 0) {
            estadisticas.proximoPago = {
              fecha: proximoPago[0].fecha,
              monto: parseFloat(proximoPago[0].monto),
              concepto: proximoPago[0].concepto
            };
          }
          
          console.log('Próximo pago obtenido');
        }
      } else if (userRole === 'Administrador') {
        // Para administradores, mostrar el próximo vencimiento general
        proximoPagoQuery = `
          SELECT 
            fechaVencimiento as fecha,
            montoTotal as monto,
            CONCAT(tipo, ' - ', concepto) as concepto
          FROM GastoComun
          WHERE idComunidad = ?
            AND fechaVencimiento >= CURDATE()
            AND estado != 'Cerrado'
          ORDER BY fechaVencimiento ASC
          LIMIT 1
        `;
        
        const [proximoPago] = await connection.execute(proximoPagoQuery, [comunidadId]);
        
        if (proximoPago.length > 0) {
          estadisticas.proximoPago = {
            fecha: proximoPago[0].fecha,
            monto: parseFloat(proximoPago[0].monto),
            concepto: proximoPago[0].concepto
          };
        }
        
        console.log('Próximo pago obtenido (admin)');
      }
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      await connection.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error al obtener estadísticas',
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
        message: 'Estadísticas obtenidas exitosamente',
        data: estadisticas
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

// Función auxiliar para completar meses faltantes en los datos históricos
function completarMesesFaltantes(datos, numMeses = 12, valorCampo = 'monto') {
  const fechaActual = new Date();
  const resultado = [];
  
  // Crear un mapa con los datos existentes
  const datosMap = {};
  datos.forEach(item => {
    const clave = `${item.año}-${item.mes}`;
    datosMap[clave] = item;
  });
  
  // Generar datos para los últimos n meses
  for (let i = numMeses - 1; i >= 0; i--) {
    const fecha = new Date();
    fecha.setMonth(fechaActual.getMonth() - i);
    
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const año = fecha.getFullYear().toString();
    const etiqueta = new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(fecha) + ' ' + año;
    const clave = `${año}-${mes}`;
    
    if (datosMap[clave]) {
      resultado.push(datosMap[clave]);
    } else {
      // Si no hay datos para este mes, agregar con valor cero
      const nuevoItem = {
        mes: mes,
        año: año,
        etiqueta: etiqueta
      };
      nuevoItem[valorCampo] = 0;
      resultado.push(nuevoItem);
    }
  }
  
  return resultado;
}