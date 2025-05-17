import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './Header.module.css';

export const Header = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <h1>SIGEPA</h1>
      </div>
      <div className={styles.userMenu}>
        {user && (
          <div className={styles.userInfo}>
            <button onClick={toggleDropdown} className={styles.userButton}>
              <span>{user.name}</span>
              <span className={styles.userRole}>{user.role === 'administrador' ? 'Administrador' : 'Copropietario'}</span>
            </button>
            {showDropdown && (
              <div className={styles.dropdown}>
                <ul>
                  <li>
                    <a href={user.role === 'administrador' ? '/admin/perfil' : '/dashboard/perfil'}>Mi Perfil</a>
                  </li>
                  <li>
                    <button onClick={logout}>Cerrar Sesión</button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};