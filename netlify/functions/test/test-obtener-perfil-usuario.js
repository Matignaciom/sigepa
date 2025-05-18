// Script para probar la función de obtener-perfil-usuario
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

// URL de la función. Cuando se ejecuta localmente, normalmente es:
const functionUrl = 'http://localhost:8889/.netlify/functions/obtener-perfil-usuario';

// Clave secreta para firmar los tokens JWT (debe ser la misma que en las funciones)
const JWT_SECRET = 'sigepa_secret_key_development';

// Datos para prueba - Copropietario
const copropietarioTestData = {
  id: 6, // Usar un ID de un copropietario existente en la base de datos
  email: 'esteban.nunez@ejemplo.com',
  role: 'Copropietario'
};

// Datos para prueba - Administrador
const adminTestData = {
  id: 1, // Usar un ID de un administrador existente en la base de datos
  email: 'admin@ejemplo.com',
  role: 'Administrador'
};

// Función para generar un token JWT para pruebas
const generateToken = (userData) => {
  return jwt.sign(userData, JWT_SECRET, { expiresIn: '1h' });
};

// Función para probar un caso específico
async function testCase(userData, description) {
  try {
    console.log('----------------------------------');
    console.log(`PRUEBA: ${description}`);
    console.log('----------------------------------');
    console.log('URL de la función:', functionUrl);
    console.log('Usuario de prueba:', userData);
    console.log('----------------------------------');
    
    // Generar token para el usuario de prueba
    const token = generateToken(userData);
    console.log('Token JWT generado:', token.substring(0, 20) + '...');
    
    console.log('Enviando solicitud...');
    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Respuesta recibida. Código de estado:', response.status);
    
    const data = await response.json();
    
    console.log('Respuesta JSON:');
    console.log(JSON.stringify(data, null, 2));
    console.log('----------------------------------');
    
    if (data.success) {
      console.log('✅ PRUEBA EXITOSA - Perfil obtenido correctamente');
      console.log('Nombre:', data.data.nombreCompleto);
      console.log('Email:', data.data.email);
      console.log('Rol:', data.data.rol);
      
      if (userData.role === 'Copropietario' && data.data.parcela) {
        console.log('Información de parcela recibida:', data.data.parcela ? 'Sí' : 'No');
        if (data.data.parcela) {
          console.log('Nombre de parcela:', data.data.parcela.nombre);
          console.log('Superficie:', data.data.parcela.superficie, 'hectáreas');
        }
      }
      
      if (userData.role === 'Administrador') {
        console.log('Estadísticas de comunidad recibidas:', data.data.comunidadStats ? 'Sí' : 'No');
        if (data.data.comunidadStats) {
          console.log('Total parcelas:', data.data.comunidadStats.total_parcelas);
          console.log('Usuarios registrados:', data.data.comunidadStats.usuarios_registrados);
        }
      }
    } else {
      console.log('❌ PRUEBA FALLIDA - Error al obtener perfil');
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
  // Caso 1: Obtener perfil de copropietario
  await testCase(copropietarioTestData, 'OBTENER PERFIL DE COPROPIETARIO');

  // Caso 2: Obtener perfil de administrador
  await testCase(adminTestData, 'OBTENER PERFIL DE ADMINISTRADOR');
}

// Ejecutar todas las pruebas
runAllTests(); 