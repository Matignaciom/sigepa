// Script para probar la función de iniciar-sesion
const fetch = require('node-fetch');

// URL de la función. Cuando se ejecuta localmente, normalmente es:
const functionUrl = 'http://localhost:8889/.netlify/functions/iniciar-sesion';

// Datos para prueba
const testData = {
  email: 'patricia.diaz@ejemplo.com',
  password: 'AdminPD2023'
};

async function testLogin() {
  try {
    console.log('----------------------------------');
    console.log('PRUEBA DE INICIO DE SESIÓN');
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
      console.log('✅ PRUEBA EXITOSA - Login correcto');
      console.log('Token JWT recibido, longitud:', data.token ? data.token.length : 0);
      console.log('Datos de usuario recibidos:', data.user ? 'Sí' : 'No');
    } else {
      console.log('❌ PRUEBA FALLIDA - Login incorrecto');
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
testLogin();