import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/api';
import styles from './Admin.module.css';

interface ResumenData {
  totalUsuarios: number;
  totalParcelas: number;
  parcelasActivas: number;
  pagosPendientes: number;
  alertasActivas: number;
}

export const Admin = () => {
  const [resumenData, setResumenData] = useState<ResumenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // En un entorno real, esto sería una llamada a la API
        // const response = await adminService.getDashboardSummary();
        
        // Datos simulados para desarrollo
        setTimeout(() => {
          setResumenData({
            totalUsuarios: 45,
            totalParcelas: 60,
            parcelasActivas: 52,
            pagosPendientes: 18,
            alertasActivas: 7
          });
          setIsLoading(false);
        }, 800);
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
        setError('No se pudieron cargar los datos del panel. Por favor, intente nuevamente.');
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Tarjetas de acceso rápido para el panel de administrador
  const quickAccessCards = [
    {
      title: 'Mapa Geoespacial',
      description: 'Visualiza la distribución de parcelas y su estado actual',
      icon: '🗺️',
      link: '/admin/mapa',
      color: 'var(--primary-color)'
    },
    {
      title: 'Gestión de Usuarios',
      description: 'Administra copropietarios y sus permisos',
      icon: '👥',
      link: '/admin/usuarios',
      color: 'var(--secondary-color)'
    },
    {
      title: 'Contratos',
      description: 'Revisa y gestiona contratos de parcelas',
      icon: '📄',
      link: '/admin/contratos',
      color: 'var(--info-color)'
    },
    {
      title: 'Alertas',
      description: 'Revisa notificaciones y alertas pendientes',
      icon: '🔔',
      link: '/admin/alertas',
      color: 'var(--warning-color)'
    },
  ];

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando información del panel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Panel de Administración</h1>
      
      {/* Resumen de estadísticas */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <h3>Usuarios</h3>
          <p className={styles.statNumber}>{resumenData?.totalUsuarios}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Parcelas</h3>
          <p className={styles.statNumber}>{resumenData?.totalParcelas}</p>
          <p className={styles.statDetail}>
            {resumenData?.parcelasActivas} activas
          </p>
        </div>
        <div className={styles.statCard}>
          <h3>Pagos Pendientes</h3>
          <p className={styles.statNumber}>{resumenData?.pagosPendientes}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Alertas</h3>
          <p className={`${styles.statNumber} ${resumenData?.alertasActivas > 0 ? styles.alertHighlight : ''}`}>
            {resumenData?.alertasActivas}
          </p>
        </div>
      </div>

      {/* Tarjetas de acceso rápido */}
      <h2 className={styles.sectionTitle}>Acceso Rápido</h2>
      <div className={styles.quickAccessGrid}>
        {quickAccessCards.map((card, index) => (
          <Link to={card.link} key={index} className={styles.quickAccessCard} style={{ borderTopColor: card.color }}>
            <div className={styles.cardIcon} style={{ backgroundColor: card.color }}>
              {card.icon}
            </div>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </Link>
        ))}
      </div>

      {/* Actividad reciente */}
      <h2 className={styles.sectionTitle}>Actividad Reciente</h2>
      <div className={styles.activityContainer}>
        <div className={styles.activityItem}>
          <div className={styles.activityIcon}>📝</div>
          <div className={styles.activityContent}>
            <p className={styles.activityText}><strong>Juan Pérez</strong> actualizó su información de perfil</p>
            <p className={styles.activityTime}>Hace 2 horas</p>
          </div>
        </div>
        <div className={styles.activityItem}>
          <div className={styles.activityIcon}>💰</div>
          <div className={styles.activityContent}>
            <p className={styles.activityText}><strong>María González</strong> realizó un pago de cuota mensual</p>
            <p className={styles.activityTime}>Hace 5 horas</p>
          </div>
        </div>
        <div className={styles.activityItem}>
          <div className={styles.activityIcon}>🔔</div>
          <div className={styles.activityContent}>
            <p className={styles.activityText}><strong>Sistema</strong> generó alerta por pago vencido para la parcela #23</p>
            <p className={styles.activityTime}>Hace 1 día</p>
          </div>
        </div>
        <div className={styles.activityItem}>
          <div className={styles.activityIcon}>👤</div>
          <div className={styles.activityContent}>
            <p className={styles.activityText}><strong>Admin</strong> registró un nuevo copropietario</p>
            <p className={styles.activityTime}>Hace 2 días</p>
          </div>
        </div>
      </div>

      {/* Botón para crear notificación */}
      <div className={styles.actionContainer}>
        <Link to="/admin/notificaciones/crear" className={styles.createNotificationButton}>
          Crear Nueva Notificación
        </Link>
      </div>
    </div>
  );
};