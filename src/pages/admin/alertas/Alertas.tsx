import { useState } from 'react';
import { Layout } from '../../../components/layout/Layout';
import styles from './Alertas.module.css';

interface Alerta {
  id: number;
  tipo: 'Pago' | 'Contrato' | 'Sistema';
  mensaje: string;
  fechaCreacion: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  estado: 'Pendiente' | 'Resuelta';
}

export const Alertas = () => {
  const [alertas, setAlertas] = useState<Alerta[]>([
    {
      id: 1,
      tipo: 'Pago',
      mensaje: 'Pago vencido de la parcela P-003',
      fechaCreacion: '15/06/2023',
      prioridad: 'Alta',
      estado: 'Pendiente'
    },
    {
      id: 2,
      tipo: 'Contrato',
      mensaje: 'Contrato próximo a vencer de la parcela P-005',
      fechaCreacion: '14/06/2023',
      prioridad: 'Media',
      estado: 'Pendiente'
    },
    {
      id: 3,
      tipo: 'Sistema',
      mensaje: 'Actualización del sistema programada para el 20/06/2023',
      fechaCreacion: '10/06/2023',
      prioridad: 'Baja',
      estado: 'Pendiente'
    },
    {
      id: 4,
      tipo: 'Pago',
      mensaje: 'Pago vencido de la parcela P-012',
      fechaCreacion: '05/06/2023',
      prioridad: 'Alta',
      estado: 'Resuelta'
    },
    {
      id: 5,
      tipo: 'Contrato',
      mensaje: 'Contrato vencido de la parcela P-008',
      fechaCreacion: '01/06/2023',
      prioridad: 'Alta',
      estado: 'Resuelta'
    }
  ]);

  const [filtros, setFiltros] = useState({
    tipo: 'todos',
    prioridad: 'todos',
    estado: 'todos'
  });

  const alertasFiltradas = alertas.filter(alerta => {
    return (
      (filtros.tipo === 'todos' || alerta.tipo === filtros.tipo) &&
      (filtros.prioridad === 'todos' || alerta.prioridad === filtros.prioridad) &&
      (filtros.estado === 'todos' || alerta.estado === filtros.estado)
    );
  });

  const handleFiltroChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const marcarComoResuelta = (id: number) => {
    setAlertas(prev => 
      prev.map(alerta => 
        alerta.id === id ? { ...alerta, estado: 'Resuelta' } : alerta
      )
    );
  };

  const getPrioridadClass = (prioridad: string) => {
    switch (prioridad) {
      case 'Alta':
        return styles.prioridadAlta;
      case 'Media':
        return styles.prioridadMedia;
      case 'Baja':
        return styles.prioridadBaja;
      default:
        return '';
    }
  };

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>Alertas del Sistema</h1>
        
        <div className={styles.filtros}>
          <div className={styles.filtroItem}>
            <label htmlFor="tipo">Tipo:</label>
            <select 
              id="tipo" 
              name="tipo"
              value={filtros.tipo} 
              onChange={handleFiltroChange}
              className={styles.select}
            >
              <option value="todos">Todos</option>
              <option value="Pago">Pago</option>
              <option value="Contrato">Contrato</option>
              <option value="Sistema">Sistema</option>
            </select>
          </div>
          
          <div className={styles.filtroItem}>
            <label htmlFor="prioridad">Prioridad:</label>
            <select 
              id="prioridad" 
              name="prioridad"
              value={filtros.prioridad} 
              onChange={handleFiltroChange}
              className={styles.select}
            >
              <option value="todos">Todas</option>
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>
          </div>
          
          <div className={styles.filtroItem}>
            <label htmlFor="estado">Estado:</label>
            <select 
              id="estado" 
              name="estado"
              value={filtros.estado} 
              onChange={handleFiltroChange}
              className={styles.select}
            >
              <option value="todos">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Resuelta">Resuelta</option>
            </select>
          </div>
          
          <button className={styles.btnCrear}>Crear Alerta</button>
        </div>
        
        <div className={styles.alertasContainer}>
          {alertasFiltradas.length > 0 ? (
            alertasFiltradas.map(alerta => (
              <div key={alerta.id} className={`${styles.alertaCard} ${alerta.estado === 'Resuelta' ? styles.resuelta : ''}`}>
                <div className={styles.alertaHeader}>
                  <span className={`${styles.tipo} ${styles[`tipo${alerta.tipo}`]}`}>{alerta.tipo}</span>
                  <span className={`${styles.prioridad} ${getPrioridadClass(alerta.prioridad)}`}>{alerta.prioridad}</span>
                </div>
                
                <div className={styles.alertaBody}>
                  <p className={styles.mensaje}>{alerta.mensaje}</p>
                  <p className={styles.fecha}>Fecha: {alerta.fechaCreacion}</p>
                </div>
                
                <div className={styles.alertaFooter}>
                  <span className={styles.estado}>{alerta.estado}</span>
                  {alerta.estado === 'Pendiente' && (
                    <button 
                      className={styles.btnResolver}
                      onClick={() => marcarComoResuelta(alerta.id)}
                    >
                      Marcar como resuelta
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noResultados}>No se encontraron alertas con los filtros seleccionados.</div>
          )}
        </div>
      </div>
    </Layout>
  );
};