import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Alertas.module.css';

interface Alerta {
  id: number;
  tipo: 'Pago' | 'Contrato' | 'Sistema';
  mensaje: string;
  fechaCreacion: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  estado: 'Pendiente' | 'Resuelta';
}

export const Alertas = () => {
  const [alertas, setAlertas] = useState<Alerta[]>([
    {
      id: 1,
      tipo: 'Pago',
      mensaje: 'Pago vencido de la parcela P-003',
      fechaCreacion: '15/06/2023',
      prioridad: 'Alta',
      estado: 'Pendiente'
    },
    {
      id: 2,
      tipo: 'Contrato',
      mensaje: 'Contrato próximo a vencer de la parcela P-005',
      fechaCreacion: '14/06/2023',
      prioridad: 'Media',
      estado: 'Pendiente'
    },
    {
      id: 3,
      tipo: 'Sistema',
      mensaje: 'Actualización del sistema programada para el 20/06/2023',
      fechaCreacion: '10/06/2023',
      prioridad: 'Baja',
      estado: 'Pendiente'
    },
    {
      id: 4,
      tipo: 'Pago',
      mensaje: 'Pago vencido de la parcela P-012',
      fechaCreacion: '05/06/2023',
      prioridad: 'Alta',
      estado: 'Resuelta'
    },
    {
      id: 5,
      tipo: 'Contrato',
      mensaje: 'Contrato vencido de la parcela P-008',
      fechaCreacion: '01/06/2023',
      prioridad: 'Alta',
      estado: 'Resuelta'
    }
  ]);

  const [filtros, setFiltros] = useState({
    tipo: 'todos',
    prioridad: 'todos',
    estado: 'todos'
  });
  
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
    // Simulación de carga de datos
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  const alertasFiltradas = alertas.filter(alerta => {
    return (
      (filtros.tipo === 'todos' || alerta.tipo === filtros.tipo) &&
      (filtros.prioridad === 'todos' || alerta.prioridad === filtros.prioridad) &&
      (filtros.estado === 'todos' || alerta.estado === filtros.estado)
    );
  });

  const handleFiltroChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const marcarComoResuelta = (id: number) => {
    setAlertas(prev => 
      prev.map(alerta => 
        alerta.id === id ? { ...alerta, estado: 'Resuelta' } : alerta
      )
    );
  };

  const getPrioridadClass = (prioridad: string) => {
    switch (prioridad) {
      case 'Alta':
        return styles.prioridadAlta;
      case 'Media':
        return styles.prioridadMedia;
      case 'Baja':
        return styles.prioridadBaja;
      default:
        return '';
    }
  };
  
  // Función para cerrar sesión
  const handleLogout = () => {
    // Aquí iría la lógica para cerrar sesión
    localStorage.removeItem('user');
    window.location.href = '/login';
  };
  
  // Función para abrir/cerrar el menú en móviles
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando información de alertas...</p>
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
                  className={`${styles.navLink} ${styles.active}`}
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
          <h2 className={styles.dashboardTitle}>Alertas del Sistema</h2>
          <div className={styles.headerBrand}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.favicon} /> SIGEPA
          </div>
        </header>
        
        {/* Filtros de alertas */}
        <div className={styles.activityContainer}>
          <div className={styles.filtros}>
            <div className={styles.filtrosGroup}>
              <div className={styles.filtroItem}>
                <label htmlFor="tipo">Tipo:</label>
                <select 
                  id="tipo" 
                  name="tipo"
                  value={filtros.tipo} 
                  onChange={handleFiltroChange}
                  className={styles.select}
                >
                  <option value="todos">Todos</option>
                  <option value="Pago">Pago</option>
                  <option value="Contrato">Contrato</option>
                  <option value="Sistema">Sistema</option>
                </select>
              </div>
              
              <div className={styles.filtroItem}>
                <label htmlFor="prioridad">Prioridad:</label>
                <select 
                  id="prioridad" 
                  name="prioridad"
                  value={filtros.prioridad} 
                  onChange={handleFiltroChange}
                  className={styles.select}
                >
                  <option value="todos">Todas</option>
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>
              
              <div className={styles.filtroItem}>
                <label htmlFor="estado">Estado:</label>
                <select 
                  id="estado" 
                  name="estado"
                  value={filtros.estado} 
                  onChange={handleFiltroChange}
                  className={styles.select}
                >
                  <option value="todos">Todos</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Resuelta">Resuelta</option>
                </select>
              </div>
            </div>
            
            <Link to="/admin/notificaciones" className={styles.createNotificationButton}>
              {!isMobile && <span className={styles.btnIcon}>✉️</span>}
              <span>Gestionar Notificaciones</span>
            </Link>
          </div>
        </div>
        
        {/* Contenedor de alertas */}
        <section>
          <h2 className={styles.sectionTitle}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.faviconSmall} />
            Listado de Alertas
          </h2>
          <div className={styles.alertasGrid}>
            {alertasFiltradas.length > 0 ? (
              alertasFiltradas.map(alerta => (
                <div key={alerta.id} className={`${styles.statCard} ${alerta.estado === 'Resuelta' ? styles.alertaResuelta : ''}`}>
                  <div className={styles.alertaHeader}>
                    <div className={styles.statIconContainer}>
                      <span className={styles.statIcon}>
                        {alerta.tipo === 'Pago' ? '💰' : 
                         alerta.tipo === 'Contrato' ? '📄' : '🔧'}
                      </span>
                    </div>
                    <span className={`${styles.alertaBadge} ${getPrioridadClass(alerta.prioridad)}`}>
                      {alerta.prioridad}
                    </span>
                  </div>
                  
                  <div className={styles.statContent}>
                    <h3>{alerta.tipo}</h3>
                    <p className={styles.mensaje}>{alerta.mensaje}</p>
                    <p className={styles.statDetail}>Fecha: {alerta.fechaCreacion}</p>
                  </div>
                  
                  <div className={styles.alertaFooter}>
                    <span className={`${styles.estadoBadge} ${alerta.estado === 'Pendiente' ? styles.estadoPendiente : styles.estadoResuelta}`}>
                      {alerta.estado}
                    </span>
                    
                    {alerta.estado === 'Pendiente' && (
                      <button 
                        className={styles.resolverButton}
                        onClick={() => marcarComoResuelta(alerta.id)}
                      >
                        Marcar como resuelta
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noResultados}>No se encontraron alertas con los filtros seleccionados.</div>
            )}
          </div>
        </section>

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