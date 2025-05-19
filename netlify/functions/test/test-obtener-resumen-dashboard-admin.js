// Script para probar la función de obtener-resumen-dashboard-admin
const fetch = require('node-fetch');

// URL de la función. Cuando se ejecuta localmente, normalmente es:
const functionUrl = 'http://localhost:8889/.netlify/functions/obtener-resumen-dashboard-admin';

// Token de prueba (debe ser un token válido de un administrador)
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Reemplazar con un token válido para pruebas

async function testObtenerResumenAdmin() {
  try {
    console.log('----------------------------------');
    console.log('PRUEBA DE OBTENCIÓN DE RESUMEN DASHBOARD ADMIN');
    console.log('----------------------------------');
    console.log('URL de la función:', functionUrl);
    console.log('Token utilizado:', testToken ? 'Sí (token truncado por seguridad)' : 'No');
    console.log('----------------------------------');
    
    console.log('Enviando solicitud...');
    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      }
    });
    
    console.log('Respuesta recibida. Código de estado:', response.status);
    
    const data = await response.json();
    
    console.log('Respuesta JSON (resumida):');
    if (data.success) {
      console.log('success:', data.success);
      console.log('message:', data.message);
      
      const resumen = data.data.resumenData;
      console.log('Resumen Dashboard:');
      console.log('- Total usuarios:', resumen.totalUsuarios);
      console.log('- Total parcelas:', resumen.totalParcelas);
      console.log('- Parcelas activas:', resumen.parcelasActivas);
      console.log('- Pagos pendientes:', resumen.pagosPendientes);
      console.log('- Pagos pagados:', resumen.pagosPagados);
      console.log('- Monto recaudado mes:', resumen.montoRecaudadoMes);
      console.log('- Nombre comunidad:', resumen.nombreComunidad);
      console.log('- Total copropietarios:', resumen.totalCopropietarios);
      console.log('- Contratos vigentes:', resumen.contratosVigentes);
      console.log('- Contratos próximos a vencer:', resumen.contratosProximosVencer);
      console.log('- Alertas activas:', resumen.alertasActivas);
      console.log('- Avisos recientes:', resumen.avisosRecientes);
      
      console.log('Actividades recientes:', data.data.actividadesRecientes.length);
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
    console.log('----------------------------------');
    
    if (data.success) {
      console.log('✅ PRUEBA EXITOSA - Resumen del dashboard de administrador obtenido correctamente');
    } else {
      console.log('❌ PRUEBA FALLIDA - Error al obtener resumen');
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
testObtenerResumenAdmin(); 