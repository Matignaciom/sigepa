// Script para probar la función de obtener-comunidad-usuario
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

// URL de la función. Cuando se ejecuta localmente, normalmente es:
const functionUrl = 'http://localhost:8889/.netlify/functions/obtener-comunidad-usuario';

// Clave secreta para firmar los tokens JWT (debe ser la misma que en las funciones)
const JWT_SECRET = 'sigepa_secret_key_development';

// Datos para prueba - Copropietario
const copropietarioTestData = {
  id: 24, // ID del copropietario Tomás Navarro
  email: 'tomas.navarro@ejemplo.com',
  role: 'Copropietario'
};

// Datos para prueba - Administrador
const adminTestData = {
  id: 3, // ID estimado para Carlos Rodríguez (ajustar según la base de datos)
  email: 'carlos.rodriguez@ejemplo.com',
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
      console.log('✅ PRUEBA EXITOSA - Comunidad obtenida correctamente');
      console.log('Nombre de comunidad:', data.comunidad.nombre);
      console.log('Fecha de creación:', data.comunidad.fecha_creacion);
      console.log('Total parcelas:', data.comunidad.total_parcelas);
      console.log('Total usuarios:', data.comunidad.total_usuarios);
    } else {
      console.log('❌ PRUEBA FALLIDA - Error al obtener comunidad');
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
  // Caso 1: Obtener comunidad como copropietario
  await testCase(copropietarioTestData, 'OBTENER COMUNIDAD COMO COPROPIETARIO');

  // Caso 2: Obtener comunidad como administrador
  await testCase(adminTestData, 'OBTENER COMUNIDAD COMO ADMINISTRADOR');
}

// Ejecutar todas las pruebas
runAllTests(); 