import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import styles from '../Admin.module.css';
import parcelaStyles from './Parcelas.module.css';

interface Parcela {
  idParcela: number;
  nombre: string;
  direccion: string;
  area: number;
  estado: 'Al día' | 'Pendiente' | 'Atrasado';
  propietario?: {
    idUsuario: number;
    nombreCompleto: string;
  };
  comunidad: {
    idComunidad: number;
    nombre: string;
  };
}

interface GastoParcela {
  idGasto: number;
  idParcela: number;
  concepto: string;
  monto: number;
  fechaVencimiento: string;
  tipo: 'Cuota Ordinaria' | 'Cuota Extraordinaria' | 'Multa' | 'Otro';
  estado: 'Pendiente' | 'Pagado' | 'Atrasado';
  fechaPago?: string;
}

export const GastosParcela = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [parcela, setParcela] = useState<Parcela | null>(null);
  const [gastos, setGastos] = useState<GastoParcela[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'Pendiente' | 'Pagado' | 'Atrasado'>('todos');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'Cuota Ordinaria' | 'Cuota Extraordinaria' | 'Multa' | 'Otro'>('todos');
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
    const cargarParcela = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // En un entorno real, esto sería una llamada a la API
        // const response = await parcelaService.getParcela(id);
        
        // Datos simulados para desarrollo
        setTimeout(() => {
          const parcelaData: Parcela = {
            idParcela: parseInt(id || '0'), 
            nombre: `Parcela ${id}`, 
            direccion: 'Camino El Arrayán 2500, Lo Barnechea', 
            area: 1.5, 
            estado: 'Al día',
            propietario: {
              idUsuario: 5,
              nombreCompleto: 'Roberto Gómez'
            },
            comunidad: {
              idComunidad: 1,
              nombre: 'Valle Verde'
            }
          };
          
          setParcela(parcelaData);
          
          // Simular cargar los gastos de la parcela
          const gastosData: GastoParcela[] = [
            {
              idGasto: 101,
              idParcela: parseInt(id || '0'),
              concepto: 'Cuota Mensual Enero 2023',
              monto: 150000,
              fechaVencimiento: '2023-01-15',
              tipo: 'Cuota Ordinaria',
              estado: 'Pagado',
              fechaPago: '2023-01-10'
            },
            {
              idGasto: 102,
              idParcela: parseInt(id || '0'),
              concepto: 'Cuota Mensual Febrero 2023',
              monto: 150000,
              fechaVencimiento: '2023-02-15',
              tipo: 'Cuota Ordinaria',
              estado: 'Pagado',
              fechaPago: '2023-02-12'
            },
            {
              idGasto: 103,
              idParcela: parseInt(id || '0'),
              concepto: 'Mantenimiento Areas Verdes',
              monto: 80000,
              fechaVencimiento: '2023-03-05',
              tipo: 'Cuota Extraordinaria',
              estado: 'Pagado',
              fechaPago: '2023-03-04'
            },
            {
              idGasto: 104,
              idParcela: parseInt(id || '0'),
              concepto: 'Cuota Mensual Marzo 2023',
              monto: 150000,
              fechaVencimiento: '2023-03-15',
              tipo: 'Cuota Ordinaria',
              estado: 'Pagado',
              fechaPago: '2023-03-14'
            },
            {
              idGasto: 105,
              idParcela: parseInt(id || '0'),
              concepto: 'Cuota Mensual Abril 2023',
              monto: 150000,
              fechaVencimiento: '2023-04-15',
              tipo: 'Cuota Ordinaria',
              estado: 'Pagado',
              fechaPago: '2023-04-10'
            },
            {
              idGasto: 106,
              idParcela: parseInt(id || '0'),
              concepto: 'Multa por Retraso',
              monto: 30000,
              fechaVencimiento: '2023-04-30',
              tipo: 'Multa',
              estado: 'Pagado',
              fechaPago: '2023-04-28'
            },
            {
              idGasto: 107,
              idParcela: parseInt(id || '0'),
              concepto: 'Cuota Mensual Mayo 2023',
              monto: 150000,
              fechaVencimiento: '2023-05-15',
              tipo: 'Cuota Ordinaria',
              estado: 'Pagado',
              fechaPago: '2023-05-12'
            },
            {
              idGasto: 108,
              idParcela: parseInt(id || '0'),
              concepto: 'Reparación Caminos',
              monto: 120000,
              fechaVencimiento: '2023-06-10',
              tipo: 'Cuota Extraordinaria',
              estado: 'Pagado',
              fechaPago: '2023-06-09'
            },
            {
              idGasto: 109,
              idParcela: parseInt(id || '0'),
              concepto: 'Cuota Mensual Junio 2023',
              monto: 150000,
              fechaVencimiento: '2023-06-15',
              tipo: 'Cuota Ordinaria',
              estado: 'Pagado',
              fechaPago: '2023-06-14'
            },
            {
              idGasto: 110,
              idParcela: parseInt(id || '0'),
              concepto: 'Cuota Mensual Julio 2023',
              monto: 150000,
              fechaVencimiento: '2023-07-15',
              tipo: 'Cuota Ordinaria',
              estado: 'Pagado',
              fechaPago: '2023-07-10'
            },
            {
              idGasto: 111,
              idParcela: parseInt(id || '0'),
              concepto: 'Cuota Mensual Agosto 2023',
              monto: 150000,
              fechaVencimiento: '2023-08-15',
              tipo: 'Cuota Ordinaria',
              estado: 'Pagado',
              fechaPago: '2023-08-13'
            },
            {
              idGasto: 112,
              idParcela: parseInt(id || '0'),
              concepto: 'Cuota Mensual Septiembre 2023',
              monto: 150000,
              fechaVencimiento: '2023-09-15',
              tipo: 'Cuota Ordinaria',
              estado: 'Pendiente'
            },
            {
              idGasto: 113,
              idParcela: parseInt(id || '0'),
              concepto: 'Remodelación Acceso',
              monto: 200000,
              fechaVencimiento: '2023-09-30',
              tipo: 'Cuota Extraordinaria',
              estado: 'Pendiente'
            }
          ];
          
          setGastos(gastosData);
          setIsLoading(false);
        }, 800);
      } catch (err) {
        console.error('Error al cargar la parcela:', err);
        setError('No se pudo cargar la información de la parcela. Por favor, intente nuevamente.');
        setIsLoading(false);
      }
    };

    if (id) {
      cargarParcela();
    } else {
      setError('ID de parcela no proporcionado.');
      setIsLoading(false);
    }
  }, [id]);

  // Función para abrir/cerrar el menú en móviles
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    // Lógica para cerrar sesión
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Función para filtrar los gastos según los filtros seleccionados
  const gastosFiltrados = gastos.filter(gasto => {
    if (filtroEstado !== 'todos' && gasto.estado !== filtroEstado) {
      return false;
    }
    
    if (filtroTipo !== 'todos' && gasto.tipo !== filtroTipo) {
      return false;
    }
    
    return true;
  });

  // Función para manejar cambios en el filtro de estado
  const handleFiltroEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltroEstado(e.target.value as 'todos' | 'Pendiente' | 'Pagado' | 'Atrasado');
  };

  // Función para manejar cambios en el filtro de tipo
  const handleFiltroTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltroTipo(e.target.value as 'todos' | 'Cuota Ordinaria' | 'Cuota Extraordinaria' | 'Multa' | 'Otro');
  };

  // Función para formatear fecha
  const formatFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-CL');
  };

  // Función para formatear moneda
  const formatMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(valor);
  };

  // Cálculos para el resumen
  const totalPendiente = gastos
    .filter(gasto => gasto.estado === 'Pendiente')
    .reduce((sum, gasto) => sum + gasto.monto, 0);
    
  const totalPagado = gastos
    .filter(gasto => gasto.estado === 'Pagado')
    .reduce((sum, gasto) => sum + gasto.monto, 0);
    
  const totalAtrasado = gastos
    .filter(gasto => gasto.estado === 'Atrasado')
    .reduce((sum, gasto) => sum + gasto.monto, 0);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando información de la parcela...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={() => navigate('/admin/mapa')}
        >
          Volver al mapa
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
      
      {/* Panel lateral izquierdo */}
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
                  className={`${styles.navLink} ${window.location.pathname.includes('/admin/mapa') ? styles.active : ''}`}
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
      
      {/* Contenido principal */}
      <div 
        className={styles.mainContent}
        style={isMobile ? { padding: '1rem', paddingTop: '60px' } : {}}
      >
        <header className={styles.header}>
          <h2 className={styles.dashboardTitle}>Gastos de Parcela</h2>
          <div className={styles.headerBrand}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.favicon} /> SIGEPA
          </div>
        </header>
        
        {/* Barra de navegación y acciones */}
        <div className={parcelaStyles.navActions}>
          <div className={parcelaStyles.breadcrumbs}>
            <Link to="/admin" className={parcelaStyles.breadcrumbLink}>Inicio</Link> {' > '}
            <Link to="/admin/mapa" className={parcelaStyles.breadcrumbLink}>Mapa</Link> {' > '}
            <span className={parcelaStyles.currentPage}>Gastos de {parcela?.nombre}</span>
          </div>
          
          <div className={parcelaStyles.actionButtons}>
            <Link to="/admin/mapa" className={parcelaStyles.backButton}>
              <span>←</span> Volver al Mapa
            </Link>
          </div>
        </div>
        
        {parcela && (
          <>
            {/* Información de la parcela */}
            <div className={parcelaStyles.parcelaInfo}>
              <div className={parcelaStyles.parcelaAvatar}>🏞️</div>
              <div className={parcelaStyles.parcelaDetails}>
                <h3 className={parcelaStyles.parcelaNombre}>{parcela.nombre}</h3>
                <p className={parcelaStyles.parcelaSubinfo}>
                  <strong>Dirección:</strong> {parcela.direccion} | 
                  <strong> Estado:</strong> {parcela.estado} | 
                  <strong> Propietario:</strong> {parcela.propietario ? parcela.propietario.nombreCompleto : 'No asignado'} | 
                  <strong> Comunidad:</strong> {parcela.comunidad.nombre}
                </p>
              </div>
            </div>
            
            {/* Filtros para gastos */}
            <div className={parcelaStyles.gastosFilters}>
              <div className={parcelaStyles.formGroup}>
                <label htmlFor="filtroEstado">Filtrar por estado:</label>
                <select 
                  id="filtroEstado" 
                  className={parcelaStyles.select}
                  value={filtroEstado}
                  onChange={handleFiltroEstadoChange}
                >
                  <option value="todos">Todos los estados</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Pagado">Pagado</option>
                  <option value="Atrasado">Atrasado</option>
                </select>
              </div>
              
              <div className={parcelaStyles.formGroup}>
                <label htmlFor="filtroTipo">Filtrar por tipo:</label>
                <select 
                  id="filtroTipo" 
                  className={parcelaStyles.select}
                  value={filtroTipo}
                  onChange={handleFiltroTipoChange}
                >
                  <option value="todos">Todos los tipos</option>
                  <option value="Cuota Ordinaria">Cuota Ordinaria</option>
                  <option value="Cuota Extraordinaria">Cuota Extraordinaria</option>
                  <option value="Multa">Multa</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
            
            {/* Lista de gastos */}
            {gastosFiltrados.length > 0 ? (
              <div className={parcelaStyles.gastosList}>
                {gastosFiltrados.map(gasto => (
                  <div key={gasto.idGasto} className={parcelaStyles.gastoItem}>
                    <div className={parcelaStyles.gastoIcon}>
                      {gasto.tipo === 'Cuota Ordinaria' ? '💰' :
                       gasto.tipo === 'Cuota Extraordinaria' ? '⚠️' :
                       gasto.tipo === 'Multa' ? '🚫' : '📝'}
                    </div>
                    <div className={parcelaStyles.gastoContent}>
                      <h4 className={parcelaStyles.gastoTitulo}>{gasto.concepto}</h4>
                      <p className={parcelaStyles.gastoDetalle}>
                        <strong>Vencimiento:</strong> {formatFecha(gasto.fechaVencimiento)} | 
                        <strong> Tipo:</strong> {gasto.tipo}
                        {gasto.fechaPago && (<span> | <strong>Pagado el:</strong> {formatFecha(gasto.fechaPago)}</span>)}
                      </p>
                    </div>
                    <div className={parcelaStyles.gastoInfo}>
                      <div className={parcelaStyles.gastoMonto}>
                        {formatMoneda(gasto.monto)}
                        <span className={`${parcelaStyles.gastoBadge} ${parcelaStyles[`badge${gasto.estado}`]}`}>
                          {gasto.estado}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={parcelaStyles.emptyState}>
                <p>No se encontraron gastos que coincidan con los filtros seleccionados.</p>
              </div>
            )}
            
            {/* Resumen de gastos */}
            <div className={parcelaStyles.resumenGastos}>
              <h3 className={parcelaStyles.resumenTitulo}>Resumen de Gastos</h3>
              <div className={parcelaStyles.resumenGrid}>
                <div className={parcelaStyles.resumenItem}>
                  <p className={parcelaStyles.resumenLabel}>Total Pendiente</p>
                  <p className={`${parcelaStyles.resumenValor} ${parcelaStyles.totalPendiente}`}>
                    {formatMoneda(totalPendiente)}
                  </p>
                </div>
                
                <div className={parcelaStyles.resumenItem}>
                  <p className={parcelaStyles.resumenLabel}>Total Pagado</p>
                  <p className={`${parcelaStyles.resumenValor} ${parcelaStyles.totalPagado}`}>
                    {formatMoneda(totalPagado)}
                  </p>
                </div>
                
                <div className={parcelaStyles.resumenItem}>
                  <p className={parcelaStyles.resumenLabel}>Total Atrasado</p>
                  <p className={`${parcelaStyles.resumenValor} ${parcelaStyles.totalAtrasado}`}>
                    {formatMoneda(totalAtrasado)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

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