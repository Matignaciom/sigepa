import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { Dashboard } from './pages/dashboard/Dashboard';
import { Parcela } from './pages/dashboard/parcelas/Parcelas';
import { Pagos } from './pages/dashboard/pagos/Pagos';
import { Historial } from './pages/dashboard/documentos/Documentos';
import { Estadisticas } from './pages/dashboard/estadisticas/Estadisticas';
import { Perfil } from './pages/dashboard/perfil/Perfil';
import { Admin } from './pages/admin/Admin';
import { Mapa } from './pages/admin/mapa/Mapa';
import { Resumen } from './pages/admin/resumen/Resumen';
import { Contratos } from './pages/admin/contratos/Contratos';
import { Alertas } from './pages/admin/alertas/Alertas';
import { Usuarios } from './pages/admin/usuarios/Usuarios';
import { GestionarNotificaciones } from './pages/admin/notificaciones/GestionarNotificaciones';
import { PerfilAdmin } from './pages/admin/perfil/PerfilAdmin';
import { Gastos } from './pages/admin/gastos/Gastos';
import { LoadingTransition } from './components/LoadingTransition';
import type { ReactNode } from 'react';
import './App.css';
import './styles/variables.css';

// Definición de tipos para las props de ProtectedRoute
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string | null;
}

// Componente para rutas protegidas
const ProtectedRoute = ({ children, requiredRole = null }: ProtectedRouteProps) => {
  // Verificar si el usuario está autenticado
  const userJson = localStorage.getItem('user');
  const isAuthenticated = !!userJson;
  
  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Si se requiere un rol específico, verificar el rol del usuario
  if (requiredRole) {
    const user = JSON.parse(userJson);
    // Normalizar el rol para comparación (admin y administrador son equivalentes)
    const normalizedUserRole = user.role.toLowerCase();
    const isAdmin = normalizedUserRole === 'admin' || normalizedUserRole === 'administrador';
    const isCopropietario = normalizedUserRole === 'copropietario';
    
    // Verificar si el rol coincide con el requerido
    if (requiredRole === 'admin' && !isAdmin) {
      return <Navigate to="/dashboard" />;
    }
    
    if (requiredRole === 'copropietario' && !isCopropietario) {
      return <Navigate to="/admin" />;
    }
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <LoadingTransition />
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/recuperar-password" element={<ForgotPassword />} />
          
          {/* Rutas de copropietario */}
          <Route path="/dashboard" element={
            <ProtectedRoute requiredRole="copropietario">
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/parcelas" element={
            <ProtectedRoute requiredRole="copropietario">
              <Parcela />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/pagos" element={
            <ProtectedRoute requiredRole="copropietario">
              <Pagos />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/gastos" element={
            <ProtectedRoute requiredRole="copropietario">
              <Gastos />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/documentos" element={
            <ProtectedRoute requiredRole="copropietario">
              <Historial />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/estadisticas" element={
            <ProtectedRoute requiredRole="copropietario">
              <Estadisticas />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/perfil" element={
            <ProtectedRoute requiredRole="copropietario">
              <Perfil />
            </ProtectedRoute>
          } />
          
          {/* Redirecciones para mantener compatibilidad con rutas antiguas */}
          <Route path="/parcelas" element={<Navigate to="/dashboard/parcelas" />} />
          <Route path="/pagos" element={<Navigate to="/dashboard/pagos" />} />
          <Route path="/gastos" element={<Navigate to="/dashboard/gastos" />} />
          <Route path="/documentos" element={<Navigate to="/dashboard/documentos" />} />
          <Route path="/estadisticas" element={<Navigate to="/dashboard/estadisticas" />} />
          <Route path="/perfil" element={<Navigate to="/dashboard/perfil" />} />
          
          {/* Rutas de administrador */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <Admin />
            </ProtectedRoute>
          } />
          <Route path="/admin/mapa" element={
            <ProtectedRoute requiredRole="admin">
              <Mapa />
            </ProtectedRoute>
          } />
          <Route path="/admin/resumen" element={
            <ProtectedRoute requiredRole="admin">
              <Resumen />
            </ProtectedRoute>
          } />
          <Route path="/admin/gastos" element={
            <ProtectedRoute requiredRole="admin">
              <Gastos />
            </ProtectedRoute>
          } />
          <Route path="/admin/contratos" element={
            <ProtectedRoute requiredRole="admin">
              <Contratos />
            </ProtectedRoute>
          } />
          <Route path="/admin/alertas" element={
            <ProtectedRoute requiredRole="admin">
              <Alertas />
            </ProtectedRoute>
          } />
          <Route path="/admin/usuarios" element={
            <ProtectedRoute requiredRole="admin">
              <Usuarios />
            </ProtectedRoute>
          } />
          <Route path="/admin/notificaciones" element={
            <ProtectedRoute requiredRole="admin">
              <GestionarNotificaciones />
            </ProtectedRoute>
          } />
          <Route path="/admin/perfil" element={
            <ProtectedRoute requiredRole="admin">
              <PerfilAdmin />
            </ProtectedRoute>
          } />
          
          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App
