import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'administrador' | 'copropietario';
  communityId?: number;
  nombreCompleto?: string;
  telefono?: string;
  direccion?: string;
  parcelaId?: string;
  superficie?: string;
  fechaAdquisicion?: string;
  estadoContrato?: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, rut: string, communityId: string) => Promise<{ success: boolean; errorCode?: string; message?: string }>;
  logout: () => void;
  updateUserData?: (userData: User) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// URL base de API
const API_URL = import.meta.env.DEV
  ? 'http://localhost:8889/.netlify/functions'
  : '/.netlify/functions';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Recuperar usuario desde localStorage al iniciar
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = async (email: string, password: string) => {
    try {
      // Usar la función iniciar-sesion.js de Netlify con la ruta correcta
      const response = await fetch(`${API_URL}/iniciar-sesion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Guardar el token en localStorage
        localStorage.setItem('token', data.token);
        
        // Transformar datos del usuario para la aplicación
        const userData = {
          id: data.user.id,
          name: data.user.nombreCompleto,
          email: data.user.email,
          role: data.user.rol.toLowerCase(),
          communityId: data.user.idComunidad
        };
        
        // Guardar los datos del usuario
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return true;
      } else {
        console.error('Error en login:', data.error || 'Error desconocido');
        return false;
      }
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string, rut: string, communityId: string): Promise<{ success: boolean; errorCode?: string; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/registrar-usuario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          nombreCompleto: name, 
          email, 
          password, 
          rut, 
          comunidad: communityId, 
          rol: 'Copropietario' 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.token) {
        // Guardar datos del usuario en el estado y localStorage
        const userData = {
          id: data.user.id,
          name: data.user.nombreCompleto,
          email: data.user.email,
          role: (data.user.rol === 'Administrador' ? 'administrador' : 'copropietario') as 'administrador' | 'copropietario',
          communityId: data.user.idComunidad
        };

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', data.token);
        return { success: true };
      }
      
      // Si hay un mensaje de error en la respuesta, lo devolvemos
      return { 
        success: false, 
        errorCode: data.errorCode || 'UNKNOWN_ERROR',
        message: data.message || 'Error desconocido durante el registro'
      };
    } catch (error) {
      console.error('Error durante el registro:', error);
      return { 
        success: false, 
        errorCode: 'CONNECTION_ERROR',
        message: 'Error de conexión con el servidor'
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const updateUserData = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};