// Script para probar la función de Netlify Functions localmente
import { handler } from './netlify/functions/test-data.js';

async function testNetlifyFunction() {
  console.log('Probando la función test-data...');
  
  // Simular una solicitud HTTP GET
  const mockEvent = {
    httpMethod: 'GET',
    path: '/.netlify/functions/test-data',
    headers: {
      'content-type': 'application/json'
    },
    body: null
  };
  
  try {
    // Llamar a la función de Netlify
    const response = await handler(mockEvent, {});
    
    console.log('Código de estado:', response.statusCode);
    console.log('Encabezados:', response.headers);
    
    // Parsear y formatear la respuesta JSON
    if (response.body) {
      const body = JSON.parse(response.body);
      console.log('Respuesta:');
      console.log(JSON.stringify(body, null, 2));
    }
    
    return response.statusCode === 200;
  } catch (error) {
    console.error('Error al ejecutar la función:', error);
    return false;
  }
}

// Ejecutar la prueba
testNetlifyFunction()
  .then(success => {
    console.log('\nResultado de la prueba:', success ? 'ÉXITO' : 'FALLO');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Error no manejado:', error);
    process.exit(1);
  }); 