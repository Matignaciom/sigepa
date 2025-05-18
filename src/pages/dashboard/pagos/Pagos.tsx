import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Pagos.module.css';
import { pagosService } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { default as transbankService } from '../../../services/transbank';
import type { PagoPendiente, PagoRealizado, ResumenPagosPendientes, ResumenPagosRealizados } from '../../../services/api';

// Estilos en línea para componentes que no tienen estilos en el CSS
const inlineStyles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    textAlign: 'center' as const
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(0, 0, 0, 0.1)',
    borderLeft: '4px solid #4f46e5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem'
  },
  spinnerSmall: {
    display: 'inline-block',
    width: '20px',
    height: '20px',
    border: '3px solid rgba(255, 255, 255, 0.3)',
    borderLeft: '3px solid #ffffff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginRight: '0.5rem',
    verticalAlign: 'middle'
  },
  errorMessage: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    border: '1px solid #ef4444',
    borderRadius: '0.5rem',
    padding: '1rem',
    marginBottom: '1rem',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '0.5rem'
  },
  errorButton: {
    backgroundColor: '#b91c1c',
    color: 'white',
    border: 'none',
    borderRadius: '0.25rem',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    fontWeight: 'bold' as const
  }
};

// Agregar un elemento de estilo para la animación del spinner
const spinnerAnimation = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const Pagos = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pendientes');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState<PagoPendiente | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [medioPago, setMedioPago] = useState('credito');
  const [mostrarComprobante, setMostrarComprobante] = useState(false);
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState<PagoRealizado | null>(null);
  
  // Estados para almacenar datos de la API
  const [pagosPendientes, setPagosPendientes] = useState<PagoPendiente[]>([]);
  const [pagosRealizados, setPagosRealizados] = useState<PagoRealizado[]>([]);
  const [resumenPendientes, setResumenPendientes] = useState<ResumenPagosPendientes['proximoVencimiento'] & ResumenPagosPendientes['totalPendiente']>({
    fecha: null,
    concepto: 'Sin pagos pendientes',
    tipo: '',
    monto: 0,
    cantidadCuotas: 0
  });
  const [resumenRealizados, setResumenRealizados] = useState({
    cantidadPagos: 0,
    fechaUltimoPago: null as string | null,
    totalPagado: 0,
    totalTrimestre: 0
  });
  
  // Estados para manejar carga y errores
  const [cargandoPendientes, setCargandoPendientes] = useState(false);
  const [cargandoRealizados, setCargandoRealizados] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
  
  // Cargar pagos pendientes
  useEffect(() => {
    if (activeTab === 'pendientes') {
      cargarPagosPendientes();
    }
  }, [activeTab]);
  
  // Cargar pagos realizados
  useEffect(() => {
    if (activeTab === 'realizados') {
      cargarPagosRealizados();
    }
  }, [activeTab]);
  
  // Función para cargar pagos pendientes desde la API
  const cargarPagosPendientes = async () => {
    try {
      setCargandoPendientes(true);
      setError(null);
      
      console.log("Cargando pagos pendientes...");
      const response = await pagosService.obtenerPagosPendientes();
      console.log("Respuesta de pagos pendientes:", response);
      
      if (response.success && response.data) {
        console.log("Datos de pagos pendientes recibidos:", response.data);
        console.log("Estructura completa:", JSON.stringify(response.data));
        
        // Validación de datos de respuesta - manejar estructura anidada
        let responseData = response.data as any;
        
        // Manejar el caso donde la respuesta está doblemente anidada (success dentro de success)
        if ('success' in responseData && responseData.success === true && 'data' in responseData) {
          console.log('Detectada estructura anidada en respuesta');
          responseData = responseData.data;
        }
        
        const typedData = responseData as ResumenPagosPendientes;
        
        if (!typedData.pagosPendientes) {
          console.warn('No se recibieron pagos pendientes en la respuesta');
          // Intentar estructurar la respuesta - puede venir con diferente formato
          const respData = responseData as any; // Usar any temporalmente para manejar estructura desconocida
          
          if (respData.data && respData.data.pagosPendientes) {
            console.log('Usando estructura alternativa para pagos pendientes');
            responseData = respData.data as ResumenPagosPendientes;
          } else if (Array.isArray(respData)) {
            console.log('La respuesta es un array, adaptando estructura');
            const pagosList = respData as PagoPendiente[];
            responseData = {
              pagosPendientes: pagosList,
              proximoVencimiento: pagosList.length > 0 ? {
                fecha: pagosList[0].fechaVencimiento,
                concepto: pagosList[0].concepto,
                tipo: pagosList[0].tipo,
                monto: pagosList[0].monto
              } : null as any, // Casting necesario para mantener compatibilidad con el tipo
              totalPendiente: {
                monto: pagosList.reduce((sum, pago) => sum + pago.monto, 0),
                cantidadCuotas: pagosList.length
              }
            };
          } else {
            // Si no se puede adaptar, inicializar con estructura vacía
            (responseData as any).pagosPendientes = [];
          }
        }
        
        // Guardar datos en los estados
        setPagosPendientes(typedData.pagosPendientes || []);
        
        // Convertir montos de string a número
        let montoProximoVencimiento = 0;
        if (typedData.proximoVencimiento && typedData.proximoVencimiento.monto) {
          montoProximoVencimiento = typeof typedData.proximoVencimiento.monto === 'string' ? 
            parseFloat(typedData.proximoVencimiento.monto) : typedData.proximoVencimiento.monto;
        }
        
        let montoTotalPendiente = 0;
        if (typedData.totalPendiente && typedData.totalPendiente.monto) {
          montoTotalPendiente = typeof typedData.totalPendiente.monto === 'string' ? 
            parseFloat(typedData.totalPendiente.monto) : typedData.totalPendiente.monto;
        }
        
        // Actualizar resumen con validación para evitar errores
        setResumenPendientes({
          fecha: typedData.proximoVencimiento?.fecha || null,
          concepto: typedData.proximoVencimiento?.concepto || 'Sin pagos pendientes',
          tipo: typedData.proximoVencimiento?.tipo || '',
          monto: montoProximoVencimiento,
          cantidadCuotas: typedData.totalPendiente?.cantidadCuotas || 0
        });
        
        console.log("Resumen de pagos pendientes actualizado:", {
          fecha: typedData.proximoVencimiento?.fecha,
          monto: montoProximoVencimiento,
          cantidadCuotas: typedData.totalPendiente?.cantidadCuotas
        });
      } else {
        console.error("Error en la respuesta:", response.error || 'Error desconocido');
        setError(response.error || 'Error al cargar pagos pendientes');
        
        // Restablecer los estados a valores por defecto
        setPagosPendientes([]);
        setResumenPendientes({
          fecha: null,
          concepto: 'Sin pagos pendientes',
          tipo: '',
          monto: 0,
          cantidadCuotas: 0
        });
      }
    } catch (error) {
      console.error('Error al cargar pagos pendientes:', error);
      setError('Error de conexión al cargar pagos pendientes');
      
      // Restablecer los estados a valores por defecto
      setPagosPendientes([]);
      setResumenPendientes({
        fecha: null,
        concepto: 'Sin pagos pendientes',
        tipo: '',
        monto: 0,
        cantidadCuotas: 0
      });
    } finally {
      setCargandoPendientes(false);
    }
  };
  
  // Función para cargar pagos realizados desde la API
  const cargarPagosRealizados = async () => {
    try {
      setCargandoRealizados(true);
      setError(null);
      
      console.log("Cargando pagos realizados...");
      const response = await pagosService.obtenerPagosRealizados();
      console.log("Respuesta de pagos realizados:", response);
      
      if (response.success && response.data) {
        console.log("Datos de pagos realizados recibidos:", response.data);
        console.log("Estructura completa:", JSON.stringify(response.data));
        
        // Validación de datos de respuesta - manejar estructura anidada
        let responseData = response.data as any;
        
        // Manejar el caso donde la respuesta está doblemente anidada (success dentro de success)
        if ('success' in responseData && responseData.success === true && 'data' in responseData) {
          console.log('Detectada estructura anidada en respuesta');
          responseData = responseData.data;
        }
        
        const typedData = responseData as ResumenPagosRealizados;
        
        if (!typedData.pagosRealizados) {
          console.warn('No se recibieron pagos realizados en la respuesta');
          // Intentar estructurar la respuesta - puede venir con diferente formato
          const respData = responseData as any; // Usar any temporalmente para manejar estructura desconocida
          
          if (respData.data && respData.data.pagosRealizados) {
            console.log('Usando estructura alternativa para pagos realizados');
            responseData = respData.data as ResumenPagosRealizados;
          } else if (Array.isArray(respData)) {
            console.log('La respuesta es un array, adaptando estructura');
            const pagosList = respData as PagoRealizado[];
            responseData = {
              pagosRealizados: pagosList,
              resumen: {
                cantidadPagos: pagosList.length,
                fechaUltimoPago: pagosList.length > 0 ? pagosList[0].fechaPago : null,
                totalPagado: pagosList.reduce((sum, pago) => sum + pago.monto, 0),
                totalTrimestre: 0 // Esto requeriría un cálculo más complejo
              }
            };
          } else {
            // Si no se puede adaptar, inicializar con estructura vacía
            (responseData as any).pagosRealizados = [];
          }
        }
        
        // Guardar datos en los estados
        setPagosRealizados(typedData.pagosRealizados || []);
        
        // Convertir montos de string a número si es necesario
        let totalPagado = 0;
        if (typedData.resumen && typedData.resumen.totalPagado !== undefined) {
          totalPagado = typeof typedData.resumen.totalPagado === 'string' ? 
            parseFloat(typedData.resumen.totalPagado) : typedData.resumen.totalPagado;
        }
        
        let totalTrimestre = 0;
        if (typedData.resumen && typedData.resumen.totalTrimestre !== undefined) {
          totalTrimestre = typeof typedData.resumen.totalTrimestre === 'string' ? 
            parseFloat(typedData.resumen.totalTrimestre) : typedData.resumen.totalTrimestre;
        }
        
        // Actualizar resumen con validación
        setResumenRealizados({
          cantidadPagos: typedData.resumen?.cantidadPagos || 0,
          fechaUltimoPago: typedData.resumen?.fechaUltimoPago || null,
          totalPagado: totalPagado,
          totalTrimestre: totalTrimestre
        });
        
        console.log("Resumen de pagos realizados actualizado:", {
          cantidadPagos: typedData.resumen?.cantidadPagos,
          totalPagado: totalPagado,
          totalTrimestre: totalTrimestre
        });
      } else {
        console.error("Error en la respuesta:", response.error || 'Error desconocido');
        setError(response.error || 'Error al cargar pagos realizados');
        
        // Restablecer los estados a valores por defecto
        setPagosRealizados([]);
        setResumenRealizados({
          cantidadPagos: 0,
          fechaUltimoPago: null,
          totalPagado: 0,
          totalTrimestre: 0
        });
      }
    } catch (error) {
      console.error('Error al cargar pagos realizados:', error);
      setError('Error de conexión al cargar pagos realizados');
      
      // Restablecer los estados a valores por defecto
      setPagosRealizados([]);
      setResumenRealizados({
        cantidadPagos: 0,
        fechaUltimoPago: null,
        totalPagado: 0,
        totalTrimestre: 0
      });
    } finally {
      setCargandoRealizados(false);
    }
  };
  
  // Función para obtener detalles del comprobante
  const cargarComprobante = async (idComprobante: number) => {
    try {
      console.log(`Cargando comprobante ID: ${idComprobante}`);
      const response = await pagosService.obtenerPagosRealizados(idComprobante);
      console.log("Respuesta de comprobante:", response);
      
      if (response.success && response.data) {
        // Manejar estructura anidada
        let responseData = response.data as any;
        
        // Manejar el caso donde la respuesta está doblemente anidada (success dentro de success)
        if ('success' in responseData && responseData.success === true && 'data' in responseData) {
          console.log('Detectada estructura anidada en respuesta de comprobante');
          responseData = responseData.data;
        }
        
        if (responseData.comprobante) {
          console.log("Comprobante encontrado:", responseData.comprobante);
          setComprobanteSeleccionado(responseData.comprobante);
          setMostrarComprobante(true);
        } else {
          console.error("No se encontró el comprobante en la respuesta");
          alert('No se pudo obtener el detalle del comprobante. No encontrado.');
        }
      } else {
        console.error("Error en la respuesta del comprobante:", response.error);
        alert('No se pudo obtener el detalle del comprobante');
      }
    } catch (error) {
      console.error('Error al cargar comprobante:', error);
      alert('Error al cargar el detalle del comprobante');
    }
  };
  
  // Función para formatear montos en pesos chilenos
  const formatMonto = (monto: number | string | null | undefined): string => {
    // Si es null o undefined, mostrar 0
    if (monto === null || monto === undefined) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
      }).format(0);
    }
    
    // Asegurar que monto sea un número
    const montoNumerico = typeof monto === 'string' ? parseFloat(monto) : monto;
    
    // Si no es un número válido, mostrar 0
    if (isNaN(montoNumerico)) {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP'
      }).format(0);
    }
    
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(montoNumerico);
  };
  
  // Función para formatear fechas en formato español
  const formatFecha = (fecha: string) => {
    const [day, month, year] = fecha.split('/');
    return `${day}/${month}/${year}`;
  };
  
  // Función para formatear fechas ISO a formato español (DD/MM/YYYY)
  const formatearFechaISO = (fechaISO: string | null): string => {
    if (!fechaISO) return 'N/A';
    
    try {
      // Convertir a fecha
      const fecha = new Date(fechaISO);
      // Verificar si la fecha es válida
      if (isNaN(fecha.getTime())) return 'N/A';
      
      // Formatear a DD/MM/YYYY
      const dia = fecha.getDate().toString().padStart(2, '0');
      const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const anio = fecha.getFullYear();
      
      return `${dia}/${mes}/${anio}`;
    } catch (error) {
      console.error('Error al formatear la fecha:', error, 'Fecha original:', fechaISO);
      return 'N/A';
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

  // Función para iniciar proceso de pago con Transbank
  const iniciarPago = (pago: PagoPendiente) => {
    setPagoSeleccionado(pago);
    setMostrarModal(true);
    // Por defecto seleccionamos crédito
    setMedioPago('credito');
  };

  // Función para ver detalle del comprobante
  const verComprobante = (pago: PagoRealizado) => {
    cargarComprobante(pago.id);
  };

  // Función para cambiar medio de pago
  const handleChangeMedioPago = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMedioPago(e.target.value);
  };

  // Función para procesar pago con Transbank
  const procesarPagoTransbank = async () => {
    if (!pagoSeleccionado) return;
    
    setProcesandoPago(true);
    
    try {
      // Simulación de Transbank
      const userId = user?.id ? parseInt(user.id) : 0;
      
      // Generar datos para la simulación
      const buyOrder = transbankService.generateBuyOrder(pagoSeleccionado.id);
      const sessionId = transbankService.generateSessionId(userId);
      const returnUrl = transbankService.getReturnUrl();
      
      // Crear transacción simulada en Transbank
      const transbankResponse = await transbankService.createTransaction(
        buyOrder,
        sessionId,
        pagoSeleccionado.monto,
        returnUrl
      );
      
      // Procesar el pago en nuestra API
      const pagoData = {
        idGasto: pagoSeleccionado.idGasto,
        idParcela: pagoSeleccionado.idParcela,
        monto: pagoSeleccionado.monto,
        descripcion: `Pago ${pagoSeleccionado.concepto} con ${medioPago === 'credito' ? 'tarjeta de crédito' : 'tarjeta de débito'}`
      };
      
      const response = await pagosService.procesarPagoTransbank(pagoData);
      
      if (response.success && 'data' in response) {
      setProcesandoPago(false);
      setMostrarModal(false);
      
        // Recargar los datos después del pago exitoso
        cargarPagosPendientes();
        
        // Redirigir a Transbank (simulación)
        window.location.href = transbankResponse.url;
      } else {
        setProcesandoPago(false);
        alert('Error al procesar el pago: ' + (response.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error al procesar pago:', error);
      setProcesandoPago(false);
      alert('Error de conexión al procesar el pago');
    }
  };
  
  // Función para procesar pago múltiple (Pagar Todo)
  const procesarPagoMultiple = async () => {
    if (!pagosPendientes || pagosPendientes.length === 0) return;
    
    setProcesandoPago(true);
    
    try {
      // Simulación de Transbank
      const userId = user?.id ? parseInt(user.id) : 0;
      
      // Calcular monto total
      const montoTotal = pagosPendientes.reduce((total, pago) => total + pago.monto, 0);
      
      // Generar datos para la simulación
      const buyOrder = transbankService.generateBuyOrder(0);
      const sessionId = transbankService.generateSessionId(userId);
      const returnUrl = transbankService.getReturnUrl();
      
      // Crear transacción simulada en Transbank
      const transbankResponse = await transbankService.createTransaction(
        buyOrder,
        sessionId,
        montoTotal,
        returnUrl
      );
      
      const pagoData = {
        pagarTodos: true,
        descripcion: `Pago múltiple de ${pagosPendientes.length} cuotas con ${medioPago === 'credito' ? 'tarjeta de crédito' : 'tarjeta de débito'}`
      };
      
      const response = await pagosService.procesarPagoTransbank(pagoData);
      
      if (response.success && 'data' in response) {
        setProcesandoPago(false);
        setMostrarModal(false);
        
        // Recargar los datos después del pago exitoso
        cargarPagosPendientes();
        
        // Redirigir a Transbank (simulación)
        window.location.href = transbankResponse.url;
      } else {
        setProcesandoPago(false);
        alert('Error al procesar los pagos: ' + (response.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error al procesar pagos múltiples:', error);
      setProcesandoPago(false);
      alert('Error de conexión al procesar los pagos');
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Agregar el elemento style para la animación del spinner */}
      <style dangerouslySetInnerHTML={{ __html: spinnerAnimation }} />
      
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
          <h2 className={styles.dashboardTitle}>Gestión de Pagos</h2>
          <div className={styles.headerBrand}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.favicon} /> SIGEPA
          </div>
        </header>
        
        <p className={styles.subtitle}>Administre sus pagos pendientes y realice transacciones seguras vía Transbank</p>
        
        {/* Contenedor de Tabs */}
        <div className={styles.tabsWrapper}>
          <div className={styles.tabsHeader}>
            <button 
              className={`${styles.tabButton} ${activeTab === 'pendientes' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('pendientes')}
            >
              Pagos Pendientes
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'realizados' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('realizados')}
            >
              Pagos Realizados
            </button>
          </div>
          
          {/* Contenido de la tab Pendientes */}
          {activeTab === 'pendientes' && (
            <div className={styles.tabContent}>
              {error && (
                <div style={inlineStyles.errorMessage}>
                  <p>{error}</p>
                  <button 
                    style={inlineStyles.errorButton} 
                    onClick={cargarPagosPendientes}
                  >
                    Reintentar
                  </button>
                </div>
              )}
              
              {cargandoPendientes ? (
                <div style={inlineStyles.loadingContainer}>
                  <div style={inlineStyles.spinner}></div>
                  <p>Cargando pagos pendientes...</p>
                </div>
              ) : (
                <>
              <div className={styles.statsRow}>
                <div className={styles.statCard}>
                  <div className={styles.statIconContainer}>
                    <span className={styles.statIcon}>⏱️</span>
                  </div>
                  <div className={styles.statContent}>
                    <h3>Próximo Vencimiento</h3>
                        <p className={styles.statNumber}>{formatearFechaISO(resumenPendientes.fecha)}</p>
                        <p className={`${styles.statDetail} ${styles.darkText}`}>{resumenPendientes.concepto}</p>
                  </div>
                </div>
                
                <div className={styles.statCard}>
                  <div className={styles.statIconContainer}>
                    <span className={styles.statIcon}>💰</span>
                  </div>
                  <div className={styles.statContent}>
                    <h3>Total Pendiente</h3>
                        <p className={styles.statNumber}>{formatMonto(resumenPendientes.monto)}</p>
                        <p className={`${styles.statDetail} ${styles.darkText}`}>{resumenPendientes.cantidadCuotas} cuota(s) pendiente(s)</p>
                  </div>
                </div>
              </div>
              
                  {pagosPendientes && pagosPendientes.length > 0 ? (
                <div className={styles.activityContainer}>
                  <div className={styles.tableHeader}>
                    <div className={styles.tableCell}>Concepto</div>
                    <div className={styles.tableCell}>Tipo</div>
                    <div className={styles.tableCell}>Fecha Vencimiento</div>
                    <div className={styles.tableCell}>Monto</div>
                    <div className={styles.tableCell}>Estado</div>
                    <div className={styles.tableCell}>Acciones</div>
                  </div>
                  
                  {pagosPendientes.map(pago => (
                    <div key={pago.id} className={styles.tableRow}>
                      <div className={styles.tableCell} data-label="Concepto">{pago.concepto}</div>
                      <div className={styles.tableCell} data-label="Tipo">{pago.tipo}</div>
                          <div className={styles.tableCell} data-label="Fecha Vencimiento">{formatearFechaISO(pago.fechaVencimiento)}</div>
                      <div className={styles.tableCell} data-label="Monto">{formatMonto(pago.monto)}</div>
                      <div className={styles.tableCell} data-label="Estado">
                        <span className={`${styles.statusBadge} ${styles[pago.estado.toLowerCase()]}`}>
                          {pago.estado}
                        </span>
                      </div>
                      <div className={styles.tableCell} data-label="Acciones">
                        <button 
                          className={styles.transbankButton}
                          onClick={() => iniciarPago(pago)}
                        >
                          <span className={styles.btnIcon}>💳</span>
                          <span className={styles.btnText}>Pagar con Transbank</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className={styles.actionContainer}>
                    <div className={styles.transbankInfo}>
                          <img src="/favicon.svg" alt="Transbank" className={styles.transbankLogo} />
                      <p>Todos los pagos son procesados de forma segura a través de Transbank</p>
                    </div>
                    <button 
                      className={styles.transbankButtonLarge}
                          onClick={() => {
                            if (pagosPendientes && pagosPendientes.length > 0) {
                              setPagoSeleccionado(pagosPendientes[0]);
                              setMostrarModal(true);
                              setMedioPago('credito');
                            }
                          }}
                          disabled={!pagosPendientes || pagosPendientes.length === 0}
                    >
                      <span className={styles.btnIcon}>💰</span>
                      <span className={styles.btnText}>Pagar Todo con Transbank</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p className={styles.emptyStateText}>No tiene pagos pendientes actualmente.</p>
                </div>
                  )}
                </>
              )}
            </div>
          )}
          
          {/* Contenido de la tab Realizados */}
          {activeTab === 'realizados' && (
            <div className={styles.tabContent}>
              {error && (
                <div style={inlineStyles.errorMessage}>
                  <p>{error}</p>
                  <button 
                    style={inlineStyles.errorButton} 
                    onClick={cargarPagosRealizados}
                  >
                    Reintentar
                  </button>
                </div>
              )}
              
              {cargandoRealizados ? (
                <div style={inlineStyles.loadingContainer}>
                  <div style={inlineStyles.spinner}></div>
                  <p>Cargando pagos realizados...</p>
                </div>
              ) : (
                <>
              <div className={styles.statsRow}>
                <div className={styles.statCard}>
                  <div className={styles.statIconContainer}>
                    <span className={styles.statIcon}>✅</span>
                  </div>
                  <div className={styles.statContent}>
                    <h3>Pagos Realizados</h3>
                        <p className={styles.statNumber}>{resumenRealizados.cantidadPagos}</p>
                        <p className={`${styles.statDetail} ${styles.darkText}`}>Último: {formatearFechaISO(resumenRealizados.fechaUltimoPago)}</p>
                  </div>
                </div>
                
                <div className={styles.statCard}>
                  <div className={styles.statIconContainer}>
                    <span className={styles.statIcon}>💸</span>
                  </div>
                  <div className={styles.statContent}>
                    <h3>Total Pagado</h3>
                        <p className={styles.statNumber}>{formatMonto(resumenRealizados.totalPagado)}</p>
                        <p className={`${styles.statDetail} ${styles.darkText}`}>Durante el último trimestre: {formatMonto(resumenRealizados.totalTrimestre)}</p>
                  </div>
                </div>
              </div>
              
                  {pagosRealizados && pagosRealizados.length > 0 ? (
                <div className={styles.activityContainer}>
                  <div className={styles.tableHeader}>
                    <div className={styles.tableCell}>Concepto</div>
                    <div className={styles.tableCell}>Fecha Pago</div>
                    <div className={styles.tableCell}>Monto</div>
                    <div className={styles.tableCell}>Comprobante</div>
                    <div className={styles.tableCell}>Transacción</div>
                    <div className={styles.tableCell}>Acciones</div>
                  </div>
                  
                  {pagosRealizados.map(pago => (
                    <div key={pago.id} className={styles.tableRow}>
                      <div className={styles.tableCell} data-label="Concepto">{pago.concepto}</div>
                          <div className={styles.tableCell} data-label="Fecha Pago">{formatearFechaISO(pago.fechaPago)}</div>
                      <div className={styles.tableCell} data-label="Monto">{formatMonto(pago.monto)}</div>
                      <div className={styles.tableCell} data-label="Comprobante">{pago.comprobante}</div>
                      <div className={styles.tableCell} data-label="Transacción">{pago.transaccion_id || 'N/A'}</div>
                      <div className={styles.tableCell} data-label="Acciones">
                        <button 
                          className={styles.detailButton}
                          onClick={() => verComprobante(pago)}
                        >
                          <span className={styles.btnIcon}>📄</span>
                          <span className={styles.btnText}>Ver Comprobante</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p className={styles.emptyStateText}>No tiene pagos realizados para mostrar.</p>
                </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        
        <footer className={styles.contentFooter}>
          <div className={styles.footerLogo}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.faviconSmall} /> SIGEPA
          </div>
          <p>Sistema de Gestión de Parcelas © {currentYear}</p>
          <div className={styles.securityBadges}>
            <img 
              src="/favicon.svg" 
              alt="PCI Compliance" 
              className={styles.securityBadge} 
            />
            <img 
              src="/favicon.svg" 
              alt="Transbank Webpay" 
              className={styles.securityBadge} 
            />
          </div>
        </footer>
      </div>
      
      {/* Modal de pago con Transbank */}
      {mostrarModal && pagoSeleccionado && (
        <div className={styles.modalOverlay} onClick={() => !procesandoPago && setMostrarModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button 
              className={styles.modalClose} 
              onClick={() => !procesandoPago && setMostrarModal(false)}
              disabled={procesandoPago}
            >
              ×
            </button>
            <div className={styles.modalHeader}>
              <img src="/favicon.svg" alt="Transbank" className={styles.transbankLogoModal} />
              <h3>Pago Seguro vía Transbank</h3>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.pagoDetalles}>
                {pagoSeleccionado.idGasto !== 0 ? (
                  // Pago individual
                  <>
                <div className={styles.detalleItem}>
                  <span className={styles.detalleLabel}>Concepto:</span>
                  <span className={styles.detalleValor}>{pagoSeleccionado.concepto}</span>
                </div>
                <div className={styles.detalleItem}>
                  <span className={styles.detalleLabel}>Monto:</span>
                  <span className={styles.detalleMonto}>{formatMonto(pagoSeleccionado.monto)}</span>
                </div>
                <div className={styles.detalleItem}>
                  <span className={styles.detalleLabel}>Fecha Vencimiento:</span>
                      <span className={styles.detalleValor}>{formatearFechaISO(pagoSeleccionado.fechaVencimiento)}</span>
                </div>
                  </>
                ) : (
                  // Pago múltiple
                  <>
                    <div className={styles.detalleItem}>
                      <span className={styles.detalleLabel}>Concepto:</span>
                      <span className={styles.detalleValor}>Pago múltiple de cuotas</span>
                    </div>
                    <div className={styles.detalleItem}>
                      <span className={styles.detalleLabel}>Monto Total:</span>
                      <span className={styles.detalleMonto}>{formatMonto(resumenPendientes.monto)}</span>
                    </div>
                    <div className={styles.detalleItem}>
                      <span className={styles.detalleLabel}>Cantidad de Cuotas:</span>
                      <span className={styles.detalleValor}>{resumenPendientes.cantidadCuotas} cuota(s)</span>
                    </div>
                  </>
                )}
              </div>
              
              <div className={styles.medioPagoOptions}>
                <h4>Seleccione su medio de pago:</h4>
                <div className={styles.tarjetasGrid}>
                  <div className={styles.tarjetaOption}>
                    <input 
                      type="radio" 
                      id="credito" 
                      name="medioPago" 
                      value="credito" 
                      checked={medioPago === 'credito'}
                      onChange={handleChangeMedioPago}
                    />
                    <label htmlFor="credito">Tarjeta de Crédito</label>
                  </div>
                  <div className={styles.tarjetaOption}>
                    <input 
                      type="radio" 
                      id="debito" 
                      name="medioPago" 
                      value="debito" 
                      checked={medioPago === 'debito'}
                      onChange={handleChangeMedioPago}
                    />
                    <label htmlFor="debito">Tarjeta de Débito</label>
                  </div>
                </div>
                
                <div className={styles.tarjetasLogos}>
                  <img src="/favicon.svg" alt="Visa" className={styles.tarjetaLogo} />
                  <img src="/favicon.svg" alt="Mastercard" className={styles.tarjetaLogo} />
                  <img src="/favicon.svg" alt="American Express" className={styles.tarjetaLogo} />
                  <img src="/favicon.svg" alt="Diners" className={styles.tarjetaLogo} />
                </div>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button 
                className={styles.modalCancelButton} 
                onClick={() => !procesandoPago && setMostrarModal(false)}
                disabled={procesandoPago}
              >
                Cancelar
              </button>
              <button 
                className={styles.modalPayButton} 
                onClick={pagoSeleccionado.idGasto !== 0 ? procesarPagoTransbank : procesarPagoMultiple}
                disabled={procesandoPago}
              >
                {procesandoPago ? (
                  <>
                    <span style={inlineStyles.spinnerSmall}></span>
                    Procesando...
                  </>
                ) : (
                  <>
                    <span className={styles.btnIcon}>💳</span>
                    Pagar con Transbank
                  </>
                )}
              </button>
            </div>
            
            <div className={styles.securityInfo}>
              <p>Transacción segura y protegida. Todos los datos son encriptados.</p>
              <div className={styles.securityIcons}>
                <span className={styles.securityIcon}>🔒</span>
                <span>Conexión segura SSL</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de visualización de comprobante */}
      {mostrarComprobante && comprobanteSeleccionado && (
        <div className={styles.modalOverlay} onClick={() => setMostrarComprobante(false)}>
          <div className={styles.comprobanteContent} onClick={e => e.stopPropagation()}>
            <button 
              className={styles.modalClose} 
              onClick={() => setMostrarComprobante(false)}
            >
              ×
            </button>
            <div className={styles.comprobanteHeader}>
              <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.comprobanteHeaderLogo} />
              <h3>Comprobante de Pago</h3>
            </div>
            <div className={styles.comprobanteBody}>
              <div className={styles.comprobanteTitulo}>
                <h1>COMPROBANTE DE PAGO</h1>
                <p>Sistema de Gestión de Parcelas</p>
              </div>
              
              <div className={styles.comprobanteInfo}>
                <div className={styles.comprobanteRow}>
                  <span className={styles.comprobanteLabel}>N° de Comprobante:</span>
                  <span className={styles.comprobanteValue}>{comprobanteSeleccionado.comprobante}</span>
                </div>
                <div className={styles.comprobanteRow}>
                  <span className={styles.comprobanteLabel}>Concepto:</span>
                  <span className={styles.comprobanteValue}>{comprobanteSeleccionado.concepto}</span>
                </div>
                <div className={styles.comprobanteRow}>
                  <span className={styles.comprobanteLabel}>Fecha de Pago:</span>
                  <span className={styles.comprobanteValue}>{formatearFechaISO(comprobanteSeleccionado.fechaPago)}</span>
                </div>
                <div className={styles.comprobanteRow}>
                  <span className={styles.comprobanteLabel}>Monto Pagado:</span>
                  <span className={styles.comprobanteMonto}>{formatMonto(comprobanteSeleccionado.monto)}</span>
                </div>
                <div className={styles.comprobanteRow}>
                  <span className={styles.comprobanteLabel}>ID Transacción:</span>
                  <span className={styles.comprobanteValue}>{comprobanteSeleccionado.transaccion_id || 'N/A'}</span>
                </div>
                <div className={styles.comprobanteRow}>
                  <span className={styles.comprobanteLabel}>Pagado por:</span>
                  <span className={styles.comprobanteValue}>Webpay Plus (Transbank)</span>
                </div>
              </div>
              
              <div className={styles.comprobanteEstado}>
                <div className={styles.comprobanteEstadoCircle}>
                  <span className={styles.comprobanteEstadoIcon}>✓</span>
                </div>
                <h3>PAGO EXITOSO</h3>
              </div>
              
              <div className={styles.comprobanteSello}>
                <div className={styles.comprobanteSelloLeft}>
                  <img src="/favicon.svg" alt="Transbank" className={styles.comprobanteSelloLogo} />
                  <div className={styles.comprobanteSelloTimestamp}>
                    <span>Fecha emisión: {formatearFechaISO(comprobanteSeleccionado.fechaPago)}</span>
                    <div className={styles.comprobanteSelloVerificacion}>
                      <span className={styles.comprobanteVerificacionIcon}>🔒</span>
                      <span>Verificado por Transbank</span>
                    </div>
                  </div>
                </div>
                <div className={styles.comprobanteSelloRight}>
                  <div className={styles.comprobanteSelloQR}></div>
                </div>
              </div>
            </div>
            
            <div className={styles.comprobanteFooter}>
              <button className={styles.comprobanteButton} onClick={() => window.print()}>
                <span className={styles.btnIcon}>🖨️</span>
                Imprimir
              </button>
              <button className={styles.comprobanteButton} onClick={() => setMostrarComprobante(false)}>
                <span className={styles.btnIcon}>✓</span>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};