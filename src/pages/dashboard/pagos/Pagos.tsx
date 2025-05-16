import { useState } from 'react';
import { Layout } from '../../../components/layout/Layout';
import styles from './Pagos.module.css';

export const Pagos = () => {
  const [activeTab, setActiveTab] = useState('pendientes');
  
  // Datos de ejemplo para pagos pendientes
  const pagosPendientes = [
    {
      id: 1,
      concepto: 'Cuota Mensual Junio 2023',
      fechaVencimiento: '15/06/2023',
      monto: 150000,
      estado: 'Pendiente'
    },
    {
      id: 2,
      concepto: 'Cuota Mensual Julio 2023',
      fechaVencimiento: '15/07/2023',
      monto: 150000,
      estado: 'Próximo'
    }
  ];
  
  // Datos de ejemplo para pagos realizados
  const pagosRealizados = [
    {
      id: 101,
      concepto: 'Cuota Mensual Mayo 2023',
      fechaPago: '10/05/2023',
      monto: 150000,
      comprobante: 'COMP-2023-05-001'
    },
    {
      id: 102,
      concepto: 'Cuota Mensual Abril 2023',
      fechaPago: '10/04/2023',
      monto: 150000,
      comprobante: 'COMP-2023-04-001'
    },
    {
      id: 103,
      concepto: 'Cuota Mensual Marzo 2023',
      fechaPago: '10/03/2023',
      monto: 150000,
      comprobante: 'COMP-2023-03-001'
    }
  ];
  
  // Función para formatear montos en pesos chilenos
  const formatMonto = (monto) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(monto);
  };
  
  return (
    <Layout>
      <div className={styles.pagosContainer}>
        <h1 className={styles.title}>Gestión de Pagos</h1>
        <p className={styles.subtitle}>Administre sus pagos pendientes y revise su historial</p>
        
        <div className={styles.tabsContainer}>
          <div className={styles.tabs}>
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
          
          <div className={styles.tabContent}>
            {activeTab === 'pendientes' && (
              <div className={styles.pendientesTab}>
                {pagosPendientes.length > 0 ? (
                  <div className={styles.pagosTable}>
                    <div className={styles.tableHeader}>
                      <div className={styles.tableCell}>Concepto</div>
                      <div className={styles.tableCell}>Fecha Vencimiento</div>
                      <div className={styles.tableCell}>Monto</div>
                      <div className={styles.tableCell}>Estado</div>
                      <div className={styles.tableCell}>Acciones</div>
                    </div>
                    
                    {pagosPendientes.map(pago => (
                      <div key={pago.id} className={styles.tableRow}>
                        <div className={styles.tableCell}>{pago.concepto}</div>
                        <div className={styles.tableCell}>{pago.fechaVencimiento}</div>
                        <div className={styles.tableCell}>{formatMonto(pago.monto)}</div>
                        <div className={styles.tableCell}>
                          <span className={`${styles.statusBadge} ${styles[pago.estado.toLowerCase()]}`}>
                            {pago.estado}
                          </span>
                        </div>
                        <div className={styles.tableCell}>
                          <button className={styles.payButton}>Pagar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p>No tiene pagos pendientes actualmente.</p>
                  </div>
                )}
                
                <div className={styles.resumenPago}>
                  <h3>Resumen de Pagos</h3>
                  <div className={styles.resumenItem}>
                    <span>Total Pendiente:</span>
                    <span className={styles.resumenMonto}>
                      {formatMonto(pagosPendientes.reduce((total, pago) => total + pago.monto, 0))}
                    </span>
                  </div>
                  <div className={styles.resumenItem}>
                    <span>Próximo Vencimiento:</span>
                    <span>{pagosPendientes.length > 0 ? pagosPendientes[0].fechaVencimiento : 'N/A'}</span>
                  </div>
                  <button className={styles.pagarTodoButton}>Pagar Todo</button>
                </div>
              </div>
            )}
            
            {activeTab === 'realizados' && (
              <div className={styles.realizadosTab}>
                {pagosRealizados.length > 0 ? (
                  <div className={styles.pagosTable}>
                    <div className={styles.tableHeader}>
                      <div className={styles.tableCell}>Concepto</div>
                      <div className={styles.tableCell}>Fecha Pago</div>
                      <div className={styles.tableCell}>Monto</div>
                      <div className={styles.tableCell}>Comprobante</div>
                      <div className={styles.tableCell}>Acciones</div>
                    </div>
                    
                    {pagosRealizados.map(pago => (
                      <div key={pago.id} className={styles.tableRow}>
                        <div className={styles.tableCell}>{pago.concepto}</div>
                        <div className={styles.tableCell}>{pago.fechaPago}</div>
                        <div className={styles.tableCell}>{formatMonto(pago.monto)}</div>
                        <div className={styles.tableCell}>{pago.comprobante}</div>
                        <div className={styles.tableCell}>
                          <button className={styles.detailButton}>Ver Detalle</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p>No tiene pagos realizados para mostrar.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};