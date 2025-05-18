import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Dashboard.module.css';

interface ResumenData {
  estadoCuenta: string;
  proximoPago: {
    fecha: string;
    monto: string;
    concepto: string;
  };
  parcelas: {
    total: number;
    alDia: number;
    pendientes: number;
  };
  gastosPendientes: number;
  notificaciones: number;
  avisos: number;
}

export const Dashboard = () => {
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
        // const response = await userService.getDashboardSummary();
        
        // Datos simulados para desarrollo basados en la estructura de la BD
        setTimeout(() => {
          setResumenData({
            estadoCuenta: "Al día",
            proximoPago: {
              fecha: "15/06/2023",
              monto: "$150.000",
              concepto: "Cuota Ordinaria Junio 2023"
            },
            parcelas: {
              total: 2,
              alDia: 2,
              pendientes: 0
            },
            gastosPendientes: 3,
            notificaciones: 2,
            avisos: 1
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

  // Tarjetas de acceso rápido para el panel de copropietario
  const quickAccessCards = [
    {
      title: 'Mis Parcelas',
      description: 'Visualiza tus parcelas y su estado actual',
      icon: '🏞️',
      link: '/dashboard/parcelas',
      color: '#4f46e5'
    },
    {
      title: 'Pagos y Gastos',
      description: 'Gestiona tus pagos y revisa gastos pendientes',
      icon: '💰',
      link: '/dashboard/pagos',
      color: '#6474ed'
    },
    {
      title: 'Documentos',
      description: 'Accede a comprobantes y contratos',
      icon: '📄',
      link: '/dashboard/documentos',
      color: '#818cf8'
    },
    {
      title: 'Estadísticas',
      description: 'Consulta estadísticas y datos relevantes',
      icon: '📊',
      link: '/dashboard/estadisticas',
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
    <div className={styles.dashboardContainer}>
      {/* Botón de menú hamburguesa para móviles */}
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
          <h1 className={styles.brandTitle}>Panel de Copropietario</h1>
          <p className={styles.brandDescription}>
            Gestiona tus parcelas, realiza pagos y mantente al día con toda la información de tu propiedad.
          </p>
        </div>
        <nav className={styles.dashboardNav}>
          <div className={styles.navSection}>
            <h3 className={styles.navTitle}>Principal</h3>
            <ul className={styles.navList}>
              <li>
                <Link to="/dashboard" 
                  className={`${styles.navLink} ${window.location.pathname === '/dashboard' ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>📊</span>
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/dashboard/parcelas" 
                  className={`${styles.navLink} ${window.location.pathname.includes('/dashboard/parcelas') ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>🏞️</span>
                  Mis Parcelas
                </Link>
              </li>
            </ul>
          </div>
          
          <div className={styles.navSection}>
            <h3 className={styles.navTitle}>Finanzas</h3>
            <ul className={styles.navList}>
              <li>
                <Link to="/dashboard/pagos" 
                  className={`${styles.navLink} ${window.location.pathname.includes('/dashboard/pagos') ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>💰</span>
                  Pagos y Gastos
                </Link>
              </li>
              <li>
                <Link to="/dashboard/documentos" 
                  className={`${styles.navLink} ${window.location.pathname.includes('/dashboard/documentos') ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>📄</span>
                  Documentos
                </Link>
              </li>
            </ul>
          </div>
          
          <div className={styles.navSection}>
            <h3 className={styles.navTitle}>Comunidad</h3>
            <ul className={styles.navList}>
              <li>
                <Link to="/dashboard/estadisticas" 
                  className={`${styles.navLink} ${window.location.pathname.includes('/dashboard/estadisticas') ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>📊</span>
                  Estadísticas
                </Link>
              </li>
            </ul>
          </div>
          
          <div className={styles.navSection}>
            <h3 className={styles.navTitle}>Cuenta</h3>
            <ul className={styles.navList}>
              <li>
                <Link to="/dashboard/perfil" 
                  className={`${styles.navLink} ${window.location.pathname.includes('/dashboard/perfil') ? styles.active : ''}`}
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
          <h2 className={styles.dashboardTitle}>Mi Panel</h2>
          <div className={styles.headerBrand}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.favicon} /> SIGEPA
          </div>
        </header>
        
        {/* Resumen de estadísticas */}
        <div className={styles.statsContainer}>
          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <span className={styles.statIcon}>📈</span>
            </div>
            <div className={styles.statContent}>
              <h3>Estado de Cuenta</h3>
              <p className={styles.statNumber}>{resumenData?.estadoCuenta}</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <span className={styles.statIcon}>📅</span>
            </div>
            <div className={styles.statContent}>
              <h3>Próximo Pago</h3>
              <p className={styles.statNumber}>{resumenData?.proximoPago.fecha}</p>
              <p className={`${styles.statDetail} ${styles.darkText}`}>{resumenData?.proximoPago.concepto}</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <span className={styles.statIcon}>💰</span>
            </div>
            <div className={styles.statContent}>
              <h3>Monto a Pagar</h3>
              <p className={styles.statNumber}>{resumenData?.proximoPago.monto}</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <span className={styles.statIcon}>🔔</span>
            </div>
            <div className={styles.statContent}>
              <h3>Pendientes</h3>
              <p className={`${styles.statNumber} ${(resumenData && 
                (resumenData.notificaciones > 0 || resumenData.avisos > 0 || resumenData.gastosPendientes > 0)) 
                ? styles.alertHighlight : ''}`}>
                {resumenData ? resumenData.gastosPendientes + resumenData.notificaciones + resumenData.avisos : 0}
              </p>
              <p className={`${styles.statDetail} ${styles.darkText}`}>
                {resumenData?.gastosPendientes} gastos, {resumenData?.notificaciones} notificaciones, {resumenData?.avisos} avisos
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

        {/* Actividad reciente basada en el schema de la BD */}
        <section>
          <h2 className={styles.sectionTitle}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.faviconSmall} />
            Actividad Reciente
          </h2>
          <div className={styles.activityContainer}>
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>💰</div>
              <div className={styles.activityContent}>
                <p className={styles.activityText}>Pago de gasto común registrado</p>
                <p className={styles.activityTime}>10/05/2023 - Cuota Ordinaria Mayo - $150.000</p>
              </div>
            </div>
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>📣</div>
              <div className={styles.activityContent}>
                <p className={styles.activityText}>Nuevo aviso comunitario publicado</p>
                <p className={styles.activityTime}>05/05/2023 - Asamblea Ordinaria</p>
              </div>
            </div>
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>📝</div>
              <div className={styles.activityContent}>
                <p className={styles.activityText}>Actualización de contrato de parcela</p>
                <p className={styles.activityTime}>02/05/2023</p>
              </div>
            </div>
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>🔔</div>
              <div className={styles.activityContent}>
                <p className={styles.activityText}>Nueva notificación recibida</p>
                <p className={styles.activityTime}>28/04/2023 - Recordatorio de pago</p>
              </div>
            </div>
          </div>
        </section>

        {/* Información de parcelas */}
        <section>
          <h2 className={styles.sectionTitle}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.faviconSmall} />
            Mis Parcelas
          </h2>
          <div className={styles.activityContainer}>
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>🏞️</div>
              <div className={styles.activityContent}>
                <p className={styles.activityText}>Parcela 1 - Sector Norte</p>
                <p className={styles.activityTime}>Estado: <span style={{color: '#22c55e', fontWeight: 'bold'}}>Al día</span> - Área: 0.75 hectáreas</p>
              </div>
            </div>
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>🏞️</div>
              <div className={styles.activityContent}>
                <p className={styles.activityText}>Parcela 2 - Sector Sur</p>
                <p className={styles.activityTime}>Estado: <span style={{color: '#22c55e', fontWeight: 'bold'}}>Al día</span> - Área: 1.25 hectáreas</p>
              </div>
            </div>
          </div>
        </section>

        {/* Botón para realizar pago */}
        <div className={styles.actionContainer}>
          <Link to="/dashboard/pagos" className={styles.primaryActionButton}>
            <span className={styles.btnIcon}>💰</span>
            <span>Gestionar Pagos</span>
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