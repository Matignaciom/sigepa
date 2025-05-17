import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../Admin.module.css';
import perfilStyles from './PerfilAdmin.module.css';

interface AdminData {
  nombreCompleto: string;
  email: string;
  telefono: string;
  cargo: string;
  rut: string;
  direccion: string;
  fechaRegistro: string;
  ultimoAcceso: string;
}

export const PerfilAdmin = () => {
  const [adminData, setAdminData] = useState<AdminData>({
    nombreCompleto: 'Admin Sistema',
    email: 'admin@sigepa.com',
    telefono: '+56 9 1234 5678',
    cargo: 'Administrador General',
    rut: '12.345.678-9',
    direccion: 'Av. Principal #123, Oficina Central',
    fechaRegistro: '01/01/2023',
    ultimoAcceso: '15/06/2023'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<AdminData>(adminData);
  const [passwordData, setPasswordData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 576);
    };

    // Comprobar inicialmente
    checkIfMobile();

    // Añadir listener para cambios de tamaño
    window.addEventListener('resize', checkIfMobile);

    // Limpiar listener al desmontar
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Función para abrir/cerrar el menú en móviles
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    // Aquí iría la lógica para cerrar sesión
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para actualizar los datos en el backend
    setAdminData(formData);
    setIsEditing(false);
    setMessage({ text: 'Perfil actualizado correctamente', type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validar que las contraseñas coincidan
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ text: 'Las contraseñas no coinciden', type: 'error' });
      return;
    }
    
    // Validar que el email coincida con el email del usuario
    if (passwordData.email !== adminData.email) {
      setMessage({ text: 'El email no coincide con su cuenta', type: 'error' });
      return;
    }
    
    // Aquí iría la lógica para actualizar la contraseña en el backend (hash SHA-256)
    setPasswordData({
      email: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordForm(false);
    setMessage({ text: 'Contraseña actualizada correctamente', type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className={styles.adminContainer}>
      {/* Botón de menú hamburguesa explícito para móviles */}
      {isMobile && (
        <>
          <button 
            onClick={toggleMenu}
            style={{
              position: 'fixed',
              top: '10px',
              right: '10px',
              width: '40px',
              height: '40px',
              backgroundColor: '#4f46e5',
              border: 'none',
              borderRadius: '5px',
              zIndex: 1002,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              alignItems: 'center',
              padding: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}
          >
            <span
              style={{
                display: 'block',
                width: '24px',
                height: '3px',
                backgroundColor: 'white',
                borderRadius: '3px',
                transition: 'all 0.3s',
                transform: menuOpen ? 'translateY(8px) rotate(45deg)' : 'none'
              }}
            ></span>
            <span
              style={{
                display: 'block',
                width: '24px',
                height: '3px',
                backgroundColor: 'white',
                borderRadius: '3px',
                transition: 'all 0.3s',
                opacity: menuOpen ? 0 : 1
              }}
            ></span>
            <span
              style={{
                display: 'block',
                width: '24px',
                height: '3px',
                backgroundColor: 'white',
                borderRadius: '3px',
                transition: 'all 0.3s',
                transform: menuOpen ? 'translateY(-8px) rotate(-45deg)' : 'none'
              }}
            ></span>
          </button>
          
          {/* Overlay para cerrar el menú al hacer clic fuera */}
          {menuOpen && (
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 998
              }}
              onClick={toggleMenu}
            />
          )}
        </>
      )}
      
      <div 
        className={`${styles.leftPanel} ${menuOpen ? styles.showMenu : ''}`}
        style={isMobile ? {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '85%',
          height: '100%',
          zIndex: 999,
          transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          overflowY: 'auto',
          boxShadow: menuOpen ? '5px 0 15px rgba(0, 0, 0, 0.1)' : 'none'
        } : {}}
      >
        <div className={styles.brandingContent}>
          <div className={styles.brandLogo}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.favicon} /> SIGEPA
          </div>
          <h1 className={styles.brandTitle}>Panel de Administración</h1>
          <p className={styles.brandDescription}>
            Administración integral de parcelas, usuarios y pagos para mantener la eficiencia operativa del sistema.
          </p>
        </div>
        <nav className={styles.adminNav}>
          <div className={styles.navSection}>
            <h3 className={styles.navTitle}>Principal</h3>
            <ul className={styles.navList}>
              <li>
                <Link to="/admin" 
                  className={`${styles.navLink} ${window.location.pathname === '/admin' ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>📊</span>
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/admin/mapa" 
                  className={`${styles.navLink} ${window.location.pathname === '/admin/mapa' ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>🗺️</span>
                  Mapa Geoespacial
                </Link>
              </li>
              <li>
                <Link to="/admin/resumen" 
                  className={`${styles.navLink} ${window.location.pathname === '/admin/resumen' ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>📈</span>
                  Resumen
                </Link>
              </li>
            </ul>
          </div>
          
          <div className={styles.navSection}>
            <h3 className={styles.navTitle}>Gestión</h3>
            <ul className={styles.navList}>
              <li>
                <Link to="/admin/contratos" 
                  className={`${styles.navLink} ${window.location.pathname === '/admin/contratos' ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>📄</span>
                  Contratos
                </Link>
              </li>
              <li>
                <Link to="/admin/alertas" 
                  className={`${styles.navLink} ${window.location.pathname === '/admin/alertas' ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>🔔</span>
                  Alertas
                </Link>
              </li>
              <li>
                <Link to="/admin/usuarios" 
                  className={`${styles.navLink} ${window.location.pathname === '/admin/usuarios' ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>👥</span>
                  Usuarios
                </Link>
              </li>
            </ul>
          </div>
          
          <div className={styles.navSection}>
            <h3 className={styles.navTitle}>Comunicación</h3>
            <ul className={styles.navList}>
              <li>
                <Link to="/admin/notificaciones" 
                  className={`${styles.navLink} ${window.location.pathname === '/admin/notificaciones' ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>✉️</span>
                  Gestionar Notificaciones
                </Link>
              </li>
            </ul>
          </div>
          
          <div className={styles.navSection}>
            <h3 className={styles.navTitle}>Cuenta</h3>
            <ul className={styles.navList}>
              <li>
                <Link to="/admin/perfil" 
                  className={`${styles.navLink} ${styles.active}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>👤</span>
                  Mi Perfil
                </Link>
              </li>
              <li>
                <button 
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }} 
                  className={styles.navLinkButton}
                >
                  <span className={styles.navIcon}>🚪</span>
                  Cerrar Sesión
                </button>
              </li>
            </ul>
          </div>
        </nav>
        <div className={styles.faviconFooter}>
          <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.faviconLarge} />
          <p>SIGEPA © {currentYear}</p>
        </div>
        <div className={`${styles.decorationCircle} ${styles.circle1}`}></div>
        <div className={`${styles.decorationCircle} ${styles.circle2}`}></div>
      </div>
      
      <div 
        className={styles.mainContent}
        style={isMobile ? { padding: '1rem', paddingTop: '60px' } : {}}
      >
        <header className={styles.header}>
          <h2 className={styles.dashboardTitle}>Mi Perfil</h2>
          <div className={styles.headerBrand}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.favicon} /> SIGEPA
          </div>
        </header>
        
        {/* Contenido del perfil */}
        <div className={perfilStyles.container} style={{ maxWidth: '1300px', margin: '0 auto' }}>
          {message && (
            <div className={`${perfilStyles.message} ${perfilStyles[message.type]}`}>
              {message.text}
            </div>
          )}
          
          <div className={perfilStyles.profileContainer}>
            <div className={perfilStyles.profileHeader}>
              <div className={perfilStyles.avatarContainer}>
                <div className={perfilStyles.avatar}>
                  {adminData.nombreCompleto.split(' ')[0].charAt(0)}
                  {adminData.nombreCompleto.split(' ').length > 1 ? adminData.nombreCompleto.split(' ')[1].charAt(0) : ''}
                </div>
              </div>
              <div className={perfilStyles.profileInfo}>
                <h2>{adminData.nombreCompleto}</h2>
                <p className={perfilStyles.cargo}>{adminData.cargo}</p>
                <p className={perfilStyles.email}>{adminData.email}</p>
                
                {!isEditing && (
                  <button 
                    className={perfilStyles.btnEditar}
                    onClick={() => setIsEditing(true)}
                    style={{
                      marginTop: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      fontWeight: 'bold'
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>✏️</span> Editar Perfil
                  </button>
                )}
              </div>
            </div>
            
            <div className={perfilStyles.profileBody}>
              {!isEditing ? (
                <div className={perfilStyles.infoSection}>
                  <h3>Información Personal</h3>
                  <div className={perfilStyles.infoGrid}>
                    <div className={perfilStyles.infoItem}>
                      <span className={perfilStyles.infoLabel}>Nombre Completo:</span>
                      <span>{adminData.nombreCompleto}</span>
                    </div>
                    <div className={perfilStyles.infoItem}>
                      <span className={perfilStyles.infoLabel}>Email:</span>
                      <span>{adminData.email}</span>
                    </div>
                    <div className={perfilStyles.infoItem}>
                      <span className={perfilStyles.infoLabel}>Dirección:</span>
                      <span>{adminData.direccion}</span>
                    </div>
                    <div className={perfilStyles.infoItem}>
                      <span className={perfilStyles.infoLabel}>Teléfono:</span>
                      <span>{adminData.telefono}</span>
                    </div>
                    <div className={perfilStyles.infoItem}>
                      <span className={perfilStyles.infoLabel}>RUT:</span>
                      <span>{adminData.rut}</span>
                    </div>
                    <div className={perfilStyles.infoItem}>
                      <span className={perfilStyles.infoLabel}>Cargo:</span>
                      <span>{adminData.cargo}</span>
                    </div>
                    <div className={perfilStyles.infoItem}>
                      <span className={perfilStyles.infoLabel}>Fecha de Registro:</span>
                      <span>{adminData.fechaRegistro}</span>
                    </div>
                    <div className={perfilStyles.infoItem}>
                      <span className={perfilStyles.infoLabel}>Último Acceso:</span>
                      <span>{adminData.ultimoAcceso}</span>
                    </div>
                  </div>
                  
                  <div className={perfilStyles.actions}>
                    <button 
                      className={perfilStyles.btnPassword}
                      onClick={() => setShowPasswordForm(!showPasswordForm)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        fontWeight: 'bold'
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>🔑</span> Cambiar Contraseña
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className={perfilStyles.form}>
                  <h3>Editar Información Personal</h3>
                  
                  <div className={perfilStyles.formGrid}>
                    <div className={perfilStyles.formGroup}>
                      <label htmlFor="nombreCompleto">Nombre Completo</label>
                      <input
                        type="text"
                        id="nombreCompleto"
                        name="nombreCompleto"
                        value={formData.nombreCompleto}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className={perfilStyles.formGroup}>
                      <label htmlFor="email">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className={perfilStyles.formGroup}>
                      <label htmlFor="direccion">Dirección</label>
                      <input
                        type="text"
                        id="direccion"
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className={perfilStyles.formGrid}>
                    <div className={perfilStyles.formGroup}>
                      <label htmlFor="telefono">Teléfono</label>
                      <input
                        type="tel"
                        id="telefono"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className={perfilStyles.formGroup}>
                      <label htmlFor="cargo">Cargo</label>
                      <input
                        type="text"
                        id="cargo"
                        name="cargo"
                        value={formData.cargo}
                        readOnly
                        className={perfilStyles.readOnly}
                      />
                    </div>
                    
                    <div className={perfilStyles.formGroup}>
                      <label htmlFor="rut">RUT</label>
                      <input
                        type="text"
                        id="rut"
                        name="rut"
                        value={formData.rut}
                        readOnly
                        className={perfilStyles.readOnly}
                      />
                    </div>
                  </div>
                  
                  <div className={perfilStyles.formActions}>
                    <button 
                      type="submit" 
                      className={perfilStyles.btnGuardar}
                      style={{
                        padding: '12px 24px',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                      }}
                    >
                      <span style={{ marginRight: '8px', fontSize: '1.2rem' }}>💾</span> Guardar Cambios
                    </button>
                    <button 
                      type="button" 
                      className={perfilStyles.btnCancelar}
                      onClick={() => {
                        setIsEditing(false);
                        setFormData(adminData);
                      }}
                      style={{
                        padding: '12px 24px',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                      }}
                    >
                      <span style={{ marginRight: '8px', fontSize: '1.2rem' }}>❌</span> Cancelar
                    </button>
                  </div>
                </form>
              )}
              
              {showPasswordForm && !isEditing && (
                <form onSubmit={handlePasswordSubmit} className={perfilStyles.passwordForm}>
                  <h3>Cambiar Contraseña</h3>
                  
                  <div className={perfilStyles.formGroup}>
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={passwordData.email}
                      onChange={handlePasswordChange}
                      placeholder="Ingrese su email para verificar su identidad"
                      required
                    />
                    <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                      Ingrese el email asociado a su cuenta para verificar su identidad
                    </small>
                  </div>
                  
                  <div className={perfilStyles.formGroup}>
                    <label htmlFor="newPassword">Nueva Contraseña</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  
                  <div className={perfilStyles.formGroup}>
                    <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  
                  <div className={perfilStyles.formActions}>
                    <button 
                      type="submit" 
                      className={perfilStyles.btnGuardar}
                      style={{
                        padding: '12px 24px',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                      }}
                    >
                      <span style={{ marginRight: '8px', fontSize: '1.2rem' }}>🔐</span> Actualizar Contraseña
                    </button>
                    <button 
                      type="button" 
                      className={perfilStyles.btnCancelar}
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({
                          email: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                      }}
                      style={{
                        padding: '12px 24px',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                      }}
                    >
                      <span style={{ marginRight: '8px', fontSize: '1.2rem' }}>❌</span> Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        <footer className={styles.contentFooter}>
          <div className={styles.footerLogo}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.faviconSmall} /> SIGEPA
          </div>
          <p>Sistema de Gestión de Parcelas © {currentYear}</p>
        </footer>
      </div>
    </div>
  );
};