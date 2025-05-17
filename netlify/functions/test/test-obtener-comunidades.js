// Script para probar la función de obtener-comunidades
const fetch = require('node-fetch');

// URL de la función. Cuando se ejecuta localmente, normalmente es:
const functionUrl = 'http://localhost:8889/.netlify/functions/obtener-comunidades';

async function testObtenerComunidades() {
  try {
    console.log('----------------------------------');
    console.log('PRUEBA DE OBTENCIÓN DE COMUNIDADES');
    console.log('----------------------------------');
    console.log('URL de la función:', functionUrl);
    console.log('----------------------------------');
    
    console.log('Enviando solicitud...');
    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Respuesta recibida. Código de estado:', response.status);
    
    const data = await response.json();
    
    console.log('Respuesta JSON:');
    console.log(JSON.stringify(data, null, 2));
    console.log('----------------------------------');
    
    if (data.success) {
      console.log('✅ PRUEBA EXITOSA - Comunidades obtenidas correctamente');
      console.log('Número de comunidades:', data.comunidades ? data.comunidades.length : 0);
      
      if (data.comunidades && data.comunidades.length > 0) {
        console.log('Lista de comunidades:');
        data.comunidades.forEach((comunidad, index) => {
          console.log(`${index + 1}. ${comunidad.nombre} (ID: ${comunidad.idComunidad})`);
        });
      } else {
        console.log('No se encontraron comunidades en la base de datos');
      }
    } else {
      console.log('❌ PRUEBA FALLIDA - Error al obtener comunidades');
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
testObtenerComunidades();