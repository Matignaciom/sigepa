import { Layout } from '../../../components/layout/Layout';
import styles from './Parcelas.module.css';

export const Parcela = () => {
  // Datos de ejemplo para la parcela
  const parcelaData = {
    numero: 'A-123',
    superficie: '5.000 m²',
    ubicacion: 'Sector Norte, Lote 45',
    fechaAdquisicion: '15/03/2020',
    valorTasacion: '$75.000.000',
    estadoContrato: 'Activo',
    proximoPago: '15/06/2023',
    montoMensual: '$150.000',
  };

  return (
    <Layout>
      <div className={styles.parcelaContainer}>
        <h1 className={styles.title}>Mi Parcela</h1>
        <p className={styles.subtitle}>Información detallada de su propiedad</p>
        
        <div className={styles.parcelaCard}>
          <div className={styles.parcelaHeader}>
            <h2>Parcela {parcelaData.numero}</h2>
            <span className={styles.statusBadge}>Estado: {parcelaData.estadoContrato}</span>
          </div>
          
          <div className={styles.parcelaBody}>
            <div className={styles.parcelaInfo}>
              <div className={styles.infoGroup}>
                <h3>Detalles de la Propiedad</h3>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Número de Parcela:</span>
                  <span className={styles.infoValue}>{parcelaData.numero}</span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Superficie:</span>
                  <span className={styles.infoValue}>{parcelaData.superficie}</span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Ubicación:</span>
                  <span className={styles.infoValue}>{parcelaData.ubicacion}</span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Fecha de Adquisición:</span>
                  <span className={styles.infoValue}>{parcelaData.fechaAdquisicion}</span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Valor de Tasación:</span>
                  <span className={styles.infoValue}>{parcelaData.valorTasacion}</span>
                </div>
              </div>
              
              <div className={styles.infoGroup}>
                <h3>Información de Contrato</h3>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Estado del Contrato:</span>
                  <span className={styles.infoValue}>{parcelaData.estadoContrato}</span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Próximo Pago:</span>
                  <span className={styles.infoValue}>{parcelaData.proximoPago}</span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Monto Mensual:</span>
                  <span className={styles.infoValue}>{parcelaData.montoMensual}</span>
                </div>
              </div>
            </div>
            
            <div className={styles.parcelaMap}>
              <div className={styles.mapPlaceholder}>
                <p>Mapa de la Parcela</p>
                <p className={styles.mapNote}>El mapa interactivo estará disponible próximamente</p>
              </div>
            </div>
          </div>
          
          <div className={styles.parcelaActions}>
            <button className={styles.actionButton}>Ver Documentos</button>
            <button className={styles.actionButton}>Descargar Contrato</button>
            <button className={`${styles.actionButton} ${styles.primaryButton}`}>Realizar Pago</button>
          </div>
        </div>
      </div>
    </Layout>
  );
};