const { handler } = require('../obtener-estadisticas-pagos');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

// Mock de JWT
jest.mock('jsonwebtoken');

// Mock de MySQL
jest.mock('mysql2/promise');

describe('obtener-estadisticas-pagos lambda function', () => {
  let mockConnection;
  let mockExecute;
  
  beforeEach(() => {
    // Configurar mocks
    mockExecute = jest.fn();
    mockConnection = {
      execute: mockExecute,
      end: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn()
    };
    mysql.createConnection.mockResolvedValue(mockConnection);
    
    // Mock de JWT.verify
    jwt.verify.mockImplementation((token) => {
      if (token === 'valid-token') {
        return { id: 1, role: 'Copropietario' };
      } else if (token === 'admin-token') {
        return { id: 2, role: 'Administrador' };
      } else {
        throw new Error('Token inválido');
      }
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('Debería rechazar peticiones no GET', async () => {
    const event = {
      httpMethod: 'POST',
      headers: {},
      body: JSON.stringify({})
    };
    
    const response = await handler(event);
    
    expect(response.statusCode).toBe(405);
    expect(JSON.parse(response.body).success).toBe(false);
  });
  
  test('Debería rechazar peticiones sin token de autenticación', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {},
      queryStringParameters: {}
    };
    
    const response = await handler(event);
    
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body).success).toBe(false);
  });
  
  test('Debería rechazar peticiones con token inválido', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {
        Authorization: 'Bearer invalid-token'
      },
      queryStringParameters: {}
    };
    
    jwt.verify.mockImplementationOnce(() => {
      throw new Error('Token inválido');
    });
    
    const response = await handler(event);
    
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body).success).toBe(false);
  });
  
  test('Debería obtener estadísticas para un copropietario', async () => {
    // Configurar evento de prueba
    const event = {
      httpMethod: 'GET',
      headers: {
        Authorization: 'Bearer valid-token'
      },
      queryStringParameters: {}
    };
    
    // Simular resultados de la base de datos
    mockExecute.mockImplementation((query, params) => {
      if (query.includes('SELECT idComunidad FROM Usuario')) {
        return [[{ idComunidad: 1 }]];
      } else if (query.includes('SELECT idParcela FROM Parcela')) {
        return [[{ idParcela: 101 }, { idParcela: 102 }]];
      } else if (query.includes('FROM Pago p')) {
        return [[
          { idPago: 1, montoPagado: '100.00', fechaPago: '2023-01-15', fechaVencimiento: '2023-01-20', estado: 'Pagado', tipo_pago: 'puntual', mes: 1, año: 2023 },
          { idPago: 2, montoPagado: '150.00', fechaPago: '2023-02-25', fechaVencimiento: '2023-02-20', estado: 'Pagado', tipo_pago: 'atrasado', mes: 2, año: 2023 }
        ]];
      } else if (query.includes('FROM GastoParcela gp') && !query.includes('JOIN GastoComun')) {
        return [[
          { estado: 'Pendiente', monto: '120.00' },
          { estado: 'Pagado', monto: '100.00' },
          { estado: 'Pagado', monto: '150.00' },
          { estado: 'Atrasado', monto: '200.00' }
        ]];
      } else if (query.includes('gc.concepto')) {
        return [[
          { concepto: 'Cuota de Mayo', fechaVencimiento: '2023-05-20', monto: '120.00' }
        ]];
      }
      return [[]];
    });
    
    const response = await handler(event);
    
    expect(response.statusCode).toBe(200);
    
    // Verificar el contenido de la respuesta
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    
    // Verificar los datos de estadísticas
    const data = body.data;
    expect(data.pagosRealizados).toBe(2);
    expect(data.pagosPuntuales).toBe(1);
    expect(data.pagosAtrasados).toBe(1);
    expect(data.puntualidad).toBe(50); // 1 de 2 pagos puntuales = 50%
    expect(data.saldoPendiente).toBeGreaterThan(0);
    expect(data.proximoPago.concepto).toBe('Cuota de Mayo');
    
    // Verificar llamadas a la base de datos
    expect(mockConnection.execute).toHaveBeenCalled();
    expect(mockConnection.end).toHaveBeenCalled();
  });
  
  test('Debería obtener estadísticas para un administrador', async () => {
    // Configurar evento de prueba
    const event = {
      httpMethod: 'GET',
      headers: {
        Authorization: 'Bearer admin-token'
      },
      queryStringParameters: {}
    };
    
    // Simular resultados de la base de datos
    mockExecute.mockImplementation((query, params) => {
      if (query.includes('SELECT idComunidad FROM Usuario')) {
        return [[{ idComunidad: 1 }]];
      } else if (query.includes('FROM Pago p')) {
        return [[
          { idPago: 1, montoPagado: '100.00', fechaPago: '2023-01-15', fechaVencimiento: '2023-01-20', estado: 'Pagado', tipo_pago: 'puntual', mes: 1, año: 2023 },
          { idPago: 2, montoPagado: '150.00', fechaPago: '2023-02-25', fechaVencimiento: '2023-02-20', estado: 'Pagado', tipo_pago: 'atrasado', mes: 2, año: 2023 },
          { idPago: 3, montoPagado: '200.00', fechaPago: '2023-03-15', fechaVencimiento: '2023-03-20', estado: 'Pagado', tipo_pago: 'puntual', mes: 3, año: 2023 }
        ]];
      } else if (query.includes('FROM GastoParcela gp') && query.includes('JOIN Parcela p')) {
        return [[
          { estado: 'Pendiente', monto: '120.00' },
          { estado: 'Pagado', monto: '100.00' },
          { estado: 'Pagado', monto: '150.00' },
          { estado: 'Atrasado', monto: '200.00' },
          { estado: 'Pagado', monto: '200.00' }
        ]];
      } else if (query.includes('FROM GastoComun')) {
        return [[
          { concepto: 'Cuota Trimestral', fechaVencimiento: '2023-06-30', monto: '500.00' }
        ]];
      }
      return [[]];
    });
    
    const response = await handler(event);
    
    expect(response.statusCode).toBe(200);
    
    // Verificar el contenido de la respuesta
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    
    // Verificar los datos de estadísticas
    const data = body.data;
    expect(data.pagosRealizados).toBe(3);
    expect(data.pagosPuntuales).toBe(2);
    expect(data.pagosAtrasados).toBe(1);
    expect(data.puntualidad).toBe(67); // 2 de 3 pagos puntuales ≈ 67%
    expect(data.saldoPendiente).toBeGreaterThan(0);
    expect(data.proximoPago.concepto).toBe('Cuota Trimestral');
    
    // Verificar llamadas a la base de datos
    expect(mockConnection.execute).toHaveBeenCalled();
    expect(mockConnection.end).toHaveBeenCalled();
  });
  
  test('Debería manejar errores de base de datos', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {
        Authorization: 'Bearer valid-token'
      },
      queryStringParameters: {}
    };
    
    // Simular error en la base de datos
    mockExecute.mockImplementationOnce(() => {
      return [[{ idComunidad: 1 }]];
    }).mockImplementationOnce(() => {
      throw new Error('Error de base de datos');
    });
    
    const response = await handler(event);
    
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).success).toBe(false);
    expect(mockConnection.end).toHaveBeenCalled();
  });
});