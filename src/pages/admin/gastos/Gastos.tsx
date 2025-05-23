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
  descripcion?: string;
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
  const [distribucionesActivas, setDistribucionesActivas] = useState<GastoParcela[]>([]);
  const [resumen, setResumen] = useState<ResumenGastos | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingDistribuciones, setLoadingDistribuciones] = useState(false);
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

  // Estado para manejar el formulario de gastos
  const [formGasto, setFormGasto] = useState({
    concepto: '',
    montoTotal: '',
    fechaVencimiento: '',
    tipo: 'Cuota Ordinaria',
    descripcion: '',
    estado: 'Pendiente',
    metodoDistribucion: 'equitativo'
  });
  
  // Estado para manejar el formulario de pago
  const [formPago, setFormPago] = useState({
    idGasto: 0,
    idParcela: 0,
    montoPagado: '',
    metodoPago: 'Efectivo',
    descripcion: ''
  });
  
  // Modal de pago
  const [modalPago, setModalPago] = useState(false);
  const [parcelaPago, setParcelaPago] = useState<GastoParcela | null>(null);
  
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
        // Obtener token de autenticación del localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No se encontró token de autenticación');
        }
        
        // Obtener datos de la comunidad (esto podría necesitar otra función)
        // Por ahora, mantenemos este valor
        setNombreComunidad('Comunidad Las Flores');
        
        // Obtener resumen de gastos
        const resumenResponse = await fetch('/.netlify/functions/obtener-resumen-gastos', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!resumenResponse.ok) {
          throw new Error('Error al obtener resumen de gastos');
        }
        
        const resumenData = await resumenResponse.json();
        if (resumenData.success) {
          setResumen(resumenData.data);
        } else {
          throw new Error(resumenData.message || 'Error al obtener resumen de gastos');
        }
        
        // Obtener lista de gastos sin filtros aplicados
        await fetchGastos(true);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error al cargar datos de gastos:', err);
        setError('No se pudieron cargar los datos de gastos: ' + (err instanceof Error ? err.message : 'Error desconocido'));
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Efecto para recargar gastos cuando cambian los filtros
  useEffect(() => {
    // Solo si ya hemos cargado datos inicialmente (para evitar cargas duplicadas)
    if (!isLoading) {
      fetchGastos(false);
    }
  }, [filtroTipo, filtroEstado, busqueda]);
  
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
  const obtenerDistribuciones = async (idGasto: number) => {
    try {
      // Si ya tenemos distribuciones para este gasto, las devolvemos
      if (distribuciones.some(d => d.idGasto === idGasto)) {
        return distribuciones.filter(dist => dist.idGasto === idGasto);
      }
      
      // Si no, las solicitamos al servidor
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }
      
      const response = await fetch(`/.netlify/functions/obtener-distribucion-gasto?idGasto=${idGasto}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener distribución del gasto');
      }
      
      const data = await response.json();
      if (data.success) {
        // Actualizar el estado de distribuciones con los nuevos datos
        setDistribuciones(prev => [
          ...prev.filter(d => d.idGasto !== idGasto),  // Eliminar distribuciones antiguas de este gasto
          ...data.data.distribucion  // Añadir las nuevas distribuciones
        ]);
        
        return data.data.distribucion;
      } else {
        throw new Error(data.message || 'Error al obtener distribución del gasto');
      }
    } catch (error) {
      console.error('Error al obtener distribución:', error);
      return [];
    }
  };
  
  // Abrir modal para crear nuevo gasto
  const abrirModalNuevoGasto = () => {
    // Resetear el formulario
    setFormGasto({
      concepto: '',
      montoTotal: '',
      fechaVencimiento: '',
      tipo: 'Cuota Ordinaria',
      descripcion: '',
      estado: 'Pendiente',
      metodoDistribucion: 'equitativo'
    });
    
    setGastoSeleccionado(null);
    setModalAbierto(true);
  };
  
  // Abrir modal para editar gasto existente
  const abrirModalEditarGasto = (gasto: GastoComun) => {
    // Llenar el formulario con los datos del gasto
    setFormGasto({
      concepto: gasto.concepto,
      montoTotal: gasto.montoTotal.toString(),
      fechaVencimiento: gasto.fechaVencimiento.split('T')[0], // Obtener solo la fecha YYYY-MM-DD
      tipo: gasto.tipo,
      descripcion: gasto.descripcion || '',
      estado: gasto.estado,
      metodoDistribucion: 'equitativo' // Por defecto
    });
    
    setGastoSeleccionado(gasto);
    setModalAbierto(true);
  };
  
  // Abrir modal para ver/editar distribución
  const abrirModalDistribucion = async (gasto: GastoComun) => {
    setGastoSeleccionado(gasto);
    setModalDistribucion(true);
    setLoadingDistribuciones(true);
    
    try {
      const distribucionesData = await obtenerDistribuciones(gasto.idGasto);
      setDistribucionesActivas(distribucionesData);
    } catch (error) {
      console.error('Error al cargar distribuciones:', error);
    } finally {
      setLoadingDistribuciones(false);
    }
  };
  
  // Cerrar modales
  const cerrarModales = () => {
    setModalAbierto(false);
    setModalDistribucion(false);
    setModalPago(false);
  };
  
  // Función para abrir/cerrar el menú en móviles
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Función para cerrar sesión - estilo Admin.tsx
  const handleLogout = () => {
    localStorage.removeItem('user'); // Asumiendo que aquí se guarda la info de sesión
    window.location.href = '/login'; // Redirige a la página de login
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
  
  // Crear nuevo gasto
  const crearGasto = async (datosGasto: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }
      
      setIsLoading(true);
      
      console.log('Enviando datos para crear gasto:', datosGasto);
      
      const response = await fetch('/.netlify/functions/crear-gasto-comun', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datosGasto)
      });
      
      // Mostrar el estado de la respuesta para depuración
      console.log('Respuesta del servidor:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('Datos de respuesta:', data);
      
      if (!response.ok) {
        throw new Error(data.message || `Error al crear el gasto: ${response.status} ${response.statusText}`);
      }
      
      if (data.success) {
        // Cerrar el modal
        cerrarModales();
        
        // Refrescar la lista completa de gastos sin filtros aplicados
        await fetchGastos(true);
        
        // Refrescar los datos de resumen
        actualizarResumen();
        
        return true;
      } else {
        throw new Error(data.message || 'Error al crear el gasto');
      }
    } catch (error) {
      console.error('Error al crear gasto:', error);
      setError('Error al crear el gasto: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Editar gasto existente
  const editarGasto = async (idGasto: number, datosActualizados: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }
      
      setIsLoading(true);
      
      // Eliminar el campo descripcion que no existe en la tabla
      const { descripcion, ...datosLimpios } = datosActualizados;
      
      console.log('Enviando datos para editar gasto:', { idGasto, ...datosLimpios });
      
      const response = await fetch('/.netlify/functions/editar-gasto-comun', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ idGasto, ...datosLimpios })
      });
      
      // Mostrar el estado de la respuesta para depuración
      console.log('Respuesta del servidor:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('Datos de respuesta:', data);
      
      if (!response.ok) {
        throw new Error(data.message || `Error al editar el gasto: ${response.status} ${response.statusText}`);
      }
      
      if (data.success) {
        // Cerrar el modal
        cerrarModales();
        
        // Refrescar la lista completa de gastos sin filtros aplicados
        await fetchGastos(true);
        
        // Refrescar los datos de resumen
        actualizarResumen();
        
        return true;
      } else {
        throw new Error(data.message || 'Error al editar el gasto');
      }
    } catch (error) {
      console.error('Error al editar gasto:', error);
      setError('Error al editar el gasto: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para actualizar el resumen de gastos
  const actualizarResumen = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }
      
      const response = await fetch('/.netlify/functions/obtener-resumen-gastos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener resumen de gastos');
      }
      
      const data = await response.json();
      if (data.success) {
        setResumen(data.data);
      } else {
        throw new Error(data.message || 'Error al obtener resumen de gastos');
      }
    } catch (error) {
      console.error('Error al actualizar resumen:', error);
    }
  };
  
  // Registrar pago de gasto
  const registrarPagoGasto = async (datosPago: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }
      
      const response = await fetch('/.netlify/functions/registrar-pago-gasto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datosPago)
      });
      
      if (!response.ok) {
        throw new Error('Error al registrar el pago');
      }
      
      const data = await response.json();
      if (data.success) {
        // Cerrar el modal de pago
        setModalPago(false);
        setParcelaPago(null);
        
        // Refrescar datos de gastos sin filtros aplicados y resumen
        await fetchGastos(true);
        await actualizarResumen();
        
        // Si hay un gasto seleccionado, actualizar sus distribuciones
        if (gastoSeleccionado) {
          const distribucionesActualizadas = await obtenerDistribuciones(gastoSeleccionado.idGasto);
          setDistribucionesActivas(distribucionesActualizadas);
        }
        
        return true;
      } else {
        throw new Error(data.message || 'Error al registrar el pago');
      }
    } catch (error) {
      console.error('Error al registrar pago:', error);
      setError('Error al registrar el pago: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      return false;
    }
  };
  
  // Abrir modal de pago
  const abrirModalPago = (gasto: GastoComun, parcela: GastoParcela) => {
    setGastoSeleccionado(gasto);
    setParcelaPago(parcela);
    setFormPago({
      idGasto: gasto.idGasto,
      idParcela: parcela.idParcela,
      montoPagado: parcela.monto_prorrateado.toString(),
      metodoPago: 'Efectivo',
      descripcion: `Pago de ${gasto.concepto} para parcela ${parcela.nombreParcela}`
    });
    setModalPago(true);
  };
  
  // Función para actualizar la lista de gastos
  const fetchGastos = async (resetFiltros = false) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }
      
      // Si se pide resetear filtros, lo hacemos antes de la petición
      if (resetFiltros) {
        setFiltroTipo('todos');
        setFiltroEstado('todos');
        setBusqueda('');
      }
      
      // Construir URL con parámetros de filtro
      let url = '/.netlify/functions/obtener-gastos-admin';
      const params = new URLSearchParams();
      
      // Aplicar filtros solo si no estamos reseteando
      if (!resetFiltros) {
        if (filtroTipo !== 'todos') params.append('tipo', filtroTipo);
        if (filtroEstado !== 'todos') params.append('estado', filtroEstado);
        if (busqueda) params.append('busqueda', busqueda);
      }
      
      // Añadir parámetros a la URL si hay alguno
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const gastosResponse = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!gastosResponse.ok) {
        throw new Error('Error al obtener lista de gastos');
      }
      
      const gastosData = await gastosResponse.json();
      if (gastosData.success) {
        setGastos(gastosData.data);
        console.log(`Gastos cargados: ${gastosData.data.length}`);
      } else {
        throw new Error(gastosData.message || 'Error al obtener lista de gastos');
      }
    } catch (err) {
      console.error('Error al cargar lista de gastos:', err);
      setError('No se pudo cargar la lista de gastos: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };
  
  // Manejar el envío del formulario de gasto
  const handleSubmitGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar datos básicos
    if (!formGasto.concepto || !formGasto.montoTotal || !formGasto.fechaVencimiento) {
      setError('Por favor complete todos los campos requeridos.');
      return;
    }
    
    // Formatear datos, excluyendo descripcion que no existe en la tabla
    const { descripcion, ...datosGastoSinDescripcion } = formGasto;
    
    const datosGasto = {
      ...datosGastoSinDescripcion,
      montoTotal: parseFloat(formGasto.montoTotal)
    };
    
    // Crear o editar según corresponda
    if (gastoSeleccionado) {
      await editarGasto(gastoSeleccionado.idGasto, datosGasto);
    } else {
      await crearGasto(datosGasto);
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
              <li>
                <button 
                  onClick={() => {
                    setMenuOpen(false); // Cerrar menú en móvil si está abierto
                    handleLogout();
                  }}
                  className={styles.navLinkButton} 
                >
                  <span className={styles.navIcon}>🚪</span> {/* Ícono de Admin.tsx */}
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
                    onClick={() => {
                      // Primero obtenemos las distribuciones para mostrar en el modal de pago
                      abrirModalDistribucion(gasto);
                      // Y luego mostramos el modal de selección de parcela para pago
                      setTimeout(() => {
                        setModalDistribucion(false);
                        // Si hay distribuciones, abrimos modal para seleccionar parcela
                        if (distribucionesActivas.length > 0) {
                          setModalPago(true);
                        } else {
                          setError('No hay distribuciones asociadas a este gasto');
                        }
                      }, 500);
                    }}
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
                
                {distribucionesActivas.map((dist) => (
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
              
              <form className={styles.formContainer} onSubmit={handleSubmitGasto}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Concepto</label>
                  <input 
                    type="text" 
                    className={styles.formInput}
                    name="concepto"
                    value={formGasto.concepto}
                    onChange={(e) => setFormGasto({ ...formGasto, concepto: e.target.value })}
                  />
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Monto Total</label>
                    <input 
                      type="number" 
                      className={styles.formInput}
                      name="montoTotal"
                      value={formGasto.montoTotal}
                      onChange={(e) => setFormGasto({ ...formGasto, montoTotal: e.target.value })}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Fecha Vencimiento</label>
                    <input 
                      type="date" 
                      className={styles.formInput}
                      name="fechaVencimiento"
                      value={formGasto.fechaVencimiento}
                      onChange={(e) => setFormGasto({ ...formGasto, fechaVencimiento: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Tipo</label>
                    <select 
                      className={styles.formSelect}
                      name="tipo"
                      value={formGasto.tipo}
                      onChange={(e) => setFormGasto({ ...formGasto, tipo: e.target.value as 'Cuota Ordinaria' | 'Cuota Extraordinaria' | 'Multa' | 'Otro' })}
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
                      name="estado"
                      value={formGasto.estado}
                      onChange={(e) => setFormGasto({ ...formGasto, estado: e.target.value as 'Pendiente' | 'Activo' | 'Cerrado' })}
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
                    name="descripcion"
                    rows={4}
                    value={formGasto.descripcion}
                    onChange={(e) => setFormGasto({ ...formGasto, descripcion: e.target.value })}
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
                    type="submit"
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
                  
                  {distribucionesActivas.map((dist) => (
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
        
        {/* Modal para selección de parcela para pago */}
        {modalPago && gastoSeleccionado && !parcelaPago && (
          <div className={styles.modalOverlay} onClick={cerrarModales}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  Seleccionar Parcela para Pago
                </h2>
                <button className={styles.closeButton} onClick={cerrarModales}>×</button>
              </div>
              
              <div>
                <div className={styles.formGroup}>
                  <h3 className={styles.formTitle}>Gasto: {gastoSeleccionado.concepto}</h3>
                  <p>Monto Total: {formatearMonto(gastoSeleccionado.montoTotal)}</p>
                  <p>Fecha Vencimiento: {formatearFecha(gastoSeleccionado.fechaVencimiento)}</p>
                </div>
                
                <div className={styles.distribucionContainer}>
                  <div className={styles.distribucionHeader}>
                    <div>ID</div>
                    <div>Parcela</div>
                    <div>Propietario</div>
                    <div>Monto</div>
                    <div>Estado</div>
                  </div>
                  
                  {distribucionesActivas
                    .filter(dist => dist.estado !== 'Pagado') // Solo mostrar las que no están pagadas
                    .map((dist) => (
                    <div 
                      key={`${dist.idGasto}-${dist.idParcela}`} 
                      className={styles.distribucionItem}
                      style={{ cursor: 'pointer' }}
                      onClick={() => abrirModalPago(gastoSeleccionado, dist)}
                    >
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
                  
                  {distribucionesActivas.filter(dist => dist.estado !== 'Pagado').length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1' }}>
                      No hay parcelas pendientes de pago para este gasto.
                    </div>
                  )}
                </div>
                
                <div className={styles.modalFooter}>
                  <button 
                    type="button"
                    className={styles.buttonNeutral}
                    onClick={cerrarModales}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal para registrar pago */}
        {modalPago && gastoSeleccionado && parcelaPago && (
          <div className={styles.modalOverlay} onClick={cerrarModales}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  Registrar Pago
                </h2>
                <button className={styles.closeButton} onClick={cerrarModales}>×</button>
              </div>
              
              <div>
                <div className={styles.formGroup}>
                  <h3 className={styles.formTitle}>Gasto: {gastoSeleccionado.concepto}</h3>
                  <p>Monto Total: {formatearMonto(gastoSeleccionado.montoTotal)}</p>
                  <p>Parcela: {parcelaPago.nombreParcela}</p>
                  <p>Propietario: {parcelaPago.propietario}</p>
                  <p>Monto Prorrateado: {formatearMonto(parcelaPago.monto_prorrateado)}</p>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Monto Pagado</label>
                  <input 
                    type="number" 
                    className={styles.formInput}
                    value={formPago.montoPagado}
                    onChange={(e) => setFormPago({ ...formPago, montoPagado: e.target.value })}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Método de Pago</label>
                  <select 
                    className={styles.formSelect}
                    value={formPago.metodoPago}
                    onChange={(e) => setFormPago({ ...formPago, metodoPago: e.target.value })}
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta">Tarjeta</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Descripción</label>
                  <textarea 
                    className={styles.formTextarea}
                    rows={4}
                    value={formPago.descripcion}
                    onChange={(e) => setFormPago({ ...formPago, descripcion: e.target.value })}
                  ></textarea>
                </div>
                
                <div className={styles.modalFooter}>
                  <button 
                    type="button"
                    className={styles.buttonNeutral}
                    onClick={() => {
                      setParcelaPago(null); // Volver a la selección de parcela
                    }}
                  >
                    Volver
                  </button>
                  <button 
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => registrarPagoGasto(formPago)}
                  >
                    Registrar Pago
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
