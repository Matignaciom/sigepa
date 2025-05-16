import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../../services/api';
import styles from './CrearNotificacion.module.css';

interface FormData {
  titulo: string;
  mensaje: string;
  tipo: 'informacion' | 'alerta' | 'pago' | 'sistema';
  destinatarios: 'todos' | 'seleccionados';
  usuariosSeleccionados: number[];
}

export const CrearNotificacion = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    titulo: '',
    mensaje: '',
    tipo: 'informacion',
    destinatarios: 'todos',
    usuariosSeleccionados: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState([
    { id: 2, nombre: 'Usuario Prueba', email: 'user@sigepa.com' },
    { id: 3, nombre: 'María González', email: 'maria@ejemplo.com' },
    { id: 4, nombre: 'Carlos Rodríguez', email: 'carlos@ejemplo.com' },
    { id: 5, nombre: 'Ana Martínez', email: 'ana@ejemplo.com' },
    { id: 6, nombre: 'Pedro Sánchez', email: 'pedro@ejemplo.com' },
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUsuarioChange = (e: React.ChangeEvent<HTMLInputElement>, usuarioId: number) => {
    const isChecked = e.target.checked;
    
    setFormData(prev => {
      if (isChecked) {
        return {
          ...prev,
          usuariosSeleccionados: [...prev.usuariosSeleccionados, usuarioId]
        };
      } else {
        return {
          ...prev,
          usuariosSeleccionados: prev.usuariosSeleccionados.filter(id => id !== usuarioId)
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Validar formulario
    if (!formData.titulo.trim()) {
      setError('El título es obligatorio');
      setIsLoading(false);
      return;
    }

    if (!formData.mensaje.trim()) {
      setError('El mensaje es obligatorio');
      setIsLoading(false);
      return;
    }

    if (formData.destinatarios === 'seleccionados' && formData.usuariosSeleccionados.length === 0) {
      setError('Debe seleccionar al menos un usuario');
      setIsLoading(false);
      return;
    }

    try {
      // En un entorno real, esto sería una llamada a la API
      // const response = await adminService.createNotification(formData);
      
      // Simulación de envío exitoso
      setTimeout(() => {
        setSuccess('Notificación enviada correctamente');
        setIsLoading(false);
        
        // Resetear formulario después de 2 segundos
        setTimeout(() => {
          setFormData({
            titulo: '',
            mensaje: '',
            tipo: 'informacion',
            destinatarios: 'todos',
            usuariosSeleccionados: [],
          });
          setSuccess(null);
        }, 2000);
      }, 1000);
    } catch (err) {
      console.error('Error al enviar notificación:', err);
      setError('Error al enviar la notificación. Por favor, intente nuevamente.');
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Crear Notificación</h1>
      
      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}
      
      <div className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="titulo">Título</label>
            <input
              type="text"
              id="titulo"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              className={styles.input}
              placeholder="Título de la notificación"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="mensaje">Mensaje</label>
            <textarea
              id="mensaje"
              name="mensaje"
              value={formData.mensaje}
              onChange={handleChange}
              className={styles.textarea}
              placeholder="Escriba el contenido de la notificación"
              rows={5}
            />
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="tipo">Tipo de Notificación</label>
              <select
                id="tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="informacion">Información</option>
                <option value="alerta">Alerta</option>
                <option value="pago">Pago</option>
                <option value="sistema">Sistema</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="destinatarios">Destinatarios</label>
              <select
                id="destinatarios"
                name="destinatarios"
                value={formData.destinatarios}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="todos">Todos los usuarios</option>
                <option value="seleccionados">Usuarios seleccionados</option>
              </select>
            </div>
          </div>
          
          {formData.destinatarios === 'seleccionados' && (
            <div className={styles.usuariosContainer}>
              <h3>Seleccionar Usuarios</h3>
              <div className={styles.usuariosList}>
                {usuarios.map(usuario => (
                  <div key={usuario.id} className={styles.usuarioItem}>
                    <input
                      type="checkbox"
                      id={`usuario-${usuario.id}`}
                      checked={formData.usuariosSeleccionados.includes(usuario.id)}
                      onChange={(e) => handleUsuarioChange(e, usuario.id)}
                    />
                    <label htmlFor={`usuario-${usuario.id}`}>
                      {usuario.nombre} ({usuario.email})
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={handleCancel}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? 'Enviando...' : 'Enviar Notificación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};