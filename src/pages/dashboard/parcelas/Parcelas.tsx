import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Parcelas.module.css';

// Declaración para extender el tipo Window con la propiedad initMap
declare global {
  interface Window {
    initMap: () => void;
    google: any;
  }
}

// Componente para Google Maps
const GoogleMapComponent = ({ coordinates }: { coordinates: { lat: number, lng: number } }) => {
  // En un entorno de producción real, se utilizaría la biblioteca @react-google-maps/api
  useEffect(() => {
    // Variable para guardar referencia al script
    let mapScript: HTMLScriptElement | null = null;
    
    // Función para cargar el mapa de Google
    const loadGoogleMaps = () => {
      // Definir la función global initMap primero, antes de cargar el script
      window.initMap = () => {
        const mapDiv = document.getElementById('google-map');
        if (mapDiv) {
          const map = new window.google.maps.Map(mapDiv, {
            center: { lat: coordinates.lat, lng: coordinates.lng },
            zoom: 15,
          });

          // Añadir un marcador
          new window.google.maps.Marker({
            position: { lat: coordinates.lat, lng: coordinates.lng },
            map: map,
            title: 'Mi Parcela'
          });
        }
      };

      // Comprobar si la API de Google Maps ya está cargada
      if (!window.google) {
        // Crear script para cargar la API
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyA7BnbM1NEQv3C-7Jj8S9mYL7BQ7JZ--G8&callback=initMap`;
        script.async = true;
        script.defer = true;
        
        // Manejar errores de carga
        script.onerror = () => {
          console.error('Error al cargar la API de Google Maps');
          const mapDiv = document.getElementById('google-map');
          if (mapDiv) {
            mapDiv.innerHTML = '<div style="padding: 20px; text-align: center;">Error al cargar el mapa. Por favor, recargue la página.</div>';
          }
        };
        
        document.head.appendChild(script);
        mapScript = script;
      } else {
        // Si ya está cargada, inicializar el mapa directamente
        window.initMap();
      }
    };

    loadGoogleMaps();

    // Limpieza al desmontar
    return () => {
      // Eliminar la función global si existe
      if (window.initMap) {
        delete window.initMap;
      }
      
      // Eliminar el script si se creó uno
      if (mapScript && document.head.contains(mapScript)) {
        document.head.removeChild(mapScript);
      }
    };
  }, [coordinates]);

  return (
    <div className={styles.mapContainer}>
      <div id="google-map" className={styles.googleMap}></div>
    </div>
  );
};

// Definir tipos para TypeScript
interface Parcela {
  idParcela: number;
  nombre: string;
  direccion: string;
  ubicacion: {
    lat: number;
    lng: number;
  };
  area: number;
  estado: string;
  fechaAdquisicion: string;
  valorCatastral: number;
  contrato: {
    estado: string;
    fechaInicio: string;
    fechaFin: string;
  };
  gastosPendientes: {
    idGasto: number;
    concepto: string;
    monto: number;
    fechaVencimiento: string;
    estado: string;
  }[];
}

export const Parcela = () => {
  // Datos de ejemplo para múltiples parcelas basados en el schema.sql
  const parcelasData: Parcela[] = [
    {
      idParcela: 1,
      nombre: 'Parcela A-123',
      direccion: 'Sector Norte, Lote 45, Valle Central',
      ubicacion: {
        lat: -33.4489,
        lng: -70.6693
      },
      area: 0.75,
      estado: 'Al día',
      fechaAdquisicion: '15/03/2020',
      valorCatastral: 75000000,
      contrato: {
        estado: 'Vigente',
        fechaInicio: '15/03/2020',
        fechaFin: '15/03/2030'
      },
      gastosPendientes: [
        {
          idGasto: 1,
          concepto: 'Cuota Ordinaria Junio 2023',
          monto: 150000,
          fechaVencimiento: '15/06/2023',
          estado: 'Pendiente'
        }
      ]
    },
    {
      idParcela: 2,
      nombre: 'Parcela B-456',
      direccion: 'Sector Sur, Lote 12, Valle Central',
      ubicacion: {
        lat: -33.4579,
        lng: -70.6583
      },
      area: 1.25,
      estado: 'Pendiente',
      fechaAdquisicion: '10/05/2019',
      valorCatastral: 120000000,
      contrato: {
        estado: 'Vigente',
        fechaInicio: '10/05/2019',
        fechaFin: '10/05/2029'
      },
      gastosPendientes: [
        {
          idGasto: 2,
          concepto: 'Cuota Extraordinaria Mejoras',
          monto: 300000,
          fechaVencimiento: '30/07/2023',
          estado: 'Pendiente'
        },
        {
          idGasto: 3,
          concepto: 'Cuota Ordinaria Julio 2023',
          monto: 180000,
          fechaVencimiento: '15/07/2023',
          estado: 'Pendiente'
        }
      ]
    }
  ];

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedParcelaIndex, setSelectedParcelaIndex] = useState(0);
  const [showParcelaSelector, setShowParcelaSelector] = useState(false);
  
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 576);
    };

    // Comprobar inicialmente
    checkIfMobile();

    // Añadir listener para cambios de tamaño
    window.addEventListener('resize', checkIfMobile);

    // Simular carga de datos (en producción sería una llamada a la API)
    setTimeout(() => {
      setIsLoading(false);
    }, 600);

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

  // Formatear valor monetario
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Formatear superficie
  const formatArea = (hectareas: number) => {
    return `${hectareas.toFixed(2)} hectáreas (${(hectareas * 10000).toFixed(0)} m²)`;
  };

  // Toggle selector de parcelas
  const toggleParcelaSelector = () => {
    setShowParcelaSelector(!showParcelaSelector);
  };

  // Cambiar parcela seleccionada
  const selectParcela = (index: number) => {
    setSelectedParcelaIndex(index);
    setShowParcelaSelector(false);
  };

  // Obtener la parcela seleccionada
  const parcelaData = parcelasData[selectedParcelaIndex];

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
          <div className={styles.headerTitleSection}>
            <h2 className={styles.dashboardTitle}>{parcelaData.nombre}</h2>
            
            {/* Selector de parcelas */}
            {parcelasData.length > 1 && (
              <div className={styles.parcelaSelector}>
                <button 
                  className={styles.parcelaSelectorButton}
                  onClick={toggleParcelaSelector}
                >
                  Cambiar Parcela
                  <span className={styles.selectorIcon}>
                    {showParcelaSelector ? '▲' : '▼'}
                  </span>
                </button>
                
                {showParcelaSelector && (
                  <div className={styles.parcelaSelectorDropdown}>
                    {parcelasData.map((parcela, index) => (
                      <button
                        key={parcela.idParcela}
                        className={`${styles.parcelaOption} ${index === selectedParcelaIndex ? styles.selectedOption : ''}`}
                        onClick={() => selectParcela(index)}
                      >
                        <div className={styles.optionContent}>
                          <span className={styles.parcelaName}>{parcela.nombre}</span>
                          <span 
                            className={`${styles.parcelaStatus} ${
                              parcela.estado === 'Al día' 
                                ? styles.statusOk 
                                : parcela.estado === 'Pendiente' 
                                  ? styles.statusPending 
                                  : styles.statusLate
                            }`}
                          >
                            {parcela.estado}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className={styles.headerBrand}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.favicon} /> SIGEPA
          </div>
        </header>
        
        <p className={styles.subtitle}>Información detallada de su propiedad</p>
        
        {/* Resumen de estadísticas */}
        <div className={styles.statsContainer}>
          <div className={styles.statCard}>
            <div className={styles.statIconContainer} style={{backgroundColor: parcelaData.estado === 'Al día' ? '#dcfce7' : '#fee2e2'}}>
              <span className={styles.statIcon} style={{color: parcelaData.estado === 'Al día' ? '#16a34a' : '#dc2626'}}>
                {parcelaData.estado === 'Al día' ? '✓' : '⚠️'}
              </span>
            </div>
            <div className={styles.statContent}>
              <h3>Estado</h3>
              <p className={styles.statNumber} style={{color: parcelaData.estado === 'Al día' ? '#16a34a' : '#dc2626'}}>
                {parcelaData.estado}
              </p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <span className={styles.statIcon}>📏</span>
            </div>
            <div className={styles.statContent}>
              <h3>Superficie</h3>
              <p className={styles.statNumber}>{formatArea(parcelaData.area)}</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <span className={styles.statIcon}>📍</span>
            </div>
            <div className={styles.statContent}>
              <h3>Dirección</h3>
              <p className={styles.statNumber}>{parcelaData.direccion}</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <span className={styles.statIcon}>💰</span>
            </div>
            <div className={styles.statContent}>
              <h3>Valor Catastral</h3>
              <p className={styles.statNumber}>{formatCurrency(parcelaData.valorCatastral)}</p>
            </div>
          </div>
        </div>

        {/* Información contractual */}
        <section>
          <h2 className={styles.sectionTitle}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.faviconSmall} />
            Información Contractual
          </h2>
          <div className={styles.activityContainer}>
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>📅</div>
              <div className={styles.activityContent}>
                <p className={styles.activityText}>Fecha de Adquisición</p>
                <p className={styles.activityTime}>{parcelaData.fechaAdquisicion}</p>
              </div>
            </div>
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>📋</div>
              <div className={styles.activityContent}>
                <p className={styles.activityText}>Estado del Contrato</p>
                <p className={styles.activityTime}>
                  <span style={{color: '#22c55e', fontWeight: 'bold'}}>{parcelaData.contrato.estado}</span>
                </p>
              </div>
            </div>
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>🗓️</div>
              <div className={styles.activityContent}>
                <p className={styles.activityText}>Vigencia</p>
                <p className={styles.activityTime}>
                  {parcelaData.contrato.fechaInicio} - {parcelaData.contrato.fechaFin}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Próximos pagos */}
        <section>
          <h2 className={styles.sectionTitle}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.faviconSmall} />
            Gastos Pendientes
          </h2>
          <div className={styles.activityContainer}>
            {parcelaData.gastosPendientes.length > 0 ? (
              parcelaData.gastosPendientes.map(gasto => (
                <div className={styles.activityItem} key={gasto.idGasto}>
                  <div className={styles.activityIcon}>💸</div>
                  <div className={styles.activityContent}>
                    <p className={styles.activityText}>{gasto.concepto}</p>
                    <p className={styles.activityTime}>
                      Vencimiento: {gasto.fechaVencimiento} - Monto: {formatCurrency(gasto.monto)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.activityItem}>
                <div className={styles.activityIcon}>✅</div>
                <div className={styles.activityContent}>
                  <p className={styles.activityText}>No tiene gastos pendientes</p>
                  <p className={styles.activityTime}>¡Su cuenta está al día!</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Mapa de Google Maps */}
        <section>
          <h2 className={styles.sectionTitle}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.faviconSmall} />
            Ubicación Geoespacial
          </h2>
          <GoogleMapComponent coordinates={parcelaData.ubicacion} />
        </section>

        {/* Botones de acción */}
        <div className={styles.quickAccessGrid}>
          <Link to="/dashboard/documentos" className={styles.quickAccessCard} style={{ borderColor: '#4f46e5' }}>
            <div className={styles.cardIcon} style={{ backgroundColor: '#4f46e5' }}>
              📄
            </div>
            <h3>Ver Documentos</h3>
            <p>Accede a todos los documentos relacionados con tu parcela</p>
          </Link>
          
          <Link to="/dashboard/documentos" className={styles.quickAccessCard} style={{ borderColor: '#6474ed' }}>
            <div className={styles.cardIcon} style={{ backgroundColor: '#6474ed' }}>
              📝
            </div>
            <h3>Descargar Contrato</h3>
            <p>Descarga tu contrato de la parcela para revisión</p>
          </Link>
          
          <Link to="/dashboard/pagos" className={styles.quickAccessCard} style={{ borderColor: '#818cf8' }}>
            <div className={styles.cardIcon} style={{ backgroundColor: '#818cf8' }}>
              💰
            </div>
            <h3>Realizar Pago</h3>
            <p>Realiza el pago de tus gastos pendientes</p>
          </Link>
          
          <Link to="/dashboard/estadisticas" className={styles.quickAccessCard} style={{ borderColor: '#f59e0b' }}>
            <div className={styles.cardIcon} style={{ backgroundColor: '#f59e0b' }}>
              📊
            </div>
            <h3>Ver Estadísticas</h3>
            <p>Consulta estadísticas y datos de tu propiedad</p>
          </Link>
        </div>

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