// Script para probar la función de obtener-actividades-recientes
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

// URL de la función. Cuando se ejecuta localmente, normalmente es:
const functionUrl = 'http://localhost:8889/.netlify/functions/obtener-actividades-recientes';

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
async function testCase(userData, description, limit = null) {
  try {
    console.log('----------------------------------');
    console.log(`PRUEBA: ${description}${limit ? ` (Límite: ${limit})` : ''}`);
    console.log('----------------------------------');
    console.log('URL de la función:', functionUrl);
    console.log('Usuario de prueba:', userData);
    console.log('----------------------------------');
    
    // Generar token para el usuario de prueba
    const token = generateToken(userData);
    console.log('Token JWT generado:', token.substring(0, 20) + '...');
    
    // Construir URL con parámetros si es necesario
    let url = functionUrl;
    if (limit) {
      url += `?limit=${limit}`;
    }
    
    console.log('Enviando solicitud a:', url);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Respuesta recibida. Código de estado:', response.status);
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ PRUEBA EXITOSA - Actividades recientes obtenidas correctamente');
      console.log(`Total de actividades obtenidas: ${data.data ? data.data.length : 0}`);
      
      if (data.data && data.data.length > 0) {
        console.log('Resumen de actividades:');
        data.data.forEach((actividad, index) => {
          console.log(`${index + 1}. ${actividad.tipo.toUpperCase()} - ${actividad.titulo}`);
          console.log(`   ${actividad.descripcion}`);
          console.log(`   Fecha: ${new Date(actividad.fecha).toLocaleString('es-ES')}`);
        });
      } else {
        console.log('No se encontraron actividades para este usuario');
      }
    } else {
      console.log('❌ PRUEBA FALLIDA - Error al obtener actividades recientes');
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
  // Caso 1: Obtener actividades como copropietario (por defecto, 10 actividades)
  await testCase(copropietarioTestData, 'OBTENER ACTIVIDADES COMO COPROPIETARIO');

  // Caso 2: Obtener actividades como copropietario (con límite personalizado)
  await testCase(copropietarioTestData, 'OBTENER ACTIVIDADES COMO COPROPIETARIO (LÍMITE 5)', 5);

  // Caso 3: Obtener actividades como administrador
  await testCase(adminTestData, 'OBTENER ACTIVIDADES COMO ADMINISTRADOR');
}

// Ejecutar todas las pruebas
runAllTests(); 