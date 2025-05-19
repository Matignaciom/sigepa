const { handler } = require('../obtener-informacion-comunidad');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

// Mock para mysql2/promise
jest.mock('mysql2/promise', () => {
  return {
    createConnection: jest.fn()
  };
});

// Mock para jsonwebtoken
jest.mock('jsonwebtoken', () => {
  return {
    verify: jest.fn()
  };
});

describe('obtener-informacion-comunidad', () => {
  beforeEach(() => {
    // Limpiar todos los mocks antes de cada test
    jest.clearAllMocks();
  });

  test('debería devolver 405 si el método no es GET', async () => {
    const event = {
      httpMethod: 'POST',
      headers: {}
    };

    const response = await handler(event);
    
    expect(response.statusCode).toBe(405);
    expect(JSON.parse(response.body).success).toBe(false);
  });

  test('debería devolver 401 si no se proporciona token de autenticación', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {}
    };

    const response = await handler(event);
    
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body).success).toBe(false);
  });

  test('debería devolver 401 si el token es inválido', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {
        authorization: 'Bearer token_invalido'
      }
    };

    jwt.verify.mockImplementation(() => {
      throw new Error('Token inválido');
    });

    const response = await handler(event);
    
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body).success).toBe(false);
  });

  test('debería devolver 403 si el usuario no es administrador', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {
        authorization: 'Bearer token_valido'
      }
    };

    jwt.verify.mockReturnValue({
      id: 1,
      email: 'usuario@ejemplo.com',
      role: 'Copropietario'
    });

    const response = await handler(event);
    
    expect(response.statusCode).toBe(403);
    expect(JSON.parse(response.body).success).toBe(false);
  });

  test('debería obtener correctamente la información de la comunidad', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {
        authorization: 'Bearer token_valido'
      }
    };

    jwt.verify.mockReturnValue({
      id: 1,
      email: 'admin@ejemplo.com',
      role: 'Administrador'
    });

    const mockConnection = {
      execute: jest.fn(),
      end: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn()
    };

    // Mock para obtener el ID de la comunidad
    mockConnection.execute.mockImplementationOnce(() => [
      [{ idComunidad: 2 }]
    ]);

    // Mock para obtener los datos de la comunidad
    mockConnection.execute.mockImplementationOnce(() => [
      [{
        idComunidad: 2,
        nombre: 'Comunidad de Prueba',
        fecha_creacion: '2023-01-01',
        direccion_administrativa: 'Dirección de prueba',
        telefono_contacto: '123456789',
        email_contacto: 'contacto@comunidad.com',
        sitio_web: 'www.comunidad.com',
        total_parcelas: 10,
        usuarios_registrados: 15,
        total_copropietarios: 12,
        total_administradores: 3,
        gastos_pendientes: 5,
        gastos_vencidos: 2
      }]
    ]);

    // Mock para obtener estadísticas adicionales
    mockConnection.execute.mockImplementationOnce(() => [
      [{
        monto_total_anual: 5000000,
        pagos_atrasados: 3,
        pagos_realizados: 25
      }]
    ]);

    mysql.createConnection.mockResolvedValue(mockConnection);

    const response = await handler(event);
    
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).success).toBe(true);
    
    const data = JSON.parse(response.body).data;
    expect(data.nombre).toBe('Comunidad de Prueba');
    expect(data.total_parcelas).toBe(10);
    expect(data.estadisticas).toBeDefined();
    expect(data.estadisticas.monto_total_anual).toBe(5000000);
    
    expect(mockConnection.execute).toHaveBeenCalledTimes(3);
    expect(mockConnection.end).toHaveBeenCalled();
  });

  test('debería manejar el error cuando no se encuentra la comunidad del administrador', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {
        authorization: 'Bearer token_valido'
      }
    };

    jwt.verify.mockReturnValue({
      id: 1,
      email: 'admin@ejemplo.com',
      role: 'Administrador'
    });

    const mockConnection = {
      execute: jest.fn(),
      end: jest.fn()
    };

    // Mock para no encontrar comunidad asignada
    mockConnection.execute.mockImplementationOnce(() => [[]]);

    mysql.createConnection.mockResolvedValue(mockConnection);

    const response = await handler(event);
    
    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body).success).toBe(false);
    expect(mockConnection.end).toHaveBeenCalled();
  });

  test('debería manejar error en la conexión a la base de datos', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {
        authorization: 'Bearer token_valido'
      }
    };

    jwt.verify.mockReturnValue({
      id: 1,
      email: 'admin@ejemplo.com',
      role: 'Administrador'
    });

    mysql.createConnection.mockRejectedValue(new Error('Error de conexión'));

    const response = await handler(event);
    
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).success).toBe(false);
  });
}); 