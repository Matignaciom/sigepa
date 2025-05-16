import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { Dashboard } from './pages/dashboard/Dashboard';
import { Parcela } from './pages/dashboard/parcela/Parcela';
import { Pagos } from './pages/dashboard/pagos/Pagos';
import { Historial } from './pages/dashboard/historial/Historial';
import { Estadisticas } from './pages/dashboard/estadisticas/Estadisticas';
import { Perfil } from './pages/dashboard/perfil/Perfil';
import { Admin } from './pages/admin/Admin';
import { Mapa } from './pages/admin/mapa/Mapa';
import { Resumen } from './pages/admin/resumen/Resumen';
import { Contratos } from './pages/admin/contratos/Contratos';
import { Alertas } from './pages/admin/alertas/Alertas';
import { Usuarios } from './pages/admin/usuarios/Usuarios';
import { CrearNotificacion } from './pages/admin/notificaciones/CrearNotificacion';
import { PerfilAdmin } from './pages/admin/perfil/PerfilAdmin';
import './App.css';
import './styles/variables.css';

// Componente para rutas protegidas
const ProtectedRoute = ({ children, requiredRole = null }) => {
  // Verificar si el usuario está autenticado
  const userJson = localStorage.getItem('user');
  const isAuthenticated = !!userJson;
  
  // Si se requiere un rol específico, verificar el rol del usuario
  if (isAuthenticated && requiredRole) {
    const user = JSON.parse(userJson);
    if (user.role !== requiredRole) {
      // Redirigir según el rol
      return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />;
    }
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/recuperar-password" element={<ForgotPassword />} />
          
          {/* Rutas de copropietario */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/parcela" element={
            <ProtectedRoute>
              <Parcela />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/pagos" element={
            <ProtectedRoute>
              <Pagos />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/historial" element={
            <ProtectedRoute>
              <Historial />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/estadisticas" element={
            <ProtectedRoute>
              <Estadisticas />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/perfil" element={
            <ProtectedRoute>
              <Perfil />
            </ProtectedRoute>
          } />
          
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
          <Route path="/admin/notificaciones/crear" element={
            <ProtectedRoute requiredRole="admin">
              <CrearNotificacion />
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
