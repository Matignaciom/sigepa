// Configuración de la API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// URL base para las funciones de Netlify (si estamos en desarrollo, usamos localhost)
const NETLIFY_FUNCTIONS_URL = import.meta.env.DEV 
  ? 'http://localhost:8889/.netlify/functions'
  : '/.netlify/functions';

// Tipos de datos para las respuestas de la API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Interfaces para los tipos de datos
export interface UserProfile {
  nombreCompleto: string;
  email: string;
  telefono: string;
  direccion: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UsuarioCompleto {
  id: number;
  nombreCompleto: string;
  email: string;
  rol: string;
  idComunidad: number;
  telefono: string;
  direccion: string;
  comunidad: string;
  direccionComunidad: string;
  parcela?: {
    id: number;
    nombre: string;
    direccion: string;
    superficie: number;
    fechaAdquisicion: string;
    valorCatastral: number;
    estado: string;
    contrato: {
      id: number;
      estado: string;
    }
  };
}

// Interfaces para pagos
export interface PagoPendiente {
  id: number;
  idGasto: number;
  idParcela: number;
  concepto: string;
  fechaVencimiento: string;
  monto: number;
  estado: 'Pendiente' | 'Próximo' | 'Atrasado';
  tipo: string;
  nombreParcela?: string;
}

export interface PagoRealizado {
  id: number;
  idGasto: number;
  idParcela: number;
  concepto: string;
  fechaPago: string;
  monto: number;
  comprobante: string;
  transaccion_id?: string;
  descripcion?: string;
  nombreParcela?: string;
  tipo?: string;
}

export interface ResumenPagosPendientes {
  proximoVencimiento: {
    fecha: string | null;
    concepto: string;
    tipo: string;
    monto: number;
  };
  totalPendiente: {
    monto: number;
    cantidadCuotas: number;
  };
  pagosPendientes: PagoPendiente[];
}

export interface ResumenPagosRealizados {
  resumen: {
    cantidadPagos: number;
    fechaUltimoPago: string | null;
    totalPagado: number;
    totalTrimestre: number;
  };
  pagosRealizados: PagoRealizado[];
  comprobante?: PagoRealizado & {
    nombreUsuario?: string;
    emailUsuario?: string;
  };
}

export interface RespuestaProcesoPago {
  transaccion_id: string;
  comprobante: string;
  monto: number;
  fechaPago: string;
  cantidadPagosRealizados?: number;
}

// Opciones por defecto para las peticiones fetch
const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
};

// Función para agregar el token de autenticación a las peticiones
const getAuthHeader = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Función genérica para realizar peticiones a la API
async function fetchApi<T>(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  customOptions: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    // Determinar la URL base adecuada
    let baseUrl = '';
    
    // Si la URL empieza con http o /, usar la URL directamente
    if (endpoint.startsWith('http') || endpoint.startsWith('/')) {
      baseUrl = '';
    } else if (endpoint.includes('.netlify/functions')) {
      // Si es una función de Netlify, usar la URL de las funciones
      baseUrl = '';
    } else {
      // En otro caso, usar la URL de la API
      baseUrl = API_URL;
    }
    
    const url = `${baseUrl}${endpoint}`;
    console.log(`Realizando solicitud ${method} a: ${url}`);
    
    const options: RequestInit = {
      ...defaultOptions,
      ...customOptions,
      method,
      headers: {
        ...defaultOptions.headers,
        ...getAuthHeader(),
        ...customOptions.headers,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    // Intentar parsear la respuesta como JSON, incluso si hay error
    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error('Error al parsear respuesta como JSON:', e);
      data = { message: 'Error al parsear la respuesta' };
    }

    if (!response.ok) {
      console.error(`Error en solicitud ${method} a ${url}:`, {
        status: response.status,
        statusText: response.statusText,
        data
      });
      
      return {
        success: false,
        error: data.message || `Error ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error(`Error en solicitud ${method} a ${endpoint}:`, error);
    return {
      success: false,
      error: 'Error de conexión con el servidor',
    };
  }
}

// Métodos HTTP
export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => fetchApi<T>(endpoint, 'GET', null, options),
  post: <T>(endpoint: string, body: any, options?: RequestInit) => fetchApi<T>(endpoint, 'POST', body, options),
  put: <T>(endpoint: string, body: any, options?: RequestInit) => fetchApi<T>(endpoint, 'PUT', body, options),
  patch: <T>(endpoint: string, body: any, options?: RequestInit) => fetchApi<T>(endpoint, 'PATCH', body, options),
  delete: <T>(endpoint: string, options?: RequestInit) => fetchApi<T>(endpoint, 'DELETE', null, options),
};

// Servicios específicos
export const authService = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (userData: any) => api.post('/auth/register', userData),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

export const userService = {
  // Estas funciones ya no se usan, las mantenemos por compatibilidad
  getProfile: () => api.get<UserProfile>('/users/profile'),
  updateProfile: (userData: Partial<UserProfile>) => api.put<UserProfile>('/users/profile', userData),
  changePassword: (passwords: PasswordChangeRequest) =>
    api.post('/users/change-password', passwords),
    
  // Funciones para usar con Netlify Functions
  updateCopropietarioPerfil: (userData: Partial<UserProfile>) => 
    api.put<any>(`${NETLIFY_FUNCTIONS_URL}/editar-perfil-copropietario`, userData),
  obtenerPerfilCompleto: () => 
    api.get<UsuarioCompleto>(`${NETLIFY_FUNCTIONS_URL}/obtener-perfil-usuario`),
};

export const parcelaService = {
  getParcelaInfo: () => api.get('/parcelas/info'),
  getParcelaHistory: () => api.get('/parcelas/history'),
};

export const pagosService = {
  // Funciones antiguas - mantenidas por compatibilidad
  getPendingPayments: () => api.get('/pagos/pendientes'),
  getPaymentHistory: () => api.get('/pagos/historial'),
  makePayment: (paymentData: any) => api.post('/pagos/realizar', paymentData),
  
  // Nuevas funciones que usan Netlify Functions
  obtenerPagosPendientes: () => 
    api.get<ResumenPagosPendientes>(`${NETLIFY_FUNCTIONS_URL}/obtener-pagos-pendientes`),
  
  obtenerPagosRealizados: (idComprobante?: number) => {
    const url = idComprobante 
      ? `${NETLIFY_FUNCTIONS_URL}/obtener-pagos-realizados?idComprobante=${idComprobante}`
      : `${NETLIFY_FUNCTIONS_URL}/obtener-pagos-realizados`;
    return api.get<ResumenPagosRealizados>(url);
  },
  
  procesarPagoTransbank: (pagoData: { 
    idGasto?: number; 
    idParcela?: number; 
    monto?: number; 
    descripcion?: string;
    pagarTodos?: boolean;
  }) => {
    console.log('Procesando pago con Transbank:', pagoData);
    
    // Validar datos mínimos necesarios para procesar el pago
    if (!pagoData.pagarTodos && (!pagoData.idGasto || !pagoData.idParcela || !pagoData.monto)) {
      console.error('Datos de pago incompletos:', pagoData);
      return Promise.resolve({
        success: false,
        error: 'Datos de pago incompletos. Se requiere idGasto, idParcela y monto.'
      });
    }
    
    // Agregar descripción por defecto si no se proporciona
    if (!pagoData.descripcion) {
      if (pagoData.pagarTodos) {
        pagoData.descripcion = 'Pago múltiple con Transbank';
      } else {
        pagoData.descripcion = 'Pago con Transbank';
      }
    }
    
    return api.post<RespuestaProcesoPago>(
      `${NETLIFY_FUNCTIONS_URL}/procesar-pago-transbank`, 
      pagoData
    );
  }
};

export const adminService = {
  getUsers: () => api.get('/admin/users'),
  getUserById: (id: string) => api.get(`/admin/users/${id}`),
  createUser: (userData: any) => api.post('/admin/users', userData),
  updateUser: (id: string, userData: any) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  
  getParcelas: () => api.get('/admin/parcelas'),
  getParcelaById: (id: string) => api.get(`/admin/parcelas/${id}`),
  createParcela: (parcelaData: any) => api.post('/admin/parcelas', parcelaData),
  updateParcela: (id: string, parcelaData: any) => api.put(`/admin/parcelas/${id}`, parcelaData),
  deleteParcela: (id: string) => api.delete(`/admin/parcelas/${id}`),
  
  getContracts: () => api.get('/admin/contratos'),
  getContractById: (id: string) => api.get(`/admin/contratos/${id}`),
  createContract: (contractData: any) => api.post('/admin/contratos', contractData),
  updateContract: (id: string, contractData: any) => api.put(`/admin/contratos/${id}`, contractData),
  deleteContract: (id: string) => api.delete(`/admin/contratos/${id}`),
  
  createNotification: (notificationData: any) => api.post('/admin/notificaciones', notificationData),
  getAlerts: () => api.get('/admin/alertas'),
  resolveAlert: (id: string) => api.put(`/admin/alertas/${id}/resolver`, {}),
};