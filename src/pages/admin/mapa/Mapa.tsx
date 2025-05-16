import { useState, useEffect } from 'react';
import { adminService } from '../../../services/api';
import styles from './Mapa.module.css';

interface Parcela {
  id: number;
  numero: string;
  superficie: number;
  estado: 'asignada' | 'disponible';
  propietario: string | null;
}

export const Mapa = () => {
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [parcelaSeleccionada, setParcelaSeleccionada] = useState<Parcela | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarParcelas = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // En un entorno real, esto sería una llamada a la API
        // const response = await adminService.getParcelas();
        
        // Datos simulados para desarrollo
        setTimeout(() => {
          const parcelasData = [
            { id: 1, numero: 'P001', superficie: 1000, estado: 'asignada', propietario: 'Usuario Prueba' },
            { id: 2, numero: 'P002', superficie: 1200, estado: 'asignada', propietario: 'María González' },
            { id: 3, numero: 'P003', superficie: 800, estado: 'disponible', propietario: null },
            { id: 4, numero: 'P004', superficie: 1500, estado: 'disponible', propietario: null },
            { id: 5, numero: 'P005', superficie: 950, estado: 'asignada', propietario: 'Carlos Rodríguez' },
            { id: 6, numero: 'P006', superficie: 1100, estado: 'asignada', propietario: 'Ana Martínez' },
            { id: 7, numero: 'P007', superficie: 750, estado: 'disponible', propietario: null },
            { id: 8, numero: 'P008', superficie: 1300, estado: 'asignada', propietario: 'Pedro Sánchez' },
          ];
          setParcelas(parcelasData);
          setIsLoading(false);
        }, 800);
      } catch (err) {
        console.error('Error al cargar parcelas:', err);
        setError('No se pudieron cargar los datos de las parcelas. Por favor, intente nuevamente.');
        setIsLoading(false);
      }
    };

    cargarParcelas();
  }, []);

  const handleParcelaClick = (parcela: Parcela) => {
    setParcelaSeleccionada(parcela);
  };

  const closeParcelaDetail = () => {
    setParcelaSeleccionada(null);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando mapa de parcelas...</p>
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
      <h1 className={styles.title}>Mapa Geoespacial de Parcelas</h1>
      
      <div className={styles.mapControls}>
        <div className={styles.filterContainer}>
          <label htmlFor="estado-filter">Filtrar por estado:</label>
          <select id="estado-filter" className={styles.filterSelect}>
            <option value="todos">Todos</option>
            <option value="asignada">Asignadas</option>
            <option value="disponible">Disponibles</option>
          </select>
        </div>
        
        <div className={styles.searchContainer}>
          <input 
            type="text" 
            placeholder="Buscar parcela..." 
            className={styles.searchInput} 
          />
          <button className={styles.searchButton}>Buscar</button>
        </div>
      </div>

      <div className={styles.mapContainer}>
        <div className={styles.mapLegend}>
          <div className={styles.legendItem}>
            <div className={`${styles.legendColor} ${styles.colorAsignada}`}></div>
            <span>Asignada</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendColor} ${styles.colorDisponible}`}></div>
            <span>Disponible</span>
          </div>
        </div>
        
        <div className={styles.map}>
          {/* Representación visual del mapa de parcelas */}
          <div className={styles.parcelasGrid}>
            {parcelas.map((parcela) => (
              <div 
                key={parcela.id}
                className={`${styles.parcelaItem} ${styles[`color${parcela.estado.charAt(0).toUpperCase() + parcela.estado.slice(1)}`]}`}
                onClick={() => handleParcelaClick(parcela)}
              >
                <span className={styles.parcelaNumero}>{parcela.numero}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detalles de la parcela seleccionada */}
      {parcelaSeleccionada && (
        <div className={styles.parcelaDetailOverlay}>
          <div className={styles.parcelaDetail}>
            <button className={styles.closeButton} onClick={closeParcelaDetail}>
              ×
            </button>
            <h2>Parcela {parcelaSeleccionada.numero}</h2>
            <div className={styles.detailContent}>
              <p><strong>Superficie:</strong> {parcelaSeleccionada.superficie} m²</p>
              <p><strong>Estado:</strong> {parcelaSeleccionada.estado.charAt(0).toUpperCase() + parcelaSeleccionada.estado.slice(1)}</p>
              <p><strong>Propietario:</strong> {parcelaSeleccionada.propietario || 'No asignado'}</p>
              
              <div className={styles.detailActions}>
                <button className={styles.actionButton}>Ver Contrato</button>
                <button className={styles.actionButton}>Editar Parcela</button>
                {parcelaSeleccionada.estado === 'disponible' && (
                  <button className={`${styles.actionButton} ${styles.assignButton}`}>Asignar Propietario</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};