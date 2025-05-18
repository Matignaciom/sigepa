// Script para probar la función de editar-comunidad
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

// URL de la función. Cuando se ejecuta localmente, normalmente es:
const functionUrl = 'http://localhost:8889/.netlify/functions/editar-comunidad';

// Clave secreta para firmar los tokens JWT (debe ser la misma que en las funciones)
const JWT_SECRET = 'sigepa_secret_key_development';

// Datos para prueba - Administrador existente
const adminTestData = {
  id: 1, // Usar un ID de un administrador existente en la base de datos
  email: 'admin@ejemplo.com',
  role: 'Administrador'
};

// Datos para prueba - Copropietario (para probar acceso denegado)
const copropietarioTestData = {
  id: 6, // Usar un ID de un copropietario existente en la base de datos
  email: 'esteban.nunez@ejemplo.com',
  role: 'Copropietario'
};

// Función para generar un token JWT para pruebas
const generateToken = (userData) => {
  return jwt.sign(userData, JWT_SECRET, { expiresIn: '1h' });
};

// Función para probar edición con datos válidos
async function testValidCommunityEdit() {
  try {
    console.log('----------------------------------');
    console.log('PRUEBA: EDITAR INFORMACIÓN DE COMUNIDAD (CASO EXITOSO)');
    console.log('----------------------------------');
    
    // Generar token para administrador
    const token = generateToken(adminTestData);
    
    // Datos actualizados para la comunidad
    const updatedCommunityData = {
      nombre: 'Parcelas Los Aromos Actualizado',
      direccion_administrativa: 'Av. Principal 123, Santiago',
      telefono_contacto: '+56 2 2345 6789',
      email_contacto: 'contacto.actualizado@losaromos.cl',
      sitio_web: 'www.losaromos-actualizado.cl'
    };
    
    console.log('URL de la función:', functionUrl);
    console.log('Datos de prueba:', updatedCommunityData);
    console.log('----------------------------------');
    
    console.log('Enviando solicitud...');
    const response = await fetch(functionUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedCommunityData)
    });
    
    console.log('Respuesta recibida. Código de estado:', response.status);
    
    const data = await response.json();
    
    console.log('Respuesta JSON:');
    console.log(JSON.stringify(data, null, 2));
    console.log('----------------------------------');
    
    if (data.success) {
      console.log('✅ PRUEBA EXITOSA - Información de comunidad actualizada correctamente');
      if (data.data) {
        console.log('Nombre actualizado:', data.data.nombre);
        console.log('Dirección administrativa:', data.data.direccion_administrativa);
        console.log('Teléfono de contacto:', data.data.telefono_contacto);
        console.log('Email de contacto:', data.data.email_contacto);
        console.log('Sitio web:', data.data.sitio_web);
        console.log('Total parcelas:', data.data.total_parcelas);
        console.log('Usuarios registrados:', data.data.usuarios_registrados);
      }
    } else {
      console.log('❌ PRUEBA FALLIDA - Error al actualizar información de comunidad');
      console.log('Mensaje de error:', data.message);
      console.log('Detalles del error:', data.error || 'No proporcionado');
    }
    console.log('----------------------------------');
    
    // Restaurar datos originales después de la prueba
    const originalData = {
      nombre: 'Parcelas Los Aromos',
      direccion_administrativa: 'Av. Las Parcelas 1250, Santiago',
      telefono_contacto: '+56 2 2345 6789',
      email_contacto: 'contacto@losaromos.cl',
      sitio_web: 'www.losaromos.cl'
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

// Función para probar acceso denegado (copropietario intentando editar información de comunidad)
async function testAccessDenied() {
  try {
    console.log('----------------------------------');
    console.log('PRUEBA: EDITAR INFORMACIÓN DE COMUNIDAD (ACCESO DENEGADO)');
    console.log('----------------------------------');
    
    // Generar token para copropietario
    const token = generateToken(copropietarioTestData);
    
    // Datos para editar la comunidad
    const updatedCommunityData = {
      nombre: 'Parcelas Los Intrusos',
      direccion_administrativa: 'Calle Sin Permiso 456, Santiago',
      telefono_contacto: '+56 2 1234 5678',
      email_contacto: 'sin.permiso@ejemplo.com',
      sitio_web: 'www.sin-permiso.cl'
    };
    
    console.log('URL de la función:', functionUrl);
    console.log('Datos de prueba (como copropietario):', updatedCommunityData);
    console.log('----------------------------------');
    
    console.log('Enviando solicitud...');
    const response = await fetch(functionUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedCommunityData)
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
  // Caso 1: Editar información de comunidad con datos válidos
  await testValidCommunityEdit();
  
  // Caso 2: Copropietario intentando acceder (debería ser denegado)
  await testAccessDenied();
}

// Ejecutar todas las pruebas
runAllTests(); 