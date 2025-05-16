import { createContext, useContext, useState, ReactNode } from 'react';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'copropietario';
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Simulación de login - en producción, esto se conectaría a la API
      if (email === 'admin@sigepa.com' && password === 'admin123') {
        setUser({
          id: '1',
          name: 'Administrador',
          email,
          role: 'admin',
        });
        localStorage.setItem('user', JSON.stringify({
          id: '1',
          name: 'Administrador',
          email,
          role: 'admin',
        }));
        return true;
      } else if (email === 'user@sigepa.com' && password === 'user123') {
        setUser({
          id: '2',
          name: 'Usuario Copropietario',
          email,
          role: 'copropietario',
        });
        localStorage.setItem('user', JSON.stringify({
          id: '2',
          name: 'Usuario Copropietario',
          email,
          role: 'copropietario',
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error durante el login:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      // Simulación de registro - en producción, esto se conectaría a la API
      setUser({
        id: '3',
        name,
        email,
        role: 'copropietario',
      });
      localStorage.setItem('user', JSON.stringify({
        id: '3',
        name,
        email,
        role: 'copropietario',
      }));
      return true;
    } catch (error) {
      console.error('Error durante el registro:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
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