import { useState, useEffect } from 'react';
import { adminService } from '../../../services/api';
import styles from './Usuarios.module.css';

interface Usuario {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  role: 'admin' | 'copropietario';
  telefono?: string;
  direccion?: string;
  estado?: 'activo' | 'inactivo' | 'suspendido';
  parcelaId?: string;
}

export const Usuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'crear' | 'editar'>('crear');

  useEffect(() => {
    const cargarUsuarios = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // En un entorno real, esto sería una llamada a la API
        // const response = await adminService.getUsers();
        
        // Datos simulados para desarrollo
        setTimeout(() => {
          const usuariosData = [
            { id: 1, email: 'admin@sigepa.com', nombre: 'Administrador', apellido: 'Sistema', role: 'admin', estado: 'activo' },
            { id: 2, email: 'user@sigepa.com', nombre: 'Usuario', apellido: 'Prueba', role: 'copropietario', telefono: '987654321', direccion: 'Calle Principal 123', estado: 'activo', parcelaId: 'P001' },
            { id: 3, email: 'maria@ejemplo.com', nombre: 'María', apellido: 'González', role: 'copropietario', telefono: '123456789', direccion: 'Avenida Central 456', estado: 'activo', parcelaId: 'P002' },
            { id: 4, email: 'carlos@ejemplo.com', nombre: 'Carlos', apellido: 'Rodríguez', role: 'copropietario', telefono: '456789123', direccion: 'Calle Norte 789', estado: 'activo', parcelaId: 'P005' },
            { id: 5, email: 'ana@ejemplo.com', nombre: 'Ana', apellido: 'Martínez', role: 'copropietario', telefono: '789123456', direccion: 'Avenida Sur 321', estado: 'activo', parcelaId: 'P006' },
            { id: 6, email: 'pedro@ejemplo.com', nombre: 'Pedro', apellido: 'Sánchez', role: 'copropietario', telefono: '321654987', direccion: 'Calle Este 654', estado: 'activo', parcelaId: 'P008' },
            { id: 7, email: 'laura@ejemplo.com', nombre: 'Laura', apellido: 'López', role: 'copropietario', telefono: '654987321', direccion: 'Avenida Oeste 987', estado: 'inactivo' },
          ];
          setUsuarios(usuariosData);
          setIsLoading(false);
        }, 800);
      } catch (err) {
        console.error('Error al cargar usuarios:', err);
        setError('No se pudieron cargar los datos de los usuarios. Por favor, intente nuevamente.');
        setIsLoading(false);
      }
    };

    cargarUsuarios();
  }, []);

  const handleCrearUsuario = () => {
    setModalMode('crear');
    setUsuarioSeleccionado(null);
    setModalVisible(true);
  };

  const handleEditarUsuario = (usuario: Usuario) => {
    setModalMode('editar');
    setUsuarioSeleccionado(usuario);
    setModalVisible(true);
  };

  const handleCerrarModal = () => {
    setModalVisible(false);
  };

  const handleGuardarUsuario = () => {
    // Aquí iría la lógica para guardar el usuario
    // En un entorno real, esto sería una llamada a la API
    alert(`Usuario ${modalMode === 'crear' ? 'creado' : 'actualizado'} correctamente`);
    setModalVisible(false);
  };

  const handleCambiarEstado = (id: number, nuevoEstado: 'activo' | 'inactivo' | 'suspendido') => {
    // Aquí iría la lógica para cambiar el estado del usuario
    // En un entorno real, esto sería una llamada a la API
    setUsuarios(usuarios.map(usuario => 
      usuario.id === id ? { ...usuario, estado: nuevoEstado } : usuario
    ));
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando usuarios...</p>
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
      <div className={styles.header}>
        <h1 className={styles.title}>Gestión de Usuarios</h1>
        <button 
          className={styles.createButton}
          onClick={handleCrearUsuario}
        >
          Crear Usuario
        </button>
      </div>
      
      <div className={styles.filters}>
        <div className={styles.searchContainer}>
          <input 
            type="text" 
            placeholder="Buscar usuario..." 
            className={styles.searchInput} 
          />
          <button className={styles.searchButton}>Buscar</button>
        </div>
        
        <div className={styles.filterContainer}>
          <label htmlFor="role-filter">Filtrar por rol:</label>
          <select id="role-filter" className={styles.filterSelect}>
            <option value="todos">Todos</option>
            <option value="admin">Administradores</option>
            <option value="copropietario">Copropietarios</option>
          </select>
        </div>
        
        <div className={styles.filterContainer}>
          <label htmlFor="estado-filter">Filtrar por estado:</label>
          <select id="estado-filter" className={styles.filterSelect}>
            <option value="todos">Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
            <option value="suspendido">Suspendidos</option>
          </select>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Parcela</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id} className={usuario.estado === 'inactivo' ? styles.inactiveRow : ''}>
                <td>{usuario.id}</td>
                <td>{`${usuario.nombre} ${usuario.apellido}`}</td>
                <td>{usuario.email}</td>
                <td>
                  <span className={`${styles.badge} ${styles[usuario.role]}`}>
                    {usuario.role === 'admin' ? 'Administrador' : 'Copropietario'}
                  </span>
                </td>
                <td>
                  <span className={`${styles.badge} ${styles[usuario.estado || 'activo']}`}>
                    {usuario.estado?.charAt(0).toUpperCase() + usuario.estado?.slice(1) || 'Activo'}
                  </span>
                </td>
                <td>{usuario.parcelaId || '-'}</td>
                <td>
                  <div className={styles.actions}>
                    <button 
                      className={styles.actionButton}
                      onClick={() => handleEditarUsuario(usuario)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    {usuario.estado === 'activo' ? (
                      <button 
                        className={`${styles.actionButton} ${styles.suspendButton}`}
                        onClick={() => handleCambiarEstado(usuario.id, 'inactivo')}
                        title="Desactivar"
                      >
                        🚫
                      </button>
                    ) : (
                      <button 
                        className={`${styles.actionButton} ${styles.activateButton}`}
                        onClick={() => handleCambiarEstado(usuario.id, 'activo')}
                        title="Activar"
                      >
                        ✅
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para crear/editar usuario */}
      {modalVisible && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{modalMode === 'crear' ? 'Crear Usuario' : 'Editar Usuario'}</h2>
              <button className={styles.closeButton} onClick={handleCerrarModal}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label htmlFor="nombre">Nombre</label>
                <input 
                  type="text" 
                  id="nombre" 
                  className={styles.input}
                  defaultValue={usuarioSeleccionado?.nombre || ''}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="apellido">Apellido</label>
                <input 
                  type="text" 
                  id="apellido" 
                  className={styles.input}
                  defaultValue={usuarioSeleccionado?.apellido || ''}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  className={styles.input}
                  defaultValue={usuarioSeleccionado?.email || ''}
                />
              </div>
              {modalMode === 'crear' && (
                <div className={styles.formGroup}>
                  <label htmlFor="password">Contraseña</label>
                  <input 
                    type="password" 
                    id="password" 
                    className={styles.input}
                  />
                </div>
              )}
              <div className={styles.formGroup}>
                <label htmlFor="telefono">Teléfono</label>
                <input 
                  type="tel" 
                  id="telefono" 
                  className={styles.input}
                  defaultValue={usuarioSeleccionado?.telefono || ''}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="direccion">Dirección</label>
                <input 
                  type="text" 
                  id="direccion" 
                  className={styles.input}
                  defaultValue={usuarioSeleccionado?.direccion || ''}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="role">Rol</label>
                <select 
                  id="role" 
                  className={styles.select}
                  defaultValue={usuarioSeleccionado?.role || 'copropietario'}
                >
                  <option value="admin">Administrador</option>
                  <option value="copropietario">Copropietario</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="parcela">Parcela (solo para copropietarios)</label>
                <select 
                  id="parcela" 
                  className={styles.select}
                  defaultValue={usuarioSeleccionado?.parcelaId || ''}
                >
                  <option value="">Sin asignar</option>
                  <option value="P001">P001</option>
                  <option value="P002">P002</option>
                  <option value="P003">P003</option>
                  <option value="P004">P004</option>
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={handleCerrarModal}
              >
                Cancelar
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleGuardarUsuario}
              >
                {modalMode === 'crear' ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};