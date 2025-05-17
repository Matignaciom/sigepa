// Script para probar la función de registrar-usuario
const fetch = require('node-fetch');

// URL de la función. Cuando se ejecuta localmente, normalmente es:
const functionUrl = 'http://localhost:8889/.netlify/functions/registrar-usuario';

// Datos para prueba - Ajusta estos datos según tu base de datos
const testData = {
  nombreCompleto: 'Usuario de Prueba',
  email: 'usuario.prueba@ejemplo.com',
  password: 'Prueba2023',
  rut: '12345678-9',
  comunidad: '1', // ID de la comunidad existente en tu base de datos
  rol: 'Copropietario'
};

async function testRegistro() {
  try {
    console.log('----------------------------------');
    console.log('PRUEBA DE REGISTRO DE USUARIO');
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
      console.log('✅ PRUEBA EXITOSA - Registro correcto');
      console.log('Token JWT recibido, longitud:', data.token ? data.token.length : 0);
      console.log('Datos de usuario recibidos:', data.user ? 'Sí' : 'No');
      if (data.user) {
        console.log('ID de usuario:', data.user.id);
        console.log('Nombre:', data.user.nombreCompleto);
        console.log('Email:', data.user.email);
        console.log('Rol:', data.user.rol);
        console.log('ID Comunidad:', data.user.idComunidad);
      }
    } else {
      console.log('❌ PRUEBA FALLIDA - Registro incorrecto');
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
testRegistro();