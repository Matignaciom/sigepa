// Script para probar la función de crear-notificacion
const fetch = require('node-fetch');

// URL de la función. Cuando se ejecuta localmente, normalmente es:
const functionUrl = 'http://localhost:8889/.netlify/functions/crear-notificacion';

// Token JWT del administrador (obtenido de la prueba de inicio de sesión exitosa)
const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiZW1haWwiOiJwYXRyaWNpYS5kaWF6QGVqZW1wbG8uY29tIiwicm9sZSI6IkFkbWluaXN0cmFkb3IiLCJpYXQiOjE3NDc1MDgzMDAsImV4cCI6MTc0NzU5NDcwMH0.881CB1_0N52Lbp5g9BGhcSy_-QJOMLe W-e3wKscAnRc';

// Eliminar cualquier espacio en el token
const cleanToken = adminToken.replace(/\s+/g, '');

// Datos para prueba - Notificación para todos los usuarios
const testDataTodos = {
  titulo: 'Reunión de comunidad',
  mensaje: 'Se informa a todos los copropietarios que el día 20 de octubre tendremos reunión general a las 19:00 hrs.',
  tipo: 'informacion',
  destinatarios: 'todos'
};

// Datos para prueba - Notificación para usuarios seleccionados
// El administrador pertenece a la comunidad 2, así que debemos usar IDs de usuarios de esa comunidad
const testDataSeleccionados = {
  titulo: 'Aviso de corte de agua',
  mensaje: 'Estimados vecinos, les informamos que el día 15 de octubre tendremos un corte de agua programado entre las 10:00 y 14:00 hrs.',
  tipo: 'alerta',
  destinatarios: 'seleccionados',
  usuariosSeleccionados: [12, 11, 15] // IDs reales de Andrés Pérez, Camila Soto y Daniela Morales de la comunidad 2
};

// Función para probar crear notificación para todos los usuarios
async function testCrearNotificacionTodos() {
  try {
    console.log('----------------------------------');
    console.log('PRUEBA DE CREAR NOTIFICACIÓN (Todos los usuarios)');
    console.log('----------------------------------');
    console.log('URL de la función:', functionUrl);
    console.log('Datos de prueba:', testDataTodos);
    console.log('----------------------------------');
    
    console.log('Enviando solicitud...');
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanToken}`
      },
      body: JSON.stringify(testDataTodos)
    });
    
    console.log('Respuesta recibida. Código de estado:', response.status);
    
    const data = await response.json();
    
    console.log('Respuesta JSON:');
    console.log(JSON.stringify(data, null, 2));
    console.log('----------------------------------');
    
    if (data.success) {
      console.log('✅ PRUEBA EXITOSA - Notificación creada correctamente');
      console.log('ID:', data.aviso.idAviso);
      console.log('Título:', data.aviso.titulo);
      console.log('Fecha:', data.aviso.fechaPublicacion);
    } else {
      console.log('❌ PRUEBA FALLIDA - Error al crear notificación');
      console.log('Mensaje de error:', data.message);
      console.log('Detalles del error:', data.error || 'No proporcionado');
    }
    console.log('----------------------------------');
  } catch (error) {
    console.error('❌ ERROR CRÍTICO AL EJECUTAR LA PRUEBA:');
    console.error(error);
  }
}

// Función para probar crear notificación para usuarios seleccionados
async function testCrearNotificacionSeleccionados() {
  try {
    console.log('----------------------------------');
    console.log('PRUEBA DE CREAR NOTIFICACIÓN (Usuarios seleccionados)');
    console.log('----------------------------------');
    console.log('URL de la función:', functionUrl);
    console.log('Datos de prueba:', testDataSeleccionados);
    console.log('----------------------------------');
    
    console.log('Enviando solicitud...');
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanToken}`
      },
      body: JSON.stringify(testDataSeleccionados)
    });
    
    console.log('Respuesta recibida. Código de estado:', response.status);
    
    const data = await response.json();
    
    console.log('Respuesta JSON:');
    console.log(JSON.stringify(data, null, 2));
    console.log('----------------------------------');
    
    if (data.success) {
      console.log('✅ PRUEBA EXITOSA - Notificación creada correctamente');
      console.log('ID:', data.aviso.idAviso);
      console.log('Título:', data.aviso.titulo);
      console.log('Fecha:', data.aviso.fechaPublicacion);
    } else {
      console.log('❌ PRUEBA FALLIDA - Error al crear notificación');
      console.log('Mensaje de error:', data.message);
      console.log('Detalles del error:', data.error || 'No proporcionado');
    }
    console.log('----------------------------------');
  } catch (error) {
    console.error('❌ ERROR CRÍTICO AL EJECUTAR LA PRUEBA:');
    console.error(error);
  }
}

// Ejecutar las pruebas
async function ejecutarPruebas() {
  await testCrearNotificacionTodos();
  await testCrearNotificacionSeleccionados();
}

ejecutarPruebas(); 