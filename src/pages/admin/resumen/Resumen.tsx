import { useEffect, useState } from 'react';
import { Layout } from '../../../components/layout/Layout';
import styles from './Resumen.module.css';

interface EstadisticaResumen {
  totalParcelas: number;
  parcelasActivas: number;
  totalUsuarios: number;
  pagosPendientes: number;
  ingresosMensuales: number;
}

export const Resumen = () => {
  const [estadisticas, setEstadisticas] = useState<EstadisticaResumen>({
    totalParcelas: 0,
    parcelasActivas: 0,
    totalUsuarios: 0,
    pagosPendientes: 0,
    ingresosMensuales: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulación de carga de datos
    const cargarDatos = () => {
      // En un caso real, aquí se haría una llamada a la API
      setTimeout(() => {
        setEstadisticas({
          totalParcelas: 120,
          parcelasActivas: 98,
          totalUsuarios: 105,
          pagosPendientes: 15,
          ingresosMensuales: 4500000
        });
        setIsLoading(false);
      }, 1000);
    };

    cargarDatos();
  }, []);

  const formatearNumero = (numero: number) => {
    return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>Resumen General</h1>
        
        {isLoading ? (
          <div className={styles.loading}>Cargando estadísticas...</div>
        ) : (
          <div className={styles.estadisticasGrid}>
            <div className={styles.card}>
              <h3>Total de Parcelas</h3>
              <p className={styles.numero}>{formatearNumero(estadisticas.totalParcelas)}</p>
            </div>
            
            <div className={styles.card}>
              <h3>Parcelas Activas</h3>
              <p className={styles.numero}>{formatearNumero(estadisticas.parcelasActivas)}</p>
              <p className={styles.porcentaje}>
                {Math.round((estadisticas.parcelasActivas / estadisticas.totalParcelas) * 100)}%
              </p>
            </div>
            
            <div className={styles.card}>
              <h3>Total de Usuarios</h3>
              <p className={styles.numero}>{formatearNumero(estadisticas.totalUsuarios)}</p>
            </div>
            
            <div className={styles.card}>
              <h3>Pagos Pendientes</h3>
              <p className={styles.numero}>{formatearNumero(estadisticas.pagosPendientes)}</p>
            </div>
            
            <div className={styles.card}>
              <h3>Ingresos Mensuales</h3>
              <p className={styles.numero}>$ {formatearNumero(estadisticas.ingresosMensuales)}</p>
            </div>
          </div>
        )}
        
        <div className={styles.seccionAdicional}>
          <h2>Actividad Reciente</h2>
          <div className={styles.actividadList}>
            <div className={styles.actividadItem}>
              <p className={styles.actividadFecha}>15/06/2023</p>
              <p className={styles.actividadDescripcion}>Pago recibido de parcela #45</p>
            </div>
            <div className={styles.actividadItem}>
              <p className={styles.actividadFecha}>14/06/2023</p>
              <p className={styles.actividadDescripcion}>Nuevo usuario registrado</p>
            </div>
            <div className={styles.actividadItem}>
              <p className={styles.actividadFecha}>12/06/2023</p>
              <p className={styles.actividadDescripcion}>Actualización de contrato parcela #23</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};