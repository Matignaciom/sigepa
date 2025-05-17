import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../../context/AuthContext';
import { userService } from '../../../services/api';
import type { UserProfile } from '../../../services/api';
import styles from './Perfil.module.css';

// Esquema de validación para el formulario de perfil
const perfilSchema = z.object({
  nombre: z.string().min(2, 'El nombre es requerido'),
  apellido: z.string().min(2, 'El apellido es requerido'),
  email: z.string().email('Correo electrónico inválido'),
  telefono: z.string().min(9, 'El teléfono debe tener al menos 9 dígitos'),
  direccion: z.string().min(5, 'La dirección es requerida'),
});

type PerfilFormData = z.infer<typeof perfilSchema>;

export const Perfil = () => {
  const { user, updateUserData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PerfilFormData>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      direccion: '',
    },
  });

  // Cargar datos del perfil
  useEffect(() => {
    const loadProfileData = async () => {
      setIsLoading(true);
      try {
        const response = await userService.getProfile();
        if (response.success && response.data) {
          const profileData = response.data;
          reset({
            nombre: profileData.nombre || '',
            apellido: profileData.apellido || '',
            email: profileData.email || '',
            telefono: profileData.telefono || '',
            direccion: profileData.direccion || '',
          });
        }
      } catch (error) {
        console.error('Error al cargar el perfil:', error);
        setMessage({
          text: 'Error al cargar los datos del perfil',
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [reset]);

  const onSubmit = async (data: PerfilFormData) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await userService.updateProfile(data);
      if (response.success) {
        setMessage({
          text: 'Perfil actualizado correctamente',
          type: 'success',
        });
        // Actualizar datos del usuario en el contexto
        if (updateUserData) {
          updateUserData({
            ...user,
            nombre: data.nombre,
            apellido: data.apellido,
            email: data.email,
          });
        }
        setIsEditing(false);
      } else {
        setMessage({
          text: response.error || 'Error al actualizar el perfil',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      setMessage({
        text: 'Error al actualizar el perfil',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCambiarPassword = () => {
    // Implementar lógica para cambiar contraseña
    alert('Funcionalidad de cambio de contraseña en desarrollo');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Mi Perfil</h1>
      
      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Información Personal</h2>
          {!isEditing && (
            <button 
              className={styles.editButton}
              onClick={() => setIsEditing(true)}
            >
              Editar
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="nombre">Nombre</label>
              <input
                id="nombre"
                type="text"
                disabled={!isEditing}
                {...register('nombre')}
              />
              {errors.nombre && <span className={styles.error}>{errors.nombre.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="apellido">Apellido</label>
              <input
                id="apellido"
                type="text"
                disabled={!isEditing}
                {...register('apellido')}
              />
              {errors.apellido && <span className={styles.error}>{errors.apellido.message}</span>}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              disabled={!isEditing}
              {...register('email')}
            />
            {errors.email && <span className={styles.error}>{errors.email.message}</span>}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="telefono">Teléfono</label>
              <input
                id="telefono"
                type="tel"
                disabled={!isEditing}
                {...register('telefono')}
              />
              {errors.telefono && <span className={styles.error}>{errors.telefono.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="direccion">Dirección</label>
              <input
                id="direccion"
                type="text"
                disabled={!isEditing}
                {...register('direccion')}
              />
              {errors.direccion && <span className={styles.error}>{errors.direccion.message}</span>}
            </div>
          </div>

          {isEditing && (
            <div className={styles.formActions}>
              <button 
                type="button" 
                className={styles.cancelButton}
                onClick={() => setIsEditing(false)}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className={styles.saveButton}
                disabled={isLoading}
              >
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          )}
        </form>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Seguridad</h2>
        </div>
        <div className={styles.securitySection}>
          <p>Cambia tu contraseña periódicamente para mantener tu cuenta segura.</p>
          <button 
            className={styles.passwordButton}
            onClick={handleCambiarPassword}
          >
            Cambiar Contraseña
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Información de Parcela</h2>
        </div>
        <div className={styles.parcelaInfo}>
          <p><strong>Número de Parcela:</strong> {user?.parcelaId || 'No asignada'}</p>
          <p><strong>Superficie:</strong> {user?.superficie || 'No disponible'} m²</p>
          <p><strong>Fecha de Adquisición:</strong> {user?.fechaAdquisicion || 'No disponible'}</p>
          <p><strong>Estado de Contrato:</strong> {user?.estadoContrato || 'No disponible'}</p>
        </div>
      </div>
    </div>
  );
};