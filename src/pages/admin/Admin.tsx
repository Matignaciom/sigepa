import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Admin.module.css';
import { obtenerResumenDashboardAdmin } from '../../services/api';

interface ResumenData {
  // Información general
  totalUsuarios: number;
  totalParcelas: number;
  parcelasActivas: number;

  // Información de pagos
  pagosPendientes: number;
  pagosPagados: number;
  montoRecaudadoMes: number;

  // Información de comunidad
  nombreComunidad: string;
  totalCopropietarios: number;

  // Información de contratos
  contratosVigentes: number;
  contratosProximosVencer: number;

  // Alertas y avisos
  alertasActivas: number;
  avisosRecientes: number;
}

interface ActividadReciente {
  id: number;
  tipo: 'pago' | 'documento' | 'notificacion' | 'otro';
  descripcion: string;
  fecha: string;
  usuario: string;
  parcelaId?: number;
}

export const Admin = () => {
  const [resumenData, setResumenData] = useState<ResumenData | null>(null);
  const [actividadesRecientes, setActividadesRecientes] = useState<ActividadReciente[]>([]);
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
        const response = await obtenerResumenDashboardAdmin();
        
        console.log('Respuesta de la API:', response);
        
        if (response.success && response.data) {
          console.log('Datos recibidos:', response.data);
          
          // Verificar que resumenData exista
          if (!response.data.resumenData) {
            console.error('Error: resumenData es undefined en la respuesta');
            throw new Error('La estructura de datos recibida no es válida');
          }
          
          // Asegurarnos de que todos los valores numéricos sean números
          const resumen = {
            ...response.data.resumenData,
            totalUsuarios: Number(response.data.resumenData.totalUsuarios || 0),
            totalParcelas: Number(response.data.resumenData.totalParcelas || 0),
            parcelasActivas: Number(response.data.resumenData.parcelasActivas || 0),
            pagosPendientes: Number(response.data.resumenData.pagosPendientes || 0),
            pagosPagados: Number(response.data.resumenData.pagosPagados || 0),
            montoRecaudadoMes: Number(response.data.resumenData.montoRecaudadoMes || 0),
            totalCopropietarios: Number(response.data.resumenData.totalCopropietarios || 0),
            contratosVigentes: Number(response.data.resumenData.contratosVigentes || 0),
            contratosProximosVencer: Number(response.data.resumenData.contratosProximosVencer || 0),
            alertasActivas: Number(response.data.resumenData.alertasActivas || 0),
            avisosRecientes: Number(response.data.resumenData.avisosRecientes || 0)
          };
          
          setResumenData(resumen);
          
          // Verificar que actividadesRecientes exista antes de hacer map
          if (response.data.actividadesRecientes && Array.isArray(response.data.actividadesRecientes)) {
            const actividadesFormateadas = response.data.actividadesRecientes.map(act => ({
              ...act,
              id: Number(act.id || 0),
              tipo: mapearTipoActividad(act.tipo || 'otro'),
              parcelaId: act.parcelaId ? Number(act.parcelaId) : undefined
            }));
            setActividadesRecientes(actividadesFormateadas);
          } else {
            // Si no hay actividades recientes, establecer un array vacío
            setActividadesRecientes([]);
          }
          
          setIsLoading(false);
        } else {
          console.error('Error en la respuesta:', response.error || 'Respuesta no exitosa');
          throw new Error(response.error || 'Error al obtener datos del dashboard');
        }
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
        setError('No se pudieron cargar los datos del panel. Por favor, intente nuevamente.');
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Función auxiliar para mapear el tipo de actividad 
  const mapearTipoActividad = (tipo: string): 'pago' | 'documento' | 'notificacion' | 'otro' => {
    switch (tipo) {
      case 'pago':
        return 'pago';
      case 'documento':
        return 'documento';
      case 'notificacion':
        return 'notificacion';
      default:
        return 'otro';
    }
  };

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

  // Formatear números
  const formatearNumero = (numero: number) => {
    return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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

  // Tarjetas de acceso secundario
  const secondaryAccessCards = [
    {
      title: 'Resumen Detallado',
      description: 'Visualiza estadísticas detalladas del sistema',
      icon: '📊',
      link: '/admin/resumen',
      color: '#10b981'
    },
    {
      title: 'Notificaciones',
      description: 'Gestiona notificaciones y comunicaciones',
      icon: '✉️',
      link: '/admin/notificaciones',
      color: '#047857'
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
            Administración integral de parcelas, usuarios y pagos para {resumenData?.nombreComunidad}.
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
                <Link to="/admin/gastos"
                  className={`${styles.navLink} ${window.location.pathname === '/admin/gastos' ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>💰</span>
                  Gastos
                </Link>
              </li>
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
          <h2 className={styles.dashboardTitle}>Panel de Administración</h2>
          <div className={styles.headerInfo}>
            <span className={styles.communityName}>
              {resumenData?.nombreComunidad}
            </span>
            <div className={styles.headerBrand}>
              <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.favicon} /> SIGEPA
            </div>
          </div>
        </header>

        {/* Resumen de estadísticas */}
        <div className={styles.statsContainer}>
          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <span className={styles.statIcon}>👥</span>
            </div>
            <div className={styles.statContent}>
              <h3>Usuarios Totales</h3>
              <p className={styles.statNumber}>{formatearNumero(resumenData?.totalUsuarios || 0)}</p>
              <p className={styles.statDetail}>
                {formatearNumero(resumenData?.totalCopropietarios || 0)} copropietarios
              </p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <span className={styles.statIcon}>🏞️</span>
            </div>
            <div className={styles.statContent}>
              <h3>Parcelas</h3>
              <p className={styles.statNumber}>{formatearNumero(resumenData?.totalParcelas || 0)}</p>
              <p className={styles.statDetail}>
                {formatearNumero(resumenData?.parcelasActivas || 0)} activas
              </p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <span className={styles.statIcon}>💰</span>
            </div>
            <div className={styles.statContent}>
              <h3>Pagos</h3>
              <p className={styles.statNumber}>
                ${formatearNumero(resumenData?.montoRecaudadoMes || 0)}
              </p>
              <p className={styles.statDetail}>
                {formatearNumero(resumenData?.pagosPendientes || 0)} pendientes
              </p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <span className={styles.statIcon}>📄</span>
            </div>
            <div className={styles.statContent}>
              <h3>Contratos</h3>
              <p className={styles.statNumber}>{formatearNumero(resumenData?.contratosVigentes || 0)}</p>
              <p className={styles.statDetail}>
                {formatearNumero(resumenData?.contratosProximosVencer || 0)} próximos a vencer
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

        {/* Tarjetas de acceso secundario */}
        <section>
          <h2 className={styles.sectionTitle}>Gestión Financiera</h2>
          <div className={styles.quickAccessGrid}>
            {secondaryAccessCards.map((card, index) => (
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

        {/* Alertas activas */}
        {resumenData && resumenData.alertasActivas > 0 && (
          <div className={styles.alertBanner}>
            <div className={styles.alertIcon}>⚠️</div>
            <div className={styles.alertContent}>
              <h3>Alertas Activas</h3>
              <p>
                Hay <strong>{resumenData.alertasActivas} alertas</strong> que requieren su atención.
                <Link to="/admin/alertas" className={styles.alertLink}>
                  Ver alertas
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Actividad reciente */}
        <section>
          <h2 className={styles.sectionTitle}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.faviconSmall} />
            Actividad Reciente
          </h2>
          <div className={styles.activityContainer}>
            {actividadesRecientes.map(actividad => (
              <div key={actividad.id} className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  {actividad.tipo === 'pago' && '💰'}
                  {actividad.tipo === 'documento' && '📄'}
                  {actividad.tipo === 'notificacion' && '🔔'}
                  {actividad.tipo === 'otro' && '📋'}
                </div>
                <div className={styles.activityContent}>
                  <p className={styles.activityText}>
                    <strong>{actividad.usuario}</strong> {actividad.descripcion}
                    {actividad.parcelaId &&
                      <span className={styles.activityParcel}> (Parcela #{actividad.parcelaId})</span>
                    }
                  </p>
                  <p className={styles.activityTime}>{actividad.fecha}</p>
                </div>
              </div>
            ))}

            <div className={styles.viewAllActivity}>
              <Link to="/admin/resumen">
                Ver más información
              </Link>
            </div>
          </div>
        </section>

        {/* Botones de acción rápida */}
        <div className={styles.actionContainer}>
          <Link to="/admin/notificaciones" className={styles.createNotificationButton}>
            <span className={styles.btnIcon}>✉️</span>
            <span>Gestionar Notificaciones</span>
          </Link>

          <Link to="/admin/usuarios" className={styles.actionButton}>
            <span className={styles.btnIcon}>👤</span>
            <span>Gestionar Usuarios</span>
          </Link>

          <Link to="/admin/contratos" className={styles.actionButton}>
            <span className={styles.btnIcon}>📄</span>
            <span>Gestionar Contratos</span>
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