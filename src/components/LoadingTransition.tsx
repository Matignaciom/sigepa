import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './LoadingTransition.module.css';

export const LoadingTransition = () => {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Cuando cambia la ubicación, mostrar la animación de carga
    setIsLoading(true);
    
    // Ocultar después de un tiempo (500-800ms es bueno para transiciones)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 700);
    
    return () => clearTimeout(timer);
  }, [location]);

  if (!isLoading) return null;

  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.loadingSpinner}>
        <div className={styles.spinnerInner}></div>
        <img src="/favicon.svg" alt="SIGEPA" className={styles.spinnerLogo} />
      </div>
    </div>
  );
}; 