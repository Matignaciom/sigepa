import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from '../Admin.module.css';

interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: 'informacion' | 'alerta' | 'pago' | 'sistema';
  destinatarios: 'todos' | 'seleccionados';
  usuariosSeleccionados: number[];
  fechaCreacion: string;
  creador: string;
  leida: boolean;
}

interface FormData {
  titulo: string;
  mensaje: string;
  tipo: 'informacion' | 'alerta' | 'pago' | 'sistema';
  destinatarios: 'todos' | 'seleccionados';
  usuariosSeleccionados: number[];
}

export const GestionarNotificaciones = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    titulo: '',
    mensaje: '',
    tipo: 'informacion',
    destinatarios: 'todos',
    usuariosSeleccionados: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'crear' | 'gestionar'>('crear');
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([
    {
      id: 1,
      titulo: 'Asamblea Mensual',
      mensaje: 'Se recuerda a todos los copropietarios que la próxima asamblea será el día 15 a las 19:00 horas.',
      tipo: 'informacion',
      destinatarios: 'todos',
      usuariosSeleccionados: [],
      fechaCreacion: '2023-08-01',
      creador: 'Admin Principal',
      leida: false
    },
    {
      id: 2,
      titulo: 'Pago de cuota extraordinaria',
      mensaje: 'Se informa que se ha aprobado una cuota extraordinaria de $50.000 con vencimiento el 30 de agosto.',
      tipo: 'pago',
      destinatarios: 'todos',
      usuariosSeleccionados: [],
      fechaCreacion: '2023-08-05',
      creador: 'Admin Principal',
      leida: true
    },
    {
      id: 3,
      titulo: 'Corte de agua programado',
      mensaje: 'Se realizará un corte programado de agua el día 12 de agosto de 09:00 a 14:00 horas por mantenimiento.',
      tipo: 'alerta',
      destinatarios: 'seleccionados',
      usuariosSeleccionados: [3, 4],
      fechaCreacion: '2023-08-10',
      creador: 'Admin Principal',
      leida: false
    }
  ]);
  const [notificacionSeleccionada, setNotificacionSeleccionada] = useState<Notificacion | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [usuarios] = useState([
    { id: 2, nombre: 'Usuario Prueba', email: 'user@sigepa.com' },
    { id: 3, nombre: 'María González', email: 'maria@ejemplo.com' },
    { id: 4, nombre: 'Carlos Rodríguez', email: 'carlos@ejemplo.com' },
    { id: 5, nombre: 'Ana Martínez', email: 'ana@ejemplo.com' },
    { id: 6, nombre: 'Pedro Sánchez', email: 'pedro@ejemplo.com' },
  ]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUsuarioChange = (e: React.ChangeEvent<HTMLInputElement>, usuarioId: number) => {
    const isChecked = e.target.checked;

    setFormData(prev => {
      if (isChecked) {
        return {
          ...prev,
          usuariosSeleccionados: [...prev.usuariosSeleccionados, usuarioId]
        };
      } else {
        return {
          ...prev,
          usuariosSeleccionados: prev.usuariosSeleccionados.filter(id => id !== usuarioId)
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Validar formulario
    if (!formData.titulo.trim()) {
      setError('El título es obligatorio');
      setIsLoading(false);
      return;
    }

    if (!formData.mensaje.trim()) {
      setError('El mensaje es obligatorio');
      setIsLoading(false);
      return;
    }

    if (formData.destinatarios === 'seleccionados' && formData.usuariosSeleccionados.length === 0) {
      setError('Debe seleccionar al menos un usuario');
      setIsLoading(false);
      return;
    }

    try {
      // En un entorno real, esto sería una llamada a la API
      // const response = await adminService.createNotification(formData);

      // Simulación de envío exitoso
      setTimeout(() => {
        setSuccess('Notificación enviada correctamente');
        setIsLoading(false);

        // Resetear formulario después de 2 segundos
        setTimeout(() => {
          setFormData({
            titulo: '',
            mensaje: '',
            tipo: 'informacion',
            destinatarios: 'todos',
            usuariosSeleccionados: [],
          });
          setSuccess(null);
        }, 2000);
      }, 1000);
    } catch (err) {
      console.error('Error al enviar notificación:', err);
      setError('Error al enviar la notificación. Por favor, intente nuevamente.');
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin');
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

  // Función para seleccionar una notificación para editar
  const handleEditarNotificacion = (notificacion: Notificacion) => {
    // Verificar si la notificación ya ha sido leída
    if (notificacion.leida) {
      setError('No se puede editar una notificación que ya ha sido leída por los usuarios');
      return;
    }

    setNotificacionSeleccionada(notificacion);
    setFormData({
      titulo: notificacion.titulo,
      mensaje: notificacion.mensaje,
      tipo: notificacion.tipo,
      destinatarios: notificacion.destinatarios,
      usuariosSeleccionados: notificacion.usuariosSeleccionados,
    });
    setModoEdicion(true);
    setActiveTab('crear');
    setError(null);
    setSuccess(null);
  };

  // Función para actualizar una notificación existente
  const handleUpdateNotificacion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!notificacionSeleccionada) {
      return;
    }

    setIsLoading(true);
    setError(null);

    // Validaciones
    if (!formData.titulo.trim()) {
      setError('El título es obligatorio');
      setIsLoading(false);
      return;
    }

    if (!formData.mensaje.trim()) {
      setError('El mensaje es obligatorio');
      setIsLoading(false);
      return;
    }

    if (formData.destinatarios === 'seleccionados' && formData.usuariosSeleccionados.length === 0) {
      setError('Debe seleccionar al menos un usuario');
      setIsLoading(false);
      return;
    }

    try {
      // En un entorno real, llamaríamos a la API
      // const response = await adminService.updateNotification(notificacionSeleccionada.id, formData);

      // Simulación de actualización exitosa
      setTimeout(() => {
        // Actualizar la notificación en el estado local
        setNotificaciones(prevNotificaciones =>
          prevNotificaciones.map(n =>
            n.id === notificacionSeleccionada.id
              ? {
                ...n,
                titulo: formData.titulo,
                mensaje: formData.mensaje,
                tipo: formData.tipo,
                destinatarios: formData.destinatarios,
                usuariosSeleccionados: formData.usuariosSeleccionados
              }
              : n
          )
        );

        setSuccess('Notificación actualizada correctamente');
        setIsLoading(false);

        // Resetear formulario después de 2 segundos
        setTimeout(() => {
          setFormData({
            titulo: '',
            mensaje: '',
            tipo: 'informacion',
            destinatarios: 'todos',
            usuariosSeleccionados: [],
          });
          setModoEdicion(false);
          setNotificacionSeleccionada(null);
          setSuccess(null);
          setActiveTab('gestionar');
        }, 2000);
      }, 1000);
    } catch (err) {
      console.error('Error al actualizar notificación:', err);
      setError('Error al actualizar la notificación. Por favor, intente nuevamente.');
      setIsLoading(false);
    }
  };

  // Función para eliminar una notificación
  const handleEliminarNotificacion = async (notificacion: Notificacion) => {
    // Aquí normalmente verificaríamos que el usuario actual es el creador de la notificación
    // En este ejemplo simulado, asumimos que sí lo es

    if (window.confirm(`¿Está seguro de eliminar la notificación "${notificacion.titulo}"?`)) {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      try {
        // En un entorno real, llamaríamos a la API
        // await adminService.deleteNotification(notificacion.id);

        // Simulación de eliminación exitosa
        setTimeout(() => {
          setNotificaciones(prevNotificaciones =>
            prevNotificaciones.filter(n => n.id !== notificacion.id)
          );

          setSuccess('Notificación eliminada correctamente');
          setIsLoading(false);

          setTimeout(() => {
            setSuccess(null);
          }, 2000);
        }, 1000);
      } catch (err) {
        console.error('Error al eliminar notificación:', err);
        setError('Error al eliminar la notificación. Por favor, intente nuevamente.');
        setIsLoading(false);
      }
    }
  };

  // Función para cancelar la edición
  const handleCancelarEdicion = () => {
    setFormData({
      titulo: '',
      mensaje: '',
      tipo: 'informacion',
      destinatarios: 'todos',
      usuariosSeleccionados: [],
    });
    setModoEdicion(false);
    setNotificacionSeleccionada(null);
    setError(null);
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
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh - 80px)'
        }}>
          <header className={styles.header}>
            <h2 className={styles.dashboardTitle}>Gestionar Notificaciones</h2>
            <div className={styles.headerBrand}>
              <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.favicon} /> SIGEPA
            </div>
          </header>

          {/* Pestañas de navegación */}
          <div style={{
            display: 'flex',
            margin: '0 0 1.5rem 0',
            borderBottom: '1px solid #e5e7eb',
            overflow: 'auto'
          }}>
            <button
              onClick={() => {
                setActiveTab('crear');
                if (modoEdicion) {
                  // No reseteamos el form si estamos en modo edición
                } else {
                  // Resetear form si estamos simplemente cambiando a la pestaña de crear
                  setFormData({
                    titulo: '',
                    mensaje: '',
                    tipo: 'informacion',
                    destinatarios: 'todos',
                    usuariosSeleccionados: [],
                  });
                }
              }}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: activeTab === 'crear' ? '#f9fafb' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'crear' ? '3px solid #4f46e5' : '3px solid transparent',
                color: activeTab === 'crear' ? '#1f2937' : '#6b7280',
                fontWeight: activeTab === 'crear' ? 600 : 400,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {modoEdicion ? 'Editar Notificación' : 'Crear Notificación'}
            </button>

            <button
              onClick={() => {
                setActiveTab('gestionar');
                setModoEdicion(false);
                setNotificacionSeleccionada(null);
                setError(null);
                setSuccess(null);
              }}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: activeTab === 'gestionar' ? '#f9fafb' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'gestionar' ? '3px solid #4f46e5' : '3px solid transparent',
                color: activeTab === 'gestionar' ? '#1f2937' : '#6b7280',
                fontWeight: activeTab === 'gestionar' ? 600 : 400,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Historial de Notificaciones
            </button>
          </div>

          {/* Mensajes de error y éxito */}
          {error && (
            <div className={styles.activityContainer} style={{ backgroundColor: 'rgba(231, 76, 60, 0.1)', borderColor: '#e74c3c', marginBottom: '1.5rem' }}>
              <div className={styles.activityItem} style={{ borderBottom: 'none' }}>
                <div className={styles.activityIcon} style={{ backgroundColor: 'rgba(231, 76, 60, 0.2)' }}>❌</div>
                <div className={styles.activityContent}>
                  <p className={styles.activityText}>{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className={styles.activityContainer} style={{ backgroundColor: 'rgba(46, 204, 113, 0.1)', borderColor: '#2ecc71', marginBottom: '1.5rem' }}>
              <div className={styles.activityItem} style={{ borderBottom: 'none' }}>
                <div className={styles.activityIcon} style={{ backgroundColor: 'rgba(46, 204, 113, 0.2)' }}>✅</div>
                <div className={styles.activityContent}>
                  <p className={styles.activityText}>{success}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'crear' && (
            <section style={{ flex: '1' }}>
              <h2 className={styles.sectionTitle}>
                <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.faviconSmall} />
                {modoEdicion ? 'Actualizar notificación' : 'Detalles de la notificación'}
              </h2>

              <div className={styles.activityContainer}>
                <form onSubmit={modoEdicion ? handleUpdateNotificacion : handleSubmit}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#1f2937' }}>
                      Título
                    </label>
                    <input
                      type="text"
                      name="titulo"
                      value={formData.titulo}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        fontSize: '1rem',
                        backgroundColor: '#ffffff',
                        color: '#1f2937',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                      }}
                      placeholder="Título de la notificación"
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#1f2937' }}>
                      Mensaje
                    </label>
                    <textarea
                      name="mensaje"
                      value={formData.mensaje}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        fontSize: '1rem',
                        minHeight: '120px',
                        resize: 'vertical',
                        backgroundColor: '#ffffff',
                        color: '#1f2937',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                      }}
                      placeholder="Escriba el contenido de la notificación"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#1f2937' }}>
                        Tipo de Notificación
                      </label>
                      <select
                        name="tipo"
                        value={formData.tipo}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          fontSize: '1rem',
                          backgroundColor: '#ffffff',
                          color: '#1f2937',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                          appearance: 'none',
                          backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 0.7rem top 50%',
                          backgroundSize: '0.65rem auto',
                          paddingRight: '2rem'
                        }}
                      >
                        <option value="informacion">Información</option>
                        <option value="alerta">Alerta</option>
                        <option value="pago">Pago</option>
                        <option value="sistema">Sistema</option>
                      </select>
                    </div>

                    <div style={{ flex: '1', minWidth: '200px' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#1f2937' }}>
                        Destinatarios
                      </label>
                      <select
                        name="destinatarios"
                        value={formData.destinatarios}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          fontSize: '1rem',
                          backgroundColor: '#ffffff',
                          color: '#1f2937',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                          appearance: 'none',
                          backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 0.7rem top 50%',
                          backgroundSize: '0.65rem auto',
                          paddingRight: '2rem'
                        }}
                      >
                        <option value="todos">Todos los usuarios</option>
                        <option value="seleccionados">Usuarios seleccionados</option>
                      </select>
                    </div>
                  </div>

                  {formData.destinatarios === 'seleccionados' && (
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: 0, marginBottom: '1rem', color: '#1f2937' }}>
                        Seleccionar Usuarios
                      </h3>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
                        {usuarios.map(usuario => (
                          <div
                            key={usuario.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0.75rem',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              backgroundColor: formData.usuariosSeleccionados.includes(usuario.id) ? 'rgba(79, 70, 229, 0.1)' : 'white',
                              transition: 'background-color 0.2s',
                            }}
                          >
                            <input
                              type="checkbox"
                              id={`usuario-${usuario.id}`}
                              checked={formData.usuariosSeleccionados.includes(usuario.id)}
                              onChange={(e) => handleUsuarioChange(e, usuario.id)}
                              style={{
                                marginRight: '0.75rem',
                                width: '1.2rem',
                                height: '1.2rem',
                                accentColor: '#4f46e5',
                                cursor: 'pointer'
                              }}
                            />
                            <label htmlFor={`usuario-${usuario.id}`} style={{ cursor: 'pointer', display: 'block', width: '100%' }}>
                              <div style={{ fontWeight: 500, color: '#1f2937' }}>{usuario.nombre}</div>
                              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{usuario.email}</div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                    <button
                      type="button"
                      onClick={modoEdicion ? handleCancelarEdicion : handleCancel}
                      style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: 'transparent',
                        color: '#6b7280',
                        fontSize: '1rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      disabled={isLoading}
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#4f46e5',
                        color: 'white',
                        fontSize: '1rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 6px rgba(79, 70, 229, 0.2)',
                      }}
                      disabled={isLoading}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#4338ca';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#4f46e5';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {isLoading ? (
                        <>
                          <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                          {modoEdicion ? 'Actualizando...' : 'Enviando...'}
                        </>
                      ) : (
                        <>
                          <span>{modoEdicion ? '🔄' : '✉️'}</span>
                          {modoEdicion ? 'Actualizar Notificación' : 'Enviar Notificación'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}

          {activeTab === 'gestionar' && (
            <section style={{ flex: '1' }}>
              <h2 className={styles.sectionTitle}>
                <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.faviconSmall} />
                Historial de Notificaciones
              </h2>

              <div className={styles.activityContainer}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#1f2937' }}>Título</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#1f2937' }}>Tipo</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#1f2937' }}>Fecha</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#1f2937' }}>Estado</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#1f2937' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notificaciones.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '2rem 1rem', textAlign: 'center', color: '#6b7280' }}>
                            No hay notificaciones disponibles
                          </td>
                        </tr>
                      ) : (
                        notificaciones.map(notificacion => (
                          <tr key={notificacion.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '0.75rem 1rem', color: '#1f2937' }}>
                              <div>{notificacion.titulo}</div>
                              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                {notificacion.mensaje.length > 50
                                  ? `${notificacion.mensaje.substring(0, 50)}...`
                                  : notificacion.mensaje}
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: '#1f2937' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                backgroundColor:
                                  notificacion.tipo === 'informacion' ? 'rgba(79, 70, 229, 0.1)' :
                                    notificacion.tipo === 'alerta' ? 'rgba(239, 68, 68, 0.1)' :
                                      notificacion.tipo === 'pago' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                                color:
                                  notificacion.tipo === 'informacion' ? '#4f46e5' :
                                    notificacion.tipo === 'alerta' ? '#ef4444' :
                                      notificacion.tipo === 'pago' ? '#10b981' : '#6b7280',
                              }}>
                                {notificacion.tipo === 'informacion' ? 'Información' :
                                  notificacion.tipo === 'alerta' ? 'Alerta' :
                                    notificacion.tipo === 'pago' ? 'Pago' : 'Sistema'}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: '#1f2937' }}>
                              {notificacion.fechaCreacion}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: '#1f2937' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                backgroundColor: notificacion.leida ? 'rgba(107, 114, 128, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                color: notificacion.leida ? '#6b7280' : '#10b981',
                              }}>
                                {notificacion.leida ? 'Leída' : 'Pendiente'}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                              <button
                                onClick={() => handleEditarNotificacion(notificacion)}
                                disabled={notificacion.leida}
                                title={notificacion.leida ? 'No se puede editar una notificación leída' : 'Editar notificación'}
                                style={{
                                  marginRight: '0.5rem',
                                  padding: '0.4rem 0.5rem',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '0.375rem',
                                  backgroundColor: notificacion.leida ? '#f3f4f6' : 'white',
                                  color: notificacion.leida ? '#9ca3af' : '#4f46e5',
                                  fontSize: '0.875rem',
                                  cursor: notificacion.leida ? 'not-allowed' : 'pointer',
                                }}
                              >
                                🔄
                              </button>
                              <button
                                onClick={() => handleEliminarNotificacion(notificacion)}
                                title="Eliminar notificación"
                                style={{
                                  padding: '0.4rem 0.5rem',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '0.375rem',
                                  backgroundColor: 'white',
                                  color: '#ef4444',
                                  fontSize: '0.875rem',
                                  cursor: 'pointer',
                                }}
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* Sección de información/consejos de notificaciones */}
          <section>
            <h2 className={styles.sectionTitle}>
              <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.faviconSmall} />
              Consejos para notificaciones efectivas
            </h2>

            <div className={styles.quickAccessGrid} style={{ marginBottom: '2rem' }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '1.25rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
                borderLeft: '4px solid #4f46e5'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  fontSize: '1.5rem',
                  backgroundColor: '#4f46e5',
                  color: 'white'
                }}>📝</div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#1f2937' }}>Sea conciso</h3>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  Las notificaciones más efectivas son breves y directas. Procure que el mensaje sea claro y fácil de entender.
                </p>
              </div>

              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '1.25rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
                borderLeft: '4px solid #f59e0b'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  fontSize: '1.5rem',
                  backgroundColor: '#f59e0b',
                  color: 'white'
                }}>⏰</div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#1f2937' }}>Elija el momento adecuado</h3>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  Envíe notificaciones en horarios adecuados. Evite notificar en horas de descanso a menos que sea una emergencia.
                </p>
              </div>
            </div>

            <div className={styles.activityContainer} style={{ marginBottom: '2rem' }}>
              <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #f3f4f6' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1f2937' }}>Estadísticas de envío</h3>
              </div>
              <div style={{
                display: 'flex',
                padding: '1rem',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
                textAlign: 'center',
                gap: '1rem'
              }}>
                <div style={{ flex: '1', minWidth: '130px' }}>
                  <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>Notificaciones enviadas</p>
                  <p style={{ fontSize: '2rem', color: '#4f46e5', fontWeight: 'bold', margin: '0.5rem 0' }}>127</p>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>Este mes</p>
                </div>
                <div style={{ flex: '1', minWidth: '130px' }}>
                  <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>Tasa de apertura</p>
                  <p style={{ fontSize: '2rem', color: '#10b981', fontWeight: 'bold', margin: '0.5rem 0' }}>76%</p>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>Promedio</p>
                </div>
                <div style={{ flex: '1', minWidth: '130px' }}>
                  <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>Tiempo de respuesta</p>
                  <p style={{ fontSize: '2rem', color: '#f59e0b', fontWeight: 'bold', margin: '0.5rem 0' }}>1.4h</p>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>Promedio</p>
                </div>
              </div>
            </div>
          </section>

          <footer className={styles.contentFooter} style={{ marginTop: 'auto' }}>
            <div className={styles.footerLogo}>
              <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.faviconSmall} /> SIGEPA
            </div>
            <p>Sistema de Gestión de Parcelas © {currentYear}</p>
          </footer>
        </div>
      </div>
    </div>
  );
};