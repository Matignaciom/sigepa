import styles from './Footer.module.css';

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p className={styles.copyright}>
          &copy; {currentYear} SIGEPA - Sistema de Gestión de Pagos. Todos los derechos reservados.
        </p>
        <div className={styles.links}>
          <a href="#" className={styles.link}>Términos y Condiciones</a>
          <a href="#" className={styles.link}>Política de Privacidad</a>
          <a href="#" className={styles.link}>Contacto</a>
        </div>
      </div>
    </footer>
  );
};