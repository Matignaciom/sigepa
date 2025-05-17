// Script para probar todas las funciones relacionadas con notificaciones
const fetch = require('node-fetch');

// URL base para las funciones
const baseUrl = 'http://localhost:8889/.netlify/functions';

// Token JWT del administrador obtenido al iniciar sesión (corregido exacto de la respuesta)
const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiZW1haWwiOiJwYXRyaWNpYS5kaWF6QGVqZW1wbG8uY29tIiwicm9sZSI6IkFkbWluaXN0cmFkb3IiLCJpYXQiOjE3NDc1MDgzMDAsImV4cCI6MTc0NzU5NDcwMH0.881CB1_0N52Lbp5g9BGhcSy_-QJOMLe W-e3wKscAnRc';

// Eliminar cualquier espacio en el token
const cleanToken = adminToken.replace(/\s+/g, '');

// Variables globales para almacenar datos entre pruebas
let idNotificacionCreada;

// ====== 1. Prueba de crear notificación ======
async function testCrearNotificacion() {
  try {
    console.log('\n===========================================');
    console.log('1️⃣ PRUEBA: CREAR NOTIFICACIÓN');
    console.log('===========================================');
    
    const testData = {
      titulo: 'Importante: Asamblea extraordinaria',
      mensaje: 'Estimados vecinos, se convoca a asamblea extraordinaria para el día 25 de octubre a las 19:00 hrs en el salón comunal.',
      tipo: 'informacion',
      destinatarios: 'todos'
    };
    
    console.log('Datos de prueba:', testData);
    
    const response = await fetch(`${baseUrl}/crear-notificacion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanToken}`
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Código de estado:', response.status);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ PRUEBA EXITOSA - Notificación creada correctamente');
      console.log('ID:', data.aviso.idAviso);
      console.log('Título:', data.aviso.titulo);
      console.log('Fecha:', data.aviso.fechaPublicacion);
      
      // Guardamos el ID para usar en pruebas posteriores
      idNotificacionCreada = data.aviso.idAviso;
    } else {
      console.log('❌ PRUEBA FALLIDA - Error al crear notificación');
      console.log('Error:', data.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error en testCrearNotificacion:', error);
  }
}

// ====== 2. Prueba de actualizar notificación ======
async function testActualizarNotificacion() {
  try {
    console.log('\n===========================================');
    console.log('2️⃣ PRUEBA: ACTUALIZAR NOTIFICACIÓN');
    console.log('===========================================');
    
    // Verificar que tengamos un ID de notificación
    if (!idNotificacionCreada) {
      console.log('❌ No se puede ejecutar la prueba: No hay ID de notificación disponible');
      return;
    }
    
    const testData = {
      idAviso: idNotificacionCreada,
      titulo: 'ACTUALIZADO: Asamblea extraordinaria',
      mensaje: 'ACTUALIZADO: La asamblea extraordinaria ha cambiado de fecha. Ahora será el día 26 de octubre a las 20:00 hrs.',
      tipo: 'alerta',
      destinatarios: 'todos'
    };
    
    console.log('Datos de prueba:', testData);
    
    const response = await fetch(`${baseUrl}/actualizar-notificacion`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanToken}`
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Código de estado:', response.status);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ PRUEBA EXITOSA - Notificación actualizada correctamente');
      console.log('ID:', data.aviso.idAviso);
      console.log('Título:', data.aviso.titulo);
      console.log('Tipo:', data.aviso.tipo);
    } else {
      console.log('❌ PRUEBA FALLIDA - Error al actualizar notificación');
      console.log('Error:', data.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error en testActualizarNotificacion:', error);
  }
}

// ====== 3. Prueba de estadísticas de notificaciones ======
async function testEstadisticasNotificaciones() {
  try {
    console.log('\n===========================================');
    console.log('3️⃣ PRUEBA: ESTADÍSTICAS DE NOTIFICACIONES');
    console.log('===========================================');
    
    const response = await fetch(`${baseUrl}/estadisticas-notificaciones`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cleanToken}`
      }
    });
    
    console.log('Código de estado:', response.status);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ PRUEBA EXITOSA - Estadísticas obtenidas correctamente');
      console.log('Mensaje de resumen:');
      console.log(data.mensaje);
      
      console.log('\nDetalle de estadísticas:');
      console.log('Total enviadas:', data.estadisticas.total.enviadas);
      console.log('Total este mes:', data.estadisticas.total.este_mes);
      console.log('Tasa de apertura:', data.estadisticas.tasa_apertura + '%');
      console.log('Tiempo promedio de respuesta:', data.estadisticas.tiempo_respuesta + 'h');
      
      console.log('\nNotificaciones recientes:');
      data.estadisticas.recientes.forEach((notif, index) => {
        console.log(`${index + 1}. "${notif.titulo}" - ${notif.fechaPublicacion} (Leídas: ${notif.total_leidas}/${notif.total_destinatarios})`);
      });
    } else {
      console.log('❌ PRUEBA FALLIDA - Error al obtener estadísticas');
      console.log('Error:', data.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error en testEstadisticasNotificaciones:', error);
  }
}

// ====== 4. Prueba de eliminar notificación ======
async function testEliminarNotificacion() {
  try {
    console.log('\n===========================================');
    console.log('4️⃣ PRUEBA: ELIMINAR NOTIFICACIÓN');
    console.log('===========================================');
    
    // Verificar que tengamos un ID de notificación
    if (!idNotificacionCreada) {
      console.log('❌ No se puede ejecutar la prueba: No hay ID de notificación disponible');
      return;
    }
    
    console.log('Eliminando notificación con ID:', idNotificacionCreada);
    
    const response = await fetch(`${baseUrl}/eliminar-notificacion?id=${idNotificacionCreada}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${cleanToken}`
      }
    });
    
    console.log('Código de estado:', response.status);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ PRUEBA EXITOSA - Notificación eliminada correctamente');
      console.log('Mensaje:', data.message);
    } else {
      console.log('❌ PRUEBA FALLIDA - Error al eliminar notificación');
      console.log('Error:', data.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error en testEliminarNotificacion:', error);
  }
}

// Función principal que ejecuta todas las pruebas secuencialmente
async function ejecutarTodasLasPruebas() {
  console.log('INICIANDO PRUEBAS DE FUNCIONES DE NOTIFICACIONES');
  console.log('===============================================');
  
  try {
    // 1. Crear notificación
    await testCrearNotificacion();
    
    // 2. Actualizar notificación
    await testActualizarNotificacion();
    
    // 3. Estadísticas de notificaciones
    await testEstadisticasNotificaciones();
    
    // 4. Eliminar notificación
    await testEliminarNotificacion();
    
    console.log('\n===============================================');
    console.log('TODAS LAS PRUEBAS COMPLETADAS');
    console.log('===============================================');
  } catch (error) {
    console.error('ERROR AL EJECUTAR LAS PRUEBAS:', error);
  }
}

// Ejecutar todas las pruebas
ejecutarTodasLasPruebas(); 