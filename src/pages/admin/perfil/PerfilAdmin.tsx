import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../../context/AuthContext';
import styles from './PerfilAdmin.module.css';

// Esquema de validación para el formulario de perfil de administrador
const perfilAdminSchema = z.object({
  nombreCompleto: z.string().min(2, 'El nombre completo es requerido'),
  email: z.string().email('Correo electrónico inválido'),
  telefono: z.string().min(9, 'El teléfono debe tener al menos 9 dígitos'),
  direccion: z.string().min(5, 'La dirección es requerida'),
  cargo: z.string().optional(),
  rut: z.string().optional(),
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

// Esquema de validación para la información de la comunidad
const comunidadSchema = z.object({
  nombre: z.string().min(3, 'El nombre de la comunidad es requerido'),
  fecha_creacion: z.string().optional()
});

type PerfilAdminFormData = z.infer<typeof perfilAdminSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type ComunidadFormData = z.infer<typeof comunidadSchema>;

// Datos de muestra para visualización
const datosDeMuestra = {
  nombreCompleto: 'Carlos Alvarado Ramírez',
  email: 'carlos.alvarado@sigepa.com',
  telefono: '+56 9 8765 4321',
  direccion: 'Av. Principal #123, Santiago',
  cargo: 'Administrador de Comunidad',
  rut: '12.345.678-9',
  fechaRegistro: '01/01/2023',
  ultimoAcceso: '15/06/2023',
  comunidadId: 1,
  comunidadNombre: 'Parcelación Los Aromos',
  comunidad: {
    id: 1,
    nombre: 'Parcelación Los Aromos',
    fecha_creacion: '15/03/2020',
    total_parcelas: 32,
    usuarios_registrados: 45,
    direccion_administrativa: 'Av. Las Parcelas 1250, Santiago',
    telefono_contacto: '+56 2 2345 6789',
    email_contacto: 'admin@losaromos.cl',
    sitio_web: 'www.parcelacionlosaromos.cl'
  }
};

export const PerfilAdmin = () => {
  const { user, updateUserData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [editingComunidad, setEditingComunidad] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const currentYear = new Date().getFullYear();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PerfilAdminFormData>({
    resolver: zodResolver(perfilAdminSchema),
    defaultValues: {
      nombreCompleto: datosDeMuestra.nombreCompleto,
      email: datosDeMuestra.email,
      telefono: datosDeMuestra.telefono,
      direccion: datosDeMuestra.direccion,
      cargo: datosDeMuestra.cargo,
      rut: datosDeMuestra.rut,
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

  const {
    register: registerComunidad,
    handleSubmit: handleSubmitComunidad,
    reset: resetComunidad,
    formState: { errors: comunidadErrors },
  } = useForm<ComunidadFormData>({
    resolver: zodResolver(comunidadSchema),
    defaultValues: {
      nombre: datosDeMuestra.comunidad.nombre,
      fecha_creacion: datosDeMuestra.comunidad.fecha_creacion,
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
        // Simulamos carga de datos, aquí se llamaría a una API real
        setTimeout(() => {
          reset({
            nombreCompleto: datosDeMuestra.nombreCompleto,
            email: datosDeMuestra.email,
            telefono: datosDeMuestra.telefono,
            direccion: datosDeMuestra.direccion,
            cargo: datosDeMuestra.cargo,
            rut: datosDeMuestra.rut,
          });
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error al cargar el perfil:', error);
        setMessage({
          text: 'Error al cargar los datos del perfil',
          type: 'error',
        });
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [reset]);

  const onSubmit = async (data: PerfilAdminFormData) => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Simulamos actualización de datos, aquí se llamaría a una API real
      setTimeout(() => {
        setMessage({
          text: 'Perfil actualizado correctamente',
          type: 'success',
        });
        // Actualizar datos del usuario en el contexto
        if (updateUserData && user) {
          updateUserData({
            ...user,
            // Solo actualizamos campos que probablemente existan en el objeto user
            email: data.email,
            // Otros campos específicos podrían necesitar una adaptación particular
          });
        }
        setIsEditing(false);
        setIsLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      setMessage({
        text: 'Error al actualizar el perfil',
        type: 'error',
      });
      setIsLoading(false);
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Simulamos actualización de contraseña, aquí se llamaría a una API real
      setTimeout(() => {
        setMessage({
          text: 'Contraseña actualizada correctamente',
          type: 'success',
        });
        setIsLoading(false);
        setChangePasswordMode(false);
        resetPassword();
      }, 800);
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

  // Función para gestionar la comunidad
  const onSubmitComunidad = async (data: ComunidadFormData) => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Simulamos actualización de datos, aquí se llamaría a una API real
      setTimeout(() => {
        setMessage({
          text: 'Información de la comunidad actualizada correctamente',
          type: 'success',
        });
        setEditingComunidad(false);
        setIsLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error al actualizar la información de la comunidad:', error);
      setMessage({
        text: 'Error al actualizar la información de la comunidad',
        type: 'error',
      });
      setIsLoading(false);
    }
  };

  const handleEditComunidad = () => {
    setEditingComunidad(true);
    resetComunidad({
      nombre: datosDeMuestra.comunidad.nombre,
      fecha_creacion: datosDeMuestra.comunidad.fecha_creacion,
    });
  };

  const handleCancelComunidadEdit = () => {
    setEditingComunidad(false);
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

  if (isLoading && !isEditing && !changePasswordMode && !editingComunidad) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando información del perfil de administrador...</p>
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
          <h1 className={styles.brandTitle}>Panel de Administración</h1>
          <p className={styles.brandDescription}>
            Administración integral de parcelas, usuarios y pagos para mantener la eficiencia operativa del sistema.
          </p>
        </div>
        <nav className={styles.dashboardNav}>
          <div className={styles.navSection}>
            <h3 className={styles.navTitle}>Principal</h3>
            <ul className={styles.navList}>
              <li>
                <Link to="/admin"
                  className={`${styles.navLink} ${window.location.pathname === '/admin' ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>📊</span>
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/admin/mapa"
                  className={`${styles.navLink} ${window.location.pathname.includes('/admin/mapa') ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>🗺️</span>
                  Mapa Geoespacial
                </Link>
              </li>
            </ul>
          </div>

          <div className={styles.navSection}>
            <h3 className={styles.navTitle}>Gestión</h3>
            <ul className={styles.navList}>
              <li>
                <Link to="/admin/gastos"
                  className={`${styles.navLink} ${window.location.pathname === '/admin/gastos' ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>💰</span>
                  Gastos
                </Link>
              </li>
              <li>
                <Link to="/admin/contratos"
                  className={`${styles.navLink} ${window.location.pathname.includes('/admin/contratos') ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>📄</span>
                  Contratos
                </Link>
              </li>
              <li>
                <Link to="/admin/alertas"
                  className={`${styles.navLink} ${window.location.pathname.includes('/admin/alertas') ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>🔔</span>
                  Alertas
                </Link>
              </li>
              <li>
                <Link to="/admin/usuarios"
                  className={`${styles.navLink} ${window.location.pathname.includes('/admin/usuarios') ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navIcon}>👥</span>
                  Usuarios
                </Link>
              </li>
            </ul>
          </div>

          <div className={styles.navSection}>
            <h3 className={styles.navTitle}>Cuenta</h3>
            <ul className={styles.navList}>
              <li>
                <Link to="/admin/perfil"
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

        <div className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div className={styles.avatarContainer}>
              <div className={styles.avatar}>
                {datosDeMuestra.nombreCompleto.split(' ')[0].charAt(0)}
                {datosDeMuestra.nombreCompleto.split(' ').length > 1
                  ? datosDeMuestra.nombreCompleto.split(' ')[1].charAt(0)
                  : ''}
              </div>
            </div>
            <div className={styles.profileInfo}>
              <h2>{datosDeMuestra.nombreCompleto}</h2>
              <p className={styles.cargo}>{datosDeMuestra.cargo}</p>
              <p className={styles.email}>{datosDeMuestra.email}</p>

              {!isEditing && !changePasswordMode && (
                <button
                  className={styles.editButton}
                  onClick={() => setIsEditing(true)}
                >
                  <span className={styles.btnIcon}>✏️</span> Editar Perfil
                </button>
              )}
            </div>
          </div>

          <div className={styles.profileContent}>
            {!isEditing && !changePasswordMode && (
              <div className={styles.activityContainer}>
                <div className={styles.cardHeader}>
                  <h2>Información Personal</h2>
                </div>

                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>👤</div>
                    <div className={styles.infoContent}>
                      <p className={styles.infoLabel}>Nombre Completo:</p>
                      <p className={styles.infoText}>{datosDeMuestra.nombreCompleto}</p>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>✉️</div>
                    <div className={styles.infoContent}>
                      <p className={styles.infoLabel}>Email:</p>
                      <p className={styles.infoText}>{datosDeMuestra.email}</p>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>📞</div>
                    <div className={styles.infoContent}>
                      <p className={styles.infoLabel}>Teléfono:</p>
                      <p className={styles.infoText}>{datosDeMuestra.telefono}</p>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>📍</div>
                    <div className={styles.infoContent}>
                      <p className={styles.infoLabel}>Dirección:</p>
                      <p className={styles.infoText}>{datosDeMuestra.direccion}</p>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>🪪</div>
                    <div className={styles.infoContent}>
                      <p className={styles.infoLabel}>RUT:</p>
                      <p className={styles.infoText}>{datosDeMuestra.rut}</p>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>👨‍💼</div>
                    <div className={styles.infoContent}>
                      <p className={styles.infoLabel}>Cargo:</p>
                      <p className={styles.infoText}>{datosDeMuestra.cargo}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isEditing && !changePasswordMode && (
              <div className={styles.activityContainer}>
                <div className={styles.cardHeader}>
                  <h2>Actividad de Cuenta</h2>
                </div>

                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>📅</div>
                    <div className={styles.infoContent}>
                      <p className={styles.infoLabel}>Fecha de Registro:</p>
                      <p className={styles.infoText}>{datosDeMuestra.fechaRegistro}</p>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>🕒</div>
                    <div className={styles.infoContent}>
                      <p className={styles.infoLabel}>Último Acceso:</p>
                      <p className={styles.infoText}>{datosDeMuestra.ultimoAcceso}</p>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>🏢</div>
                    <div className={styles.infoContent}>
                      <p className={styles.infoLabel}>Comunidad:</p>
                      <p className={styles.infoText}>{datosDeMuestra.comunidadNombre}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isEditing && !changePasswordMode && !editingComunidad && (
              <div className={`${styles.activityContainer} ${styles.comunidadSection}`}>
                <div className={styles.cardHeader}>
                  <h2>Información de la Comunidad</h2>
                  <button
                    className={styles.primaryActionButton}
                    onClick={handleEditComunidad}
                  >
                    <span className={styles.btnIcon}>✏️</span>
                    Editar Comunidad
                  </button>
                </div>

                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>🏘️</div>
                    <div className={styles.infoContent}>
                      <p className={styles.infoLabel}>Nombre:</p>
                      <p className={styles.infoText}>{datosDeMuestra.comunidad.nombre}</p>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>📆</div>
                    <div className={styles.infoContent}>
                      <p className={styles.infoLabel}>Fecha de Creación:</p>
                      <p className={styles.infoText}>{datosDeMuestra.comunidad.fecha_creacion}</p>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>📊</div>
                    <div className={styles.infoContent}>
                      <p className={styles.infoLabel}>Total de Parcelas:</p>
                      <p className={styles.infoText}>{datosDeMuestra.comunidad.total_parcelas}</p>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>👥</div>
                    <div className={styles.infoContent}>
                      <p className={styles.infoLabel}>Usuarios Registrados:</p>
                      <p className={styles.infoText}>{datosDeMuestra.comunidad.usuarios_registrados}</p>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>📍</div>
                    <div className={styles.infoContent}>
                      <p className={styles.infoLabel}>Dirección Administrativa:</p>
                      <p className={styles.infoText}>{datosDeMuestra.comunidad.direccion_administrativa}</p>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>📞</div>
                    <div className={styles.infoContent}>
                      <p className={styles.infoLabel}>Teléfono de Contacto:</p>
                      <p className={styles.infoText}>{datosDeMuestra.comunidad.telefono_contacto}</p>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>📧</div>
                    <div className={styles.infoContent}>
                      <p className={styles.infoLabel}>Email de Contacto:</p>
                      <p className={styles.infoText}>{datosDeMuestra.comunidad.email_contacto}</p>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>🌐</div>
                    <div className={styles.infoContent}>
                      <p className={styles.infoLabel}>Sitio Web:</p>
                      <p className={styles.infoText}>{datosDeMuestra.comunidad.sitio_web}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isEditing && !changePasswordMode && !editingComunidad && (
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

            {isEditing && (
              <div className={styles.activityContainer}>
                <div className={styles.cardHeader}>
                  <h2>Editar Información Personal</h2>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="nombreCompleto">Nombre Completo</label>
                      <input
                        id="nombreCompleto"
                        type="text"
                        className={errors.nombreCompleto ? styles.inputError : ''}
                        {...register('nombreCompleto')}
                      />
                      {errors.nombreCompleto && <span className={styles.errorText}>{errors.nombreCompleto.message}</span>}
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="email">Email</label>
                      <input
                        id="email"
                        type="email"
                        className={errors.email ? styles.inputError : ''}
                        {...register('email')}
                      />
                      {errors.email && <span className={styles.errorText}>{errors.email.message}</span>}
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="telefono">Teléfono</label>
                      <input
                        id="telefono"
                        type="tel"
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
                        className={errors.direccion ? styles.inputError : ''}
                        {...register('direccion')}
                      />
                      {errors.direccion && <span className={styles.errorText}>{errors.direccion.message}</span>}
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="cargo">Cargo</label>
                      <input
                        id="cargo"
                        type="text"
                        className={`${styles.readOnly}`}
                        {...register('cargo')}
                        readOnly
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="rut">RUT</label>
                      <input
                        id="rut"
                        type="text"
                        className={`${styles.readOnly}`}
                        {...register('rut')}
                        readOnly
                      />
                    </div>
                  </div>

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
                </form>
              </div>
            )}

            {editingComunidad && (
              <div className={`${styles.activityContainer} ${styles.comunidadSection}`}>
                <div className={styles.cardHeader}>
                  <h2>Editar Información de la Comunidad</h2>
                </div>
                <form onSubmit={handleSubmitComunidad(onSubmitComunidad)} className={styles.form}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="nombre">Nombre de la Comunidad</label>
                      <input
                        id="nombre"
                        type="text"
                        className={comunidadErrors.nombre ? styles.inputError : ''}
                        {...registerComunidad('nombre')}
                      />
                      {comunidadErrors.nombre && <span className={styles.errorText}>{comunidadErrors.nombre.message}</span>}
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="fecha_creacion">Fecha de Creación</label>
                      <input
                        id="fecha_creacion"
                        type="text"
                        className={`${styles.readOnly}`}
                        {...registerComunidad('fecha_creacion')}
                        readOnly
                      />
                      <small className={styles.formHelper}>
                        La fecha de creación no puede ser modificada
                      </small>
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="direccion_administrativa">Dirección Administrativa</label>
                      <input
                        id="direccion_administrativa"
                        type="text"
                        defaultValue={datosDeMuestra.comunidad.direccion_administrativa}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="telefono_contacto">Teléfono de Contacto</label>
                      <input
                        id="telefono_contacto"
                        type="tel"
                        defaultValue={datosDeMuestra.comunidad.telefono_contacto}
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="email_contacto">Email de Contacto</label>
                      <input
                        id="email_contacto"
                        type="email"
                        defaultValue={datosDeMuestra.comunidad.email_contacto}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="sitio_web">Sitio Web</label>
                      <input
                        id="sitio_web"
                        type="text"
                        defaultValue={datosDeMuestra.comunidad.sitio_web}
                      />
                    </div>
                  </div>

                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={handleCancelComunidadEdit}
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
                </form>
              </div>
            )}

            {changePasswordMode && (
              <div className={styles.activityContainer}>
                <div className={styles.cardHeader}>
                  <h2>Cambiar Contraseña</h2>
                </div>
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
                    <small className={styles.formHelper}>
                      Ingrese el email asociado a su cuenta para verificar su identidad
                    </small>
                  </div>

                  <div className={styles.formRow}>
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
              </div>
            )}
          </div>
        </div>

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