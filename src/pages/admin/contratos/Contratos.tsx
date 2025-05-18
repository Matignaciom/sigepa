import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './Contratos.module.css';

// Interfaz actualizada para coincidir con schema.sql
interface Contrato {
  idContrato: number;
  idComunidad: number;
  pdf_ruta: string;
  estado: 'Vigente' | 'Expirado';
  // Campos relacionados (obtenidos mediante JOIN o consultas)
  nombreComunidad?: string;
  idParcela?: number;
  nombreParcela?: string;
  idPropietario?: number;
  nombrePropietario?: string;
  // Campos adicionales (deberían agregarse a la BD si son necesarios)
  fechaInicio?: string;
  fechaFin?: string;
}

interface FormData {
  idComunidad: number;
  pdf_ruta: string;
  estado: 'Vigente' | 'Expirado';
  idParcela?: number;
  nombreParcela?: string;
  idPropietario?: number;
  nombrePropietario?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export const Contratos = () => {
  // Datos de ejemplo actualizados para coincidir con el esquema
  const [contratos] = useState<Contrato[]>([
    {
      idContrato: 1,
      idComunidad: 1,
      pdf_ruta: '/contratos/contrato-001.pdf',
      estado: 'Vigente',
      nombreComunidad: 'Comunidad Las Flores',
      idParcela: 1,
      nombreParcela: 'P-001',
      idPropietario: 1,
      nombrePropietario: 'Juan Pérez',
      fechaInicio: '01/01/2023',
      fechaFin: '31/12/2023'
    },
    {
      idContrato: 2,
      idComunidad: 1,
      pdf_ruta: '/contratos/contrato-002.pdf',
      estado: 'Vigente',
      nombreComunidad: 'Comunidad Las Flores',
      idParcela: 2,
      nombreParcela: 'P-002',
      idPropietario: 2,
      nombrePropietario: 'María González',
      fechaInicio: '15/02/2023',
      fechaFin: '15/02/2024'
    },
    {
      idContrato: 3,
      idComunidad: 1,
      pdf_ruta: '/contratos/contrato-003.pdf',
      estado: 'Vigente',
      nombreComunidad: 'Comunidad Las Flores',
      idParcela: 3,
      nombreParcela: 'P-003',
      idPropietario: 3,
      nombrePropietario: 'Carlos Rodríguez',
      fechaInicio: '10/03/2023',
      fechaFin: '10/03/2024'
    },
    {
      idContrato: 4,
      idComunidad: 1,
      pdf_ruta: '/contratos/contrato-004.pdf',
      estado: 'Vigente',
      nombreComunidad: 'Comunidad Las Flores',
      idParcela: 4,
      nombreParcela: 'P-004',
      idPropietario: 4,
      nombrePropietario: 'Ana Martínez',
      fechaInicio: '05/04/2023',
      fechaFin: '05/04/2024'
    },
    {
      idContrato: 5,
      idComunidad: 1,
      pdf_ruta: '/contratos/contrato-005.pdf',
      estado: 'Expirado',
      nombreComunidad: 'Comunidad Las Flores',
      idParcela: 5,
      nombreParcela: 'P-005',
      idPropietario: 5,
      nombrePropietario: 'Roberto Sánchez',
      fechaInicio: '20/12/2022',
      fechaFin: '20/12/2023'
    }
  ]);

  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [contratoSeleccionado, setContratoSeleccionado] = useState<Contrato | null>(null);
  const [mostrarVisualizador, setMostrarVisualizador] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formMode, setFormMode] = useState<'crear' | 'editar'>('crear');
  const [mostrarMensaje, setMostrarMensaje] = useState(false);
  const [mensajeTexto, setMensajeTexto] = useState('');
  const [mensajeTipo, setMensajeTipo] = useState<'exito' | 'error' | 'info'>('info');
  const [formData, setFormData] = useState<FormData>({
    idComunidad: 1,
    pdf_ruta: '',
    estado: 'Vigente',
    nombreParcela: '',
    nombrePropietario: '',
    fechaInicio: '',
    fechaFin: '',
  });
  
  const visualizadorRef = useRef<HTMLDivElement>(null);
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

  const contratosFiltrados = filtroEstado === 'todos' 
    ? contratos 
    : contratos.filter(contrato => contrato.estado.toLowerCase() === filtroEstado);

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

  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case 'Vigente':
        return styles.estadoActivo;
      case 'Expirado':
        return styles.estadoVencido;
      default:
        return '';
    }
  };

  const handleVerContrato = (contrato: Contrato) => {
    setContratoSeleccionado(contrato);
    setMostrarVisualizador(true);
  };

  const handleEditarContrato = (contrato: Contrato) => {
    setContratoSeleccionado(contrato);
    setFormData({
      idComunidad: contrato.idComunidad,
      pdf_ruta: contrato.pdf_ruta,
      estado: contrato.estado,
      idParcela: contrato.idParcela,
      nombreParcela: contrato.nombreParcela,
      idPropietario: contrato.idPropietario,
      nombrePropietario: contrato.nombrePropietario,
      fechaInicio: contrato.fechaInicio,
      fechaFin: contrato.fechaFin
    });
    setFormMode('editar');
    setMostrarFormulario(true);
  };

  const handleRenovarContrato = (contrato: Contrato) => {
    setContratoSeleccionado(contrato);
    setMensajeTexto(`¿Estás seguro que deseas renovar el contrato de ${contrato.nombrePropietario} para la parcela ${contrato.nombreParcela}?`);
    setMensajeTipo('info');
    setMostrarMensaje(true);
  };

  const handleConfirmRenovar = () => {
    // Aquí iría la lógica para renovar el contrato
    if (contratoSeleccionado) {
      const fechaActual = new Date();
      // Renovar por un año más desde la fecha actual
      const fechaFin = new Date(fechaActual);
      fechaFin.setFullYear(fechaFin.getFullYear() + 1);
      
      // Aquí se llamaría a la API para actualizar el contrato
      setTimeout(() => {
        setMensajeTexto(`El contrato ha sido renovado exitosamente hasta ${fechaFin.toLocaleDateString()}.`);
        setMensajeTipo('exito');
        setTimeout(() => {
          setMostrarMensaje(false);
        }, 3000);
      }, 1000);
    }
  };

  const handleCancelarRenovar = () => {
    setMostrarMensaje(false);
  };

  const handleNuevoContrato = () => {
    const fechaActual = new Date().toISOString().split('T')[0];
    setFormData({
      idComunidad: 1, // Se podría obtener de un contexto o una lista desplegable
      pdf_ruta: '',
      estado: 'Vigente',
      nombreParcela: '',
      nombrePropietario: '',
      fechaInicio: fechaActual,
      fechaFin: '',
    });
    setFormMode('crear');
    setMostrarFormulario(true);
  };

  const handleCloseVisualizador = () => {
    setMostrarVisualizador(false);
    setContratoSeleccionado(null);
  };

  const handleCloseFormulario = () => {
    setMostrarFormulario(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para guardar el contrato (nuevo o editado)
    setMensajeTexto(formMode === 'crear' 
      ? 'Contrato creado exitosamente' 
      : 'Contrato actualizado exitosamente');
    setMensajeTipo('exito');
    setMostrarMensaje(true);
    setMostrarFormulario(false);
    
    setTimeout(() => {
      setMostrarMensaje(false);
    }, 3000);
  };

  const toggleFullscreen = () => {
    if (visualizadorRef.current) {
      if (!document.fullscreenElement) {
        visualizadorRef.current.requestFullscreen().catch(err => {
          console.error(`Error al intentar mostrar en pantalla completa: ${err.message}`);
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    }
  };

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
                  className={`${styles.navLink} ${styles.active}`}
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
          <h2 className={styles.dashboardTitle}>Gestión de Contratos</h2>
          <div className={styles.headerBrand}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.favicon} /> SIGEPA
          </div>
        </header>
        
        {/* Filtros y botón de nuevo contrato */}
        <div className={styles.filtros}>
          <div className={styles.filtroItem}>
            <label htmlFor="filtroEstado">Filtrar por estado:</label>
            <select 
              id="filtroEstado" 
              value={filtroEstado} 
              onChange={(e) => setFiltroEstado(e.target.value)}
              className={styles.select}
            >
              <option value="todos">Todos</option>
              <option value="vigente">Vigentes</option>
              <option value="expirado">Expirados</option>
            </select>
          </div>
          
          <button className={styles.btnNuevo} onClick={handleNuevoContrato}>
            <span className={styles.btnIcon}>📝</span>
            Nuevo Contrato
          </button>
        </div>
        
        {/* Tabla de contratos */}
        <div className={styles.tablaContainer}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Parcela</th>
                <th>Propietario</th>
                <th>Fecha Inicio</th>
                <th>Fecha Fin</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {contratosFiltrados.map((contrato) => (
                <tr key={contrato.idContrato}>
                  <td>{contrato.idContrato}</td>
                  <td>{contrato.nombreParcela}</td>
                  <td>{contrato.nombrePropietario}</td>
                  <td>{contrato.fechaInicio}</td>
                  <td>{contrato.fechaFin}</td>
                  <td>
                    <span className={`${styles.estado} ${getEstadoClass(contrato.estado)}`}>
                      {contrato.estado}
                    </span>
                  </td>
                  <td>
                    <div className={styles.acciones}>
                      <button className={styles.btnVer} onClick={() => handleVerContrato(contrato)}>Ver</button>
                      <button className={styles.btnEditar} onClick={() => handleEditarContrato(contrato)}>Editar</button>
                      <button className={styles.btnRenovar} onClick={() => handleRenovarContrato(contrato)}>Renovar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {contratosFiltrados.length === 0 && (
          <div className={styles.noResultados}>No se encontraron contratos con los filtros seleccionados.</div>
        )}

        {/* Visualizador de contrato en pantalla completa */}
        {mostrarVisualizador && contratoSeleccionado && (
          <div className={styles.modalOverlay} onClick={handleCloseVisualizador}>
            <div className={styles.visualizadorContainer} ref={visualizadorRef} onClick={(e) => e.stopPropagation()}>
              <div className={styles.visualizadorHeader}>
                <h3>Contrato: {contratoSeleccionado.nombreParcela} - {contratoSeleccionado.nombrePropietario}</h3>
                <div className={styles.visualizadorActions}>
                  <button className={styles.btnIcono} onClick={toggleFullscreen} title="Pantalla completa">
                    <span className={styles.navIcon}>🔍</span>
                  </button>
                  <button className={styles.btnIcono} onClick={handleCloseVisualizador} title="Cerrar">
                    <span className={styles.navIcon}>✖️</span>
                  </button>
                </div>
              </div>
              <div className={styles.visualizadorContent}>
                {/* Aquí iría un iframe para el PDF o un componente específico de visualización */}
                <div className={styles.pdfPlaceholder}>
                  <div className={styles.pdfHeader}>
                    <h4>CONTRATO DE PARCELA</h4>
                    <p>N° {contratoSeleccionado.idContrato}</p>
                  </div>
                  <div className={styles.pdfContent}>
                    <p><strong>Comunidad:</strong> {contratoSeleccionado.nombreComunidad}</p>
                    <p><strong>Parcela:</strong> {contratoSeleccionado.nombreParcela}</p>
                    <p><strong>Propietario:</strong> {contratoSeleccionado.nombrePropietario}</p>
                    <p><strong>Fecha de Inicio:</strong> {contratoSeleccionado.fechaInicio}</p>
                    <p><strong>Fecha de Fin:</strong> {contratoSeleccionado.fechaFin}</p>
                    <p><strong>Estado:</strong> {contratoSeleccionado.estado}</p>
                    
                    <p className={styles.pdfText}>
                      Este contrato establece los términos y condiciones para el uso y administración
                      de la parcela identificada, de acuerdo con las regulaciones establecidas por
                      la Comunidad y en conformidad con las leyes vigentes.
                    </p>
                    
                    <p className={styles.pdfText}>
                      El propietario se compromete a mantener el estado de la parcela según las
                      normativas y a cumplir con los pagos establecidos por la administración.
                    </p>
                    
                    <div className={styles.pdfSignatures}>
                      <div className={styles.signature}>
                        <div className={styles.signatureLine}></div>
                        <p>Firma del Propietario</p>
                      </div>
                      <div className={styles.signature}>
                        <div className={styles.signatureLine}></div>
                        <p>Firma del Administrador</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formulario para crear/editar contrato */}
        {mostrarFormulario && (
          <div className={styles.modalOverlay} onClick={handleCloseFormulario}>
            <div className={styles.formularioContainer} onClick={(e) => e.stopPropagation()}>
              <div className={styles.formularioHeader}>
                <h3>{formMode === 'crear' ? 'Nuevo Contrato' : 'Editar Contrato'}</h3>
                <button className={styles.btnIcono} onClick={handleCloseFormulario}>
                  <span className={styles.navIcon}>✖️</span>
                </button>
              </div>
              <form onSubmit={handleSubmitForm} className={styles.formulario}>
                {/* Campo oculto para idComunidad o mostrado si tiene múltiples comunidades */}
                <input 
                  type="hidden" 
                  name="idComunidad" 
                  value={formData.idComunidad}
                />
                
                <div className={styles.formGroup}>
                  <label htmlFor="nombreParcela">Parcela</label>
                  <input
                    type="text"
                    id="nombreParcela"
                    name="nombreParcela"
                    value={formData.nombreParcela}
                    onChange={handleInputChange}
                    className={styles.formInput}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="nombrePropietario">Propietario</label>
                  <input
                    type="text"
                    id="nombrePropietario"
                    name="nombrePropietario"
                    value={formData.nombrePropietario}
                    onChange={handleInputChange}
                    className={styles.formInput}
                    required
                  />
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="fechaInicio">Fecha Inicio</label>
                    <input
                      type="date"
                      id="fechaInicio"
                      name="fechaInicio"
                      value={formData.fechaInicio}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="fechaFin">Fecha Fin</label>
                    <input
                      type="date"
                      id="fechaFin"
                      name="fechaFin"
                      value={formData.fechaFin}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      required
                    />
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="estado">Estado</label>
                  <select
                    id="estado"
                    name="estado"
                    value={formData.estado}
                    onChange={handleInputChange}
                    className={styles.formSelect}
                    required
                  >
                    <option value="Vigente">Vigente</option>
                    <option value="Expirado">Expirado</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="pdf_ruta">Documento PDF</label>
                  <div className={styles.fileInputContainer}>
                    <input
                      type="file"
                      id="pdf_ruta"
                      name="pdf_ruta"
                      accept=".pdf"
                      className={styles.fileInput}
                    />
                    <button type="button" className={styles.fileInputButton}>
                      Seleccionar Archivo
                    </button>
                    <span className={styles.fileInputText}>
                      {formData.pdf_ruta ? formData.pdf_ruta.split('/').pop() : 'Ningún archivo seleccionado'}
                    </span>
                  </div>
                </div>
                
                <div className={styles.formActions}>
                  <button type="button" className={styles.btnCancelar} onClick={handleCloseFormulario}>
                    Cancelar
                  </button>
                  <button type="submit" className={styles.btnGuardar}>
                    {formMode === 'crear' ? 'Crear Contrato' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Mensaje de confirmación/info */}
        {mostrarMensaje && (
          <div className={styles.modalOverlay}>
            <div className={`${styles.mensajeContainer} ${styles[`mensaje${mensajeTipo.charAt(0).toUpperCase() + mensajeTipo.slice(1)}`]}`}>
              <p className={styles.mensajeTexto}>{mensajeTexto}</p>
              {mensajeTipo === 'info' && (
                <div className={styles.mensajeAcciones}>
                  <button className={styles.btnCancelar} onClick={handleCancelarRenovar}>Cancelar</button>
                  <button className={styles.btnConfirmar} onClick={handleConfirmRenovar}>Confirmar</button>
                </div>
              )}
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