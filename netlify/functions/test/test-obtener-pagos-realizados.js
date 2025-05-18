// Script para probar la función de obtener-pagos-realizados
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

// URL de la función. Cuando se ejecuta localmente, normalmente es:
const functionUrl = 'http://localhost:8889/.netlify/functions/obtener-pagos-realizados';

// Clave secreta para firmar los tokens JWT (debe ser la misma que en las funciones)
const JWT_SECRET = 'sigepa_secret_key_development';

// Datos para prueba - Copropietario con parcelas
const copropietarioTestData = {
  id: 6, // Usar un ID de un copropietario existente en la base de datos
  email: 'esteban.nunez@ejemplo.com',
  role: 'Copropietario'
};

// Datos para prueba - Administrador
const adminTestData = {
  id: 1, // Usar un ID de un administrador existente en la base de datos
  email: 'admin@ejemplo.com',
  role: 'Administrador'
};

// Función para generar un token JWT para pruebas
const generateToken = (userData) => {
  return jwt.sign(userData, JWT_SECRET, { expiresIn: '1h' });
};

// Función para probar un caso específico
async function testCase(userData, description, idComprobante = null) {
  try {
    console.log('----------------------------------');
    console.log(`PRUEBA: ${description}${idComprobante ? ` (Comprobante: ${idComprobante})` : ''}`);
    console.log('----------------------------------');
    console.log('URL de la función:', functionUrl);
    console.log('Usuario de prueba:', userData);
    console.log('----------------------------------');
    
    // Generar token para el usuario de prueba
    const token = generateToken(userData);
    console.log('Token JWT generado:', token.substring(0, 20) + '...');
    
    // Construir URL con parámetros si es necesario
    let url = functionUrl;
    if (idComprobante) {
      url += `?idComprobante=${idComprobante}`;
    }
    
    console.log('Enviando solicitud a:', url);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Respuesta recibida. Código de estado:', response.status);
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ PRUEBA EXITOSA - Pagos realizados obtenidos correctamente');
      
      // Mostrar resumen de datos
      if (data.data) {
        // Si existe un comprobante específico
        if (data.data.comprobante) {
          const comprobante = data.data.comprobante;
          console.log('\nDETALLES DEL COMPROBANTE:');
          console.log(`- ID: ${comprobante.id}`);
          console.log(`- Fecha: ${comprobante.fechaPago}`);
          console.log(`- Monto: ${comprobante.monto}`);
          console.log(`- Concepto: ${comprobante.concepto}`);
          console.log(`- Tipo: ${comprobante.tipo}`);
          console.log(`- Número de comprobante: ${comprobante.comprobante}`);
          console.log(`- Transacción ID: ${comprobante.transaccion_id || 'N/A'}`);
          console.log(`- Parcela: ${comprobante.nombreParcela}`);
          console.log(`- Usuario: ${comprobante.nombreUsuario}`);
        } else {
          // Mostrar resumen general
          const { resumen, pagosRealizados } = data.data;
          
          console.log('\nRESUMEN:');
          console.log(`- Cantidad de pagos: ${resumen.cantidadPagos}`);
          console.log(`- Fecha del último pago: ${resumen.fechaUltimoPago || 'N/A'}`);
          console.log(`- Total pagado: ${resumen.totalPagado}`);
          console.log(`- Total pagado en el último trimestre: ${resumen.totalTrimestre}`);
          
          console.log(`\nPAGOS REALIZADOS: ${pagosRealizados.length}`);
          if (pagosRealizados.length > 0) {
            console.log('Primeros 2 pagos realizados:');
            pagosRealizados.slice(0, 2).forEach((pago, index) => {
              console.log(`\n${index + 1}. ${pago.concepto} (ID: ${pago.id})`);
              console.log(`   - Parcela: ${pago.nombreParcela}`);
              console.log(`   - Fecha de pago: ${pago.fechaPago}`);
              console.log(`   - Monto: ${pago.monto}`);
              console.log(`   - Comprobante: ${pago.comprobante}`);
              console.log(`   - Transacción ID: ${pago.transaccion_id || 'N/A'}`);
            });
            
            if (pagosRealizados.length > 2) {
              console.log(`\n... y ${pagosRealizados.length - 2} pagos más`);
            }
          }
        }
      } else {
        console.log('No se encontraron datos de pagos realizados');
      }
    } else {
      console.log('❌ PRUEBA FALLIDA - Error al obtener pagos realizados');
      console.log('Mensaje de error:', data.message);
      console.log('Detalles del error:', data.error || 'No proporcionado');
    }
    console.log('----------------------------------');
  } catch (error) {
    console.error('❌ ERROR CRÍTICO AL EJECUTAR LA PRUEBA:');
    console.error(error);
  }
}

// Función para ejecutar todas las pruebas
async function runAllTests() {
  // Caso 1: Obtener pagos realizados como copropietario
  await testCase(copropietarioTestData, 'OBTENER PAGOS REALIZADOS COMO COPROPIETARIO');

  // Caso 2: Obtener pagos realizados como administrador
  await testCase(adminTestData, 'OBTENER PAGOS REALIZADOS COMO ADMINISTRADOR');
  
  // Caso 3: Obtener un comprobante específico (necesitarás un ID de comprobante válido)
  // Comentado porque necesitas un ID de comprobante válido
  // const idComprobanteValido = 1; // Reemplazar con un ID válido
  // await testCase(copropietarioTestData, 'OBTENER COMPROBANTE ESPECÍFICO', idComprobanteValido);
}

// Ejecutar todas las pruebas
runAllTests(); 