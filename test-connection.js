// Script para probar la conexión a la base de datos
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Cargar variables de entorno
dotenv.config();

// Función para probar la conexión
async function testConnection() {
  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
  };
  
  console.log('Configuración de la base de datos:', {
    host: dbConfig.host,
    user: dbConfig.user,
    port: dbConfig.port,
    database: process.env.DB_NAME
  });
  
  try {
    console.log('Intentando conectar a la base de datos...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('Conexión establecida correctamente con el servidor MySQL');
    
    // Comprobar si la base de datos existe
    const [rows] = await connection.execute(`SHOW DATABASES LIKE '${process.env.DB_NAME}'`);
    if (rows.length > 0) {
      console.log(`La base de datos ${process.env.DB_NAME} existe`);
    } else {
      console.log(`La base de datos ${process.env.DB_NAME} no existe y debe ser creada`);
    }
    
    await connection.end();
    console.log('Conexión cerrada correctamente');
    return true;
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
    return false;
  }
}

// Ejecutar la prueba
testConnection()
  .then(result => {
    console.log('Resultado de la prueba:', result ? 'Éxito' : 'Fallo');
    process.exit(result ? 0 : 1);
  })
  .catch(error => {
    console.error('Error no manejado:', error);
    process.exit(1);
  }); 