import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Admin.module.css';

interface ResumenData {
  totalUsuarios: number;
  totalParcelas: number;
  parcelasActivas: number;
  pagosPendientes: number;
  alertasActivas: number;
}

export const Admin = () => {
  const [resumenData, setResumenData] = useState<ResumenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // En un entorno real, esto sería una llamada a la API
        // const response = await adminService.getDashboardSummary();
        
        // Datos simulados para desarrollo
        setTimeout(() => {
          setResumenData({
            totalUsuarios: 45,
            totalParcelas: 60,
            parcelasActivas: 52,
            pagosPendientes: 18,
            alertasActivas: 7
          });
          setIsLoading(false);
        }, 800);
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
        setError('No se pudieron cargar los datos del panel. Por favor, intente nuevamente.');
        setIsLoading(false);
      }
    };

    fetchDashboardData();
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

  // Tarjetas de acceso rápido para el panel de administrador
  const quickAccessCards = [
    {
      title: 'Mapa Geoespacial',
      description: 'Visualiza la distribución de parcelas y su estado actual',
      icon: '🗺️',
      link: '/admin/mapa',
      color: '#4f46e5'
    },
    {
      title: 'Gestión de Usuarios',
      description: 'Administra copropietarios y sus permisos',
      icon: '👥',
      link: '/admin/usuarios',
      color: '#6474ed'
    },
    {
      title: 'Contratos',
      description: 'Revisa y gestiona contratos de parcelas',
      icon: '📄',
      link: '/admin/contratos',
      color: '#818cf8'
    },
    {
      title: 'Alertas',
      description: 'Revisa notificaciones y alertas pendientes',
      icon: '🔔',
      link: '/admin/alertas',
      color: '#f59e0b'
    },
  ];

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando información del panel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Reintentar
        </button>
      </div>
    );
  }

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
                  className={`${styles.navLink} ${window.location.pathname === '/admin/perfil' ? styles.active : ''}`}
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
          <h2 className={styles.dashboardTitle}>Dashboard</h2>
          <div className={styles.headerBrand}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.favicon} /> SIGEPA
          </div>
        </header>
        
        {/* Resumen de estadísticas */}
        <div className={styles.statsContainer}>
          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <span className={styles.statIcon}>👥</span>
            </div>
            <div className={styles.statContent}>
              <h3>Usuarios</h3>
              <p className={styles.statNumber}>{resumenData?.totalUsuarios}</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <span className={styles.statIcon}>🏞️</span>
            </div>
            <div className={styles.statContent}>
              <h3>Parcelas</h3>
              <p className={styles.statNumber}>{resumenData?.totalParcelas}</p>
              <p className={styles.statDetail}>
                {resumenData?.parcelasActivas} activas
              </p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <span className={styles.statIcon}>💰</span>
            </div>
            <div className={styles.statContent}>
              <h3>Pagos Pendientes</h3>
              <p className={styles.statNumber}>{resumenData?.pagosPendientes}</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <span className={styles.statIcon}>🔔</span>
            </div>
            <div className={styles.statContent}>
              <h3>Alertas</h3>
              <p className={`${styles.statNumber} ${resumenData && resumenData.alertasActivas > 0 ? styles.alertHighlight : ''}`}>
                {resumenData?.alertasActivas}
              </p>
            </div>
          </div>
        </div>

        {/* Tarjetas de acceso rápido */}
        <section>
          <h2 className={styles.sectionTitle}>Acceso Rápido</h2>
          <div className={styles.quickAccessGrid}>
            {quickAccessCards.map((card, index) => (
              <Link to={card.link} key={index} className={styles.quickAccessCard} style={{ borderColor: card.color }}>
                <div className={styles.cardIcon} style={{ backgroundColor: card.color }}>
                  {card.icon}
                </div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Actividad reciente */}
        <section>
          <h2 className={styles.sectionTitle}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.faviconSmall} />
            Actividad Reciente
          </h2>
          <div className={styles.activityContainer}>
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>📝</div>
              <div className={styles.activityContent}>
                <p className={styles.activityText}><strong>Juan Pérez</strong> actualizó su información de perfil</p>
                <p className={styles.activityTime}>Hace 2 horas</p>
              </div>
            </div>
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>💰</div>
              <div className={styles.activityContent}>
                <p className={styles.activityText}><strong>María González</strong> realizó un pago de cuota mensual</p>
                <p className={styles.activityTime}>Hace 5 horas</p>
              </div>
            </div>
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>🔔</div>
              <div className={styles.activityContent}>
                <p className={styles.activityText}><strong>Sistema</strong> generó alerta por pago vencido para la parcela #23</p>
                <p className={styles.activityTime}>Hace 1 día</p>
              </div>
            </div>
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>👤</div>
              <div className={styles.activityContent}>
                <p className={styles.activityText}><strong>Admin</strong> registró un nuevo copropietario</p>
                <p className={styles.activityTime}>Hace 2 días</p>
              </div>
            </div>
          </div>
        </section>

        {/* Botón para gestionar notificaciones */}
        <div className={styles.actionContainer}>
          <Link to="/admin/notificaciones" className={styles.createNotificationButton}>
            <span className={styles.btnIcon}>✉️</span>
            <span>Gestionar Notificaciones</span>
          </Link>
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