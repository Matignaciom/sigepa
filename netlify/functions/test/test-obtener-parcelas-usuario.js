// Script para probar la función de obtener-parcelas-usuario
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

// URL de la función. Cuando se ejecuta localmente, normalmente es:
const functionUrl = 'http://localhost:8889/.netlify/functions/obtener-parcelas-usuario';

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
    
    if (data.success) {
      console.log('✅ PRUEBA EXITOSA - Parcelas obtenidas correctamente');
      
      if (data.data) {
        const { parcelas, estadisticas } = data.data;
        
        // Mostrar estadísticas
        console.log('Estadísticas:');
        console.log(`  - Total de parcelas: ${estadisticas.total}`);
        console.log(`  - Parcelas al día: ${estadisticas.por_estado['Al día']}`);
        console.log(`  - Parcelas pendientes: ${estadisticas.por_estado['Pendiente']}`);
        console.log(`  - Parcelas atrasadas: ${estadisticas.por_estado['Atrasado']}`);
        
        if (estadisticas.area_promedio) {
          console.log(`  - Área promedio: ${estadisticas.area_promedio.toFixed(2)} hectáreas`);
        }
        if (estadisticas.area_total) {
          console.log(`  - Área total: ${estadisticas.area_total.toFixed(2)} hectáreas`);
        }
        
        // Mostrar parcelas
        console.log(`\nParcelas (${parcelas.length}):`);
        parcelas.forEach((parcela, index) => {
          console.log(`${index + 1}. ${parcela.nombre}`);
          console.log(`   - Dirección: ${parcela.direccion}`);
          console.log(`   - Área: ${parcela.area} hectáreas`);
          console.log(`   - Estado: ${parcela.estado}`);
          console.log(`   - Fecha adquisición: ${new Date(parcela.fechaAdquisicion).toLocaleDateString('es-ES')}`);
          
          if (parcela.propietario) {
            console.log(`   - Propietario: ${parcela.propietario.nombre} (ID: ${parcela.propietario.id})`);
          }
          
          if (parcela.contrato) {
            console.log(`   - Contrato: ${parcela.contrato.estado}`);
            if (parcela.contrato.fechaInicio) {
              console.log(`     Desde: ${new Date(parcela.contrato.fechaInicio).toLocaleDateString('es-ES')}`);
            }
            if (parcela.contrato.fechaFin) {
              console.log(`     Hasta: ${new Date(parcela.contrato.fechaFin).toLocaleDateString('es-ES')}`);
            }
          }
        });
      } else {
        console.log('No se encontraron datos de parcelas');
      }
    } else {
      console.log('❌ PRUEBA FALLIDA - Error al obtener parcelas');
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
  // Caso 1: Obtener parcelas como copropietario
  await testCase(copropietarioTestData, 'OBTENER PARCELAS COMO COPROPIETARIO');

  // Caso 2: Obtener parcelas como administrador
  await testCase(adminTestData, 'OBTENER PARCELAS COMO ADMINISTRADOR');
}

// Ejecutar todas las pruebas
runAllTests(); 