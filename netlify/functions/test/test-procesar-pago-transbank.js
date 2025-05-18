// Script para probar la función de procesar-pago-transbank
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

// URL de la función. Cuando se ejecuta localmente, normalmente es:
const functionUrl = 'http://localhost:8889/.netlify/functions/procesar-pago-transbank';

// Clave secreta para firmar los tokens JWT (debe ser la misma que en las funciones)
const JWT_SECRET = 'sigepa_secret_key_development';

// Datos para prueba - Copropietario con parcelas
const copropietarioTestData = {
  id: 6, // Usar un ID de un copropietario existente en la base de datos
  email: 'esteban.nunez@ejemplo.com',
  role: 'Copropietario'
};

// Función para generar un token JWT para pruebas
const generateToken = (userData) => {
  return jwt.sign(userData, JWT_SECRET, { expiresIn: '1h' });
};

// Función para probar el caso de pago individual
async function testPagoIndividual() {
  try {
    console.log('----------------------------------');
    console.log('PRUEBA: PROCESAR PAGO INDIVIDUAL CON TRANSBANK');
    console.log('----------------------------------');
    console.log('URL de la función:', functionUrl);
    console.log('Usuario de prueba:', copropietarioTestData);
    console.log('----------------------------------');
    
    // Generar token para el usuario de prueba
    const token = generateToken(copropietarioTestData);
    console.log('Token JWT generado:', token.substring(0, 20) + '...');
    
    // Datos para la prueba de pago individual 
    // NOTA: Estos IDs deben existir en la base de datos y estar relacionados con el usuario
    const testData = {
      idGasto: 2, // Reemplazar con un ID de gasto válido
      idParcela: 3, // Reemplazar con un ID de parcela válido que pertenezca al usuario
      monto: 25000,
      descripcion: 'Prueba de pago individual con Transbank'
    };
    
    console.log('Datos de prueba:', testData);
    console.log('----------------------------------');
    
    console.log('Enviando solicitud...');
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Respuesta recibida. Código de estado:', response.status);
    
    const data = await response.json();
    
    console.log('Respuesta JSON:');
    console.log(JSON.stringify(data, null, 2));
    console.log('----------------------------------');
    
    if (data.success) {
      console.log('✅ PRUEBA EXITOSA - Pago procesado correctamente');
      console.log('Mensaje:', data.message);
      if (data.data) {
        console.log('Transacción ID:', data.data.transaccion_id);
        console.log('Comprobante:', data.data.comprobante);
        console.log('Monto:', data.data.monto);
        console.log('Fecha de pago:', data.data.fechaPago);
      }
    } else {
      console.log('❌ PRUEBA FALLIDA - Error al procesar el pago');
      console.log('Mensaje de error:', data.message);
      console.log('Detalles del error:', data.error || 'No proporcionado');
    }
    console.log('----------------------------------');
  } catch (error) {
    console.error('❌ ERROR CRÍTICO AL EJECUTAR LA PRUEBA:');
    console.error(error);
  }
}

// Función para probar el caso de pago múltiple
async function testPagoMultiple() {
  try {
    console.log('----------------------------------');
    console.log('PRUEBA: PROCESAR PAGO MÚLTIPLE CON TRANSBANK');
    console.log('----------------------------------');
    console.log('URL de la función:', functionUrl);
    console.log('Usuario de prueba:', copropietarioTestData);
    console.log('----------------------------------');
    
    // Generar token para el usuario de prueba
    const token = generateToken(copropietarioTestData);
    console.log('Token JWT generado:', token.substring(0, 20) + '...');
    
    // Datos para la prueba de pago múltiple
    const testData = {
      pagarTodos: true,
      descripcion: 'Prueba de pago múltiple con Transbank'
    };
    
    console.log('Datos de prueba:', testData);
    console.log('----------------------------------');
    
    console.log('Enviando solicitud...');
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Respuesta recibida. Código de estado:', response.status);
    
    const data = await response.json();
    
    console.log('Respuesta JSON:');
    console.log(JSON.stringify(data, null, 2));
    console.log('----------------------------------');
    
    if (data.success) {
      console.log('✅ PRUEBA EXITOSA - Pago múltiple procesado correctamente');
      console.log('Mensaje:', data.message);
      if (data.data) {
        console.log('Transacción ID:', data.data.transaccion_id);
        console.log('Comprobante:', data.data.comprobante);
        console.log('Monto total:', data.data.monto);
        console.log('Fecha de pago:', data.data.fechaPago);
        console.log('Cantidad de pagos:', data.data.cantidadPagosRealizados);
      }
    } else {
      console.log('❌ PRUEBA FALLIDA - Error al procesar el pago múltiple');
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
  // Caso 1: Procesar pago individual
  await testPagoIndividual();

  // Caso 2: Procesar pago múltiple
  await testPagoMultiple();
}

// Ejecutar todas las pruebas
// NOTA: Estas pruebas deben ejecutarse con cuidado ya que modifican la base de datos
// Es recomendable ejecutarlas en un entorno de prueba
console.log('⚠️ ADVERTENCIA: Estas pruebas modificarán datos en la base de datos.');
console.log('⚠️ Si deseas ejecutarlas, descomenta la siguiente línea:');
// runAllTests(); 