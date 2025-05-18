import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../../context/AuthContext';
import { userService } from '../../../services/api';
import type { UsuarioCompleto } from '../../../services/api';
import styles from './Perfil.module.css';

// URL base para las funciones de Netlify (si estamos en desarrollo, usamos localhost)
const NETLIFY_FUNCTIONS_URL = import.meta.env.DEV 
  ? 'http://localhost:8889/.netlify/functions'
  : '/.netlify/functions';

// Actualizar interfaces para incluir nombreCompleto
interface User {
  id?: number;
  nombreCompleto?: string;
  email?: string;
  rol?: string;
  idComunidad?: number;
  parcelaId?: string;
  superficie?: string;
  fechaAdquisicion?: string;
  estadoContrato?: string;
}

interface UserProfile {
  nombreCompleto?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}

// Estilo para requisitos de contraseña
const passwordRequirementsStyle = {
  marginBottom: '20px',
  padding: '15px',
  backgroundColor: '#f8f9fa',
  borderRadius: '5px',
  border: '1px solid #e0e0e0',
};

const passwordRequirementsListStyle = {
  margin: '10px 0 0 0',
  paddingLeft: '20px',
  fontSize: '0.9rem',
  color: '#666',
};

// Esquema de validación para el formulario de perfil
const perfilSchema = z.object({
  nombreCompleto: z.string().min(2, 'El nombre completo es requerido'),
  email: z.string().email('Correo electrónico inválido'),
  telefono: z.string().min(9, 'El teléfono debe tener al menos 9 dígitos'),
  direccion: z.string().min(5, 'La dirección es requerida'),
});

// Esquema de validación para el cambio de contraseña
const passwordSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe tener al menos una letra mayúscula')
    .regex(/[a-z]/, 'La contraseña debe tener al menos una letra minúscula')
    .regex(/[0-9]/, 'La contraseña debe tener al menos un número')
    .max(50, 'La contraseña no debe exceder los 50 caracteres'),
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
  const [userProfileData, setUserProfileData] = useState<UsuarioCompleto | null>(null);
  
  const currentYear = new Date().getFullYear();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PerfilFormData>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nombreCompleto: `${datosDeMuestra.nombre} ${datosDeMuestra.apellido}`,
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
        console.log('Obteniendo perfil de usuario...');
        
        // Obtener el token del localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('No hay token de autenticación');
          setMessage({
            text: 'No hay sesión activa. Por favor, inicie sesión nuevamente.',
            type: 'error',
          });
          setIsLoading(false);
          return;
        }
        
        // Realizar solicitud para obtener los datos completos del perfil
        const perfilResponse = await fetch(`${NETLIFY_FUNCTIONS_URL}/obtener-perfil-usuario`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        const perfilData = await perfilResponse.json();
        
        if (perfilData.success && perfilData.data) {
          console.log('Perfil obtenido correctamente:', perfilData.data);
          const perfil = perfilData.data;
          
          // Guardar los datos completos del perfil
          setUserProfileData(perfil);
          
          // Actualizar el formulario con los datos del perfil
          reset({
            nombreCompleto: perfil.nombreCompleto || '',
            email: perfil.email || '',
            telefono: perfil.telefono || '',
            direccion: perfil.direccion || '',
          });
          
          // Si también estamos en modo de cambio de contraseña, actualizar ese formulario
          if (changePasswordMode) {
            resetPassword({
              email: perfil.email || '',
              password: '',
              confirmPassword: '',
            });
          }
        } else {
          console.warn('No se pudo obtener el perfil:', perfilData.message || 'Error desconocido');
          setMessage({
            text: 'Error al cargar el perfil: ' + (perfilData.message || 'Error desconocido'),
            type: 'error',
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
  }, [reset, changePasswordMode, resetPassword]);

  const onSubmit = async (data: PerfilFormData) => {
    setIsLoading(true);
    setMessage(null);

    try {
      console.log('Actualizando perfil de usuario:', data);
      
      // Obtener el token del localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setMessage({
          text: 'No hay sesión activa. Por favor, inicie sesión nuevamente.',
          type: 'error',
        });
        setIsLoading(false);
        return;
      }
      
      // Realizar la solicitud a la función de Netlify para actualizar el perfil
      const response = await fetch(`${NETLIFY_FUNCTIONS_URL}/editar-perfil-copropietario`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      const responseData = await response.json();
      
      if (responseData.success) {
        setMessage({
          text: 'Perfil actualizado correctamente',
          type: 'success',
        });
        
        // Actualizar datos del usuario en el contexto
        if (updateUserData && user) {
          updateUserData({
            ...user,
            nombreCompleto: data.nombreCompleto,
            name: data.nombreCompleto, // Actualizar ambos campos para consistencia
            email: data.email,
            telefono: data.telefono,
            direccion: data.direccion
          });
        }
        
        // Recargar los datos del perfil
        try {
          const profileResponse = await fetch(`${NETLIFY_FUNCTIONS_URL}/obtener-perfil-usuario`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          const profileData = await profileResponse.json();
          
          if (profileData.success && profileData.data) {
            setUserProfileData(profileData.data);
          }
        } catch (error) {
          console.error('Error al recargar el perfil:', error);
        }
        
        setIsEditing(false);
      } else {
        setMessage({
          text: responseData.message || 'Error al actualizar el perfil',
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
      console.log('Cambiando contraseña para:', data.email);
      
      // Realizar la solicitud a la función de Netlify para cambiar la contraseña
      const response = await fetch(`${NETLIFY_FUNCTIONS_URL}/cambiar-contrasena`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: data.email,
          newPassword: data.password,
          confirmPassword: data.confirmPassword
        })
      });
      
      const responseData = await response.json();
      
      if (responseData.success) {
        setMessage({
          text: 'Contraseña actualizada exitosamente',
          type: 'success',
        });
        setChangePasswordMode(false);
        resetPassword();
      } else {
        setMessage({
          text: responseData.message || 'Error al actualizar la contraseña',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error al actualizar la contraseña:', error);
      setMessage({
        text: 'Error al actualizar la contraseña. Por favor, intente nuevamente más tarde.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCambiarPassword = () => {
    setChangePasswordMode(true);
    
    // Usar el email real del usuario en lugar del email de muestra
    const userEmail = userProfileData?.email || user?.email || '';
    
    resetPassword({
      email: userEmail,
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
              <div className={styles.formGroup}>
                <label htmlFor="nombreCompleto">Nombre Completo</label>
                <input
                  id="nombreCompleto"
                  type="text"
                  disabled={!isEditing}
                  className={errors.nombreCompleto ? styles.inputError : ''}
                  {...register('nombreCompleto')}
                />
                {errors.nombreCompleto && <span className={styles.errorText}>{errors.nombreCompleto.message}</span>}
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
                  readOnly
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
                  placeholder="Ingrese su nueva contraseña"
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
                  placeholder="Repita su nueva contraseña"
                />
                {passwordErrors.confirmPassword && <span className={styles.errorText}>{passwordErrors.confirmPassword.message}</span>}
              </div>
              
              <div className={styles.passwordRequirements} style={passwordRequirementsStyle}>
                <h4>Requisitos de seguridad:</h4>
                <ul style={passwordRequirementsListStyle}>
                  <li>Mínimo 6 caracteres</li>
                  <li>Al menos una letra mayúscula</li>
                  <li>Al menos una letra minúscula</li>
                  <li>Al menos un número</li>
                  <li>Máximo 50 caracteres</li>
                </ul>
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
              {userProfileData && userProfileData.parcela ? (
                <>
                  <div className={styles.parcelaItem}>
                    <div className={styles.parcelaIcon}>🏞️</div>
                    <div className={styles.parcelaContent}>
                      <p className={styles.parcelaText}><strong>Nombre de Parcela:</strong> {userProfileData.parcela.nombre}</p>
                    </div>
                  </div>
                  <div className={styles.parcelaItem}>
                    <div className={styles.parcelaIcon}>📍</div>
                    <div className={styles.parcelaContent}>
                      <p className={styles.parcelaText}><strong>Dirección:</strong> {userProfileData.parcela.direccion}</p>
                    </div>
                  </div>
                  <div className={styles.parcelaItem}>
                    <div className={styles.parcelaIcon}>📏</div>
                    <div className={styles.parcelaContent}>
                      <p className={styles.parcelaText}><strong>Superficie:</strong> {userProfileData.parcela.superficie} hectáreas</p>
                    </div>
                  </div>
                  <div className={styles.parcelaItem}>
                    <div className={styles.parcelaIcon}>📅</div>
                    <div className={styles.parcelaContent}>
                      <p className={styles.parcelaText}><strong>Fecha de Adquisición:</strong> {new Date(userProfileData.parcela.fechaAdquisicion).toLocaleDateString('es-CL')}</p>
                    </div>
                  </div>
                  <div className={styles.parcelaItem}>
                    <div className={styles.parcelaIcon}>💰</div>
                    <div className={styles.parcelaContent}>
                      <p className={styles.parcelaText}><strong>Valor Catastral:</strong> ${userProfileData.parcela.valorCatastral.toLocaleString('es-CL')}</p>
                    </div>
                  </div>
                  <div className={styles.parcelaItem}>
                    <div className={styles.parcelaIcon}>📝</div>
                    <div className={styles.parcelaContent}>
                      <p className={styles.parcelaText}><strong>Estado:</strong> {userProfileData.parcela.estado}</p>
                    </div>
                  </div>
                  {userProfileData.parcela.contrato && (
                    <div className={styles.parcelaItem}>
                      <div className={styles.parcelaIcon}>📄</div>
                      <div className={styles.parcelaContent}>
                        <p className={styles.parcelaText}><strong>Estado de Contrato:</strong> {userProfileData.parcela.contrato.estado}</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        )}

        {!changePasswordMode && userProfileData && (
          <div className={styles.activityContainer}>
            <div className={styles.cardHeader}>
              <h2>Información de Comunidad</h2>
            </div>
            <div className={styles.parcelaInfo}>
              <div className={styles.parcelaItem}>
                <div className={styles.parcelaIcon}>🏘️</div>
                <div className={styles.parcelaContent}>
                  <p className={styles.parcelaText}><strong>Nombre de Comunidad:</strong> {userProfileData.comunidad}</p>
                </div>
              </div>
              {userProfileData.direccionComunidad && (
                <div className={styles.parcelaItem}>
                  <div className={styles.parcelaIcon}>📍</div>
                  <div className={styles.parcelaContent}>
                    <p className={styles.parcelaText}><strong>Dirección Administrativa:</strong> {userProfileData.direccionComunidad}</p>
                  </div>
                </div>
              )}
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