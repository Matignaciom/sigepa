import { useState, useEffect, useRef } from 'react';
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
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapStatus, setMapStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  
  // Validar coordenadas
  const isValidCoord = (coord: any) => 
    typeof coord === 'number' && !isNaN(coord) && isFinite(coord);
  
  const validLat = isValidCoord(coordinates.lat) ? coordinates.lat : -33.4489;
  const validLng = isValidCoord(coordinates.lng) ? coordinates.lng : -70.6693;
  
  // Cargar el mapa solo una vez cuando el componente se monta
  useEffect(() => {
    // Si no hay un elemento de referencia, no hacer nada
    if (!mapRef.current) {
      console.error('El elemento de mapa no existe');
      setMapStatus('error');
      return;
    }
    
    // Función para mostrar un mapa estático como fallback
    const showFallbackMap = () => {
      if (mapRef.current) {
        mapRef.current.innerHTML = `
          <div style="padding: 20px; text-align: center; background-color: #f5f5f5; border-radius: 8px;">
            <h3>Vista previa de ubicación</h3>
            <p>Coordenadas: ${validLat.toFixed(6)}, ${validLng.toFixed(6)}</p>
            <div style="margin: 10px 0; font-size: 12px; color: #666;">
              La visualización del mapa no está disponible actualmente.
            </div>
          </div>
        `;
      }
      setMapStatus('error');
    };
    
    // Inicializar el mapa cuando Google Maps ya está cargado
    const initializeMap = () => {
      if (!window.google || !window.google.maps) {
        showFallbackMap();
        return;
      }
      
      try {
        const mapOptions = {
          center: { lat: validLat, lng: validLng },
          zoom: 15,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false
        };
        
        const map = new window.google.maps.Map(mapRef.current, mapOptions);
        
        new window.google.maps.Marker({
          position: { lat: validLat, lng: validLng },
          map: map,
          title: 'Mi Parcela'
        });
        
        setMapStatus('loaded');
      } catch (error) {
        console.error('Error al inicializar el mapa:', error);
        showFallbackMap();
      }
    };
    
    // Crear un elemento script para cargar Google Maps API
    const loadGoogleMapsScript = () => {
      // Si hay un script de Google Maps en progreso, no crear otro
      if (document.querySelector('script[src*="maps.googleapis.com/maps/api"]')) {
        // Esperar a que la API se cargue
        const checkGoogleInterval = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkGoogleInterval);
            initializeMap();
          }
        }, 200);
        
        // Establecer un tiempo límite
        setTimeout(() => {
          clearInterval(checkGoogleInterval);
          if (mapStatus === 'loading') {
            showFallbackMap();
          }
        }, 10000);
        
        return;
      }
      
      // Crear script
      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyA7BnbM1NEQv3C-7Jj8S9mYL7BQ7JZ--G8&loading=async';
      script.async = true;
      script.defer = true;
      
      script.onload = initializeMap;
      script.onerror = showFallbackMap;
      
      document.head.appendChild(script);
    };
    
    // Si Google Maps ya está cargado, inicializar directamente
    if (window.google && window.google.maps) {
      initializeMap();
    } else {
      loadGoogleMapsScript();
    }
    
    // Establecer un tiempo límite general para la carga
    const timeoutId = setTimeout(() => {
      if (mapStatus === 'loading') {
        showFallbackMap();
      }
    }, 10000);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [coordinates.lat, coordinates.lng, mapStatus]);
  
  return (
    <div className={styles.mapContainer}>
      {mapStatus === 'loading' && (
        <div className={styles.mapLoading} style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 1
        }}>
          <div className={styles.spinner}></div>
          <p>Cargando mapa...</p>
        </div>
      )}
      <div 
        ref={mapRef}
        style={{ 
          width: '100%', 
          height: '100%', 
          minHeight: '300px',
          backgroundColor: '#f5f5f5'
        }}
      ></div>
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

// Interfaz para la respuesta de la API
interface ParcelasResponse {
  success: boolean;
  message: string;
  data: {
    parcelas: Parcela[];
    estadisticas: {
      total: number;
      por_estado: {
        "Al día": number;
        "Pendiente": number;
        "Atrasado": number;
      }
    }
  }
}

export const Parcela = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedParcelaIndex, setSelectedParcelaIndex] = useState(0);
  const [showParcelaSelector, setShowParcelaSelector] = useState(false);
  const [parcelasData, setParcelasData] = useState<Parcela[]>([]);
  
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 576);
    };

    // Comprobar inicialmente
    checkIfMobile();

    // Añadir listener para cambios de tamaño
    window.addEventListener('resize', checkIfMobile);

    // Cargar datos de parcelas desde la API
    const cargarParcelas = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Obtener token de autenticación
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('No se ha encontrado la sesión de usuario');
          setIsLoading(false);
          return;
        }
        
        // Realizar llamada a la API
        const response = await fetch('/.netlify/functions/obtener-parcelas-usuario', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data: ParcelasResponse = await response.json();
        
        if (data.success && data.data.parcelas.length > 0) {
          // Transformar los datos si es necesario
          const parcelas = data.data.parcelas.map(parcela => {
            // Si no tiene contrato, crear un objeto vacío
            if (!parcela.contrato) {
              parcela.contrato = {
                estado: 'Sin contrato',
                fechaInicio: '',
                fechaFin: ''
              };
            }
            
            // Asegurar que los valores númericos sean del tipo correcto
            const area = typeof parcela.area === 'string' ? parseFloat(parcela.area) : parcela.area;
            const valorCatastral = typeof parcela.valorCatastral === 'string' ? 
              parseFloat(parcela.valorCatastral) : parcela.valorCatastral;
            
            // Si no tiene datos de ubicación, usar valores por defecto
            let ubicacion = { lat: -33.4489, lng: -70.6693 };

            // Intentar extraer ubicación si existe
            if (parcela.ubicacion) {
              const isValidCoord = (coord) => 
                typeof coord === 'number' && !isNaN(coord) && isFinite(coord);
              
              // Validar latitud y longitud
              if (isValidCoord(parcela.ubicacion.lat) && isValidCoord(parcela.ubicacion.lng)) {
                ubicacion = parcela.ubicacion;
              } else if (typeof parcela.ubicacion === 'string') {
                // Intentar extraer ubicación del formato ST_AsText(POINT(lng lat))
                try {
                  const match = /POINT\(([^ ]+) ([^)]+)\)/.exec(parcela.ubicacion);
                  if (match) {
                    const lng = parseFloat(match[1]);
                    const lat = parseFloat(match[2]);
                    
                    if (isValidCoord(lat) && isValidCoord(lng)) {
                      ubicacion = { lat, lng };
                    }
                  }
                } catch (error) {
                  console.error('Error al parsear ubicación:', error);
                }
              }
            }
            
            // Cargar gastos pendientes desde la API
            return {
              ...parcela,
              // Convertir explícitamente los campos numéricos
              area: isNaN(area) ? 0 : area,
              valorCatastral: isNaN(valorCatastral) ? 0 : valorCatastral,
              // Si no tiene datos de ubicación, usar valores por defecto
              ubicacion: ubicacion,
              // Inicialmente dejar los gastos pendientes vacíos, se cargarán en otra llamada
              gastosPendientes: []
            };
          });
          
          setParcelasData(parcelas);
          
          // Cargar los gastos pendientes para cada parcela
          cargarGastosPendientes(parcelas);
        } else {
          setError(data.message || 'No se encontraron parcelas');
        }
      } catch (error) {
        console.error('Error al cargar parcelas:', error);
        setError('Error al cargar la información de parcelas');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Función para cargar los gastos pendientes de las parcelas
    const cargarGastosPendientes = async (parcelas: Parcela[]) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) return;
        
        // Obtener los pagos pendientes
        const response = await fetch('/.netlify/functions/obtener-pagos-pendientes', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (data.success && data.data.pagosPendientes.length > 0) {
          // Mapear los pagos pendientes a cada parcela
          const parcelasConGastos = parcelas.map(parcela => {
            const gastosDeParcela = data.data.pagosPendientes
              .filter(pago => pago.idParcela === parcela.idParcela)
              .map(pago => ({
                idGasto: pago.idGasto,
                concepto: pago.concepto,
                monto: pago.monto,
                fechaVencimiento: pago.fechaVencimiento,
                estado: pago.estado
              }));
            
            return {
              ...parcela,
              gastosPendientes: gastosDeParcela
            };
          });
          
          setParcelasData(parcelasConGastos);
        }
      } catch (error) {
        console.error('Error al cargar gastos pendientes:', error);
      }
    };
    
    cargarParcelas();

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
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  // Formatear valor monetario
  const formatCurrency = (value: any) => {
    // Validar si es un número o convertir a número si es un string
    const valorNumerico = typeof value === 'string' ? parseFloat(value) : value;
    
    // Si no es un número válido, mostrar valor por defecto
    if (isNaN(valorNumerico) || valorNumerico === null || valorNumerico === undefined) {
      return "Valor no especificado";
    }
    
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(valorNumerico);
  };

  // Formatear superficie
  const formatArea = (hectareas: any) => {
    // Validar si es un número o convertir a número si es un string
    const areaNumero = typeof hectareas === 'string' ? parseFloat(hectareas) : hectareas;
    
    // Si no es un número válido, mostrar valor por defecto
    if (isNaN(areaNumero) || areaNumero === null || areaNumero === undefined) {
      return "Área no especificada";
    }
    
    return `${areaNumero.toFixed(2)} hectáreas (${(areaNumero * 10000).toFixed(0)} m²)`;
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
  const parcelaData = parcelasData.length > 0 ? parcelasData[selectedParcelaIndex] : null;

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando información de la parcela...</p>
      </div>
    );
  }

  if (error || !parcelaData || parcelasData.length === 0) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error || 'No se encontraron parcelas asociadas a su cuenta'}</p>
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
            {parcelaData.gastosPendientes && parcelaData.gastosPendientes.length > 0 ? (
              parcelaData.gastosPendientes.map(gasto => (
                <div className={styles.activityItem} key={gasto.idGasto}>
                  <div className={styles.activityIcon}>💸</div>
                  <div className={styles.activityContent}>
                    <p className={styles.activityText}>{gasto.concepto}</p>
                    <p className={styles.activityTime}>
                      Vencimiento: {new Date(gasto.fechaVencimiento).toLocaleDateString('es-CL')} - Monto: {formatCurrency(gasto.monto)}
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
          <div className={styles.mapContainer}>
            {(parcelaData.ubicacion && 
              typeof parcelaData.ubicacion === 'object' && 
              'lat' in parcelaData.ubicacion && 
              'lng' in parcelaData.ubicacion) ? (
              <>
                <GoogleMapComponent coordinates={parcelaData.ubicacion} />
                
              </>
            ) : (
              <div className={styles.noMapContainer} style={{padding: "20px", textAlign: "center"}}>
                <p>No hay información de ubicación disponible para esta parcela.</p>
              </div>
            )}
          </div>
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