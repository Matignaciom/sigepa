/**
 * Servicio para integración con Transbank WebPay Plus
 * Documentación oficial: https://www.transbankdevelopers.cl/documentacion/webpay-plus#crear-una-transaccion
 * 
 * NOTA: Esta implementación es para entorno de DESARROLLO, usa credenciales de prueba proporcionadas por Transbank
 */

// URL base del servicio de Transbank según el ambiente
const TRANSBANK_URL = {
  // Para pruebas
  DEVELOPMENT: 'https://webpay3gint.transbank.cl',
  // Para producción
  PRODUCTION: 'https://webpay3g.transbank.cl'
};

// Token y llaves para desarrollo/pruebas
// Para producción, estos valores serán proporcionados por Transbank
const CREDENTIALS = {
  DEVELOPMENT: {
    // Credenciales para ambiente de integración (pruebas)
    COMMERCE_CODE: '597055555532',
    API_KEY: '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C'
  },
  PRODUCTION: {
    // Credenciales para ambiente de producción (reales)
    COMMERCE_CODE: '', // Tu código de comercio en producción
    API_KEY: '' // Tu API Key en producción
  }
};

// Enum para los diferentes ambientes
export enum Environment {
  DEVELOPMENT = 'DEVELOPMENT',
  PRODUCTION = 'PRODUCTION'
}

// Configuración actual (por defecto desarrollo)
const currentEnvironment: Environment = Environment.DEVELOPMENT;

// Helper para tipar correctamente las credenciales según el ambiente
type CredentialType = typeof CREDENTIALS.DEVELOPMENT;

// Función para obtener credenciales tipadas correctamente
const getCredentials = (env: Environment): CredentialType => {
  return CREDENTIALS[env];
};

// Interfaces para las peticiones y respuestas de Transbank
export interface CreateTransactionRequest {
  buy_order: string; // Orden de compra, debe ser único
  session_id: string; // ID de sesión de compra
  amount: number; // Monto a pagar
  return_url: string; // URL donde redirige después del pago
}

export interface CreateTransactionResponse {
  token: string; // Token de la transacción
  url: string; // URL de redirección a Webpay
}

export interface CommitTransactionResponse {
  vci: string;
  amount: number;
  status: string;
  buy_order: string;
  session_id: string;
  card_detail: {
    card_number: string;
  };
  accounting_date: string;
  transaction_date: string;
  authorization_code: string;
  payment_type_code: string;
  response_code: number;
  installments_amount: number;
  installments_number: number;
}

// SIMULACIÓN PARA AMBIENTE DE DESARROLLO
// En producción esto se conectaría a la API real de Transbank
const simulateTransbank = (success = true, delay = 1500): Promise<any> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (success) {
        resolve(true);
      } else {
        reject(new Error('Error simulado de Transbank'));
      }
    }, delay);
  });
};

// Función para crear una transacción en Transbank
export const createTransaction = async (
  buyOrder: string,
  sessionId: string,
  amount: number,
  returnUrl: string
): Promise<CreateTransactionResponse> => {
  try {
    // En el entorno de desarrollo, simulamos la respuesta
    if (currentEnvironment === Environment.DEVELOPMENT) {
      await simulateTransbank();
      
      // Generamos un token simulado
      const token = `SIMULACION_${Math.random().toString(36).substring(2, 15)}`;
      
      return {
        token,
        url: `${returnUrl}?token_ws=${token}`  // Simulamos la URL de retorno
      };
    }
    
    // Código para ambiente real - se usaría en producción
    const response = await fetch(`${TRANSBANK_URL[currentEnvironment]}/rswebpaytransaction/api/webpay/v1.2/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Tbk-Api-Key-Id': getCredentials(currentEnvironment).COMMERCE_CODE,
        'Tbk-Api-Key-Secret': getCredentials(currentEnvironment).API_KEY
      },
      body: JSON.stringify({
        buy_order: buyOrder,
        session_id: sessionId,
        amount: amount,
        return_url: returnUrl
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al crear transacción: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al crear transacción en Transbank:', error);
    throw error;
  }
};

// Función para confirmar una transacción una vez que el usuario regresa de la página de pago
export const commitTransaction = async (token: string): Promise<CommitTransactionResponse> => {
  try {
    // En el entorno de desarrollo, simulamos la respuesta
    if (currentEnvironment === Environment.DEVELOPMENT) {
      await simulateTransbank();
      
      // Retornamos datos simulados
      return {
        vci: "TSY",
        amount: 10000,
        status: "AUTHORIZED",
        buy_order: `SIMULADO-${Date.now()}`,
        session_id: `SESION-${Date.now()}`,
        card_detail: {
          card_number: "XXXX-XXXX-XXXX-6623"
        },
        accounting_date: new Date().toISOString().split('T')[0],
        transaction_date: new Date().toISOString(),
        authorization_code: "123456",
        payment_type_code: "VN",
        response_code: 0,
        installments_amount: 0,
        installments_number: 0
      };
    }
    
    // Código para ambiente real - se usaría en producción
    const response = await fetch(`${TRANSBANK_URL[currentEnvironment]}/rswebpaytransaction/api/webpay/v1.2/transactions/${token}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Tbk-Api-Key-Id': getCredentials(currentEnvironment).COMMERCE_CODE,
        'Tbk-Api-Key-Secret': getCredentials(currentEnvironment).API_KEY
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al confirmar transacción: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al confirmar transacción en Transbank:', error);
    throw error;
  }
};

// Función para obtener el estado de una transacción
export const getTransactionStatus = async (token: string): Promise<CommitTransactionResponse> => {
  try {
    // En el entorno de desarrollo, simulamos la respuesta
    if (currentEnvironment === Environment.DEVELOPMENT) {
      await simulateTransbank();
      
      // Retornamos datos simulados
      return {
        vci: "TSY",
        amount: 10000,
        status: "AUTHORIZED",
        buy_order: `SIMULADO-${Date.now()}`,
        session_id: `SESION-${Date.now()}`,
        card_detail: {
          card_number: "XXXX-XXXX-XXXX-6623"
        },
        accounting_date: new Date().toISOString().split('T')[0],
        transaction_date: new Date().toISOString(),
        authorization_code: "123456",
        payment_type_code: "VN",
        response_code: 0,
        installments_amount: 0,
        installments_number: 0
      };
    }
    
    // Código para ambiente real - se usaría en producción
    const response = await fetch(`${TRANSBANK_URL[currentEnvironment]}/rswebpaytransaction/api/webpay/v1.2/transactions/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Tbk-Api-Key-Id': getCredentials(currentEnvironment).COMMERCE_CODE,
        'Tbk-Api-Key-Secret': getCredentials(currentEnvironment).API_KEY
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al obtener estado de transacción: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al obtener estado de transacción en Transbank:', error);
    throw error;
  }
};

// Función para generar una orden de compra única basada en el ID de pago y timestamp
export const generateBuyOrder = (pagoId: number): string => {
  const timestamp = new Date().getTime();
  return `SIGEPA-${pagoId}-${timestamp}`;
};

// Función para generar un ID de sesión único
export const generateSessionId = (userId: number): string => {
  const timestamp = new Date().getTime();
  return `SESSION-${userId}-${timestamp}`;
};

// Función para generar una URL de retorno desde WebPay
export const getReturnUrl = (): string => {
  // La URL base de la aplicación
  const baseUrl = window.location.origin;
  // URL donde manejaremos el retorno del pago
  return `${baseUrl}/pago-retorno`;
};

export default {
  createTransaction,
  commitTransaction,
  getTransactionStatus,
  generateBuyOrder,
  generateSessionId,
  getReturnUrl,
  Environment
}; 