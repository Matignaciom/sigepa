import { useState } from 'react';
import { Layout } from '../../../components/layout/Layout';
import styles from './Contratos.module.css';

interface Contrato {
  id: number;
  numeroParcela: string;
  propietario: string;
  fechaInicio: string;
  fechaFin: string;
  estado: 'Activo' | 'Pendiente' | 'Vencido';
}

export const Contratos = () => {
  const [contratos, setContratos] = useState<Contrato[]>([
    {
      id: 1,
      numeroParcela: 'P-001',
      propietario: 'Juan Pérez',
      fechaInicio: '01/01/2023',
      fechaFin: '31/12/2023',
      estado: 'Activo'
    },
    {
      id: 2,
      numeroParcela: 'P-002',
      propietario: 'María González',
      fechaInicio: '15/02/2023',
      fechaFin: '15/02/2024',
      estado: 'Activo'
    },
    {
      id: 3,
      numeroParcela: 'P-003',
      propietario: 'Carlos Rodríguez',
      fechaInicio: '10/03/2023',
      fechaFin: '10/03/2024',
      estado: 'Activo'
    },
    {
      id: 4,
      numeroParcela: 'P-004',
      propietario: 'Ana Martínez',
      fechaInicio: '05/04/2023',
      fechaFin: '05/04/2024',
      estado: 'Pendiente'
    },
    {
      id: 5,
      numeroParcela: 'P-005',
      propietario: 'Roberto Sánchez',
      fechaInicio: '20/12/2022',
      fechaFin: '20/12/2023',
      estado: 'Vencido'
    }
  ]);

  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const contratosFiltrados = filtroEstado === 'todos' 
    ? contratos 
    : contratos.filter(contrato => contrato.estado.toLowerCase() === filtroEstado);

  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case 'Activo':
        return styles.estadoActivo;
      case 'Pendiente':
        return styles.estadoPendiente;
      case 'Vencido':
        return styles.estadoVencido;
      default:
        return '';
    }
  };

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>Gestión de Contratos</h1>
        
        <div className={styles.filtros}>
          <div className={styles.filtroItem}>
            <label htmlFor="filtroEstado">Filtrar por estado:</label>
            <select 
              id="filtroEstado" 
              value={filtroEstado} 
              onChange={(e) => setFiltroEstado(e.target.value)}
              className={styles.select}
            >
              <option value="todos">Todos</option>
              <option value="activo">Activos</option>
              <option value="pendiente">Pendientes</option>
              <option value="vencido">Vencidos</option>
            </select>
          </div>
          
          <button className={styles.btnNuevo}>Nuevo Contrato</button>
        </div>
        
        <div className={styles.tablaContainer}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Parcela</th>
                <th>Propietario</th>
                <th>Fecha Inicio</th>
                <th>Fecha Fin</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {contratosFiltrados.map((contrato) => (
                <tr key={contrato.id}>
                  <td>{contrato.id}</td>
                  <td>{contrato.numeroParcela}</td>
                  <td>{contrato.propietario}</td>
                  <td>{contrato.fechaInicio}</td>
                  <td>{contrato.fechaFin}</td>
                  <td>
                    <span className={`${styles.estado} ${getEstadoClass(contrato.estado)}`}>
                      {contrato.estado}
                    </span>
                  </td>
                  <td>
                    <div className={styles.acciones}>
                      <button className={styles.btnVer}>Ver</button>
                      <button className={styles.btnEditar}>Editar</button>
                      <button className={styles.btnRenovar}>Renovar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {contratosFiltrados.length === 0 && (
          <div className={styles.noResultados}>No se encontraron contratos con los filtros seleccionados.</div>
        )}
      </div>
    </Layout>
  );
};