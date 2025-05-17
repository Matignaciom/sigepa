const fetch = require('node-fetch');
const functionUrl = 'http://localhost:8889/.netlify/functions/editar-perfil';

// Datos para probar edición de administrador
const testAdminData = {
  idUsuario: 1,
  nombreCompleto: 'Ana Martínez Actualizada',
  email: 'ana.martinez.actualizada@ejemplo.com',
  direccion: 'Av. Principal 123, Ciudad',
  telefono: '+56 9 1234 5678'
};

// Datos para probar edición de copropietario
const testCopropietarioData = {
  idUsuario: 6,
  nombreCompleto: 'Roberto Fuentes Actualizado',
  email: 'roberto.fuentes.actualizado@ejemplo.com',
  direccion: 'Calle Secundaria 456, Ciudad',
  telefono: '+56 9 8765 4321'
};

async function testEditarPerfil(testData, userType) {
  try {
    console.log('----------------------------------');
    console.log(`PRUEBA DE EDICIÓN DE PERFIL (${userType})`);
    console.log('----------------------------------');
    console.log('URL de la función:', functionUrl);
    console.log('Datos de prueba:', testData);
    
    const response = await fetch(functionUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ PRUEBA EXITOSA');
      console.log('Mensaje:', data.message);
    } else {
      console.log('❌ PRUEBA FALLIDA');
      console.log('Mensaje de error:', data.message);
    }
    console.log('----------------------------------');
  } catch (error) {
    console.error('❌ ERROR CRÍTICO:', error);
  }
}

// Ejecutar pruebas
testEditarPerfil(testAdminData, 'Administrador');
testEditarPerfil(testCopropietarioData, 'Copropietario');