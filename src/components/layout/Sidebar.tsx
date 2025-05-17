import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Sidebar.module.css';

export const Sidebar = () => {
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'administrador';
  
  const adminLinks = [
    { to: '/admin', label: 'Inicio', exact: true },
    { to: '/admin/mapa', label: 'Mapa Geoespacial' },
    { to: '/admin/resumen', label: 'Resumen' },
    { to: '/admin/contratos', label: 'Contratos' },
    { to: '/admin/alertas', label: 'Alertas' },
    { to: '/admin/usuarios', label: 'Gestión de Usuarios' },
    { to: '/admin/notificaciones', label: 'Gestionar Notificaciones' },
    { to: '/admin/perfil', label: 'Mi Perfil' },
  ];
  
  const copropietarioLinks = [
    { to: '/dashboard', label: 'Inicio', exact: true },
    { to: '/dashboard/parcela', label: 'Mi Parcela' },
    { to: '/dashboard/pagos', label: 'Pagos' },
    { to: '/dashboard/historial', label: 'Historial' },
    { to: '/dashboard/estadisticas', label: 'Estadísticas' },
    { to: '/dashboard/perfil', label: 'Mi Perfil' },
  ];
  
  const links = isAdmin ? adminLinks : copropietarioLinks;
  
  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        <ul className={styles.menu}>
          {links.map((link) => (
            <li key={link.to} className={styles.menuItem}>
              <NavLink 
                to={link.to} 
                className={({ isActive }) => 
                  isActive ? `${styles.link} ${styles.active}` : styles.link
                }
                end={link.exact}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};