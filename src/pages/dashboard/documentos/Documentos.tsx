import { useState } from 'react';
import { Layout } from '../../../components/layout/Layout';
import styles from './Documentos.module.css';

export const Historial = () => {
  const [filtroAnio, setFiltroAnio] = useState('2023');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  
  // Datos de ejemplo para el historial
  const historialData = [
    {
      id: 1,
      fecha: '10/05/2023',
      tipo: 'pago',
      concepto: 'Pago Mensual Mayo 2023',
      monto: 150000,
      estado: 'Completado',
      comprobante: 'COMP-2023-05-001'
    },
    {
      id: 2,
      fecha: '10/04/2023',
      tipo: 'pago',
      concepto: 'Pago Mensual Abril 2023',
      monto: 150000,
      estado: 'Completado',
      comprobante: 'COMP-2023-04-001'
    },
    {
      id: 3,
      fecha: '15/03/2023',
      tipo: 'documento',
      concepto: 'Actualización de Contrato',
      monto: null,
      estado: 'Procesado',
      comprobante: 'DOC-2023-03-001'
    },
    {
      id: 4,
      fecha: '10/03/2023',
      tipo: 'pago',
      concepto: 'Pago Mensual Marzo 2023',
      monto: 150000,
      estado: 'Completado',
      comprobante: 'COMP-2023-03-001'
    },
    {
      id: 5,
      fecha: '20/02/2023',
      tipo: 'notificacion',
      concepto: 'Recordatorio de Pago',
      monto: null,
      estado: 'Leído',
      comprobante: null
    },
    {
      id: 6,
      fecha: '10/02/2023',
      tipo: 'pago',
      concepto: 'Pago Mensual Febrero 2023',
      monto: 150000,
      estado: 'Completado',
      comprobante: 'COMP-2023-02-001'
    },
  ];
  
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
        return styles.estadoCompletado;
      case 'procesado':
        return styles.estadoProcesado;
      case 'leído':
        return styles.estadoLeido;
      case 'pendiente':
        return styles.estadoPendiente;
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
  
  return (
    <Layout>
      <div className={styles.historialContainer}>
        <h1 className={styles.title}>Historial de Actividades</h1>
        <p className={styles.subtitle}>Revise todas sus actividades y transacciones</p>
        
        <div className={styles.filtrosContainer}>
          <div className={styles.filtro}>
            <label htmlFor="filtroAnio">Año:</label>
            <select 
              id="filtroAnio" 
              value={filtroAnio} 
              onChange={(e) => setFiltroAnio(e.target.value)}
              className={styles.select}
            >
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
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
        
        <div className={styles.historialCard}>
          {datosFiltrados.length > 0 ? (
            <div className={styles.historialTable}>
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
                  <div className={styles.tableCell}>{item.fecha}</div>
                  <div className={styles.tableCell}>
                    <span className={styles.tipoIcon}>{getTipoIcon(item.tipo)}</span>
                    <span className={styles.tipoText}>
                      {item.tipo === 'pago' ? 'Pago' : 
                       item.tipo === 'documento' ? 'Documento' : 
                       item.tipo === 'notificacion' ? 'Notificación' : 'Otro'}
                    </span>
                  </div>
                  <div className={styles.tableCell}>{item.concepto}</div>
                  <div className={styles.tableCell}>{formatMonto(item.monto)}</div>
                  <div className={styles.tableCell}>
                    <span className={`${styles.estadoBadge} ${getEstadoClass(item.estado)}`}>
                      {item.estado}
                    </span>
                  </div>
                  <div className={styles.tableCell}>
                    {item.comprobante ? (
                      <button className={styles.comprobanteButton}>
                        Ver Comprobante
                      </button>
                    ) : '-'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>No se encontraron registros para los filtros seleccionados.</p>
            </div>
          )}
        </div>
        
        <div className={styles.exportOptions}>
          <button className={styles.exportButton}>Exportar a PDF</button>
          <button className={styles.exportButton}>Exportar a Excel</button>
        </div>
      </div>
    </Layout>
  );
};