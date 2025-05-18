import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Gastos.module.css';

interface GastoComun {
  idGasto: number;
  concepto: string;
  montoTotal: number;
  fechaVencimiento: string;
  tipo: 'Cuota Ordinaria' | 'Cuota Extraordinaria' | 'Multa' | 'Otro';
  idComunidad: number;
  estado: 'Pendiente' | 'Activo' | 'Cerrado';
}

interface GastoParcela {
  idGasto: number;
  idParcela: number;
  nombreParcela: string;
  propietario: string;
  monto_prorrateado: number;
  estado: 'Pendiente' | 'Pagado' | 'Atrasado';
}

interface ResumenGastos {
  totalGastos: number;
  montoTotal: number;
  gastosActivos: number;
  gastosPendientes: number;
  gastosCerrados: number;
  pagosRecibidos: number;
  montoPagado: number;
  montoPendiente: number;
}

export const Gastos = () => {
  const [gastos, setGastos] = useState<GastoComun[]>([]);
  const [distribuciones, setDistribuciones] = useState<GastoParcela[]>([]);
  const [resumen, setResumen] = useState<ResumenGastos | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gastoSeleccionado, setGastoSeleccionado] = useState<GastoComun | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalDistribucion, setModalDistribucion] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [nombreComunidad, setNombreComunidad] = useState<string>('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const currentYear = new Date().getFullYear();

  // Función para formatear fechas
  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Función para formatear montos
  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(monto);
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
  
  // Carga inicial de datos
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // En un entorno real, esto sería una llamada a la API
        // const responseComunidad = await fetch('/api/comunidad/actual');
        // const dataComunidad = await responseComunidad.json();
        // setNombreComunidad(dataComunidad.nombre);
        
        // Simular respuesta para desarrollo
        setTimeout(() => {
          setNombreComunidad('Comunidad Las Flores');
          
          // Simular resumen de gastos
          setResumen({
            totalGastos: 24,
            montoTotal: 12500000,
            gastosActivos: 15,
            gastosPendientes: 5,
            gastosCerrados: 4,
            pagosRecibidos: 85,
            montoPagado: 9750000,
            montoPendiente: 2750000
          });
          
          // Simular lista de gastos
          setGastos([
            {
              idGasto: 1,
              concepto: 'Cuota mensual Enero 2023',
              montoTotal: 1200000,
              fechaVencimiento: '2023-01-31',
              tipo: 'Cuota Ordinaria',
              idComunidad: 1,
              estado: 'Cerrado'
            },
            {
              idGasto: 2,
              concepto: 'Reparación camino principal',
              montoTotal: 3500000,
              fechaVencimiento: '2023-03-15',
              tipo: 'Cuota Extraordinaria',
              idComunidad: 1,
              estado: 'Activo'
            },
            {
              idGasto: 3,
              concepto: 'Cuota mensual Febrero 2023',
              montoTotal: 1200000,
              fechaVencimiento: '2023-02-28',
              tipo: 'Cuota Ordinaria',
              idComunidad: 1,
              estado: 'Cerrado'
            },
            {
              idGasto: 4,
              concepto: 'Mantención áreas verdes',
              montoTotal: 850000,
              fechaVencimiento: '2023-04-10',
              tipo: 'Cuota Ordinaria',
              idComunidad: 1,
              estado: 'Activo'
            },
            {
              idGasto: 5,
              concepto: 'Multa por retraso en pago',
              montoTotal: 120000,
              fechaVencimiento: '2023-04-30',
              tipo: 'Multa',
              idComunidad: 1,
              estado: 'Pendiente'
            },
            {
              idGasto: 6,
              concepto: 'Cuota mensual Marzo 2023',
              montoTotal: 1200000,
              fechaVencimiento: '2023-03-31',
              tipo: 'Cuota Ordinaria',
              idComunidad: 1,
              estado: 'Activo'
            },
            {
              idGasto: 7,
              concepto: 'Evento comunidad',
              montoTotal: 650000,
              fechaVencimiento: '2023-05-15',
              tipo: 'Otro',
              idComunidad: 1,
              estado: 'Pendiente'
            }
          ]);
          
          // Simular distribuciones
          setDistribuciones([
            {
              idGasto: 2,
              idParcela: 1,
              nombreParcela: 'Parcela 1A',
              propietario: 'Juan Pérez',
              monto_prorrateado: 35000,
              estado: 'Pagado'
            },
            {
              idGasto: 2,
              idParcela: 2,
              nombreParcela: 'Parcela 1B',
              propietario: 'María González',
              monto_prorrateado: 35000,
              estado: 'Pendiente'
            },
            {
              idGasto: 2,
              idParcela: 3,
              nombreParcela: 'Parcela 2A',
              propietario: 'Carlos Rodríguez',
              monto_prorrateado: 35000,
              estado: 'Atrasado'
            },
            {
              idGasto: 2,
              idParcela: 4,
              nombreParcela: 'Parcela 2B',
              propietario: 'Ana Martínez',
              monto_prorrateado: 35000,
              estado: 'Pagado'
            },
            {
              idGasto: 2,
              idParcela: 5,
              nombreParcela: 'Parcela 3A',
              propietario: 'Roberto Silva',
              monto_prorrateado: 35000,
              estado: 'Pendiente'
            }
          ]);
          
          setIsLoading(false);
        }, 800);
      } catch (err) {
        console.error('Error al cargar datos de gastos:', err);
        setError('No se pudieron cargar los datos de gastos. Por favor, intente nuevamente.');
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filtrar gastos según los filtros aplicados
  const gastosFiltrados = gastos.filter(gasto => {
    // Filtrar por tipo
    if (filtroTipo !== 'todos' && gasto.tipo !== filtroTipo) {
      return false;
    }
    
    // Filtrar por estado
    if (filtroEstado !== 'todos' && gasto.estado !== filtroEstado) {
      return false;
    }
    
    // Filtrar por búsqueda (en concepto)
    if (busqueda && !gasto.concepto.toLowerCase().includes(busqueda.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Obtener distribuciones para un gasto específico
  const obtenerDistribuciones = (idGasto: number) => {
    return distribuciones.filter(dist => dist.idGasto === idGasto);
  };
  
  // Abrir modal para crear nuevo gasto
  const abrirModalNuevoGasto = () => {
    setGastoSeleccionado(null);
    setModalAbierto(true);
  };
  
  // Abrir modal para editar gasto existente
  const abrirModalEditarGasto = (gasto: GastoComun) => {
    setGastoSeleccionado(gasto);
    setModalAbierto(true);
  };
  
  // Abrir modal para ver/editar distribución
  const abrirModalDistribucion = (gasto: GastoComun) => {
    setGastoSeleccionado(gasto);
    setModalDistribucion(true);
  };
  
  // Cerrar modales
  const cerrarModales = () => {
    setModalAbierto(false);
    setModalDistribucion(false);
  };
  
  // Función para abrir/cerrar el menú en móviles
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  // Determinar clases CSS para tipo de gasto
  const obtenerClaseTipo = (tipo: string) => {
    switch (tipo) {
      case 'Cuota Ordinaria':
        return styles.tipoOrdinario;
      case 'Cuota Extraordinaria':
        return styles.tipoExtraordinario;
      case 'Multa':
        return styles.tipoMulta;
      default:
        return styles.tipoOtro;
    }
  };
  
  // Determinar clases CSS para estado de gasto
  const obtenerClaseEstado = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return styles.estadoPendiente;
      case 'Activo':
        return styles.estadoActivo;
      case 'Cerrado':
        return styles.estadoCerrado;
      case 'Pagado':
        return styles.estadoPagado;
      case 'Atrasado':
        return styles.estadoAtrasado;
      default:
        return '';
    }
  };
  
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando información de gastos...</p>
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
    <div className={styles.gastosContainer}>
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
            Administración integral de parcelas, usuarios y pagos para {nombreComunidad}.
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
                  className={`${styles.navLink} ${styles.active}`}
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
          <h2 className={styles.pageTitle}>Gestión de Gastos</h2>
          <div className={styles.headerInfo}>
            <span className={styles.communityName}>
              {nombreComunidad}
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
              <span className={styles.statIcon}>💰</span>
            </div>
            <div className={styles.statContent}>
              <h3>Total Gastos</h3>
              <p className={styles.statNumber}>{resumen?.totalGastos || 0}</p>
              <p className={styles.statDetail}>
                {resumen?.gastosActivos || 0} activos
              </p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <span className={styles.statIcon}>📊</span>
            </div>
            <div className={styles.statContent}>
              <h3>Monto Total</h3>
              <p className={styles.statNumber}>{formatearMonto(resumen?.montoTotal || 0)}</p>
              <p className={styles.statDetail}>
                {resumen?.gastosPendientes || 0} pendientes
              </p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <span className={styles.statIcon}>✅</span>
            </div>
            <div className={styles.statContent}>
              <h3>Monto Pagado</h3>
              <p className={styles.statNumber}>{formatearMonto(resumen?.montoPagado || 0)}</p>
              <p className={styles.statDetail}>
                {resumen?.pagosRecibidos || 0} pagos recibidos
              </p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <span className={styles.statIcon}>⏱️</span>
            </div>
            <div className={styles.statContent}>
              <h3>Monto Pendiente</h3>
              <p className={styles.statNumber}>{formatearMonto(resumen?.montoPendiente || 0)}</p>
              <p className={styles.statDetail}>
                {resumen?.gastosCerrados || 0} gastos cerrados
              </p>
            </div>
          </div>
        </div>
        
        {/* Filtros y búsqueda */}
        <div className={styles.filterContainer}>
          <div className={styles.filterGroup}>
            <select 
              className={styles.filterSelect}
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <option value="todos">Todos los tipos</option>
              <option value="Cuota Ordinaria">Cuota Ordinaria</option>
              <option value="Cuota Extraordinaria">Cuota Extraordinaria</option>
              <option value="Multa">Multa</option>
              <option value="Otro">Otro</option>
            </select>
            
            <select 
              className={styles.filterSelect}
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Activo">Activo</option>
              <option value="Cerrado">Cerrado</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <input
              type="text"
              placeholder="Buscar por concepto..."
              className={styles.searchInput}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            
            <button 
              className={styles.primaryButton}
              onClick={abrirModalNuevoGasto}
            >
              Nuevo Gasto
            </button>
          </div>
        </div>
        
        {/* Lista de gastos */}
        <h2 className={styles.sectionTitle}>Gastos Comunes</h2>
        <div className={styles.gastosGrid}>
          <div className={styles.gastosHeader}>
            <div>Concepto</div>
            <div>Monto</div>
            <div>Fecha Vencimiento</div>
            <div>Tipo</div>
            <div>Estado</div>
            <div>Acciones</div>
          </div>
          
          {gastosFiltrados.length > 0 ? (
            gastosFiltrados.map(gasto => (
              <div key={gasto.idGasto} className={styles.gastoItem}>
                <div className={styles.gastoConcepto}>{gasto.concepto}</div>
                <div className={styles.gastoMonto}>{formatearMonto(gasto.montoTotal)}</div>
                <div className={styles.gastoFecha}>{formatearFecha(gasto.fechaVencimiento)}</div>
                <div>
                  <span className={`${styles.gastoTipo} ${obtenerClaseTipo(gasto.tipo)}`}>
                    {gasto.tipo}
                  </span>
                </div>
                <div>
                  <span className={`${styles.gastoEstado} ${obtenerClaseEstado(gasto.estado)}`}>
                    {gasto.estado}
                  </span>
                </div>
                <div className={styles.gastoAcciones}>
                  <button 
                    className={styles.accionBoton}
                    onClick={() => abrirModalEditarGasto(gasto)}
                    title="Editar gasto"
                  >
                    ✏️
                  </button>
                  <button 
                    className={styles.accionBoton}
                    onClick={() => abrirModalDistribucion(gasto)}
                    title="Ver distribución"
                  >
                    📊
                  </button>
                  <button 
                    className={styles.accionBoton}
                    title="Registrar pago"
                  >
                    💸
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1' }}>
              No se encontraron gastos con los filtros aplicados.
            </div>
          )}
        </div>
        
        {/* Sección colapsable para distribución de un gasto seleccionado */}
        {gastoSeleccionado && (
          <div className={`${styles.collapsibleSection} ${styles.collapsibleOpen}`}>
            <div className={styles.collapsibleHeader}>
              <h3 className={styles.collapsibleTitle}>
                Distribución del gasto: {gastoSeleccionado.concepto}
              </h3>
              <span className={styles.collapsibleIcon}>▼</span>
            </div>
            
            <div className={styles.collapsibleContent}>
              <div className={styles.distribucionContainer}>
                <div className={styles.distribucionHeader}>
                  <div>ID</div>
                  <div>Parcela</div>
                  <div>Propietario</div>
                  <div>Monto</div>
                  <div>Estado</div>
                </div>
                
                {obtenerDistribuciones(gastoSeleccionado.idGasto).map((dist) => (
                  <div key={`${dist.idGasto}-${dist.idParcela}`} className={styles.distribucionItem}>
                    <div>
                      <span className={styles.iconoBadge}>{dist.idParcela}</span>
                    </div>
                    <div>{dist.nombreParcela}</div>
                    <div>{dist.propietario}</div>
                    <div className={styles.gastoMonto}>{formatearMonto(dist.monto_prorrateado)}</div>
                    <div>
                      <span className={`${styles.gastoEstado} ${obtenerClaseEstado(dist.estado)}`}>
                        {dist.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Modal para crear/editar gasto */}
        {modalAbierto && (
          <div className={styles.modalOverlay} onClick={cerrarModales}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  {gastoSeleccionado ? 'Editar Gasto' : 'Nuevo Gasto'}
                </h2>
                <button className={styles.closeButton} onClick={cerrarModales}>×</button>
              </div>
              
              <form className={styles.formContainer}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Concepto</label>
                  <input 
                    type="text" 
                    className={styles.formInput}
                    defaultValue={gastoSeleccionado?.concepto || ''}
                  />
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Monto Total</label>
                    <input 
                      type="number" 
                      className={styles.formInput}
                      defaultValue={gastoSeleccionado?.montoTotal || ''}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Fecha Vencimiento</label>
                    <input 
                      type="date" 
                      className={styles.formInput}
                      defaultValue={gastoSeleccionado?.fechaVencimiento || ''}
                    />
                  </div>
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Tipo</label>
                    <select 
                      className={styles.formSelect}
                      defaultValue={gastoSeleccionado?.tipo || 'Cuota Ordinaria'}
                    >
                      <option value="Cuota Ordinaria">Cuota Ordinaria</option>
                      <option value="Cuota Extraordinaria">Cuota Extraordinaria</option>
                      <option value="Multa">Multa</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Estado</label>
                    <select 
                      className={styles.formSelect}
                      defaultValue={gastoSeleccionado?.estado || 'Pendiente'}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="Activo">Activo</option>
                      <option value="Cerrado">Cerrado</option>
                    </select>
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Descripción</label>
                  <textarea 
                    className={styles.formTextarea}
                    rows={4}
                    defaultValue={''}
                  ></textarea>
                </div>
                
                <div className={styles.modalFooter}>
                  <button 
                    type="button"
                    className={styles.buttonNeutral}
                    onClick={cerrarModales}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button"
                    className={styles.primaryButton}
                  >
                    {gastoSeleccionado ? 'Guardar Cambios' : 'Crear Gasto'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Modal para distribución */}
        {modalDistribucion && gastoSeleccionado && (
          <div className={styles.modalOverlay} onClick={cerrarModales}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  Distribución del Gasto
                </h2>
                <button className={styles.closeButton} onClick={cerrarModales}>×</button>
              </div>
              
              <div>
                <div className={styles.formGroup}>
                  <h3 className={styles.formTitle}>Gasto: {gastoSeleccionado.concepto}</h3>
                  <p>Monto Total: {formatearMonto(gastoSeleccionado.montoTotal)}</p>
                  <p>Fecha Vencimiento: {formatearFecha(gastoSeleccionado.fechaVencimiento)}</p>
                </div>
                
                <div className={styles.formActions} style={{ justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 className={styles.formTitle}>Distribución entre parcelas</h3>
                  <button className={styles.secondaryButton}>
                    Prorratear Automáticamente
                  </button>
                </div>
                
                <div className={styles.distribucionContainer}>
                  <div className={styles.distribucionHeader}>
                    <div>ID</div>
                    <div>Parcela</div>
                    <div>Propietario</div>
                    <div>Monto</div>
                    <div>Estado</div>
                  </div>
                  
                  {obtenerDistribuciones(gastoSeleccionado.idGasto).map((dist) => (
                    <div key={`${dist.idGasto}-${dist.idParcela}`} className={styles.distribucionItem}>
                      <div>
                        <span className={styles.iconoBadge}>{dist.idParcela}</span>
                      </div>
                      <div>{dist.nombreParcela}</div>
                      <div>{dist.propietario}</div>
                      <div>
                        <input 
                          type="number" 
                          className={styles.formInput}
                          value={dist.monto_prorrateado}
                          onChange={() => {}}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <select 
                          className={styles.formSelect}
                          value={dist.estado}
                          onChange={() => {}}
                          style={{ width: '100%' }}
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="Pagado">Pagado</option>
                          <option value="Atrasado">Atrasado</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className={styles.modalFooter}>
                  <button 
                    type="button"
                    className={styles.buttonNeutral}
                    onClick={cerrarModales}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button"
                    className={styles.primaryButton}
                  >
                    Guardar Distribución
                  </button>
                </div>
              </div>
            </div>
          </div>
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
