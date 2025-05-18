import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Resumen.module.css';

interface EstadisticaResumen {
  // Estadísticas de Usuarios
  totalUsuarios: number;
  usuariosAdministradores: number;
  usuariosCopropietarios: number;

  // Estadísticas de Parcelas
  totalParcelas: number;
  parcelasAlDia: number;
  parcelasPendientes: number;
  parcelasAtrasadas: number;

  // Estadísticas de Pagos
  pagosPendientes: number;
  pagosPagados: number;
  pagosFallidos: number;
  montoRecaudadoMes: number;

  // Estadísticas de Contratos
  contratosVigentes: number;
  contratosExpirados: number;

  // Estadísticas de Gastos Comunes
  gastosOrdinarios: number;
  gastosExtraordinarios: number;
  gastosPendientes: number;
  gastosActivos: number;
  gastosCerrados: number;

  // Estadísticas de Notificaciones y Avisos
  notificacionesEnviadas: number;
  avisosActivos: number;
}

export const Resumen = () => {
  const [estadisticas, setEstadisticas] = useState<EstadisticaResumen>({
    // Usuarios
    totalUsuarios: 0,
    usuariosAdministradores: 0,
    usuariosCopropietarios: 0,

    // Parcelas
    totalParcelas: 0,
    parcelasAlDia: 0,
    parcelasPendientes: 0,
    parcelasAtrasadas: 0,

    // Pagos
    pagosPendientes: 0,
    pagosPagados: 0,
    pagosFallidos: 0,
    montoRecaudadoMes: 0,

    // Contratos
    contratosVigentes: 0,
    contratosExpirados: 0,

    // Gastos Comunes
    gastosOrdinarios: 0,
    gastosExtraordinarios: 0,
    gastosPendientes: 0,
    gastosActivos: 0,
    gastosCerrados: 0,

    // Notificaciones y Avisos
    notificacionesEnviadas: 0,
    avisosActivos: 0
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
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // En un entorno real, esto sería una llamada a la API
        // const response = await adminService.getResumenData();

        // Datos simulados para desarrollo basados en el schema.sql
        setTimeout(() => {
          setEstadisticas({
            // Usuarios
            totalUsuarios: 105,
            usuariosAdministradores: 5,
            usuariosCopropietarios: 100,

            // Parcelas
            totalParcelas: 120,
            parcelasAlDia: 80,
            parcelasPendientes: 25,
            parcelasAtrasadas: 15,

            // Pagos
            pagosPendientes: 35,
            pagosPagados: 82,
            pagosFallidos: 3,
            montoRecaudadoMes: 4500000,

            // Contratos
            contratosVigentes: 115,
            contratosExpirados: 5,

            // Gastos Comunes
            gastosOrdinarios: 12,
            gastosExtraordinarios: 3,
            gastosPendientes: 2,
            gastosActivos: 10,
            gastosCerrados: 3,

            // Notificaciones y Avisos
            notificacionesEnviadas: 250,
            avisosActivos: 8
          });
          setIsLoading(false);
        }, 800);
      } catch (err) {
        console.error('Error al cargar datos del resumen:', err);
        setError('No se pudieron cargar los datos del resumen. Por favor, intente nuevamente.');
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

  // Tarjetas de acceso rápido para el panel de resumen
  const quickAccessCards = [
    {
      title: 'Parcelas y Contratos',
      description: 'Gestiona parcelas y sus contratos asociados',
      icon: '🏞️',
      link: '/admin/contratos',
      color: '#818cf8'
    },
    {
      title: 'Gestión de Usuarios',
      description: 'Administra copropietarios y administradores',
      icon: '👥',
      link: '/admin/usuarios',
      color: '#6474ed'
    },
    {
      title: 'Gastos y Pagos',
      description: 'Administra gastos comunes y pagos pendientes',
      icon: '💰',
      link: '/admin/pagos',
      color: '#4f46e5'
    },
    {
      title: 'Comunicaciones',
      description: 'Gestiona avisos y notificaciones del sistema',
      icon: '✉️',
      link: '/admin/notificaciones',
      color: '#f59e0b'
    },
  ];

  const formatearNumero = (numero: number) => {
    return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando información del resumen...</p>
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
            Visualización de métricas clave del sistema incluyendo usuarios, parcelas, contratos, gastos y pagos.
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
          <div className={styles.headerBrand}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.favicon} /> SIGEPA
          </div>
        </header>

        {/* Sección Usuarios */}
        <section>
          <h2 className={styles.sectionTitle}>Usuarios</h2>
          <div className={styles.statsContainer}>
            <div className={styles.statCard}>
              <div className={styles.statIconContainer}>
                <span className={styles.statIcon}>👥</span>
              </div>
              <div className={styles.statContent}>
                <h3>Total de Usuarios</h3>
                <p className={styles.statNumber}>{formatearNumero(estadisticas.totalUsuarios)}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconContainer}>
                <span className={styles.statIcon}>👨‍💼</span>
              </div>
              <div className={styles.statContent}>
                <h3>Administradores</h3>
                <p className={styles.statNumber}>{formatearNumero(estadisticas.usuariosAdministradores)}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconContainer}>
                <span className={styles.statIcon}>👨‍🌾</span>
              </div>
              <div className={styles.statContent}>
                <h3>Copropietarios</h3>
                <p className={styles.statNumber}>{formatearNumero(estadisticas.usuariosCopropietarios)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Sección Parcelas */}
        <section>
          <h2 className={styles.sectionTitle}>Parcelas</h2>
          <div className={styles.statsContainer}>
            <div className={styles.statCard}>
              <div className={styles.statIconContainer}>
                <span className={styles.statIcon}>🏞️</span>
              </div>
              <div className={styles.statContent}>
                <h3>Total de Parcelas</h3>
                <p className={styles.statNumber}>{formatearNumero(estadisticas.totalParcelas)}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconContainer}>
                <span className={styles.statIcon}>✅</span>
              </div>
              <div className={styles.statContent}>
                <h3>Parcelas Al Día</h3>
                <p className={styles.statNumber}>{formatearNumero(estadisticas.parcelasAlDia)}</p>
                <p className={styles.statDetail}>
                  {Math.round((estadisticas.parcelasAlDia / estadisticas.totalParcelas) * 100)}% del total
                </p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconContainer}>
                <span className={styles.statIcon}>⏳</span>
              </div>
              <div className={styles.statContent}>
                <h3>Parcelas Pendientes</h3>
                <p className={styles.statNumber}>{formatearNumero(estadisticas.parcelasPendientes)}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconContainer}>
                <span className={styles.statIcon}>⚠️</span>
              </div>
              <div className={styles.statContent}>
                <h3>Parcelas Atrasadas</h3>
                <p className={styles.statNumber} style={{ color: "#dc2626" }}>{formatearNumero(estadisticas.parcelasAtrasadas)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Sección Pagos */}
        <section>
          <h2 className={styles.sectionTitle}>Pagos y Finanzas</h2>
          <div className={styles.statsContainer}>
            <div className={styles.statCard}>
              <div className={styles.statIconContainer}>
                <span className={styles.statIcon}>💵</span>
              </div>
              <div className={styles.statContent}>
                <h3>Recaudado este mes</h3>
                <p className={styles.statNumber}>$ {formatearNumero(estadisticas.montoRecaudadoMes)}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconContainer}>
                <span className={styles.statIcon}>⏱️</span>
              </div>
              <div className={styles.statContent}>
                <h3>Pagos Pendientes</h3>
                <p className={styles.statNumber}>{formatearNumero(estadisticas.pagosPendientes)}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconContainer}>
                <span className={styles.statIcon}>✓</span>
              </div>
              <div className={styles.statContent}>
                <h3>Pagos Completados</h3>
                <p className={styles.statNumber}>{formatearNumero(estadisticas.pagosPagados)}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconContainer}>
                <span className={styles.statIcon}>❌</span>
              </div>
              <div className={styles.statContent}>
                <h3>Pagos Fallidos</h3>
                <p className={styles.statNumber}>{formatearNumero(estadisticas.pagosFallidos)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Sección Gastos Comunes */}
        <section>
          <h2 className={styles.sectionTitle}>Gastos Comunes</h2>
          <div className={styles.statsContainer}>
            <div className={styles.statCard}>
              <div className={styles.statIconContainer}>
                <span className={styles.statIcon}>📋</span>
              </div>
              <div className={styles.statContent}>
                <h3>Gastos Ordinarios</h3>
                <p className={styles.statNumber}>{formatearNumero(estadisticas.gastosOrdinarios)}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconContainer}>
                <span className={styles.statIcon}>📊</span>
              </div>
              <div className={styles.statContent}>
                <h3>Gastos Extraordinarios</h3>
                <p className={styles.statNumber}>{formatearNumero(estadisticas.gastosExtraordinarios)}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconContainer}>
                <span className={styles.statIcon}>🔄</span>
              </div>
              <div className={styles.statContent}>
                <h3>Estado de Gastos</h3>
                <p className={styles.statDetail}>
                  Pendientes: {formatearNumero(estadisticas.gastosPendientes)} |
                  Activos: {formatearNumero(estadisticas.gastosActivos)} |
                  Cerrados: {formatearNumero(estadisticas.gastosCerrados)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Sección Contratos */}
        <section>
          <h2 className={styles.sectionTitle}>Contratos</h2>
          <div className={styles.statsContainer}>
            <div className={styles.statCard}>
              <div className={styles.statIconContainer}>
                <span className={styles.statIcon}>📄</span>
              </div>
              <div className={styles.statContent}>
                <h3>Contratos Vigentes</h3>
                <p className={styles.statNumber}>{formatearNumero(estadisticas.contratosVigentes)}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconContainer}>
                <span className={styles.statIcon}>⚠️</span>
              </div>
              <div className={styles.statContent}>
                <h3>Contratos Expirados</h3>
                <p className={styles.statNumber}>{formatearNumero(estadisticas.contratosExpirados)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tarjetas de acceso rápido */}
        <section>
          <h2 className={styles.sectionTitle}>Acciones Rápidas</h2>
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
              <div className={styles.activityIcon}>💰</div>
              <div className={styles.activityContent}>
                <p className={styles.activityText}><strong>María González</strong> realizó un pago de cuota mensual</p>
                <p className={styles.activityTime}>15/06/2023 - 14:30</p>
              </div>
            </div>
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>📄</div>
              <div className={styles.activityContent}>
                <p className={styles.activityText}><strong>Sistema</strong> generó contrato para la parcela #23</p>
                <p className={styles.activityTime}>14/06/2023 - 10:15</p>
              </div>
            </div>
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>👤</div>
              <div className={styles.activityContent}>
                <p className={styles.activityText}><strong>Admin</strong> registró un nuevo copropietario</p>
                <p className={styles.activityTime}>12/06/2023 - 16:45</p>
              </div>
            </div>
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>⚠️</div>
              <div className={styles.activityContent}>
                <p className={styles.activityText}><strong>Sistema</strong> identificó 3 parcelas con pagos atrasados</p>
                <p className={styles.activityTime}>10/06/2023 - 08:00</p>
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