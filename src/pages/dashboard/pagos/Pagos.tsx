import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Pagos.module.css';

// Tipos para integrar con el esquema de la base de datos
interface PagoPendiente {
  id: number;
  idGasto: number;
  idParcela: number;
  concepto: string;
  fechaVencimiento: string;
  monto: number;
  estado: 'Pendiente' | 'Próximo' | 'Atrasado';
  tipo: string;
}

interface PagoRealizado {
  id: number;
  idGasto: number;
  idParcela: number;
  concepto: string;
  fechaPago: string;
  monto: number;
  comprobante: string;
  transaccion_id?: string;
}

export const Pagos = () => {
  const [activeTab, setActiveTab] = useState('pendientes');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState<PagoPendiente | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [medioPago, setMedioPago] = useState('credito');
  const [mostrarComprobante, setMostrarComprobante] = useState(false);
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState<PagoRealizado | null>(null);
  
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
  
  // Datos de ejemplo para pagos pendientes basados en el esquema
  const pagosPendientes: PagoPendiente[] = [
    {
      id: 1,
      idGasto: 101,
      idParcela: 1,
      concepto: 'Cuota Ordinaria Junio 2023',
      fechaVencimiento: '15/06/2023',
      monto: 150000,
      estado: 'Pendiente',
      tipo: 'Cuota Ordinaria'
    },
    {
      id: 2,
      idGasto: 102,
      idParcela: 1,
      concepto: 'Cuota Extraordinaria Mantención',
      fechaVencimiento: '15/07/2023',
      monto: 75000,
      estado: 'Próximo',
      tipo: 'Cuota Extraordinaria'
    },
    {
      id: 3,
      idGasto: 103,
      idParcela: 2,
      concepto: 'Multa por atraso en pago',
      fechaVencimiento: '10/06/2023',
      monto: 15000,
      estado: 'Atrasado',
      tipo: 'Multa'
    }
  ];
  
  // Datos de ejemplo para pagos realizados basados en el esquema
  const pagosRealizados: PagoRealizado[] = [
    {
      id: 101,
      idGasto: 98,
      idParcela: 1,
      concepto: 'Cuota Ordinaria Mayo 2023',
      fechaPago: '10/05/2023',
      monto: 150000,
      comprobante: 'COMP-2023-05-001',
      transaccion_id: 'TB-982736451'
    },
    {
      id: 102,
      idGasto: 97,
      idParcela: 1,
      concepto: 'Cuota Ordinaria Abril 2023',
      fechaPago: '10/04/2023',
      monto: 150000,
      comprobante: 'COMP-2023-04-001',
      transaccion_id: 'TB-975632147'
    },
    {
      id: 103,
      idGasto: 96,
      idParcela: 1,
      concepto: 'Cuota Ordinaria Marzo 2023',
      fechaPago: '10/03/2023',
      monto: 150000,
      comprobante: 'COMP-2023-03-001',
      transaccion_id: 'TB-963258741'
    }
  ];
  
  // Función para formatear montos en pesos chilenos
  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(monto);
  };
  
  // Función para formatear fechas en formato español
  const formatFecha = (fecha: string) => {
    const [day, month, year] = fecha.split('/');
    return `${day}/${month}/${year}`;
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
    setComprobanteSeleccionado(pago);
    setMostrarComprobante(true);
  };

  // Función para cambiar medio de pago
  const handleChangeMedioPago = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMedioPago(e.target.value);
  };

  // Función para simular procesamiento de pago con Transbank
  const procesarPagoTransbank = () => {
    if (!pagoSeleccionado) return;
    
    setProcesandoPago(true);
    
    // Simulación de la integración con Transbank
    setTimeout(() => {
      setProcesandoPago(false);
      setMostrarModal(false);
      
      // Aquí se implementaría la redirección a Transbank o procesamiento WebPay
      alert(`Redirigiendo a Transbank para procesar el pago de ${formatMonto(pagoSeleccionado.monto)} con ${medioPago === 'credito' ? 'tarjeta de crédito' : 'tarjeta de débito'}`);
      
      // Después se procesaría el callback de Transbank
    }, 1500);
  };

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
              <div className={styles.statsRow}>
                <div className={styles.statCard}>
                  <div className={styles.statIconContainer}>
                    <span className={styles.statIcon}>⏱️</span>
                  </div>
                  <div className={styles.statContent}>
                    <h3>Próximo Vencimiento</h3>
                    <p className={styles.statNumber}>{pagosPendientes.length > 0 ? pagosPendientes[0].fechaVencimiento : 'N/A'}</p>
                    <p className={`${styles.statDetail} ${styles.darkText}`}>{pagosPendientes.length > 0 ? pagosPendientes[0].concepto : 'Sin pagos pendientes'}</p>
                  </div>
                </div>
                
                <div className={styles.statCard}>
                  <div className={styles.statIconContainer}>
                    <span className={styles.statIcon}>💰</span>
                  </div>
                  <div className={styles.statContent}>
                    <h3>Total Pendiente</h3>
                    <p className={styles.statNumber}>{formatMonto(pagosPendientes.reduce((total, pago) => total + pago.monto, 0))}</p>
                    <p className={`${styles.statDetail} ${styles.darkText}`}>{pagosPendientes.length} cuota(s) pendiente(s)</p>
                  </div>
                </div>
              </div>
              
              {pagosPendientes.length > 0 ? (
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
                      <div className={styles.tableCell} data-label="Fecha Vencimiento">{pago.fechaVencimiento}</div>
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
                      <img src="https://www.transbank.cl/public/img/logo-transbank-color.png" alt="Transbank" className={styles.transbankLogo} />
                      <p>Todos los pagos son procesados de forma segura a través de Transbank</p>
                    </div>
                    <button 
                      className={styles.transbankButtonLarge}
                      onClick={() => iniciarPago(pagosPendientes[0])}
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
            </div>
          )}
          
          {/* Contenido de la tab Realizados */}
          {activeTab === 'realizados' && (
            <div className={styles.tabContent}>
              <div className={styles.statsRow}>
                <div className={styles.statCard}>
                  <div className={styles.statIconContainer}>
                    <span className={styles.statIcon}>✅</span>
                  </div>
                  <div className={styles.statContent}>
                    <h3>Pagos Realizados</h3>
                    <p className={styles.statNumber}>{pagosRealizados.length}</p>
                    <p className={`${styles.statDetail} ${styles.darkText}`}>Último: {pagosRealizados.length > 0 ? pagosRealizados[0].fechaPago : 'N/A'}</p>
                  </div>
                </div>
                
                <div className={styles.statCard}>
                  <div className={styles.statIconContainer}>
                    <span className={styles.statIcon}>💸</span>
                  </div>
                  <div className={styles.statContent}>
                    <h3>Total Pagado</h3>
                    <p className={styles.statNumber}>{formatMonto(pagosRealizados.reduce((total, pago) => total + pago.monto, 0))}</p>
                    <p className={`${styles.statDetail} ${styles.darkText}`}>Durante el último trimestre</p>
                  </div>
                </div>
              </div>
              
              {pagosRealizados.length > 0 ? (
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
                      <div className={styles.tableCell} data-label="Fecha Pago">{pago.fechaPago}</div>
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
              src="https://www.webpay.cl/assets/img/pci.svg" 
              alt="PCI Compliance" 
              className={styles.securityBadge} 
            />
            <img 
              src="https://www.transbank.cl/public/img/logo-color.svg" 
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
              <img src="https://www.transbank.cl/public/img/logo-transbank-color.png" alt="Transbank" className={styles.transbankLogoModal} />
              <h3>Pago Seguro vía Transbank</h3>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.pagoDetalles}>
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
                  <span className={styles.detalleValor}>{pagoSeleccionado.fechaVencimiento}</span>
                </div>
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
                  <img src="https://www.transbank.cl/public/img/tarjetas/visa.svg" alt="Visa" className={styles.tarjetaLogo} />
                  <img src="https://www.transbank.cl/public/img/tarjetas/mastercard.svg" alt="Mastercard" className={styles.tarjetaLogo} />
                  <img src="https://www.transbank.cl/public/img/tarjetas/amex.svg" alt="American Express" className={styles.tarjetaLogo} />
                  <img src="https://www.transbank.cl/public/img/tarjetas/diners.svg" alt="Diners" className={styles.tarjetaLogo} />
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
                onClick={procesarPagoTransbank}
                disabled={procesandoPago}
              >
                {procesandoPago ? (
                  <>
                    <span className={styles.spinnerSmall}></span>
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
                  <span className={styles.comprobanteValue}>{formatFecha(comprobanteSeleccionado.fechaPago)}</span>
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
                  <img src="https://www.transbank.cl/public/img/logo-transbank-color.png" alt="Transbank" className={styles.comprobanteSelloLogo} />
                  <div className={styles.comprobanteSelloTimestamp}>
                    <span>Fecha emisión: {formatFecha(comprobanteSeleccionado.fechaPago)}</span>
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