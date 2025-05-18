import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import styles from '../Admin.module.css';
import parcelaStyles from './Parcelas.module.css';

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
  idUsuario?: number;
  idComunidad: number;
}

interface Usuario {
  idUsuario: number;
  nombreCompleto: string;
  email: string;
}

interface Comunidad {
  idComunidad: number;
  nombre: string;
}

export const EditarParcela = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [parcela, setParcela] = useState<Parcela | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [comunidades, setComunidades] = useState<Comunidad[]>([]);
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
            ubicacion: { lat: -33.41, lng: -70.62 },
            area: 1.5, // 1.5 hectáreas
            estado: 'Al día', 
            fechaAdquisicion: '2022-05-15',
            valorCatastral: 65000000,
            idUsuario: 5,
            idComunidad: 1
          };
          
          setParcela(parcelaData);
          setIsLoading(false);
        }, 800);
      } catch (err) {
        console.error('Error al cargar la parcela:', err);
        setError('No se pudo cargar la información de la parcela. Por favor, intente nuevamente.');
        setIsLoading(false);
      }
    };

    const cargarUsuarios = async () => {
      try {
        // Datos simulados para desarrollo
        setTimeout(() => {
          const usuariosData: Usuario[] = [
            { idUsuario: 1, nombreCompleto: 'Administrador Sistema', email: 'admin@sigepa.com' },
            { idUsuario: 2, nombreCompleto: 'Usuario Prueba', email: 'user@sigepa.com' },
            { idUsuario: 5, nombreCompleto: 'Roberto Gómez', email: 'rgomez@example.com' },
            { idUsuario: 7, nombreCompleto: 'María González', email: 'mgonzalez@example.com' }
          ];
          setUsuarios(usuariosData);
        }, 500);
      } catch (err) {
        console.error('Error al cargar usuarios:', err);
      }
    };

    const cargarComunidades = async () => {
      try {
        // Datos simulados para desarrollo
        setTimeout(() => {
          const comunidadesData: Comunidad[] = [
            { idComunidad: 1, nombre: 'Valle Verde' },
            { idComunidad: 2, nombre: 'Hacienda Los Almendros' },
            { idComunidad: 3, nombre: 'Parque Los Nogales' }
          ];
          setComunidades(comunidadesData);
        }, 500);
      } catch (err) {
        console.error('Error al cargar comunidades:', err);
      }
    };

    if (id) {
      cargarParcela();
      cargarUsuarios();
      cargarComunidades();
    } else {
      setError('ID de parcela no proporcionado.');
      setIsLoading(false);
    }
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Aquí iría la lógica para guardar los cambios
    // En un entorno real se enviaría a la API
    
    alert('Parcela actualizada correctamente');
    navigate('/admin/mapa');
  };

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
          <h2 className={styles.dashboardTitle}>Editar Parcela</h2>
          <div className={styles.headerBrand}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.favicon} /> SIGEPA
          </div>
        </header>
        
        {/* Barra de navegación y acciones */}
        <div className={parcelaStyles.navActions}>
          <div className={parcelaStyles.breadcrumbs}>
            <Link to="/admin" className={parcelaStyles.breadcrumbLink}>Inicio</Link> {' > '}
            <Link to="/admin/mapa" className={parcelaStyles.breadcrumbLink}>Mapa</Link> {' > '}
            <span className={parcelaStyles.currentPage}>Editar Parcela #{parcela?.idParcela}</span>
          </div>
          
          <div className={parcelaStyles.actionButtons}>
            <Link to="/admin/mapa" className={parcelaStyles.backButton}>
              <span>←</span> Volver al Mapa
            </Link>
          </div>
        </div>
        
        {parcela && (
          <div className={parcelaStyles.formContainer}>
            <form onSubmit={handleSubmit} className={parcelaStyles.form}>
              <div className={parcelaStyles.formSection}>
                <h3 className={parcelaStyles.formSectionTitle}>Información General</h3>
                
                <div className={parcelaStyles.formRow}>
                  <div className={parcelaStyles.formGroup}>
                    <label htmlFor="nombre">Nombre de la Parcela</label>
                    <input 
                      type="text" 
                      id="nombre" 
                      className={parcelaStyles.input} 
                      defaultValue={parcela.nombre}
                      required
                    />
                  </div>
                  
                  <div className={parcelaStyles.formGroup}>
                    <label htmlFor="direccion">Dirección</label>
                    <input 
                      type="text" 
                      id="direccion" 
                      className={parcelaStyles.input} 
                      defaultValue={parcela.direccion}
                      required
                    />
                  </div>
                </div>
                
                <div className={parcelaStyles.formRow}>
                  <div className={parcelaStyles.formGroup}>
                    <label htmlFor="area">Área (hectáreas)</label>
                    <input 
                      type="number" 
                      id="area" 
                      className={parcelaStyles.input} 
                      defaultValue={parcela.area}
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div className={parcelaStyles.formGroup}>
                    <label htmlFor="valorCatastral">Valor Catastral</label>
                    <input 
                      type="number" 
                      id="valorCatastral" 
                      className={parcelaStyles.input} 
                      defaultValue={parcela.valorCatastral}
                      required
                    />
                  </div>
                </div>
                
                <div className={parcelaStyles.formRow}>
                  <div className={parcelaStyles.formGroup}>
                    <label htmlFor="fechaAdquisicion">Fecha de Adquisición</label>
                    <input 
                      type="date" 
                      id="fechaAdquisicion" 
                      className={parcelaStyles.input} 
                      defaultValue={parcela.fechaAdquisicion}
                      required
                    />
                  </div>
                  
                  <div className={parcelaStyles.formGroup}>
                    <label htmlFor="estado">Estado</label>
                    <select 
                      id="estado" 
                      className={parcelaStyles.select}
                      defaultValue={parcela.estado}
                      required
                    >
                      <option value="Al día">Al día</option>
                      <option value="Pendiente">Pendiente</option>
                      <option value="Atrasado">Atrasado</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className={parcelaStyles.formSection}>
                <h3 className={parcelaStyles.formSectionTitle}>Asignaciones</h3>
                
                <div className={parcelaStyles.formRow}>
                  <div className={parcelaStyles.formGroup}>
                    <label htmlFor="propietario">Propietario</label>
                    <select 
                      id="propietario" 
                      className={parcelaStyles.select}
                      defaultValue={parcela.idUsuario}
                    >
                      <option value="">-- Sin propietario asignado --</option>
                      {usuarios.map(usuario => (
                        <option key={usuario.idUsuario} value={usuario.idUsuario}>
                          {usuario.nombreCompleto} ({usuario.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={parcelaStyles.formGroup}>
                    <label htmlFor="comunidad">Comunidad</label>
                    <select 
                      id="comunidad" 
                      className={parcelaStyles.select}
                      defaultValue={parcela.idComunidad}
                      required
                    >
                      {comunidades.map(comunidad => (
                        <option key={comunidad.idComunidad} value={comunidad.idComunidad}>
                          {comunidad.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className={parcelaStyles.formSection}>
                <h3 className={parcelaStyles.formSectionTitle}>Ubicación</h3>
                
                <div className={parcelaStyles.formRow}>
                  <div className={parcelaStyles.formGroup}>
                    <label htmlFor="latitud">Latitud</label>
                    <input 
                      type="number" 
                      id="latitud" 
                      className={parcelaStyles.input} 
                      defaultValue={parcela.ubicacion.lat}
                      step="0.000001"
                      required
                    />
                  </div>
                  
                  <div className={parcelaStyles.formGroup}>
                    <label htmlFor="longitud">Longitud</label>
                    <input 
                      type="number" 
                      id="longitud" 
                      className={parcelaStyles.input} 
                      defaultValue={parcela.ubicacion.lng}
                      step="0.000001"
                      required
                    />
                  </div>
                </div>
                
                <div className={parcelaStyles.mapPreview}>
                  <div className={parcelaStyles.mapPlaceholder}>
                    <p>Vista previa del mapa no disponible en este momento</p>
                    <p>Las coordenadas serán: {parcela.ubicacion.lat.toFixed(6)}, {parcela.ubicacion.lng.toFixed(6)}</p>
                  </div>
                </div>
              </div>
              
              <div className={parcelaStyles.formActions}>
                <Link to="/admin/mapa" className={parcelaStyles.cancelButton}>
                  Cancelar
                </Link>
                <button type="submit" className={parcelaStyles.submitButton}>
                  Guardar Cambios
                </button>
              </div>
            </form>
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