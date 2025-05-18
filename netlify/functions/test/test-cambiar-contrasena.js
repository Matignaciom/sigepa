// Script para probar la función de cambiar-contrasena
const fetch = require('node-fetch');

// URL de la función. Cuando se ejecuta localmente, normalmente es:
const functionUrl = 'http://localhost:8889/.netlify/functions/cambiar-contrasena';

// Datos para prueba - Usando el usuario de prueba con contraseña que cumple todos los requisitos
const testData = {
  email: 'usuario.prueba@ejemplo.com',
  newPassword: 'NuevaContraseña2023',
  confirmPassword: 'NuevaContraseña2023'
};

// Datos para prueba - Contraseña débil (para probar validaciones)
const weakPasswordData = {
  email: 'usuario.prueba@ejemplo.com',
  newPassword: 'prueba',
  confirmPassword: 'prueba'
};

// Datos para prueba - Contraseñas no coinciden
const mismatchPasswordData = {
  email: 'usuario.prueba@ejemplo.com',
  newPassword: 'NuevaContraseña2023',
  confirmPassword: 'DiferenteContraseña2023'
};

// Datos para prueba - Email no válido
const invalidEmailData = {
  email: 'correo-no-valido',
  newPassword: 'NuevaContraseña2023',
  confirmPassword: 'NuevaContraseña2023'
};

console.log('PRUEBA DE CAMBIO DE CONTRASEÑA (VALIDACIÓN MEJORADA)');

// Función para probar un caso específico
async function testCase(testData, description) {
  try {
    console.log('----------------------------------');
    console.log(`PRUEBA: ${description}`);
    console.log('----------------------------------');
    console.log('URL de la función:', functionUrl);
    console.log('Datos de prueba:', JSON.stringify(testData));
    console.log('----------------------------------');
    
    console.log('Enviando solicitud...');
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Respuesta recibida. Código de estado:', response.status);
    
    const data = await response.json();
    
    console.log('Respuesta JSON:');
    console.log(JSON.stringify(data, null, 2));
    console.log('----------------------------------');
    
    if (data.success) {
      console.log('✅ PRUEBA EXITOSA - Cambio de contraseña correcto');
      console.log('Mensaje:', data.message);
    } else {
      if (description.includes('VALIDACIÓN')) {
        console.log('✅ PRUEBA EXITOSA - Validación correcta');
      } else {
        console.log('❌ PRUEBA FALLIDA - Cambio de contraseña incorrecto');
      }
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
  // Caso 1: Contraseña fuerte (caso exitoso)
  await testCase(testData, 'CAMBIO DE CONTRASEÑA EXITOSO');

  // Caso 2: Contraseña débil
  await testCase(weakPasswordData, 'VALIDACIÓN DE CONTRASEÑA DÉBIL');

  // Caso 3: Contraseñas no coinciden
  await testCase(mismatchPasswordData, 'VALIDACIÓN DE CONTRASEÑAS NO COINCIDENTES');

  // Caso 4: Email no válido
  await testCase(invalidEmailData, 'VALIDACIÓN DE EMAIL NO VÁLIDO');
}

// Ejecutar todas las pruebas
runAllTests();