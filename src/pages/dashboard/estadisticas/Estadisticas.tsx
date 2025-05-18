import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Estadisticas.module.css';
import { useAuth } from '../../../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Opciones generales para los gráficos
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(79, 70, 229, 0.8)',
      titleFont: {
        size: 13
      },
      bodyFont: {
        size: 12
      },
      padding: 10,
      cornerRadius: 6
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  }
};

export const Estadisticas = () => {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('anual');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();
  
  const currentYear = new Date().getFullYear();
  
  // Datos de ejemplo para las estadísticas
  const datosEstadisticas = {
    pagosRealizados: 12,
    montoTotal: 1800000,
    pagosPuntuales: 11,
    pagosAtrasados: 1,
    porcentajePuntualidad: 91.67,
    saldoPendiente: 0,
    proximoPago: '15/06/2023',
    montoProximoPago: 150000
  };
  
  // Datos para el gráfico de pagos mensuales (simulados)
  const datosPagosMensuales = [
    { mes: 'Ene', monto: 150000, puntual: true },
    { mes: 'Feb', monto: 150000, puntual: true },
    { mes: 'Mar', monto: 150000, puntual: true },
    { mes: 'Abr', monto: 150000, puntual: true },
    { mes: 'May', monto: 150000, puntual: true },
    { mes: 'Jun', monto: 150000, puntual: false },
    { mes: 'Jul', monto: 150000, puntual: true },
    { mes: 'Ago', monto: 150000, puntual: true },
    { mes: 'Sep', monto: 150000, puntual: true },
    { mes: 'Oct', monto: 150000, puntual: true },
    { mes: 'Nov', monto: 150000, puntual: true },
    { mes: 'Dic', monto: 150000, puntual: true },
  ];

  // Datos para el gráfico de distribución de pagos por estado (simulados)
  // Basado en el enum de estado en la tabla Pago: ENUM('Pendiente','Pagado','Fallido')
  const datosEstadoPagos = {
    labels: ['Pagado', 'Pendiente', 'Fallido'],
    datasets: [
      {
        data: [25, 5, 2],
        backgroundColor: [
          'rgba(79, 70, 229, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(231, 76, 60, 0.8)'
        ],
        borderColor: [
          'rgba(79, 70, 229, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(231, 76, 60, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Datos para el gráfico de evolución de puntualidad (simulados)
  // Basado en la tabla GastoParcela y su estado: ENUM('Pendiente','Pagado','Atrasado')
  const datosPuntualidad = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    datasets: [
      {
        label: 'Porcentaje de Puntualidad',
        data: [100, 100, 95, 100, 90, 85, 100, 100, 95, 90, 100, 95],
        borderColor: 'rgba(79, 70, 229, 1)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Datos para el gráfico de distribución de gastos por tipo (simulados)
  // Basado en el enum de tipo en la tabla GastoComun: ENUM('Cuota Ordinaria','Cuota Extraordinaria','Multa','Otro')
  const datosTipoGastos = {
    labels: ['Cuota Ordinaria', 'Cuota Extraordinaria', 'Multa', 'Otro'],
    datasets: [
      {
        data: [70, 15, 10, 5],
        backgroundColor: [
          'rgba(79, 70, 229, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(231, 76, 60, 0.8)',
          'rgba(52, 152, 219, 0.8)'
        ]
      }
    ]
  };

  // Datos para el gráfico de barras (basado en los datos mensuales)
  const datosGraficoBarras = {
    labels: datosPagosMensuales.map(item => item.mes),
    datasets: [
      {
        label: 'Pagos Mensuales',
        data: datosPagosMensuales.map(item => item.monto),
        backgroundColor: datosPagosMensuales.map(item => 
          item.puntual ? 'rgba(79, 70, 229, 0.8)' : 'rgba(231, 76, 60, 0.8)'
        ),
        borderColor: datosPagosMensuales.map(item => 
          item.puntual ? 'rgba(79, 70, 229, 1)' : 'rgba(231, 76, 60, 1)'
        ),
        borderWidth: 1
      }
    ]
  };

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
  
  // Función para formatear montos en pesos chilenos
  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(monto);
  };
  
  // Función para cambiar el periodo de visualización
  const cambiarPeriodo = (periodo: string) => {
    setPeriodoSeleccionado(periodo);
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
          <h2 className={styles.dashboardTitle}>Estadísticas de Pagos</h2>
          <div className={styles.headerBrand}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.favicon} /> SIGEPA
          </div>
        </header>

        <div className={styles.periodSelector}>
          <button 
            className={`${styles.periodButton} ${periodoSeleccionado === 'mensual' ? styles.activePeriod : ''}`}
            onClick={() => cambiarPeriodo('mensual')}
          >
            Mensual
          </button>
          <button 
            className={`${styles.periodButton} ${periodoSeleccionado === 'trimestral' ? styles.activePeriod : ''}`}
            onClick={() => cambiarPeriodo('trimestral')}
          >
            Trimestral
          </button>
          <button 
            className={`${styles.periodButton} ${periodoSeleccionado === 'anual' ? styles.activePeriod : ''}`}
            onClick={() => cambiarPeriodo('anual')}
          >
            Anual
          </button>
        </div>
        
        {/* Resumen de estadísticas */}
        <div className={styles.statsContainer}>
          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <span className={styles.statIcon}>📈</span>
            </div>
            <div className={styles.statContent}>
              <h3>Pagos Realizados</h3>
              <p className={styles.statNumber}>{datosEstadisticas.pagosRealizados}</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <span className={styles.statIcon}>💰</span>
            </div>
            <div className={styles.statContent}>
              <h3>Monto Total Pagado</h3>
              <p className={styles.statNumber}>{formatMonto(datosEstadisticas.montoTotal)}</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <span className={styles.statIcon}>✅</span>
            </div>
            <div className={styles.statContent}>
              <h3>Pagos Puntuales</h3>
              <p className={styles.statNumber}>{datosEstadisticas.pagosPuntuales}</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <span className={styles.statIcon}>⚠️</span>
            </div>
            <div className={styles.statContent}>
              <h3>Pagos Atrasados</h3>
              <p className={styles.statNumber}>{datosEstadisticas.pagosAtrasados}</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <span className={styles.statIcon}>🏆</span>
            </div>
            <div className={styles.statContent}>
              <h3>Puntualidad</h3>
              <p className={styles.statNumber}>{datosEstadisticas.porcentajePuntualidad}%</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <span className={styles.statIcon}>💸</span>
            </div>
            <div className={styles.statContent}>
              <h3>Saldo Pendiente</h3>
              <p className={styles.statNumber}>{formatMonto(datosEstadisticas.saldoPendiente)}</p>
            </div>
          </div>
        </div>
        
        {/* Gráfico de pagos mensuales */}
        <section>
          <h2 className={styles.sectionTitle}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.faviconSmall} />
            Historial de Pagos Mensuales
          </h2>
          <div className={styles.activityContainer}>
            <div className={styles.chartContainer}>
              <Bar data={datosGraficoBarras} options={chartOptions} />
            </div>
          </div>
        </section>

        {/* Gráfico de distribución de pagos por estado */}
        <section>
          <h2 className={styles.sectionTitle}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.faviconSmall} />
            Distribución de Pagos por Estado
          </h2>
          <div className={styles.chartsRow}>
            <div className={styles.chartCard}>
              <div className={styles.chartContainer}>
                <Doughnut data={datosEstadoPagos} options={{
                  ...chartOptions,
                  cutout: '65%'
                }} />
              </div>
              <div className={styles.chartLegend}>
                <div className={styles.legendItem}>
                  <span className={styles.legendColor} style={{backgroundColor: 'rgba(79, 70, 229, 0.8)'}}></span>
                  <span>Pagado</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendColor} style={{backgroundColor: 'rgba(245, 158, 11, 0.8)'}}></span>
                  <span>Pendiente</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendColor} style={{backgroundColor: 'rgba(231, 76, 60, 0.8)'}}></span>
                  <span>Fallido</span>
                </div>
              </div>
            </div>
            
            <div className={styles.chartCard}>
              <div className={styles.chartContainer}>
                <Pie data={datosTipoGastos} options={chartOptions} />
              </div>
              <div className={styles.chartLegend}>
                <h3 className={styles.chartSubtitle}>Distribución por Tipo de Gasto</h3>
                <div className={styles.legendItem}>
                  <span className={styles.legendColor} style={{backgroundColor: 'rgba(79, 70, 229, 0.8)'}}></span>
                  <span>Cuota Ordinaria</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendColor} style={{backgroundColor: 'rgba(245, 158, 11, 0.8)'}}></span>
                  <span>Cuota Extraordinaria</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendColor} style={{backgroundColor: 'rgba(231, 76, 60, 0.8)'}}></span>
                  <span>Multa</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendColor} style={{backgroundColor: 'rgba(52, 152, 219, 0.8)'}}></span>
                  <span>Otro</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Gráfico de evolución de puntualidad */}
        <section>
          <h2 className={styles.sectionTitle}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.faviconSmall} />
            Evolución de Puntualidad
          </h2>
          <div className={styles.activityContainer}>
            <div className={styles.chartContainer}>
              <Line data={datosPuntualidad} options={{
                ...chartOptions,
                scales: {
                  ...chartOptions.scales,
                  y: {
                    ...chartOptions.scales.y,
                    max: 100,
                    ticks: {
                      callback: function(value) {
                        return value + '%';
                      }
                    }
                  }
                }
              }} />
            </div>
          </div>
        </section>
        
        {/* Próximo Pago */}
        <section>
          <h2 className={styles.sectionTitle}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.faviconSmall} />
            Próximo Pago
          </h2>
          <div className={styles.activityContainer}>
            <div className={styles.proximoPagoCard}>
              <div className={styles.proximoPagoInfo}>
                <div className={styles.proximoPagoItem}>
                  <span className={styles.proximoPagoLabel}>Fecha:</span>
                  <span className={styles.proximoPagoValue}>{datosEstadisticas.proximoPago}</span>
                </div>
                <div className={styles.proximoPagoItem}>
                  <span className={styles.proximoPagoLabel}>Monto:</span>
                  <span className={styles.proximoPagoValue}>{formatMonto(datosEstadisticas.montoProximoPago)}</span>
                </div>
              </div>
              
              <button className={styles.pagarButton}>Realizar Pago</button>
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