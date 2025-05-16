import { useState } from 'react';
import { Layout } from '../../../components/layout/Layout';
import styles from './Estadisticas.module.css';

export const Estadisticas = () => {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('anual');
  
  // Datos de ejemplo para las estadísticas
  const datosEstadisticas = {
    pagosRealizados: 12,
    montoTotal: 1800000,
    pagosPuntuales: 11,
    pagosAtrasados: 1,
    porcentajePuntualidad: 91.67,
    saldoPendiente: 0,
    proximoPago: '15/06/2023',
    montoProximoPago: 150000
  };
  
  // Datos para el gráfico de pagos mensuales (simulados)
  const datosPagosMensuales = [
    { mes: 'Ene', monto: 150000, puntual: true },
    { mes: 'Feb', monto: 150000, puntual: true },
    { mes: 'Mar', monto: 150000, puntual: true },
    { mes: 'Abr', monto: 150000, puntual: true },
    { mes: 'May', monto: 150000, puntual: true },
    { mes: 'Jun', monto: 150000, puntual: false },
    { mes: 'Jul', monto: 150000, puntual: true },
    { mes: 'Ago', monto: 150000, puntual: true },
    { mes: 'Sep', monto: 150000, puntual: true },
    { mes: 'Oct', monto: 150000, puntual: true },
    { mes: 'Nov', monto: 150000, puntual: true },
    { mes: 'Dic', monto: 150000, puntual: true },
  ];
  
  // Función para formatear montos en pesos chilenos
  const formatMonto = (monto) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(monto);
  };
  
  // Función para cambiar el periodo de visualización
  const cambiarPeriodo = (periodo) => {
    setPeriodoSeleccionado(periodo);
  };
  
  return (
    <Layout>
      <div className={styles.estadisticasContainer}>
        <h1 className={styles.title}>Estadísticas de Pagos</h1>
        <p className={styles.subtitle}>Visualice el historial y comportamiento de sus pagos</p>
        
        <div className={styles.periodSelector}>
          <button 
            className={`${styles.periodButton} ${periodoSeleccionado === 'mensual' ? styles.activePeriod : ''}`}
            onClick={() => cambiarPeriodo('mensual')}
          >
            Mensual
          </button>
          <button 
            className={`${styles.periodButton} ${periodoSeleccionado === 'trimestral' ? styles.activePeriod : ''}`}
            onClick={() => cambiarPeriodo('trimestral')}
          >
            Trimestral
          </button>
          <button 
            className={`${styles.periodButton} ${periodoSeleccionado === 'anual' ? styles.activePeriod : ''}`}
            onClick={() => cambiarPeriodo('anual')}
          >
            Anual
          </button>
        </div>
        
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Pagos Realizados</h3>
            <p className={styles.statValue}>{datosEstadisticas.pagosRealizados}</p>
          </div>
          
          <div className={styles.statCard}>
            <h3>Monto Total Pagado</h3>
            <p className={styles.statValue}>{formatMonto(datosEstadisticas.montoTotal)}</p>
          </div>
          
          <div className={styles.statCard}>
            <h3>Pagos Puntuales</h3>
            <p className={styles.statValue}>{datosEstadisticas.pagosPuntuales}</p>
          </div>
          
          <div className={styles.statCard}>
            <h3>Pagos Atrasados</h3>
            <p className={styles.statValue}>{datosEstadisticas.pagosAtrasados}</p>
          </div>
          
          <div className={styles.statCard}>
            <h3>Puntualidad</h3>
            <p className={styles.statValue}>{datosEstadisticas.porcentajePuntualidad}%</p>
          </div>
          
          <div className={styles.statCard}>
            <h3>Saldo Pendiente</h3>
            <p className={styles.statValue}>{formatMonto(datosEstadisticas.saldoPendiente)}</p>
          </div>
        </div>
        
        <div className={styles.chartSection}>
          <h2 className={styles.sectionTitle}>Historial de Pagos Mensuales</h2>
          
          <div className={styles.barChart}>
            {datosPagosMensuales.map((item, index) => (
              <div key={index} className={styles.barContainer}>
                <div 
                  className={`${styles.bar} ${item.puntual ? styles.barPuntual : styles.barAtrasado}`}
                  style={{ height: `${(item.monto / 150000) * 100}%` }}
                >
                  <span className={styles.barAmount}>{formatMonto(item.monto)}</span>
                </div>
                <div className={styles.barLabel}>{item.mes}</div>
              </div>
            ))}
          </div>
          
          <div className={styles.chartLegend}>
            <div className={styles.legendItem}>
              <span className={`${styles.legendColor} ${styles.colorPuntual}`}></span>
              <span>Pago Puntual</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendColor} ${styles.colorAtrasado}`}></span>
              <span>Pago Atrasado</span>
            </div>
          </div>
        </div>
        
        <div className={styles.proximoPagoSection}>
          <h2 className={styles.sectionTitle}>Próximo Pago</h2>
          
          <div className={styles.proximoPagoCard}>
            <div className={styles.proximoPagoInfo}>
              <div className={styles.proximoPagoItem}>
                <span className={styles.proximoPagoLabel}>Fecha:</span>
                <span className={styles.proximoPagoValue}>{datosEstadisticas.proximoPago}</span>
              </div>
              <div className={styles.proximoPagoItem}>
                <span className={styles.proximoPagoLabel}>Monto:</span>
                <span className={styles.proximoPagoValue}>{formatMonto(datosEstadisticas.montoProximoPago)}</span>
              </div>
            </div>
            
            <button className={styles.pagarButton}>Realizar Pago</button>
          </div>
        </div>
      </div>
    </Layout>
  );
};