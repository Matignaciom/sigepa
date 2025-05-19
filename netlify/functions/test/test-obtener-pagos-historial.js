// Script para probar la función de obtener-pagos-historial
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

// URL de la función. Cuando se ejecuta localmente, normalmente es:
const functionUrl = 'http://localhost:8889/.netlify/functions/obtener-pagos-historial';

// Clave secreta para firmar los tokens JWT (debe ser la misma que en las funciones)
const JWT_SECRET = 'sigepa_secret_key_development';

// Datos para prueba - Copropietario con pagos
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
async function testCase(userData, description) {
  try {
    console.log('----------------------------------');
    console.log(`PRUEBA: ${description}`);
    console.log('----------------------------------');
    console.log('URL de la función:', functionUrl);
    console.log('Usuario de prueba:', userData);
    console.log('----------------------------------');
    
    // Generar token para el usuario de prueba
    const token = generateToken(userData);
    console.log('Token JWT generado:', token.substring(0, 20) + '...');
    
    console.log('Enviando solicitud...');
    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Respuesta recibida. Código de estado:', response.status);
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ PRUEBA EXITOSA - Historial de pagos obtenido correctamente');
      
      if (data.data && data.data.length > 0) {
        console.log(`Total de pagos encontrados: ${data.data.length}`);
        console.log('\nPrimeros 3 pagos del historial:');
        
        data.data.slice(0, 3).forEach((pago, index) => {
          console.log(`\n${index + 1}. ${pago.concepto} (ID: ${pago.id})`);
          console.log(`   - Parcela: ${pago.nombreParcela}`);
          console.log(`   - Fecha: ${new Date(pago.fechaPago).toLocaleDateString('es-ES')}`);
          console.log(`   - Monto: ${pago.montoPagado}`);
          console.log(`   - Estado: ${pago.estado}`);
          console.log(`   - Comprobante: ${pago.comprobante || 'No disponible'}`);
        });
        
        if (data.data.length > 3) {
          console.log(`\n... y ${data.data.length - 3} pagos más`);
        }
      } else {
        console.log('No se encontraron pagos en el historial');
      }
    } else {
      console.log('❌ PRUEBA FALLIDA - Error al obtener historial de pagos');
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
  // Caso 1: Obtener historial de pagos como copropietario
  await testCase(copropietarioTestData, 'OBTENER HISTORIAL DE PAGOS COMO COPROPIETARIO');

  // Caso 2: Obtener historial de pagos como administrador
  await testCase(adminTestData, 'OBTENER HISTORIAL DE PAGOS COMO ADMINISTRADOR');
}

// Ejecutar todas las pruebas
runAllTests(); 