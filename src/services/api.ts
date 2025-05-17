// Configuración de la API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Tipos de datos para las respuestas de la API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Interfaces para los tipos de datos
export interface UserProfile {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
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
    const url = `${API_URL}${endpoint}`;
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
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Error en la petición',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error en la petición:', error);
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
  getProfile: () => api.get<UserProfile>('/users/profile'),
  updateProfile: (userData: Partial<UserProfile>) => api.put<UserProfile>('/users/profile', userData),
  changePassword: (passwords: PasswordChangeRequest) =>
    api.post('/users/change-password', passwords),
};

export const parcelaService = {
  getParcelaInfo: () => api.get('/parcelas/info'),
  getParcelaHistory: () => api.get('/parcelas/history'),
};

export const pagosService = {
  getPendingPayments: () => api.get('/pagos/pendientes'),
  getPaymentHistory: () => api.get('/pagos/historial'),
  makePayment: (paymentData: any) => api.post('/pagos/realizar', paymentData),
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