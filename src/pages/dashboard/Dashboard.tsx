import { Layout } from '../../components/layout/Layout';
import styles from './Dashboard.module.css';

export const Dashboard = () => {
  return (
    <Layout>
      <div className={styles.dashboard}>
        <h1 className={styles.title}>Panel de Control</h1>
        <p className={styles.subtitle}>Bienvenido al Sistema de Gestión de Pagos</p>
        
        <div className={styles.statsContainer}>
          <div className={styles.statCard}>
            <h3>Estado de Cuenta</h3>
            <p className={styles.statValue}>Al día</p>
          </div>
          
          <div className={styles.statCard}>
            <h3>Próximo Pago</h3>
            <p className={styles.statValue}>15/06/2023</p>
          </div>
          
          <div className={styles.statCard}>
            <h3>Monto</h3>
            <p className={styles.statValue}>$150.000</p>
          </div>
        </div>
        
        <div className={styles.recentActivity}>
          <h2>Actividad Reciente</h2>
          <div className={styles.activityList}>
            <div className={styles.activityItem}>
              <div className={styles.activityDate}>10/05/2023</div>
              <div className={styles.activityContent}>
                <h4>Pago Mensual</h4>
                <p>Pago realizado correctamente</p>
              </div>
              <div className={styles.activityAmount}>$150.000</div>
            </div>
            
            <div className={styles.activityItem}>
              <div className={styles.activityDate}>10/04/2023</div>
              <div className={styles.activityContent}>
                <h4>Pago Mensual</h4>
                <p>Pago realizado correctamente</p>
              </div>
              <div className={styles.activityAmount}>$150.000</div>
            </div>
            
            <div className={styles.activityItem}>
              <div className={styles.activityDate}>10/03/2023</div>
              <div className={styles.activityContent}>
                <h4>Pago Mensual</h4>
                <p>Pago realizado correctamente</p>
              </div>
              <div className={styles.activityAmount}>$150.000</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};