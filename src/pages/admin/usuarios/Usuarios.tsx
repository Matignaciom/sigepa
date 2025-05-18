import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../Admin.module.css';
import userStyles from './Usuarios.module.css';

// Definición de interfaces actualizadas
interface Parcela {
  idParcela: number;
  nombre: string;
  direccion: string;
  area: number;
  valorCatastral: number;
}

// Definición del usuario según el esquema de la base de datos
interface Usuario {
  idUsuario: number;
  nombreCompleto: string;
  email: string;
  rol: 'Administrador' | 'Copropietario';
  rut: string;
  rut_original?: string;
  direccion?: string;
  telefono?: string;
  fechaRegistro?: string;
  idComunidad: number;
  estado?: 'activo' | 'inactivo' | 'suspendido';
  parcela?: Parcela;
}

interface EstadisticasUsuarios {
  totalUsuarios: number;
  administradores: number;
  copropietarios: number;
  usuariosActivos: number;
  usuariosInactivos: number;
  comunidades: Record<number, number>; // id comunidad -> número de usuarios
}

export const Usuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [crearModalVisible, setCrearModalVisible] = useState(false);
  const [asignarParcelaModalVisible, setAsignarParcelaModalVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  const [estadisticas, setEstadisticas] = useState<EstadisticasUsuarios | null>(null);
  const [parcelasDisponibles, setParcelasDisponibles] = useState<Parcela[]>([]);
  const [parcelaSeleccionada, setParcelaSeleccionada] = useState<number | ''>('');
  
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 576);
      setIsSmallMobile(window.innerWidth <= 430);
    };

    // Comprobar inicialmente
    checkIfMobile();

    // Añadir listener para cambios de tamaño
    window.addEventListener('resize', checkIfMobile);

    // Limpiar listener al desmontar
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Función para calcular estadísticas de usuarios
  const calcularEstadisticas = (usuariosData: Usuario[]): EstadisticasUsuarios => {
    const stats: EstadisticasUsuarios = {
      totalUsuarios: usuariosData.length,
      administradores: 0,
      copropietarios: 0,
      usuariosActivos: 0,
      usuariosInactivos: 0,
      comunidades: {}
    };

    usuariosData.forEach(usuario => {
      // Contar por rol
      if (usuario.rol === 'Administrador') {
        stats.administradores++;
      } else {
        stats.copropietarios++;
      }

      // Contar por estado
      if (usuario.estado === 'activo') {
        stats.usuariosActivos++;
      } else {
        stats.usuariosInactivos++;
      }

      // Contar por comunidad
      if (!stats.comunidades[usuario.idComunidad]) {
        stats.comunidades[usuario.idComunidad] = 1;
      } else {
        stats.comunidades[usuario.idComunidad]++;
      }
    });

    return stats;
  };

  useEffect(() => {
    const cargarUsuarios = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // En un entorno real, esto sería una llamada a la API
        // const response = await adminService.getUsers();
        
        // Datos simulados para desarrollo, adaptados a la estructura de la DB
        setTimeout(() => {
          const usuariosData: Usuario[] = [
            { 
              idUsuario: 1, 
              nombreCompleto: 'Administrador Sistema', 
              email: 'admin@sigepa.com', 
              rol: 'Administrador', 
              rut: '12.345.678-9',
              idComunidad: 1,
              fechaRegistro: '01/01/2023',
              estado: 'activo'
            },
            { 
              idUsuario: 2, 
              nombreCompleto: 'Usuario Prueba', 
              email: 'user@sigepa.com', 
              rol: 'Copropietario', 
              rut: '9.876.543-2', 
              telefono: '987654321', 
              direccion: 'Calle Principal 123', 
              idComunidad: 1,
              fechaRegistro: '15/02/2023',
              estado: 'activo' 
            },
            { 
              idUsuario: 3, 
              nombreCompleto: 'María González', 
              email: 'maria@ejemplo.com', 
              rol: 'Copropietario', 
              rut: '11.222.333-4', 
              telefono: '123456789', 
              direccion: 'Avenida Central 456', 
              idComunidad: 1,
              fechaRegistro: '03/03/2023',
              estado: 'activo' 
            },
            { 
              idUsuario: 4, 
              nombreCompleto: 'Carlos Rodríguez', 
              email: 'carlos@ejemplo.com', 
              rol: 'Copropietario', 
              rut: '4.555.666-7', 
              telefono: '456789123', 
              direccion: 'Calle Norte 789', 
              idComunidad: 2,
              fechaRegistro: '20/03/2023',
              estado: 'activo' 
            },
            { 
              idUsuario: 5, 
              nombreCompleto: 'Ana Martínez', 
              email: 'ana@ejemplo.com', 
              rol: 'Copropietario', 
              rut: '7.888.999-0', 
              telefono: '789123456', 
              direccion: 'Avenida Sur 321', 
              idComunidad: 2,
              fechaRegistro: '05/04/2023',
              estado: 'activo' 
            },
            { 
              idUsuario: 6, 
              nombreCompleto: 'Pedro Sánchez', 
              email: 'pedro@ejemplo.com', 
              rol: 'Administrador', 
              rut: '10.111.213-4', 
              telefono: '321654987', 
              direccion: 'Calle Este 654', 
              idComunidad: 1,
              fechaRegistro: '10/05/2023',
              estado: 'activo' 
            },
            { 
              idUsuario: 7, 
              nombreCompleto: 'Laura López', 
              email: 'laura@ejemplo.com', 
              rol: 'Copropietario', 
              rut: '14.151.617-8', 
              telefono: '654987321', 
              direccion: 'Avenida Oeste 987', 
              idComunidad: 3,
              fechaRegistro: '15/06/2023',
              estado: 'inactivo' 
            },
          ];
          setUsuarios(usuariosData);
          setEstadisticas(calcularEstadisticas(usuariosData));
          setIsLoading(false);
        }, 800);
      } catch (err) {
        console.error('Error al cargar usuarios:', err);
        setError('No se pudieron cargar los datos de los usuarios. Por favor, intente nuevamente.');
        setIsLoading(false);
      }
    };

    cargarUsuarios();
  }, []);

  useEffect(() => {
    const cargarParcelas = async () => {
      try {
        // En un entorno real, esto sería una llamada a la API
        // const response = await parcelaService.getParcelasDisponibles();
        
        // Datos simulados para desarrollo
        setTimeout(() => {
          const parcelasData: Parcela[] = [
            { 
              idParcela: 3, 
              nombre: 'Parcela El Algarrobal', 
              direccion: 'Camino El Algarrobal Km 5, Colina', 
              area: 1.8,
              valorCatastral: 58000000
            },
            { 
              idParcela: 4, 
              nombre: 'Parcela Las Encinas', 
              direccion: 'Camino Las Encinas 780, Calera de Tango', 
              area: 3.2,
              valorCatastral: 120000000
            },
            { 
              idParcela: 7, 
              nombre: 'Parcela Los Espinos', 
              direccion: 'Camino Los Espinos 1200, Padre Hurtado', 
              area: 1.7,
              valorCatastral: 62000000
            }
          ];
          setParcelasDisponibles(parcelasData);
        }, 500);
      } catch (err) {
        console.error('Error al cargar parcelas disponibles:', err);
      }
    };

    cargarParcelas();
  }, []);

  const handleEditarUsuario = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setModalVisible(true);
  };

  const handleCrearUsuario = () => {
    setCrearModalVisible(true);
  };

  const handleCerrarModal = () => {
    setModalVisible(false);
  };

  const handleCerrarCrearModal = () => {
    setCrearModalVisible(false);
  };

  const handleGuardarUsuario = () => {
    // Aquí iría la lógica para guardar el usuario en un entorno real
    alert(`Usuario actualizado correctamente`);
    setModalVisible(false);
  };

  const handleCrearNuevoUsuario = () => {
    // Obtener los valores del formulario
    const rolSeleccionado = (document.getElementById('rolNuevo') as HTMLSelectElement).value as 'Administrador' | 'Copropietario';
    
    // Crear usuario base
    const nuevoUsuario: Usuario = {
      idUsuario: usuarios.length + 1,
      nombreCompleto: (document.getElementById('nombreCompletoNuevo') as HTMLInputElement).value,
      email: (document.getElementById('emailNuevo') as HTMLInputElement).value,
      rol: rolSeleccionado,
      rut: (document.getElementById('rutNuevo') as HTMLInputElement).value,
      telefono: (document.getElementById('telefonoNuevo') as HTMLInputElement).value,
      direccion: (document.getElementById('direccionNuevo') as HTMLInputElement).value,
      idComunidad: parseInt((document.getElementById('comunidadNuevo') as HTMLSelectElement).value),
      fechaRegistro: new Date().toLocaleDateString(),
      estado: 'activo'
    };
    
    // Si es copropietario, agregar datos de la parcela
    if (rolSeleccionado === 'Copropietario') {
      const parcelaNombre = (document.getElementById('parcelaNombreNuevo') as HTMLInputElement).value;
      const parcelaDireccion = (document.getElementById('parcelaDireccionNuevo') as HTMLInputElement).value;
      const parcelaArea = parseFloat((document.getElementById('parcelaAreaNuevo') as HTMLInputElement).value);
      const parcelaValor = parseFloat((document.getElementById('parcelaValorNuevo') as HTMLInputElement).value);
      
      nuevoUsuario.parcela = {
        idParcela: usuarios.length + 50, // Generamos un ID ficticio para la parcela
        nombre: parcelaNombre,
        direccion: parcelaDireccion,
        area: parcelaArea,
        valorCatastral: parcelaValor
      };
    }
    
    const usuariosActualizados = [...usuarios, nuevoUsuario];
    setUsuarios(usuariosActualizados);
    setEstadisticas(calcularEstadisticas(usuariosActualizados));
    
    alert(`Usuario ${nuevoUsuario.nombreCompleto} creado correctamente`);
    setCrearModalVisible(false);
  };

  const handleCambiarEstado = (id: number, nuevoEstado: 'activo' | 'inactivo' | 'suspendido') => {
    // Función corregida para cambiar el estado de un solo usuario
    const usuariosActualizados = usuarios.map(usuario => 
      usuario.idUsuario === id ? { ...usuario, estado: nuevoEstado } : usuario
    );
    
    setUsuarios(usuariosActualizados);
    setEstadisticas(calcularEstadisticas(usuariosActualizados));
  };

  const handleAsignarParcela = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setAsignarParcelaModalVisible(true);
  };

  const handleCerrarAsignarModal = () => {
    setAsignarParcelaModalVisible(false);
    setParcelaSeleccionada('');
  };

  const handleConfirmarAsignacion = () => {
    if (!usuarioSeleccionado || !parcelaSeleccionada) {
      alert('Por favor, seleccione una parcela para asignar.');
      return;
    }

    // En un entorno real, aquí enviaríamos los datos al backend
    
    // Simulamos la actualización
    const parcelaAsignada = parcelasDisponibles.find(p => p.idParcela === Number(parcelaSeleccionada));
    
    if (parcelaAsignada) {
      // Actualizar la lista de usuarios (simulado)
      const usuariosActualizados = usuarios.map(u => 
        u.idUsuario === usuarioSeleccionado.idUsuario 
          ? { ...u, parcela: parcelaAsignada } 
          : u
      );
      
      setUsuarios(usuariosActualizados);
      
      // Quitar la parcela asignada de la lista de disponibles
      const parcelasRestantes = parcelasDisponibles.filter(p => p.idParcela !== Number(parcelaSeleccionada));
      setParcelasDisponibles(parcelasRestantes);
      
      alert(`Parcela "${parcelaAsignada.nombre}" asignada correctamente a ${usuarioSeleccionado.nombreCompleto}`);
      setAsignarParcelaModalVisible(false);
      setParcelaSeleccionada('');
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

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando usuarios...</p>
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
      
      {/* Panel lateral izquierdo - Igual al de Admin.tsx */}
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
                  className={`${styles.navLink} ${styles.active}`}
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
          <h2 className={styles.dashboardTitle}>Gestión de Usuarios</h2>
          <div className={styles.headerBrand}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.favicon} /> SIGEPA
          </div>
        </header>
        
        {/* Estadísticas de usuarios */}
        {estadisticas && (
          <div className={styles.statsContainer}>
            <div className={styles.statCard}>
              <div className={styles.statIconContainer}>
                <span className={styles.statIcon}>👥</span>
              </div>
              <div className={styles.statContent}>
                <h3>Total Usuarios</h3>
                <p className={styles.statNumber}>{estadisticas.totalUsuarios}</p>
                <p className={styles.statDetail}>
                  En {Object.keys(estadisticas.comunidades).length} comunidades
                </p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconContainer}>
                <span className={styles.statIcon}>👑</span>
              </div>
              <div className={styles.statContent}>
                <h3>Administradores</h3>
                <p className={styles.statNumber}>{estadisticas.administradores}</p>
                <p className={styles.statDetail}>
                  {Math.round((estadisticas.administradores / estadisticas.totalUsuarios) * 100)}% del total
                </p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconContainer}>
                <span className={styles.statIcon}>🏠</span>
              </div>
              <div className={styles.statContent}>
                <h3>Copropietarios</h3>
                <p className={styles.statNumber}>{estadisticas.copropietarios}</p>
                <p className={styles.statDetail}>
                  {Math.round((estadisticas.copropietarios / estadisticas.totalUsuarios) * 100)}% del total
                </p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconContainer}>
                <span className={styles.statIcon}>✅</span>
              </div>
              <div className={styles.statContent}>
                <h3>Usuarios Activos</h3>
                <p className={styles.statNumber}>{estadisticas.usuariosActivos}</p>
                <p className={styles.statDetail}>
                  {estadisticas.usuariosInactivos} inactivos
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botón para crear nuevo usuario */}
        <div className={userStyles.actionHeader}>
          <button 
            className={userStyles.createButton}
            onClick={handleCrearUsuario}
          >
            <span className={userStyles.createIcon}>+</span>
            Crear Nuevo Usuario
          </button>
        </div>
        
        {/* Filtros y búsqueda */}
        <div className={userStyles.filters}>
          <div className={userStyles.searchContainer}>
          <input 
            type="text" 
            placeholder="Buscar usuario..." 
              className={userStyles.searchInput} 
          />
            <button className={userStyles.searchButton}>Buscar</button>
        </div>
        
          <div className={userStyles.filterContainer}>
          <label htmlFor="role-filter">Filtrar por rol:</label>
            <select id="role-filter" className={userStyles.filterSelect}>
            <option value="todos">Todos</option>
              <option value="Administrador">Administradores</option>
              <option value="Copropietario">Copropietarios</option>
          </select>
        </div>
        
          <div className={userStyles.filterContainer}>
          <label htmlFor="estado-filter">Filtrar por estado:</label>
            <select id="estado-filter" className={userStyles.filterSelect}>
            <option value="todos">Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
            <option value="suspendido">Suspendidos</option>
          </select>
        </div>
      </div>

        {/* Tabla de usuarios para pantallas grandes */}
        {!isSmallMobile && (
          <div className={userStyles.tableResponsive}>
            <table className={userStyles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
                  <th>RUT</th>
              <th>Rol</th>
              <th>Estado</th>
                  <th>Comunidad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
                  <tr key={usuario.idUsuario} className={usuario.estado === 'inactivo' ? userStyles.inactiveRow : ''}>
                    <td>{usuario.idUsuario}</td>
                    <td>{usuario.nombreCompleto}</td>
                <td>{usuario.email}</td>
                    <td>{usuario.rut}</td>
                <td>
                      <span className={`${userStyles.badge} ${userStyles[usuario.rol === 'Administrador' ? 'admin' : 'copropietario']}`}>
                        {usuario.rol}
                  </span>
                </td>
                <td>
                      <span className={`${userStyles.badge} ${userStyles[usuario.estado || 'activo']}`}>
                    {usuario.estado ? (usuario.estado.charAt(0).toUpperCase() + usuario.estado.slice(1)) : 'Activo'}
                  </span>
                </td>
                    <td>Comunidad #{usuario.idComunidad}</td>
                <td>
                      <div className={userStyles.actions}>
                    <button 
                          className={userStyles.actionButton}
                      onClick={() => handleEditarUsuario(usuario)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    {usuario.rol === 'Copropietario' && !usuario.parcela && (
                      <button
                        className={`${userStyles.actionButton} ${userStyles.assignButton}`}
                        onClick={() => handleAsignarParcela(usuario)}
                        title="Asignar Parcela"
                      >
                        🏞️
                      </button>
                    )}
                    {usuario.estado === 'activo' ? (
                      <button 
                            className={`${userStyles.actionButton} ${userStyles.suspendButton}`}
                            onClick={() => handleCambiarEstado(usuario.idUsuario, 'inactivo')}
                        title="Desactivar"
                      >
                        🚫
                      </button>
                    ) : (
                      <button 
                            className={`${userStyles.actionButton} ${userStyles.activateButton}`}
                            onClick={() => handleCambiarEstado(usuario.idUsuario, 'activo')}
                        title="Activar"
                      >
                        ✅
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        )}

        {/* Vista alternativa para móviles */}
        {isSmallMobile && (
          <div className={userStyles.mobileCards}>
            {usuarios.map(usuario => (
              <div key={usuario.idUsuario} className={userStyles.userCard}>
                <div className={userStyles.userCardHeader}>
                  <h3 className={userStyles.userCardName}>{usuario.nombreCompleto}</h3>
                  <span className={`${userStyles.badge} ${userStyles[usuario.rol === 'Administrador' ? 'admin' : 'copropietario']}`}>
                    {usuario.rol}
                  </span>
                </div>
                
                <div className={userStyles.userCardField}>
                  <span className={userStyles.userCardLabel}>ID:</span>
                  <span className={userStyles.userCardValue}>{usuario.idUsuario}</span>
                </div>
                
                <div className={userStyles.userCardField}>
                  <span className={userStyles.userCardLabel}>Email:</span>
                  <span className={userStyles.userCardValue}>{usuario.email}</span>
                </div>
                
                <div className={userStyles.userCardField}>
                  <span className={userStyles.userCardLabel}>RUT:</span>
                  <span className={userStyles.userCardValue}>{usuario.rut}</span>
                </div>
                
                <div className={userStyles.userCardField}>
                  <span className={userStyles.userCardLabel}>Estado:</span>
                  <span className={`${userStyles.badge} ${userStyles[usuario.estado || 'activo']}`}>
                    {usuario.estado ? (usuario.estado.charAt(0).toUpperCase() + usuario.estado.slice(1)) : 'Activo'}
                  </span>
                </div>
                
                <div className={userStyles.userCardField}>
                  <span className={userStyles.userCardLabel}>Comunidad:</span>
                  <span className={userStyles.userCardValue}>#{usuario.idComunidad}</span>
                </div>
                
                <div className={userStyles.userCardActions}>
                  <button 
                    className={userStyles.actionButton}
                    onClick={() => handleEditarUsuario(usuario)}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  
                  {usuario.rol === 'Copropietario' && !usuario.parcela && (
                    <button
                      className={`${userStyles.actionButton} ${userStyles.assignButton}`}
                      onClick={() => handleAsignarParcela(usuario)}
                      title="Asignar Parcela"
                    >
                      🏞️
                    </button>
                  )}
                  
                  {usuario.estado === 'activo' ? (
                    <button 
                      className={`${userStyles.actionButton} ${userStyles.suspendButton}`}
                      onClick={() => handleCambiarEstado(usuario.idUsuario, 'inactivo')}
                      title="Desactivar"
                    >
                      🚫
                    </button>
                  ) : (
                    <button 
                      className={`${userStyles.actionButton} ${userStyles.activateButton}`}
                      onClick={() => handleCambiarEstado(usuario.idUsuario, 'activo')}
                      title="Activar"
                    >
                      ✅
                    </button>
                  )}
                </div>
              </div>
            ))}
            </div>
        )}

        {/* Modal para editar usuario */}
        {modalVisible && usuarioSeleccionado && (
          <div className={userStyles.modalOverlay}>
            <div className={userStyles.modal}>
              <div className={userStyles.modalHeader}>
                <h2>Editar Usuario</h2>
                <button className={userStyles.closeButton} onClick={handleCerrarModal}>×</button>
              </div>
              <div className={userStyles.modalBody}>
                {/* Campos editables */}
                <div className={userStyles.formGroup}>
                  <label htmlFor="nombreCompleto">Nombre Completo</label>
                <input 
                  type="text" 
                    id="nombreCompleto" 
                    className={userStyles.input}
                    defaultValue={usuarioSeleccionado.nombreCompleto || ''}
                />
              </div>
                <div className={userStyles.formGroup}>
                <label htmlFor="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                    className={userStyles.input}
                    defaultValue={usuarioSeleccionado.email || ''}
                />
              </div>
                <div className={userStyles.formGroup}>
                  <label htmlFor="rut">RUT</label>
                  <input 
                    type="text" 
                    id="rut" 
                    className={userStyles.input}
                    defaultValue={usuarioSeleccionado.rut}
                  />
                </div>
                <div className={userStyles.formGroup}>
                  <label htmlFor="rol">Rol</label>
                  <select 
                    id="rol" 
                    className={userStyles.select}
                    defaultValue={usuarioSeleccionado.rol}
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Copropietario">Copropietario</option>
                  </select>
                </div>
                <div className={userStyles.formGroup}>
                <label htmlFor="telefono">Teléfono</label>
                <input 
                    type="text" 
                  id="telefono" 
                    className={userStyles.input}
                    defaultValue={usuarioSeleccionado.telefono || ''}
                />
              </div>
                <div className={userStyles.formGroup}>
                <label htmlFor="direccion">Dirección</label>
                <input 
                  type="text" 
                  id="direccion" 
                    className={userStyles.input}
                    defaultValue={usuarioSeleccionado.direccion || ''}
                />
              </div>
                <div className={userStyles.formGroup}>
                  <label htmlFor="estado">Estado</label>
                <select 
                    id="estado" 
                    className={userStyles.select}
                    defaultValue={usuarioSeleccionado.estado || 'activo'}
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="suspendido">Suspendido</option>
                </select>
                </div>
                
                {/* Campos de solo lectura */}
                <div className={userStyles.formGroup}>
                  <label htmlFor="idComunidad">Comunidad (Solo lectura)</label>
                  <input 
                    type="text" 
                    id="idComunidad" 
                    className={`${userStyles.input} ${userStyles.readOnly}`}
                    value={`Comunidad #${usuarioSeleccionado.idComunidad}`}
                    readOnly
                  />
                </div>
                <div className={userStyles.formGroup}>
                  <label htmlFor="fechaRegistro">Fecha de Registro (Solo lectura)</label>
                  <input 
                    type="text" 
                    id="fechaRegistro" 
                    className={`${userStyles.input} ${userStyles.readOnly}`}
                    value={usuarioSeleccionado.fechaRegistro || 'No disponible'}
                    readOnly
                  />
                </div>
              </div>
              <div className={userStyles.modalFooter}>
                <button 
                  className={userStyles.cancelButton}
                  onClick={handleCerrarModal}
                >
                  Cancelar
                </button>
                <button 
                  className={userStyles.saveButton}
                  onClick={handleGuardarUsuario}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para crear nuevo usuario */}
        {crearModalVisible && (
          <div className={userStyles.modalOverlay}>
            <div className={userStyles.modal}>
              <div className={userStyles.modalHeader}>
                <h2>Crear Nuevo Usuario</h2>
                <button className={userStyles.closeButton} onClick={handleCerrarCrearModal}>×</button>
              </div>
              <div className={userStyles.modalBody}>
                <div className={userStyles.formGroup}>
                  <label htmlFor="nombreCompletoNuevo">Nombre Completo</label>
                  <input 
                    type="text" 
                    id="nombreCompletoNuevo" 
                    className={userStyles.input}
                    placeholder="Nombre completo"
                    required
                  />
                </div>
                <div className={userStyles.formGroup}>
                  <label htmlFor="emailNuevo">Email</label>
                  <input 
                    type="email" 
                    id="emailNuevo" 
                    className={userStyles.input}
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>
                <div className={userStyles.formGroup}>
                  <label htmlFor="rutNuevo">RUT</label>
                  <input 
                    type="text" 
                    id="rutNuevo" 
                    className={userStyles.input}
                    placeholder="12.345.678-9"
                    required
                  />
                </div>
                <div className={userStyles.formGroup}>
                  <label htmlFor="rolNuevo">Rol</label>
                  <select 
                    id="rolNuevo" 
                    className={userStyles.select}
                    onChange={(e) => {
                      // Mostrar u ocultar los campos de parcela según el rol seleccionado
                      const parcelaFields = document.getElementById('parcelaFields');
                      if (parcelaFields) {
                        parcelaFields.style.display = e.target.value === 'Copropietario' ? 'block' : 'none';
                      }
                    }}
                    required
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Copropietario">Copropietario</option>
                  </select>
                </div>
                <div className={userStyles.formGroup}>
                  <label htmlFor="telefonoNuevo">Teléfono</label>
                  <input 
                    type="text" 
                    id="telefonoNuevo" 
                    className={userStyles.input}
                    placeholder="912345678"
                  />
                </div>
                <div className={userStyles.formGroup}>
                  <label htmlFor="direccionNuevo">Dirección</label>
                  <input 
                    type="text" 
                    id="direccionNuevo" 
                    className={userStyles.input}
                    placeholder="Calle, número, comuna"
                  />
                </div>
                <div className={userStyles.formGroup}>
                  <label htmlFor="comunidadNuevo">Comunidad</label>
                  <select 
                    id="comunidadNuevo" 
                    className={userStyles.select}
                    required
                  >
                    <option value="1">Comunidad #1</option>
                    <option value="2">Comunidad #2</option>
                    <option value="3">Comunidad #3</option>
                  </select>
                </div>
                
                {/* Campos específicos para Parcela (solo para copropietarios) */}
                <div id="parcelaFields" style={{display: 'none', gridColumn: '1 / -1'}}>
                  <h3 className={userStyles.formSectionTitle}>Datos de la Parcela</h3>
                  
                  <div className={userStyles.formGroup}>
                    <label htmlFor="parcelaNombreNuevo">Nombre de la Parcela</label>
                    <input 
                      type="text" 
                      id="parcelaNombreNuevo" 
                      className={userStyles.input}
                      placeholder="Nombre de la parcela"
                    />
                  </div>
                  
                  <div className={userStyles.formGroup}>
                    <label htmlFor="parcelaDireccionNuevo">Dirección de la Parcela</label>
                    <input 
                      type="text" 
                      id="parcelaDireccionNuevo" 
                      className={userStyles.input}
                      placeholder="Dirección de la parcela"
                    />
                  </div>
                  
                  <div className={userStyles.formGroup}>
                    <label htmlFor="parcelaAreaNuevo">Área (hectáreas)</label>
                    <input 
                      type="number" 
                      id="parcelaAreaNuevo" 
                      className={userStyles.input}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  
                  <div className={userStyles.formGroup}>
                    <label htmlFor="parcelaValorNuevo">Valor Catastral ($)</label>
                    <input 
                      type="number" 
                      id="parcelaValorNuevo" 
                      className={userStyles.input}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </div>
              <div className={userStyles.modalFooter}>
              <button 
                  className={userStyles.cancelButton}
                  onClick={handleCerrarCrearModal}
              >
                Cancelar
              </button>
              <button 
                  className={userStyles.saveButton}
                  onClick={handleCrearNuevoUsuario}
              >
                  Crear Usuario
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Modal para asignar parcela */}
        {asignarParcelaModalVisible && usuarioSeleccionado && (
          <div className={userStyles.modalOverlay}>
            <div className={userStyles.modal}>
              <div className={userStyles.modalHeader}>
                <h2>Asignar Parcela</h2>
                <button className={userStyles.closeButton} onClick={handleCerrarAsignarModal}>×</button>
              </div>
              <div className={userStyles.modalBody}>
                <p className={userStyles.modalText}>
                  Seleccione una parcela para asignar a <strong>{usuarioSeleccionado.nombreCompleto}</strong>
                </p>
                
                {parcelasDisponibles.length > 0 ? (
                  <div className={userStyles.formGroup}>
                    <label htmlFor="parcelaSelect">Parcela:</label>
                    <select 
                      id="parcelaSelect" 
                      className={userStyles.select}
                      value={parcelaSeleccionada}
                      onChange={(e) => setParcelaSeleccionada(e.target.value === '' ? '' : Number(e.target.value))}
                    >
                      <option value="">-- Seleccionar parcela --</option>
                      {parcelasDisponibles.map(parcela => (
                        <option key={parcela.idParcela} value={parcela.idParcela}>
                          {parcela.nombre} - {parcela.direccion}
                        </option>
                      ))}
                    </select>
                    
                    {parcelaSeleccionada && (
                      <div className={userStyles.parcelaDetalles}>
                        <h4>Detalles de la parcela:</h4>
                        {(() => {
                          const parcelaDetail = parcelasDisponibles.find(p => p.idParcela === Number(parcelaSeleccionada));
                          if (parcelaDetail) {
                            return (
                              <>
                                <p><strong>Área:</strong> {parcelaDetail.area} hectáreas</p>
                                <p><strong>Valor Catastral:</strong> {new Intl.NumberFormat('es-CL', { 
                                  style: 'currency', 
                                  currency: 'CLP',
                                  maximumFractionDigits: 0 
                                }).format(parcelaDetail.valorCatastral)}</p>
                              </>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className={userStyles.emptyState}>
                    No hay parcelas disponibles para asignar en este momento.
                  </p>
                )}
              </div>
              <div className={userStyles.modalFooter}>
                <button 
                  className={userStyles.cancelButton}
                  onClick={handleCerrarAsignarModal}
                >
                  Cancelar
                </button>
                <button 
                  className={userStyles.saveButton}
                  onClick={handleConfirmarAsignacion}
                  disabled={!parcelaSeleccionada || parcelasDisponibles.length === 0}
                >
                  Asignar Parcela
                </button>
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