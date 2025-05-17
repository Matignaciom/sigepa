// Script para probar la función temporal de obtener-usuarios-comunidad
const fetch = require('node-fetch');

// URL de la función
const functionUrl = 'http://localhost:8889/.netlify/functions/obtener-usuarios-comunidad';

async function testObtenerUsuariosComunidad() {
  try {
    console.log('----------------------------------');
    console.log('PRUEBA DE OBTENCIÓN DE USUARIOS DE COMUNIDAD');
    console.log('----------------------------------');
    console.log('URL de la función:', functionUrl);
    console.log('----------------------------------');
    
    console.log('Enviando solicitud...');
    const response = await fetch(`${functionUrl}?idComunidad=2`, {
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
      console.log('✅ PRUEBA EXITOSA - Usuarios obtenidos correctamente');
      console.log('Número de usuarios:', data.usuarios ? data.usuarios.length : 0);
      
      if (data.usuarios && data.usuarios.length > 0) {
        console.log('Lista de usuarios:');
        data.usuarios.forEach((usuario, index) => {
          console.log(`${index + 1}. ${usuario.nombreCompleto} (ID: ${usuario.idUsuario}, Rol: ${usuario.rol})`);
        });
      } else {
        console.log('No se encontraron usuarios en la comunidad 2');
      }
    } else {
      console.log('❌ PRUEBA FALLIDA - Error al obtener usuarios');
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
testObtenerUsuariosComunidad(); 