// Script para probar la función de cambiar-contrasena
const fetch = require('node-fetch');

// URL de la función. Cuando se ejecuta localmente, normalmente es:
const functionUrl = 'http://localhost:8889/.netlify/functions/cambiar-contrasena';

// Datos para prueba - Usando el usuario de prueba
const testData = {
  email: 'usuario.prueba@ejemplo.com',
  oldPassword: 'password123',
  newPassword: 'NuevaContraseña2023',
  confirmPassword: 'NuevaContraseña2023'
};

async function testCambioContrasena() {
  try {
    console.log('----------------------------------');
    console.log('PRUEBA DE CAMBIO DE CONTRASEÑA');
    console.log('----------------------------------');
    console.log('URL de la función:', functionUrl);
    console.log('Datos de prueba:', testData);
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
      console.log('❌ PRUEBA FALLIDA - Cambio de contraseña incorrecto');
      console.log('Mensaje de error:', data.message);
      console.log('Detalles del error:', data.error || 'No proporcionado');
    }
    console.log('----------------------------------');
  } catch (error) {
    console.error('❌ ERROR CRÍTICO AL EJECUTAR LA PRUEBA:');
    console.error(error);
  }
}

// Ejecutar la prueba
testCambioContrasena();