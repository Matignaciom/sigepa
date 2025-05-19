import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './Mapa.module.css';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { obtenerParcelasMapa, buscarParcelaMapa, obtenerEstadisticasParcelas, actualizarCoordenadasParcela } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { LoadingTransition } from '../../../components/LoadingTransition';

interface Usuario {
  idUsuario: number;
  nombreCompleto: string;
  email?: string;
}

interface Comunidad {
  idComunidad: number;
  nombre: string;
}

interface Parcela {
  idParcela: number;
  nombre: string;
  direccion: string;
  ubicacion: {
    lat: number;
    lng: number;
  };
  area: number; // En hectáreas
  estado: 'Al día' | 'Pendiente' | 'Atrasado';
  fechaAdquisicion: string; // formato ISO
  valorCatastral: number;
  propietario: Usuario | null;
  comunidad: Comunidad;
  // Información opcional relacionada
  gastosPendientes?: number;
  ultimoPago?: string; // fecha del último pago
}

// Configuración del mapa
const mapContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '8px'
};

// Centro inicial del mapa (coordenadas para Chile central)
const center = {
  lat: -33.44,
  lng: -70.65,
};

// Estilo personalizado para los marcadores según estado
const markerIcons = {
  'Al día': {
    url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
  },
  'Pendiente': {
    url: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png'
  },
  'Atrasado': {
    url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
  }
};

export const Mapa = () => {
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [parcelaSeleccionada, setParcelaSeleccionada] = useState<Parcela | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'Al día' | 'Pendiente' | 'Atrasado'>('todos');
  const [filtroComunidad, setFiltroComunidad] = useState<number | 'todos'>('todos');
  const [comunidades, setComunidades] = useState<Comunidad[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(false);
  const [mapInfoWindow, setMapInfoWindow] = useState<Parcela | null>(null);
  const mapLoadTimeoutRef = useRef<number | null>(null);
  const [estadisticas, setEstadisticas] = useState<any>({
    total: 0,
    por_estado: {
      "Al día": 0,
      "Pendiente": 0,
      "Atrasado": 0
    }
  });
  const [buscando, setBuscando] = useState(false);
  const { user } = useAuth();
  const token = localStorage.getItem('token') || '';

  const currentYear = new Date().getFullYear();

  // Añadimos un estado para controlar si estamos en un dispositivo con ancho de 418px
  const [isExactMobile, setIsExactMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 576);
      setIsExactMobile(window.innerWidth <= 418);
    };

    // Comprobar inicialmente
    checkIfMobile();

    // Añadir listener para cambios de tamaño
    window.addEventListener('resize', checkIfMobile);

    // Limpiar listener al desmontar
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    const cargarComunidades = async () => {
      try {
        if (token) {
          const response = await obtenerParcelasMapa(token);
          if (response.success && response.data.comunidad) {
            setComunidades([response.data.comunidad]);
          }
        }
      } catch (error) {
        console.error('Error al cargar comunidad:', error);
      }
    };

    cargarComunidades();
  }, [token]);

  useEffect(() => {
    const cargarParcelas = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (token) {
          // Solo enviamos el filtro por estado si no es 'todos'
          const filtro = filtroEstado !== 'todos' ? { estado: filtroEstado } : undefined;
          const response = await obtenerParcelasMapa(token, filtro);
          
          if (response.success) {
            setParcelas(response.data.parcelas || []);
            setEstadisticas(response.data.estadisticas || {
              total: 0,
              por_estado: {
                "Al día": 0,
                "Pendiente": 0,
                "Atrasado": 0
              }
            });
          } else {
            setError(response.message || 'Error al cargar parcelas');
          }
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Error al cargar parcelas:', err);
        setError('No se pudieron cargar los datos de las parcelas. Por favor, intente nuevamente.');
        setIsLoading(false);
      }
    };

    cargarParcelas();
  }, [token, filtroEstado]);

  useEffect(() => {
    // Establecer un timeout para detectar si el mapa no carga
    mapLoadTimeoutRef.current = window.setTimeout(() => {
      if (!mapLoaded) {
        console.log('Mapa no cargado después de 10 segundos, mostrando alternativa');
        setMapLoadError(true);
        setIsLoading(false);
      }
    }, 10000); // 10 segundos de timeout

    return () => {
      if (mapLoadTimeoutRef.current) {
        clearTimeout(mapLoadTimeoutRef.current);
      }
    };
  }, [mapLoaded]);

  const handleParcelaClick = (parcela: Parcela) => {
    setParcelaSeleccionada(parcela);
  };

  const closeParcelaDetail = () => {
    setParcelaSeleccionada(null);
  };

  const handleFiltroEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltroEstado(e.target.value as 'todos' | 'Al día' | 'Pendiente' | 'Atrasado');
  };

  const handleFiltroComunidadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const valor = e.target.value;
    setFiltroComunidad(valor === 'todos' ? 'todos' : parseInt(valor));
  };

  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusqueda(e.target.value);
  };

  const handleBuscar = async () => {
    if (!busqueda.trim()) {
      // Si la búsqueda está vacía, cargamos todas las parcelas de nuevo
      const filtro = filtroEstado !== 'todos' ? { estado: filtroEstado } : undefined;
      try {
        setIsLoading(true);
        const response = await obtenerParcelasMapa(token, filtro);
        if (response.success) {
          setParcelas(response.data.parcelas || []);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error al recargar parcelas:', error);
        setError('Error al recargar parcelas');
        setIsLoading(false);
      }
      return;
    }

    setBuscando(true);
    setIsLoading(true);
    
    try {
      if (token) {
        const response = await buscarParcelaMapa(token, busqueda);
        if (response.success) {
          setParcelas(response.data.parcelas || []);
        } else {
          setError(response.message || 'Error al buscar parcelas');
          setParcelas([]);
        }
      }
    } catch (error) {
      console.error('Error en la búsqueda:', error);
      setError('Error al realizar la búsqueda. Por favor, intente nuevamente.');
      setParcelas([]);
    } finally {
      setBuscando(false);
      setIsLoading(false);
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

  const parcelasFiltradas = parcelas.filter(parcela => {
    // Solo aplicamos el filtro por comunidad, ya que el filtro por estado
    // se hace directamente en la llamada a la API
    if (filtroComunidad !== 'todos' && parcela.comunidad.idComunidad !== filtroComunidad) {
      return false;
    }
    return true;
  });

  // Función más robusta para cargar el mapa
  const handleMapLoad = (map: google.maps.Map) => {
    console.log('Google Maps cargado correctamente');
    // Limpiar el timeout ya que el mapa cargó correctamente
    if (mapLoadTimeoutRef.current) {
      clearTimeout(mapLoadTimeoutRef.current);
    }
    setMapLoaded(true);
    setIsLoading(false);
  };

  const handleMapLoadError = () => {
    console.error('Error al cargar Google Maps');
    setMapLoadError(true);
    setIsLoading(false);
  };

  // Función para formatear dinero chileno
  const formatCLP = (valor: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(valor);
  };

  // Función para formatear fecha
  const formatFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-CL');
  };

  // Función para actualizar coordenadas de una parcela desde el mapa
  const handleActualizarCoordenadas = async (idParcela: number, latitud: number, longitud: number) => {
    try {
      if (!token) {
        throw new Error('No hay sesión de usuario');
      }
      
      const response = await actualizarCoordenadasParcela(
        token,
        idParcela,
        latitud,
        longitud
      );
      
      if (response.success) {
        // Actualizamos las coordenadas en el estado local
        setParcelas(prevParcelas => 
          prevParcelas.map(p => {
            if (p.idParcela === idParcela) {
              return {
                ...p,
                ubicacion: {
                  lat: latitud,
                  lng: longitud
                }
              };
            }
            return p;
          })
        );
        
        // Opcional: mostrar mensaje de éxito
        alert('Coordenadas actualizadas correctamente');
      }
    } catch (error) {
      console.error('Error al actualizar coordenadas:', error);
      alert('Error al actualizar coordenadas. Por favor, intente nuevamente.');
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingTransition />
        <p>Cargando mapa de parcelas...</p>
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
          <h2 className={styles.dashboardTitle}>Mapa Geoespacial</h2>
          <div className={styles.headerBrand}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.favicon} /> SIGEPA
          </div>
        </header>

        {/* Versión móvil optimizada para 418px */}
        {isExactMobile ? (
          <div className={`${styles.mapControls} ${styles.mapControlsMobile}`}>
            <div className={styles.filterControlsRow}>
              <div className={styles.filterContainer}>
                <label htmlFor="estado-filter">Estado:</label>
                <select
                  id="estado-filter"
                  className={styles.filterSelect}
                  value={filtroEstado}
                  onChange={handleFiltroEstadoChange}
                >
                  <option value="todos">Todos</option>
                  <option value="Al día">Al día</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Atrasado">Atrasado</option>
                </select>
              </div>

              {comunidades.length > 1 && (
                <div className={styles.filterContainer}>
                  <label htmlFor="comunidad-filter">Comunidad:</label>
                  <select
                    id="comunidad-filter"
                    className={styles.filterSelect}
                    value={filtroComunidad === 'todos' ? 'todos' : filtroComunidad}
                    onChange={handleFiltroComunidadChange}
                  >
                    <option value="todos">Todas</option>
                    {comunidades.map(comunidad => (
                      <option key={comunidad.idComunidad} value={comunidad.idComunidad}>
                        {comunidad.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Buscar parcela..."
                className={styles.searchInput}
                value={busqueda}
                onChange={handleBusquedaChange}
                onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
              />
              <button
                className={styles.searchButton}
                onClick={handleBuscar}
                disabled={buscando}
              >
                {buscando ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.mapControls}>
            <div className={styles.filterContainer}>
              <label htmlFor="estado-filter">Filtrar por estado:</label>
              <select
                id="estado-filter"
                className={styles.filterSelect}
                value={filtroEstado}
                onChange={handleFiltroEstadoChange}
              >
                <option value="todos">Todos</option>
                <option value="Al día">Al día</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Atrasado">Atrasado</option>
              </select>
            </div>

            {comunidades.length > 1 && (
              <div className={styles.filterContainer}>
                <label htmlFor="comunidad-filter">Comunidad:</label>
                <select
                  id="comunidad-filter"
                  className={styles.filterSelect}
                  value={filtroComunidad === 'todos' ? 'todos' : filtroComunidad}
                  onChange={handleFiltroComunidadChange}
                >
                  <option value="todos">Todas</option>
                  {comunidades.map(comunidad => (
                    <option key={comunidad.idComunidad} value={comunidad.idComunidad}>
                      {comunidad.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Buscar parcela..."
                className={styles.searchInput}
                value={busqueda}
                onChange={handleBusquedaChange}
                onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
              />
              <button
                className={styles.searchButton}
                onClick={handleBuscar}
                disabled={buscando}
              >
                {buscando ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>
        )}

        <div className={styles.contentCard}>
          <div className={styles.mapInfoSection}>
            <div className={styles.mapLegend}>
              <div className={styles.legendItem}>
                <div className={`${styles.legendColor} ${styles.colorAlDia}`}></div>
                <span>Al día</span>
              </div>
              <div className={styles.legendItem}>
                <div className={`${styles.legendColor} ${styles.colorPendiente}`}></div>
                <span>Pendiente</span>
              </div>
              <div className={styles.legendItem}>
                <div className={`${styles.legendColor} ${styles.colorAtrasado}`}></div>
                <span>Atrasado</span>
              </div>
            </div>

            <div className={styles.mapStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Total parcelas:</span>
                <span className={styles.statValue}>{estadisticas.total || parcelas.length}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Al día:</span>
                <span className={styles.statValue}>
                  {estadisticas.por_estado?.["Al día"] || parcelas.filter(p => p.estado === 'Al día').length}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Pendientes:</span>
                <span className={styles.statValue}>
                  {estadisticas.por_estado?.["Pendiente"] || parcelas.filter(p => p.estado === 'Pendiente').length}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Atrasadas:</span>
                <span className={styles.statValue}>
                  {estadisticas.por_estado?.["Atrasado"] || parcelas.filter(p => p.estado === 'Atrasado').length}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.map}>
            {!mapLoadError ? (
              <LoadScript
                googleMapsApiKey="AIzaSyA7BnbM1NEQv3C-7Jj8S9mYL7BQ7JZ--G8"
                onLoad={() => console.log('LoadScript cargado correctamente')}
                onError={handleMapLoadError}
                loadingElement={<div className={styles.mapLoadingOverlay}>
                  <div className={styles.spinner}></div>
                  <p>Cargando mapa de parcelas...</p>
                </div>}
              >
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={center}
                  zoom={12}
                  onLoad={handleMapLoad}
                >
                  {parcelasFiltradas.map((parcela) => (
                    <Marker
                      key={parcela.idParcela}
                      position={{
                        lat: parcela.ubicacion.lat,
                        lng: parcela.ubicacion.lng
                      }}
                      onClick={() => setMapInfoWindow(parcela)}
                      icon={markerIcons[parcela.estado]}
                      title={parcela.nombre}
                      draggable={true}
                      onDragEnd={(e) => {
                        if (e.latLng) {
                          const newLat = e.latLng.lat();
                          const newLng = e.latLng.lng();
                          
                          // Confirmar antes de actualizar
                          if (window.confirm(`¿Desea actualizar las coordenadas de "${parcela.nombre}" a esta nueva ubicación?`)) {
                            handleActualizarCoordenadas(parcela.idParcela, newLat, newLng);
                          }
                        }
                      }}
                    />
                  ))}

                  {mapInfoWindow && (
                    <InfoWindow
                      position={{
                        lat: mapInfoWindow.ubicacion.lat,
                        lng: mapInfoWindow.ubicacion.lng
                      }}
                      onCloseClick={() => setMapInfoWindow(null)}
                    >
                      <div className={styles.infoWindowContent}>
                        <h3 className={styles.infoWindowTitle}>{mapInfoWindow.nombre}</h3>
                        <div className={styles.infoWindowDetail}>
                          <strong>Estado:</strong> {mapInfoWindow.estado}
                        </div>
                        <div className={styles.infoWindowDetail}>
                          <strong>Área:</strong> {mapInfoWindow.area} hectáreas
                        </div>
                        <div className={styles.infoWindowDetail}>
                          <strong>Comunidad:</strong> {mapInfoWindow.comunidad.nombre}
                        </div>
                        <div className={styles.infoWindowDetail}>
                          <strong>Propietario:</strong> {mapInfoWindow.propietario ? mapInfoWindow.propietario.nombreCompleto : 'No asignado'}
                        </div>
                        <button
                          onClick={() => {
                            setParcelaSeleccionada(mapInfoWindow);
                            setMapInfoWindow(null);
                          }}
                          className={styles.infoWindowButton}
                        >
                          Ver detalles completos
                        </button>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </LoadScript>
            ) : (
              <div className={styles.mapErrorFallback}>
                <div className={styles.mapErrorIcon}>🗺️</div>
                <h3>No se pudo cargar el mapa</h3>
                <p>Se muestra información de las parcelas en formato de lista</p>
                <div className={styles.parcelasList}>
                  {parcelasFiltradas.map(parcela => (
                    <div
                      key={parcela.idParcela}
                      className={`${styles.parcelaListItem} ${parcela.estado === 'Al día' ? styles.estadoAldia :
                          parcela.estado === 'Pendiente' ? styles.estadoPendiente :
                            styles.estadoAtrasado
                        }`}
                      onClick={() => setParcelaSeleccionada(parcela)}
                    >
                      <div className={styles.parcelaListContent}>
                        <h4>{parcela.nombre}</h4>
                        <p>{parcela.direccion}</p>
                        <span className={`${styles.parcelaListBadge} ${parcela.estado === 'Al día' ? styles.badgeAldia :
                            parcela.estado === 'Pendiente' ? styles.badgePendiente :
                              styles.badgeAtrasado
                          }`}>
                          {parcela.estado}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vista de respaldo durante la carga */}
            {isLoading && (
              <div className={styles.mapLoadingOverlay}>
                <div className={styles.spinner}></div>
                <p>Cargando mapa de parcelas...</p>
              </div>
            )}
          </div>
        </div>

        {/* Detalles de la parcela seleccionada */}
        {parcelaSeleccionada && (
          <div className={styles.parcelaDetailOverlay}>
            <div className={styles.parcelaDetail}>
              <button className={styles.closeButton} onClick={closeParcelaDetail}>
                ×
              </button>
              <h2 className={styles.detailTitle}>
                {parcelaSeleccionada.nombre}
                <span className={`${styles.detailBadge} ${styles[`badge${parcelaSeleccionada.estado.replace(/\s+/g, '')}`]}`}>
                  {parcelaSeleccionada.estado}
                </span>
              </h2>
              <div className={styles.detailContent}>
                <p className={styles.detailRow}>
                  <span className={styles.detailLabel}>ID Parcela:</span>
                  <span className={styles.detailValue}>{parcelaSeleccionada.idParcela}</span>
                </p>
                <p className={styles.detailRow}>
                  <span className={styles.detailLabel}>Dirección:</span>
                  <span className={styles.detailValue}>{parcelaSeleccionada.direccion}</span>
                </p>
                <p className={styles.detailRow}>
                  <span className={styles.detailLabel}>Área:</span>
                  <span className={styles.detailValue}>{parcelaSeleccionada.area} hectáreas</span>
                </p>
                <p className={styles.detailRow}>
                  <span className={styles.detailLabel}>Valor Catastral:</span>
                  <span className={styles.detailValue}>{formatCLP(parcelaSeleccionada.valorCatastral)}</span>
                </p>
                <p className={styles.detailRow}>
                  <span className={styles.detailLabel}>Fecha Adquisición:</span>
                  <span className={styles.detailValue}>{formatFecha(parcelaSeleccionada.fechaAdquisicion)}</span>
                </p>
                <p className={styles.detailRow}>
                  <span className={styles.detailLabel}>Comunidad:</span>
                  <span className={styles.detailValue}>{parcelaSeleccionada.comunidad.nombre}</span>
                </p>
                <p className={styles.detailRow}>
                  <span className={styles.detailLabel}>Propietario:</span>
                  <span className={styles.detailValue}>
                    {parcelaSeleccionada.propietario ? parcelaSeleccionada.propietario.nombreCompleto : 'No asignado'}
                  </span>
                </p>
                {parcelaSeleccionada.propietario?.email && (
                  <p className={styles.detailRow}>
                    <span className={styles.detailLabel}>Email:</span>
                    <span className={styles.detailValue}>{parcelaSeleccionada.propietario.email}</span>
                  </p>
                )}
                <p className={styles.detailRow}>
                  <span className={styles.detailLabel}>Gastos Pendientes:</span>
                  <span className={styles.detailValue}>
                    {parcelaSeleccionada.gastosPendientes || 0}
                  </span>
                </p>
                {parcelaSeleccionada.ultimoPago && (
                  <p className={styles.detailRow}>
                    <span className={styles.detailLabel}>Último Pago:</span>
                    <span className={styles.detailValue}>{formatFecha(parcelaSeleccionada.ultimoPago)}</span>
                  </p>
                )}
                <p className={styles.detailRow}>
                  <span className={styles.detailLabel}>Coordenadas:</span>
                  <span className={styles.detailValue}>
                    {parcelaSeleccionada.ubicacion.lat.toFixed(6)}, {parcelaSeleccionada.ubicacion.lng.toFixed(6)}
                  </span>
                </p>

                <div className={styles.detailSectionTitle}>Acciones de Gestión</div>
                <div className={styles.detailActions}>
                  <Link to="/admin/contratos" className={`${styles.actionButton} ${styles.contractButton}`}>
                    <span className={styles.actionIcon}>📄</span>
                    Ver Contrato
                    <span className={styles.actionTooltip}>
                      Consulta el contrato asociado a esta parcela según la tabla Contrato en la base de datos
                    </span>
                  </Link>
                  <Link to={`/admin/parcelas/editar/${parcelaSeleccionada.idParcela}`} className={`${styles.actionButton} ${styles.editButton}`}>
                    <span className={styles.actionIcon}>✏️</span>
                    Editar Parcela
                    <span className={styles.actionTooltip}>
                      Modifica información como nombre, dirección, valor catastral y otros datos de la parcela
                    </span>
                  </Link>
                  <Link to={`/admin/parcelas/gastos/${parcelaSeleccionada.idParcela}`} className={`${styles.actionButton} ${styles.expenseButton}`}>
                    <span className={styles.actionIcon}>💰</span>
                    Ver Gastos
                    <span className={styles.actionTooltip}>
                      Consulta cuotas ordinarias, extraordinarias y otros gastos asignados a esta parcela
                    </span>
                  </Link>
                  {!parcelaSeleccionada.propietario && (
                    <Link to="/admin/usuarios" className={`${styles.actionButton} ${styles.assignButton}`}
                      onClick={() => {
                        // Aquí se podría guardar en localStorage o contexto la parcela a asignar
                        localStorage.setItem('parcelaParaAsignar', JSON.stringify({
                          id: parcelaSeleccionada.idParcela,
                          nombre: parcelaSeleccionada.nombre
                        }));
                      }}
                    >
                      <span className={styles.actionIcon}>👤</span>
                      Asignar Propietario
                      <span className={styles.actionTooltip}>
                        Vincula un usuario copropietario existente a esta parcela
                      </span>
                    </Link>
                  )}
                </div>

                <div className={styles.detailSectionDivider}></div>

                <div className={styles.detailSectionTitle}>Historial de Pagos</div>
                <div className={styles.detailHistorySection}>
                  <div className={styles.historyEmptyState}>
                    <div className={styles.emptyStateIcon}>📋</div>
                    <p>Consulta el historial de pagos realizados por esta parcela</p>
                    <button className={styles.secondaryButton}>Ver Historial Completo</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
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