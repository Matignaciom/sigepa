// Prueba básica para la función obtener-perfil-admin.js
const handler = require('../obtener-perfil-admin').handler;
const jwt = require('jsonwebtoken');

// Mock de configuración
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

// Mock de mysql2/promise
jest.mock('mysql2/promise', () => {
  const mockConnection = {
    execute: jest.fn(),
    end: jest.fn().mockResolvedValue(true),
  };
  return {
    createConnection: jest.fn().mockResolvedValue(mockConnection),
  };
});

// Mock de jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

describe('obtener-perfil-admin', () => {
  let mockEvent;
  let mockContext;
  let mockConnection;

  beforeEach(() => {
    // Configurar el evento mock
    mockEvent = {
      httpMethod: 'GET',
      headers: {
        Authorization: 'Bearer test-token',
      },
    };

    // Configurar el contexto mock
    mockContext = {};

    // Configurar el mock de conexión de la base de datos
    mockConnection = require('mysql2/promise').createConnection();

    // Configurar el mock de verificación JWT
    jwt.verify.mockReturnValue({
      id: 1,
      email: 'admin@test.com',
      role: 'Administrador',
    });

    // Configurar el mock de execute para devolver los datos esperados
    mockConnection.execute.mockImplementation((query, params) => {
      if (query.includes('SELECT idComunidad FROM Usuario')) {
        return Promise.resolve([[{ idComunidad: 1 }]]);
      } else if (query.includes('SELECT u.idUsuario as id')) {
        return Promise.resolve([[{
          id: 1,
          nombreCompleto: 'Administrador Test',
          email: 'admin@test.com',
          rol: 'Administrador',
          idComunidad: 1,
          telefono: '123456789',
          direccion: 'Dirección Test',
          fecha_registro: '2023-01-01',
          ultimo_acceso: '2023-05-15',
          comunidad_nombre: 'Comunidad Test',
          comunidad_direccion: 'Dirección Comunidad',
          comunidad_telefono: '987654321',
          comunidad_email: 'comunidad@test.com',
          comunidad_sitio_web: 'www.comunidad-test.com'
        }]]);
      } else if (query.includes('SELECT c.idComunidad')) {
        return Promise.resolve([[{
          idComunidad: 1,
          nombre: 'Comunidad Test',
          fecha_creacion: '2022-01-01',
          direccion_administrativa: 'Dirección Comunidad',
          telefono_contacto: '987654321',
          email_contacto: 'comunidad@test.com',
          sitio_web: 'www.comunidad-test.com',
          total_parcelas: 10,
          usuarios_registrados: 20,
          total_copropietarios: 18,
          total_administradores: 2,
          gastos_pendientes: 5,
          gastos_vencidos: 2,
          monto_total_anual: 1000000,
          pagos_atrasados: 3,
          pagos_realizados: 50
        }]]);
      }
      return Promise.resolve([[]]);
    });
  });

  it('debería devolver error 405 para métodos no permitidos', async () => {
    mockEvent.httpMethod = 'POST';
    const response = await handler(mockEvent, mockContext);
    expect(response.statusCode).toBe(405);
    expect(JSON.parse(response.body).success).toBe(false);
  });

  it('debería devolver error 401 si no hay token de autorización', async () => {
    mockEvent.headers = {};
    const response = await handler(mockEvent, mockContext);
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body).success).toBe(false);
  });

  it('debería devolver error 403 si el usuario no es administrador', async () => {
    jwt.verify.mockReturnValueOnce({
      id: 2,
      email: 'usuario@test.com',
      role: 'Copropietario',
    });
    const response = await handler(mockEvent, mockContext);
    expect(response.statusCode).toBe(403);
    expect(JSON.parse(response.body).success).toBe(false);
  });

  it('debería devolver el perfil completo del administrador', async () => {
    const response = await handler(mockEvent, mockContext);
    expect(response.statusCode).toBe(200);
    const responseBody = JSON.parse(response.body);
    
    expect(responseBody.success).toBe(true);
    expect(responseBody.data).toHaveProperty('informacion_personal');
    expect(responseBody.data).toHaveProperty('actividad_cuenta');
    expect(responseBody.data).toHaveProperty('comunidad');
    
    expect(responseBody.data.informacion_personal.id).toBe(1);
    expect(responseBody.data.informacion_personal.nombreCompleto).toBe('Administrador Test');
    expect(responseBody.data.informacion_personal.email).toBe('admin@test.com');
    expect(responseBody.data.informacion_personal.rol).toBe('Administrador');
    
    expect(responseBody.data.actividad_cuenta.comunidad).toBe('Comunidad Test');
    
    expect(responseBody.data.comunidad.nombre).toBe('Comunidad Test');
    expect(responseBody.data.comunidad.total_parcelas).toBe(10);
    expect(responseBody.data.comunidad.usuarios_registrados).toBe(20);
  });
}); 