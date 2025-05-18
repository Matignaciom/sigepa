// Script para probar la función de obtener-pagos-pendientes
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

// URL de la función. Cuando se ejecuta localmente, normalmente es:
const functionUrl = 'http://localhost:8889/.netlify/functions/obtener-pagos-pendientes';

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
    
    console.log('Respuesta JSON (parcial):');
    
    if (data.success) {
      console.log('✅ PRUEBA EXITOSA - Pagos pendientes obtenidos correctamente');
      
      // Mostrar resumen de datos (no toda la respuesta para no sobrecargar la consola)
      if (data.data) {
        const { proximoVencimiento, totalPendiente, pagosPendientes } = data.data;
        
        console.log('\nPróximo vencimiento:');
        console.log(`- Fecha: ${proximoVencimiento.fecha || 'N/A'}`);
        console.log(`- Concepto: ${proximoVencimiento.concepto}`);
        console.log(`- Tipo: ${proximoVencimiento.tipo}`);
        console.log(`- Monto: ${proximoVencimiento.monto}`);
        
        console.log('\nTotal pendiente:');
        console.log(`- Monto total: ${totalPendiente.monto}`);
        console.log(`- Cantidad de cuotas: ${totalPendiente.cantidadCuotas}`);
        
        console.log(`\nPagos pendientes: ${pagosPendientes.length}`);
        if (pagosPendientes.length > 0) {
          console.log('Primeros 2 pagos pendientes:');
          pagosPendientes.slice(0, 2).forEach((pago, index) => {
            console.log(`\n${index + 1}. ${pago.concepto} (ID: ${pago.id})`);
            console.log(`   - Parcela: ${pago.nombreParcela}`);
            console.log(`   - Fecha vencimiento: ${pago.fechaVencimiento}`);
            console.log(`   - Monto: ${pago.monto}`);
            console.log(`   - Estado: ${pago.estado}`);
            console.log(`   - Tipo: ${pago.tipo}`);
          });
          
          if (pagosPendientes.length > 2) {
            console.log(`\n... y ${pagosPendientes.length - 2} pagos pendientes más`);
          }
        }
      } else {
        console.log('No se encontraron datos de pagos pendientes');
      }
    } else {
      console.log('❌ PRUEBA FALLIDA - Error al obtener pagos pendientes');
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
  // Caso 1: Obtener pagos pendientes como copropietario
  await testCase(copropietarioTestData, 'OBTENER PAGOS PENDIENTES COMO COPROPIETARIO');

  // Caso 2: Obtener pagos pendientes como administrador
  await testCase(adminTestData, 'OBTENER PAGOS PENDIENTES COMO ADMINISTRADOR');
}

// Ejecutar todas las pruebas
runAllTests(); 