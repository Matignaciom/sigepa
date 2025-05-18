// Script para probar la función de editar-perfil-copropietario
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

// URL de la función. Cuando se ejecuta localmente, normalmente es:
const functionUrl = 'http://localhost:8889/.netlify/functions/editar-perfil-copropietario';

// Clave secreta para firmar los tokens JWT (debe ser la misma que en las funciones)
const JWT_SECRET = 'sigepa_secret_key_development';

// Datos para prueba - Copropietario existente
const copropietarioTestData = {
  id: 6, // Usar un ID de un copropietario existente en la base de datos
  email: 'esteban.nunez@ejemplo.com',
  role: 'Copropietario'
};

// Datos para prueba - Administrador (para probar acceso denegado)
const adminTestData = {
  id: 1, // Usar un ID de un administrador existente en la base de datos
  email: 'admin@ejemplo.com',
  role: 'Administrador'
};

// Función para generar un token JWT para pruebas
const generateToken = (userData) => {
  return jwt.sign(userData, JWT_SECRET, { expiresIn: '1h' });
};

// Función para probar edición con datos válidos
async function testValidProfileEdit() {
  try {
    console.log('----------------------------------');
    console.log('PRUEBA: EDITAR PERFIL DE COPROPIETARIO (CASO EXITOSO)');
    console.log('----------------------------------');
    
    // Generar token para copropietario
    const token = generateToken(copropietarioTestData);
    
    // Datos actualizados para el perfil
    const updatedProfileData = {
      nombreCompleto: 'Esteban Núñez Actualizado',
      email: 'esteban.nunez.actualizado@ejemplo.com',
      telefono: '+56 9 8765 4321',
      direccion: 'Calle Nueva 123, Santiago'
    };
    
    console.log('URL de la función:', functionUrl);
    console.log('Datos de prueba:', updatedProfileData);
    console.log('----------------------------------');
    
    console.log('Enviando solicitud...');
    const response = await fetch(functionUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedProfileData)
    });
    
    console.log('Respuesta recibida. Código de estado:', response.status);
    
    const data = await response.json();
    
    console.log('Respuesta JSON:');
    console.log(JSON.stringify(data, null, 2));
    console.log('----------------------------------');
    
    if (data.success) {
      console.log('✅ PRUEBA EXITOSA - Perfil actualizado correctamente');
      console.log('Nombre actualizado:', data.data ? data.data.nombreCompleto : 'No disponible');
      console.log('Email actualizado:', data.data ? data.data.email : 'No disponible');
      console.log('Teléfono actualizado:', data.data ? data.data.telefono : 'No disponible');
      console.log('Dirección actualizada:', data.data ? data.data.direccion : 'No disponible');
    } else {
      console.log('❌ PRUEBA FALLIDA - Error al actualizar perfil');
      console.log('Mensaje de error:', data.message);
      console.log('Detalles del error:', data.error || 'No proporcionado');
    }
    console.log('----------------------------------');
    
    // Restaurar datos originales después de la prueba
    const originalData = {
      nombreCompleto: 'Esteban Núñez',
      email: 'esteban.nunez@ejemplo.com',
      telefono: '',
      direccion: ''
    };
    
    console.log('Restaurando datos originales...');
    const restoreResponse = await fetch(functionUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(originalData)
    });
    
    if (restoreResponse.ok) {
      console.log('✅ Datos originales restaurados correctamente');
    } else {
      console.log('❌ Error al restaurar datos originales');
    }
    
  } catch (error) {
    console.error('❌ ERROR CRÍTICO AL EJECUTAR LA PRUEBA:');
    console.error(error);
  }
}

// Función para probar acceso denegado (administrador intentando editar perfil con función de copropietario)
async function testAccessDenied() {
  try {
    console.log('----------------------------------');
    console.log('PRUEBA: EDITAR PERFIL DE COPROPIETARIO (ACCESO DENEGADO)');
    console.log('----------------------------------');
    
    // Generar token para administrador
    const token = generateToken(adminTestData);
    
    // Datos para editar el perfil
    const updatedProfileData = {
      nombreCompleto: 'Nombre Administrador Modificado',
      email: 'admin.modificado@ejemplo.com',
      telefono: '+56 9 1234 5678',
      direccion: 'Calle Administración 456, Santiago'
    };
    
    console.log('URL de la función:', functionUrl);
    console.log('Datos de prueba (como administrador):', updatedProfileData);
    console.log('----------------------------------');
    
    console.log('Enviando solicitud...');
    const response = await fetch(functionUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedProfileData)
    });
    
    console.log('Respuesta recibida. Código de estado:', response.status);
    const data = await response.json();
    
    console.log('Respuesta JSON:');
    console.log(JSON.stringify(data, null, 2));
    console.log('----------------------------------');
    
    if (!data.success && response.status === 403) {
      console.log('✅ PRUEBA EXITOSA - Acceso denegado correctamente');
      console.log('Mensaje de error:', data.message);
    } else {
      console.log('❌ PRUEBA FALLIDA - No se denegó el acceso correctamente');
    }
    console.log('----------------------------------');
    
  } catch (error) {
    console.error('❌ ERROR CRÍTICO AL EJECUTAR LA PRUEBA:');
    console.error(error);
  }
}

// Función para ejecutar todas las pruebas
async function runAllTests() {
  // Caso 1: Editar perfil con datos válidos
  await testValidProfileEdit();
  
  // Caso 2: Administrador intentando acceder (debería ser denegado)
  await testAccessDenied();
}

// Ejecutar todas las pruebas
runAllTests(); 