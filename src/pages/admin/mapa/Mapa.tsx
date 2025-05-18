import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './Mapa.module.css';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

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
      // En un entorno real, esto sería una llamada a la API
      // const response = await adminService.getComunidades();
      
      // Datos simulados de comunidades
      setTimeout(() => {
        const comunidadesData: Comunidad[] = [
          { idComunidad: 1, nombre: 'Valle Verde' },
          { idComunidad: 2, nombre: 'Hacienda Los Almendros' },
          { idComunidad: 3, nombre: 'Parque Los Nogales' },
        ];
        setComunidades(comunidadesData);
      }, 300);
    };

    cargarComunidades();
  }, []);

  useEffect(() => {
    const cargarParcelas = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // En un entorno real, esto sería una llamada a la API
        // const response = await adminService.getParcelas();
        
        // Datos simulados para desarrollo con la estructura de la base de datos
        setTimeout(() => {
          const parcelasData: Parcela[] = [
            { 
              idParcela: 1, 
              nombre: 'Parcela Arrayán', 
              direccion: 'Camino El Arrayán 2500, Lo Barnechea', 
              ubicacion: { lat: -33.41, lng: -70.62 },
              area: 1.5, // 1.5 hectáreas
              estado: 'Al día', 
              fechaAdquisicion: '2022-05-15',
              valorCatastral: 65000000,
              propietario: {
                idUsuario: 5,
                nombreCompleto: 'Roberto Gómez',
                email: 'rgomez@example.com'
              },
              comunidad: {
                idComunidad: 1,
                nombre: 'Valle Verde'
              },
              gastosPendientes: 0,
              ultimoPago: '2023-08-15'
            },
            { 
              idParcela: 2, 
              nombre: 'Parcela Los Cipreses', 
              direccion: 'Camino Los Cipreses 350, Pirque', 
              ubicacion: { lat: -33.42, lng: -70.63 },
              area: 2.2,
              estado: 'Al día', 
              fechaAdquisicion: '2021-10-23',
              valorCatastral: 85000000,
              propietario: {
                idUsuario: 7,
                nombreCompleto: 'María González',
                email: 'mgonzalez@example.com'
              },
              comunidad: {
                idComunidad: 1,
                nombre: 'Valle Verde'
              },
              gastosPendientes: 0,
              ultimoPago: '2023-08-10'
            },
            { 
              idParcela: 3, 
              nombre: 'Parcela El Algarrobal', 
              direccion: 'Camino El Algarrobal Km 5, Colina', 
              ubicacion: { lat: -33.43, lng: -70.64 },
              area: 1.8,
              estado: 'Pendiente', 
              fechaAdquisicion: '2022-03-07',
              valorCatastral: 58000000,
              propietario: null,
              comunidad: {
                idComunidad: 2,
                nombre: 'Hacienda Los Almendros'
              },
              gastosPendientes: 1,
              ultimoPago: '2023-07-05'
            },
            { 
              idParcela: 4, 
              nombre: 'Parcela Las Encinas', 
              direccion: 'Camino Las Encinas 780, Calera de Tango', 
              ubicacion: { lat: -33.44, lng: -70.65 },
              area: 3.2,
              estado: 'Pendiente', 
              fechaAdquisicion: '2020-12-18',
              valorCatastral: 120000000,
              propietario: null,
              comunidad: {
                idComunidad: 2,
                nombre: 'Hacienda Los Almendros'
              },
              gastosPendientes: 2,
              ultimoPago: '2023-06-15'
            },
            { 
              idParcela: 5, 
              nombre: 'Parcela El Quillay', 
              direccion: 'Camino El Quillay 455, Lampa', 
              ubicacion: { lat: -33.45, lng: -70.66 },
              area: 1.9,
              estado: 'Al día', 
              fechaAdquisicion: '2021-09-30',
              valorCatastral: 72000000,
              propietario: {
                idUsuario: 12,
                nombreCompleto: 'Carlos Rodríguez',
                email: 'crodriguez@example.com'
              },
              comunidad: {
                idComunidad: 3,
                nombre: 'Parque Los Nogales'
              },
              gastosPendientes: 0,
              ultimoPago: '2023-08-12'
            },
            { 
              idParcela: 6, 
              nombre: 'Parcela Los Aromos', 
              direccion: 'Camino Los Aromos 920, Buin', 
              ubicacion: { lat: -33.46, lng: -70.67 },
              area: 2.5,
              estado: 'Al día', 
              fechaAdquisicion: '2021-04-15',
              valorCatastral: 95000000,
              propietario: {
                idUsuario: 15,
                nombreCompleto: 'Ana Martínez',
                email: 'amartinez@example.com'
              },
              comunidad: {
                idComunidad: 3,
                nombre: 'Parque Los Nogales'
              },
              gastosPendientes: 0,
              ultimoPago: '2023-08-03'
            },
            { 
              idParcela: 7, 
              nombre: 'Parcela Los Espinos', 
              direccion: 'Camino Los Espinos 1200, Padre Hurtado', 
              ubicacion: { lat: -33.47, lng: -70.68 },
              area: 1.7,
              estado: 'Atrasado', 
              fechaAdquisicion: '2022-06-08',
              valorCatastral: 62000000,
              propietario: null,
              comunidad: {
                idComunidad: 1,
                nombre: 'Valle Verde'
              },
              gastosPendientes: 3,
              ultimoPago: '2023-05-20'
            },
            { 
              idParcela: 8, 
              nombre: 'Parcela El Canelo', 
              direccion: 'Camino El Canelo 550, San José de Maipo', 
              ubicacion: { lat: -33.48, lng: -70.69 },
              area: 2.8,
              estado: 'Al día', 
              fechaAdquisicion: '2020-08-22',
              valorCatastral: 105000000,
              propietario: {
                idUsuario: 21,
                nombreCompleto: 'Pedro Sánchez',
                email: 'psanchez@example.com'
              },
              comunidad: {
                idComunidad: 2,
                nombre: 'Hacienda Los Almendros'
              },
              gastosPendientes: 0,
              ultimoPago: '2023-08-05'
            }
          ];
          setParcelas(parcelasData);
          setIsLoading(false);
        }, 800);
      } catch (err) {
        console.error('Error al cargar parcelas:', err);
        setError('No se pudieron cargar los datos de las parcelas. Por favor, intente nuevamente.');
        setIsLoading(false);
      }
    };

    cargarParcelas();
  }, []);

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

  const handleBuscar = () => {
    // Lógica de búsqueda en un entorno real
    console.log(`Buscando: ${busqueda}`);
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
    // Filtro por estado
    if (filtroEstado !== 'todos' && parcela.estado !== filtroEstado) {
      return false;
    }
    
    // Filtro por comunidad
    if (filtroComunidad !== 'todos' && parcela.comunidad.idComunidad !== filtroComunidad) {
      return false;
    }
    
    // Filtro por búsqueda
    if (busqueda && !parcela.nombre.toLowerCase().includes(busqueda.toLowerCase())) {
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

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
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
            </div>
            
            <div className={styles.searchContainer}>
              <input 
                type="text" 
                placeholder="Buscar parcela..." 
                className={styles.searchInput} 
                value={busqueda}
                onChange={handleBusquedaChange}
              />
              <button 
                className={styles.searchButton}
                onClick={handleBuscar}
              >
                Buscar
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
            
            <div className={styles.searchContainer}>
              <input 
                type="text" 
                placeholder="Buscar parcela..." 
                className={styles.searchInput} 
                value={busqueda}
                onChange={handleBusquedaChange}
              />
              <button 
                className={styles.searchButton}
                onClick={handleBuscar}
              >
                Buscar
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
                <span className={styles.statValue}>{parcelas.length}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Al día:</span>
                <span className={styles.statValue}>
                  {parcelas.filter(p => p.estado === 'Al día').length}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Pendientes:</span>
                <span className={styles.statValue}>
                  {parcelas.filter(p => p.estado === 'Pendiente').length}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Atrasadas:</span>
                <span className={styles.statValue}>
                  {parcelas.filter(p => p.estado === 'Atrasado').length}
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
                      className={`${styles.parcelaListItem} ${
                        parcela.estado === 'Al día' ? styles.estadoAldia :
                        parcela.estado === 'Pendiente' ? styles.estadoPendiente :
                        styles.estadoAtrasado
                      }`}
                      onClick={() => setParcelaSeleccionada(parcela)}
                    >
                      <div className={styles.parcelaListContent}>
                        <h4>{parcela.nombre}</h4>
                        <p>{parcela.direccion}</p>
                        <span className={`${styles.parcelaListBadge} ${
                          parcela.estado === 'Al día' ? styles.badgeAldia :
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