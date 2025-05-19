import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import styles from './Documentos.module.css';
import axios from 'axios';
// Importaciones para exportar a Excel
import * as XLSX from 'xlsx';
// Importaciones para exportar a PDF
import { jsPDF } from 'jspdf';
// Importar jspdf-autotable como una función normal
import autoTable from 'jspdf-autotable';

interface DocumentoItem {
  id: number;
  fecha: string;
  tipo: string;
  concepto: string;
  monto: number | null;
  estado: string;
  comprobante: string | null;
}

interface PagoHistorialItem {
  id: number;
  montoPagado: number;
  fechaPago: string;
  estado: string;
  comprobante: string | null;
  descripcion: string | null;
  concepto: string;
  tipo: string;
  nombreParcela: string;
}

export const Historial = () => {
  const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear().toString());
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mostrarComprobante, setMostrarComprobante] = useState(false);
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState<DocumentoItem | null>(null);
  const [historialData, setHistorialData] = useState<DocumentoItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  
  const currentYear = new Date().getFullYear();
  
  // Referencia al contenedor de la tabla para exportar a PDF
  const tableRef = useRef<HTMLDivElement>(null);
  
  // Obtener el historial de pagos desde la API
  useEffect(() => {
    const obtenerHistorialPagos = async () => {
      setCargando(true);
      setError('');
      try {
        // Obtener el token de autenticación
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No se encontró el token de autenticación');
        }
        
        // Hacer la solicitud a la API
        const response = await axios.get('/.netlify/functions/obtener-pagos-historial', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Verificar respuesta
        if (response.data.success) {
          // Convertir los datos de la API al formato requerido por nuestro componente
          const pagosFormateados: DocumentoItem[] = response.data.data.map((pago: PagoHistorialItem) => ({
            id: pago.id,
            fecha: new Date(pago.fechaPago).toLocaleDateString('es-CL'),
            tipo: pago.tipo.toLowerCase() === 'cuota ordinaria' ? 'pago' : 
                  pago.tipo.toLowerCase() === 'documento' ? 'documento' : 'notificacion',
            concepto: pago.concepto,
            monto: pago.montoPagado,
            estado: pago.estado,
            comprobante: pago.comprobante
          }));
          
          setHistorialData(pagosFormateados);
        } else {
          throw new Error(response.data.message || 'Error al obtener los datos');
        }
      } catch (err) {
        console.error('Error al obtener historial de pagos:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar los datos');
      } finally {
        setCargando(false);
      }
    };
    
    obtenerHistorialPagos();
  }, []);
  
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
  
  // Filtrar datos según los filtros seleccionados
  const datosFiltrados = historialData.filter(item => {
    const cumpleFiltroAnio = item.fecha.includes(filtroAnio);
    const cumpleFiltroTipo = filtroTipo === 'todos' || item.tipo === filtroTipo;
    return cumpleFiltroAnio && cumpleFiltroTipo;
  });
  
  // Función para formatear montos en pesos chilenos
  const formatMonto = (monto: number | null): string => {
    if (monto === null) return '-';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(monto);
  };
  
  // Función para obtener el color del estado
  const getEstadoClass = (estado: string): string => {
    switch (estado.toLowerCase()) {
      case 'completado':
      case 'pagado':
        return styles.estadoCompletado;
      case 'procesado':
        return styles.estadoProcesado;
      case 'leído':
        return styles.estadoLeido;
      case 'pendiente':
        return styles.estadoPendiente;
      case 'atrasado':
        return styles.estadoAtrasado;
      default:
        return '';
    }
  };
  
  // Función para obtener el icono según el tipo
  const getTipoIcon = (tipo: string): string => {
    switch (tipo) {
      case 'pago':
        return '💰';
      case 'documento':
        return '📄';
      case 'notificacion':
        return '🔔';
      default:
        return '📋';
    }
  };
  
  // Función para cerrar sesión
  const handleLogout = () => {
    // Aquí iría la lógica para cerrar sesión
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };
  
  // Función para abrir/cerrar el menú en móviles
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Función para ver detalle del comprobante
  const verComprobante = (documento: DocumentoItem) => {
    setComprobanteSeleccionado(documento);
    setMostrarComprobante(true);
  };

  // Función para formatear fechas
  const formatFecha = (fecha: string) => {
    return fecha;
  };

  // Función para exportar a Excel
  const exportarExcel = () => {
    // Crear un array de datos para la exportación
    const datosExcel = datosFiltrados.map(item => ({
      'Fecha': item.fecha,
      'Tipo': item.tipo === 'pago' ? 'Pago' : item.tipo === 'documento' ? 'Documento' : 'Notificación',
      'Concepto': item.concepto,
      'Monto': item.monto ? item.monto : '-',
      'Estado': item.estado,
      'Comprobante': item.comprobante || 'No disponible'
    }));

    // Crear una hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    
    // Crear un libro de trabajo y añadir la hoja
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'HistorialPagos');
    
    // Guardar el archivo
    XLSX.writeFile(wb, `Historial_Documentos_${filtroAnio}.xlsx`);
  };

  // Función mejorada para exportar a PDF
  const handleExportarPDF = () => {
    try {
      // Verificar si hay datos para exportar
      if (datosFiltrados.length === 0) {
        alert('No hay datos para exportar');
        return;
      }
      
      // Crear un nuevo documento PDF
      const doc = new jsPDF();
      
      // Añadir un logo o encabezado
      doc.setFillColor(79, 70, 229);
      doc.rect(14, 10, 10, 10, 'F');
      
      // Título del documento
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text('Historial de Documentos y Pagos', 30, 18);
      
      // Línea separadora
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 25, 196, 25);
      
      // Información del usuario y filtros
      doc.setFontSize(10);
      const nombreUsuario = user?.nombreCompleto || user?.name || 'Usuario';
      doc.text(`Usuario: ${nombreUsuario}`, 14, 32);
      doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-CL')}`, 14, 37);
      doc.text(`Filtros aplicados: Año ${filtroAnio} | Tipo: ${
        filtroTipo === 'todos' ? 'Todos' : 
        filtroTipo === 'pago' ? 'Pagos' : 
        filtroTipo === 'documento' ? 'Documentos' : 'Notificaciones'
      }`, 14, 42);
      
      // Preparar los datos para la tabla
      const datosPDF = datosFiltrados.map(item => [
        item.fecha,
        item.tipo === 'pago' ? 'Pago' : item.tipo === 'documento' ? 'Documento' : 'Notificación',
        item.concepto,
        item.monto ? formatMonto(item.monto) : '-',
        item.estado,
        item.comprobante || 'No disponible'
      ]);
      
      // Usar autoTable como una función independiente en lugar de un método de doc
      autoTable(doc, {
        head: [['Fecha', 'Tipo', 'Concepto', 'Monto', 'Estado', 'Comprobante']],
        body: datosPDF,
        startY: 48,
        theme: 'grid',
        headStyles: { 
          fillColor: [79, 70, 229], 
          textColor: [255, 255, 255],
          fontSize: 10
        },
        alternateRowStyles: { 
          fillColor: [240, 240, 255] 
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        margin: { top: 48 },
        didDrawPage: (data) => {
          // Pie de página
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `SIGEPA - Sistema de Gestión de Parcelas © ${currentYear} | Página ${data.pageNumber} de ${doc.getNumberOfPages()}`, 
            pageSize.width / 2, 
            pageHeight - 10, 
            { align: 'center' }
          );
        }
      });
      
      // Mensaje final
      const finalY = (doc as any).lastAutoTable?.finalY || 150;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Este documento es un resumen de sus pagos y documentos procesados en el sistema.', 14, finalY + 10);
      doc.text('Para cualquier consulta, contáctese con administración.', 14, finalY + 15);
            
      // Guardar el PDF
      doc.save(`Historial_Documentos_${filtroAnio}.pdf`);
      
      console.log('PDF exportado correctamente');
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      alert('Ocurrió un error al exportar a PDF. Por favor, intente nuevamente.');
    }
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
                  className={`${styles.navLink}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>📊</span>
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/dashboard/parcelas" 
                  className={`${styles.navLink}`}
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
                  className={`${styles.navLink}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>💰</span>
                  Pagos y Gastos
                </Link>
              </li>
              <li>
                <Link to="/dashboard/documentos" 
                  className={`${styles.navLink} ${styles.active}`}
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
                  className={`${styles.navLink}`}
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
                  className={`${styles.navLink}`}
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
          <h2 className={styles.dashboardTitle}>Historial de Documentos</h2>
          <div className={styles.headerBrand}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.favicon} /> SIGEPA
          </div>
        </header>
        
        <p className={styles.subtitle}>Revise todos sus documentos, comprobantes de pago y notificaciones</p>
        
        <section>
          <div className={styles.filtrosContainer}>
            <div className={styles.filtro}>
              <label htmlFor="filtroAnio">Año:</label>
              <select 
                id="filtroAnio" 
                value={filtroAnio} 
                onChange={(e) => setFiltroAnio(e.target.value)}
                className={styles.select}
              >
                <option value={currentYear.toString()}>{currentYear}</option>
                <option value={(currentYear - 1).toString()}>{currentYear - 1}</option>
                <option value={(currentYear - 2).toString()}>{currentYear - 2}</option>
              </select>
            </div>
            
            <div className={styles.filtro}>
              <label htmlFor="filtroTipo">Tipo:</label>
              <select 
                id="filtroTipo" 
                value={filtroTipo} 
                onChange={(e) => setFiltroTipo(e.target.value)}
                className={styles.select}
              >
                <option value="todos">Todos</option>
                <option value="pago">Pagos</option>
                <option value="documento">Documentos</option>
                <option value="notificacion">Notificaciones</option>
              </select>
            </div>
          </div>
        </section>
        
        <section>
          <div className={styles.activityContainer}>
            {cargando ? (
              <div className={styles.loadingState}>
                <p>Cargando datos...</p>
              </div>
            ) : error ? (
              <div className={styles.errorState}>
                <p>Error al cargar los datos: {error}</p>
              </div>
            ) : datosFiltrados.length > 0 ? (
              <>
                <div className={styles.tableHeader}>
                  <div className={styles.tableCell}>Fecha</div>
                  <div className={styles.tableCell}>Tipo</div>
                  <div className={styles.tableCell}>Concepto</div>
                  <div className={styles.tableCell}>Monto</div>
                  <div className={styles.tableCell}>Estado</div>
                  <div className={styles.tableCell}>Comprobante</div>
                </div>
                
                {datosFiltrados.map(item => (
                  <div key={item.id} className={styles.tableRow}>
                    <div className={styles.tableCell} data-label="Fecha">{item.fecha}</div>
                    <div className={styles.tableCell} data-label="Tipo">
                      <div className={styles.activityIcon}>{getTipoIcon(item.tipo)}</div>
                      <span className={styles.tipoTexto}>
                        {item.tipo === 'pago' ? 'Pago' : 
                         item.tipo === 'documento' ? 'Documento' : 
                         item.tipo === 'notificacion' ? 'Notificación' : 'Otro'}
                      </span>
                    </div>
                    <div className={styles.tableCell} data-label="Concepto">{item.concepto}</div>
                    <div className={styles.tableCell} data-label="Monto">{formatMonto(item.monto)}</div>
                    <div className={styles.tableCell} data-label="Estado">
                      <span className={`${styles.estadoBadge} ${getEstadoClass(item.estado)}`}>
                        {item.estado}
                      </span>
                    </div>
                    <div className={styles.tableCell} data-label="Comprobante">
                      {item.comprobante ? (
                        <button 
                          className={styles.detailButton}
                          onClick={() => verComprobante(item)}
                        >
                          <span className={styles.btnIcon}>📄</span>
                          <span className={styles.btnText}>Ver Comprobante</span>
                        </button>
                      ) : '-'}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className={styles.emptyState}>
                <p className={styles.emptyStateText}>No se encontraron registros para los filtros seleccionados.</p>
              </div>
            )}
          </div>
        </section>
        
        <div className={styles.exportOptions}>
          <button 
            className={styles.exportButton}
            onClick={handleExportarPDF}
            disabled={cargando || datosFiltrados.length === 0}
          >
            <span className={styles.btnIcon}>📥</span>
            Exportar a PDF
          </button>
          <button 
            className={styles.exportButton}
            onClick={exportarExcel}
            disabled={cargando || datosFiltrados.length === 0}
          >
            <span className={styles.btnIcon}>📊</span>
            Exportar a Excel
          </button>
        </div>
        
        <footer className={styles.contentFooter}>
          <div className={styles.footerLogo}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.faviconSmall} /> SIGEPA
          </div>
          <p>Sistema de Gestión de Parcelas © {currentYear}</p>
        </footer>
      </div>

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
              <h3>Comprobante de {comprobanteSeleccionado.tipo === 'pago' ? 'Pago' : 
                  comprobanteSeleccionado.tipo === 'documento' ? 'Documento' : 'Notificación'}</h3>
            </div>
            <div className={styles.comprobanteBody}>
              <div className={styles.comprobanteTitulo}>
                <h1>COMPROBANTE {comprobanteSeleccionado.comprobante}</h1>
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
                  <span className={styles.comprobanteLabel}>Fecha:</span>
                  <span className={styles.comprobanteValue}>{formatFecha(comprobanteSeleccionado.fecha)}</span>
                </div>
                {comprobanteSeleccionado.monto && (
                  <div className={styles.comprobanteRow}>
                    <span className={styles.comprobanteLabel}>Monto:</span>
                    <span className={styles.comprobanteMonto}>{formatMonto(comprobanteSeleccionado.monto)}</span>
                  </div>
                )}
                <div className={styles.comprobanteRow}>
                  <span className={styles.comprobanteLabel}>Estado:</span>
                  <span className={styles.comprobanteValue}>{comprobanteSeleccionado.estado}</span>
                </div>
                <div className={styles.comprobanteRow}>
                  <span className={styles.comprobanteLabel}>Tipo:</span>
                  <span className={styles.comprobanteValue}>
                    {comprobanteSeleccionado.tipo === 'pago' ? 'Pago' : 
                     comprobanteSeleccionado.tipo === 'documento' ? 'Documento' : 'Notificación'}
                  </span>
                </div>
              </div>
              
              <div className={styles.comprobanteEstado}>
                <div className={styles.comprobanteEstadoCircle}>
                  <span className={styles.comprobanteEstadoIcon}>✓</span>
                </div>
                <h3>DOCUMENTO PROCESADO</h3>
              </div>
              
              <div className={styles.comprobanteSello}>
                <div className={styles.comprobanteSelloLeft}>
                  <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.comprobanteSelloLogo} />
                  <div className={styles.comprobanteSelloTimestamp}>
                    <span>Fecha emisión: {formatFecha(comprobanteSeleccionado.fecha)}</span>
                    <div className={styles.comprobanteSelloVerificacion}>
                      <span className={styles.comprobanteVerificacionIcon}>🔒</span>
                      <span>Verificado por SIGEPA</span>
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