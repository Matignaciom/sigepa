import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../../context/AuthContext';
import { userService } from '../../../services/api';
import styles from './Perfil.module.css';

// Esquema de validación para el formulario de perfil
const perfilSchema = z.object({
  nombre: z.string().min(2, 'El nombre es requerido'),
  apellido: z.string().min(2, 'El apellido es requerido'),
  email: z.string().email('Correo electrónico inválido'),
  telefono: z.string().min(9, 'El teléfono debe tener al menos 9 dígitos'),
  direccion: z.string().min(5, 'La dirección es requerida'),
});

// Esquema de validación para el cambio de contraseña
const passwordSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe tener al menos una letra mayúscula')
    .regex(/[a-z]/, 'La contraseña debe tener al menos una letra minúscula')
    .regex(/[0-9]/, 'La contraseña debe tener al menos un número'),
  confirmPassword: z.string().min(1, 'La confirmación de contraseña es requerida')
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type PerfilFormData = z.infer<typeof perfilSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

// Datos de muestra para visualización
const datosDeMuestra = {
  nombre: "Juan Carlos",
  apellido: "Rodríguez López",
  email: "jcrodriguez@ejemplo.com",
  telefono: "956789123",
  direccion: "Av. Las Condes 123, Santiago",
  parcelaId: "P-0045",
  superficie: "5.000",
  fechaAdquisicion: "15/03/2020",
  estadoContrato: "Vigente"
};

export const Perfil = () => {
  const { user, updateUserData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  
  const currentYear = new Date().getFullYear();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PerfilFormData>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nombre: datosDeMuestra.nombre,
      apellido: datosDeMuestra.apellido,
      email: datosDeMuestra.email,
      telefono: datosDeMuestra.telefono,
      direccion: datosDeMuestra.direccion,
    },
  });
  
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      email: datosDeMuestra.email,
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 576);
    };

    // Comprobar inicialmente
    checkIfMobile();

    // Añadir listener para cambios de tamaño
    window.addEventListener('resize', checkIfMobile);

    // Limpiar listener al desmontar
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Cargar datos del perfil
  useEffect(() => {
    const loadProfileData = async () => {
      setIsLoading(true);
      try {
        const response = await userService.getProfile();
        if (response.success && response.data) {
          const profileData = response.data;
          reset({
            nombre: profileData.nombre || datosDeMuestra.nombre,
            apellido: profileData.apellido || datosDeMuestra.apellido,
            email: profileData.email || datosDeMuestra.email,
            telefono: profileData.telefono || datosDeMuestra.telefono,
            direccion: profileData.direccion || datosDeMuestra.direccion,
          });
        } else {
          // Si no hay datos reales, usar los de muestra
          reset({
            nombre: datosDeMuestra.nombre,
            apellido: datosDeMuestra.apellido,
            email: datosDeMuestra.email,
            telefono: datosDeMuestra.telefono,
            direccion: datosDeMuestra.direccion,
          });
        }
      } catch (error) {
        console.error('Error al cargar el perfil:', error);
        setMessage({
          text: 'Error al cargar los datos del perfil',
          type: 'error',
        });
        // Si hay error, usar los datos de muestra
        reset({
          nombre: datosDeMuestra.nombre,
          apellido: datosDeMuestra.apellido,
          email: datosDeMuestra.email,
          telefono: datosDeMuestra.telefono,
          direccion: datosDeMuestra.direccion,
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

  const onSubmitPassword = async (data: PasswordFormData) => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Simulamos actualización de contraseña
      setTimeout(() => {
        setMessage({
          text: 'Contraseña actualizada correctamente',
          type: 'success',
        });
        setIsLoading(false);
        setChangePasswordMode(false);
        resetPassword();
      }, 1500);
    } catch (error) {
      console.error('Error al actualizar la contraseña:', error);
      setMessage({
        text: 'Error al actualizar la contraseña',
        type: 'error',
      });
      setIsLoading(false);
    }
  };

  const handleCambiarPassword = () => {
    setChangePasswordMode(true);
    resetPassword({
      email: datosDeMuestra.email,
      password: '',
      confirmPassword: '',
    });
  };
  
  const handleCancelPasswordChange = () => {
    setChangePasswordMode(false);
    setMessage(null);
  };
  
  // Función para abrir/cerrar el menú en móviles
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    // Aquí iría la lógica para cerrar sesión
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (isLoading && !isEditing && !changePasswordMode) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando información del perfil...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      {/* Botón de menú hamburguesa para móviles */}
      {isMobile && (
        <>
          <button 
            onClick={toggleMenu}
            style={{
              position: 'fixed',
              top: '10px',
              right: '10px',
              width: '40px',
              height: '40px',
              backgroundColor: '#4f46e5',
              border: 'none',
              borderRadius: '5px',
              zIndex: 1002,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              alignItems: 'center',
              padding: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}
          >
            <span
              style={{
                display: 'block',
                width: '24px',
                height: '3px',
                backgroundColor: 'white',
                borderRadius: '3px',
                transition: 'all 0.3s',
                transform: menuOpen ? 'translateY(8px) rotate(45deg)' : 'none'
              }}
            ></span>
            <span
              style={{
                display: 'block',
                width: '24px',
                height: '3px',
                backgroundColor: 'white',
                borderRadius: '3px',
                transition: 'all 0.3s',
                opacity: menuOpen ? 0 : 1
              }}
            ></span>
            <span
              style={{
                display: 'block',
                width: '24px',
                height: '3px',
                backgroundColor: 'white',
                borderRadius: '3px',
                transition: 'all 0.3s',
                transform: menuOpen ? 'translateY(-8px) rotate(-45deg)' : 'none'
              }}
            ></span>
          </button>
          
          {/* Overlay para cerrar el menú al hacer clic fuera */}
          {menuOpen && (
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 998
              }}
              onClick={toggleMenu}
            />
          )}
        </>
      )}
      
      <div 
        className={`${styles.leftPanel} ${menuOpen ? styles.showMenu : ''}`}
        style={isMobile ? {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '85%',
          height: '100%',
          zIndex: 999,
          transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          overflowY: 'auto',
          boxShadow: menuOpen ? '5px 0 15px rgba(0, 0, 0, 0.1)' : 'none'
        } : {}}
      >
        <div className={styles.brandingContent}>
          <div className={styles.brandLogo}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.favicon} /> SIGEPA
          </div>
          <h1 className={styles.brandTitle}>Panel de Copropietario</h1>
          <p className={styles.brandDescription}>
            Gestiona tus parcelas, realiza pagos y mantente al día con toda la información de tu propiedad.
          </p>
        </div>
        <nav className={styles.dashboardNav}>
          <div className={styles.navSection}>
            <h3 className={styles.navTitle}>Principal</h3>
            <ul className={styles.navList}>
              <li>
                <Link to="/dashboard" 
                  className={`${styles.navLink} ${window.location.pathname === '/dashboard' ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>📊</span>
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/dashboard/parcelas" 
                  className={`${styles.navLink} ${window.location.pathname.includes('/dashboard/parcelas') ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>🏞️</span>
                  Mis Parcelas
                </Link>
              </li>
            </ul>
          </div>
          
          <div className={styles.navSection}>
            <h3 className={styles.navTitle}>Finanzas</h3>
            <ul className={styles.navList}>
              <li>
                <Link to="/dashboard/pagos" 
                  className={`${styles.navLink} ${window.location.pathname.includes('/dashboard/pagos') ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>💰</span>
                  Pagos y Gastos
                </Link>
              </li>
              <li>
                <Link to="/dashboard/documentos" 
                  className={`${styles.navLink} ${window.location.pathname.includes('/dashboard/documentos') ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>📄</span>
                  Documentos
                </Link>
              </li>
            </ul>
          </div>
          
          <div className={styles.navSection}>
            <h3 className={styles.navTitle}>Comunidad</h3>
            <ul className={styles.navList}>
              <li>
                <Link to="/dashboard/estadisticas" 
                  className={`${styles.navLink} ${window.location.pathname.includes('/dashboard/estadisticas') ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>📊</span>
                  Estadísticas
                </Link>
              </li>
            </ul>
          </div>
          
          <div className={styles.navSection}>
            <h3 className={styles.navTitle}>Cuenta</h3>
            <ul className={styles.navList}>
              <li>
                <Link to="/dashboard/perfil" 
                  className={`${styles.navLink} ${styles.active}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>👤</span>
                  Mi Perfil
                </Link>
              </li>
              <li>
                <button 
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }} 
                  className={styles.navLinkButton}
                >
                  <span className={styles.navIcon}>🚪</span>
                  Cerrar Sesión
                </button>
              </li>
            </ul>
          </div>
        </nav>
        <div className={styles.faviconFooter}>
          <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.faviconLarge} />
          <p>SIGEPA © {currentYear}</p>
        </div>
        <div className={`${styles.decorationCircle} ${styles.circle1}`}></div>
        <div className={`${styles.decorationCircle} ${styles.circle2}`}></div>
      </div>
      
      <div 
        className={styles.mainContent}
        style={isMobile ? { padding: '1rem', paddingTop: '60px' } : {}}
      >
        <header className={styles.header}>
          <h2 className={styles.dashboardTitle}>Mi Perfil</h2>
          <div className={styles.headerBrand}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.favicon} /> SIGEPA
          </div>
        </header>
        
        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}
        
        <div className={styles.activityContainer}>
          <div className={styles.cardHeader}>
            <h2>Información Personal</h2>
            {!isEditing && !changePasswordMode && (
              <button 
                className={styles.editButton}
                onClick={() => setIsEditing(true)}
              >
                Editar
              </button>
            )}
          </div>

          {!changePasswordMode && (
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="nombre">Nombre</label>
                  <input
                    id="nombre"
                    type="text"
                    disabled={!isEditing}
                    className={errors.nombre ? styles.inputError : ''}
                    {...register('nombre')}
                  />
                  {errors.nombre && <span className={styles.errorText}>{errors.nombre.message}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="apellido">Apellido</label>
                  <input
                    id="apellido"
                    type="text"
                    disabled={!isEditing}
                    className={errors.apellido ? styles.inputError : ''}
                    {...register('apellido')}
                  />
                  {errors.apellido && <span className={styles.errorText}>{errors.apellido.message}</span>}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Correo Electrónico</label>
                <input
                  id="email"
                  type="email"
                  disabled={!isEditing}
                  className={errors.email ? styles.inputError : ''}
                  {...register('email')}
                />
                {errors.email && <span className={styles.errorText}>{errors.email.message}</span>}
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="telefono">Teléfono</label>
                  <input
                    id="telefono"
                    type="tel"
                    disabled={!isEditing}
                    className={errors.telefono ? styles.inputError : ''}
                    {...register('telefono')}
                  />
                  {errors.telefono && <span className={styles.errorText}>{errors.telefono.message}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="direccion">Dirección</label>
                  <input
                    id="direccion"
                    type="text"
                    disabled={!isEditing}
                    className={errors.direccion ? styles.inputError : ''}
                    {...register('direccion')}
                  />
                  {errors.direccion && <span className={styles.errorText}>{errors.direccion.message}</span>}
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
          )}
          
          {changePasswordMode && (
            <form onSubmit={handleSubmitPassword(onSubmitPassword)} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="email-password">Correo Electrónico</label>
                <input
                  id="email-password"
                  type="email"
                  className={passwordErrors.email ? styles.inputError : ''}
                  {...registerPassword('email')}
                />
                {passwordErrors.email && <span className={styles.errorText}>{passwordErrors.email.message}</span>}
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="password">Nueva Contraseña</label>
                <input
                  id="password"
                  type="password"
                  className={passwordErrors.password ? styles.inputError : ''}
                  {...registerPassword('password')}
                />
                {passwordErrors.password && <span className={styles.errorText}>{passwordErrors.password.message}</span>}
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">Confirmar Nueva Contraseña</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className={passwordErrors.confirmPassword ? styles.inputError : ''}
                  {...registerPassword('confirmPassword')}
                />
                {passwordErrors.confirmPassword && <span className={styles.errorText}>{passwordErrors.confirmPassword.message}</span>}
              </div>
              
              <div className={styles.formActions}>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={handleCancelPasswordChange}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={styles.saveButton}
                  disabled={isLoading}
                >
                  {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                </button>
              </div>
            </form>
          )}
        </div>
        
        {!changePasswordMode && (
          <div className={styles.activityContainer}>
            <div className={styles.cardHeader}>
              <h2>Seguridad</h2>
            </div>
            <div className={styles.securitySection}>
              <p>Cambia tu contraseña periódicamente para mantener tu cuenta segura.</p>
              <button 
                className={styles.primaryActionButton}
                onClick={handleCambiarPassword}
              >
                <span className={styles.btnIcon}>🔒</span>
                Cambiar Contraseña
              </button>
            </div>
          </div>
        )}
        
        {!changePasswordMode && (
          <div className={styles.activityContainer}>
            <div className={styles.cardHeader}>
              <h2>Información de Parcela</h2>
            </div>
            <div className={styles.parcelaInfo}>
              <div className={styles.parcelaItem}>
                <div className={styles.parcelaIcon}>🏞️</div>
                <div className={styles.parcelaContent}>
                  <p className={styles.parcelaText}><strong>Número de Parcela:</strong> {user?.parcelaId || datosDeMuestra.parcelaId}</p>
                </div>
              </div>
              <div className={styles.parcelaItem}>
                <div className={styles.parcelaIcon}>📏</div>
                <div className={styles.parcelaContent}>
                  <p className={styles.parcelaText}><strong>Superficie:</strong> {user?.superficie || datosDeMuestra.superficie} m²</p>
                </div>
              </div>
              <div className={styles.parcelaItem}>
                <div className={styles.parcelaIcon}>📅</div>
                <div className={styles.parcelaContent}>
                  <p className={styles.parcelaText}><strong>Fecha de Adquisición:</strong> {user?.fechaAdquisicion || datosDeMuestra.fechaAdquisicion}</p>
                </div>
              </div>
              <div className={styles.parcelaItem}>
                <div className={styles.parcelaIcon}>📝</div>
                <div className={styles.parcelaContent}>
                  <p className={styles.parcelaText}><strong>Estado de Contrato:</strong> {user?.estadoContrato || datosDeMuestra.estadoContrato}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className={styles.contentFooter}>
          <div className={styles.footerLogo}>
            <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.faviconSmall} /> SIGEPA
          </div>
          <p>Sistema de Gestión de Parcelas © {currentYear}</p>
        </footer>
      </div>
    </div>
  );
};