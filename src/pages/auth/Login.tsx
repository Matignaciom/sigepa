import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaInfoCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import styles from './Login.module.css';

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      // Usar el método login del contexto de autenticación
      const success = await login(data.email, data.password);
      
      if (success) {
        // Obtener el rol del usuario desde localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          const role = userData.role;
          // Redirigir según rol
          navigate(role === 'administrador' ? '/admin' : '/dashboard');
        }
      } else {
        setError('Credenciales inválidas o error de conexión');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error de inicio de sesión:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftSection}>
        <div className={styles.brandingContent}>
          <div className={styles.brandLogo}>SIGEPA</div>
          <h1 className={styles.brandTitle}>Sistema de Gestión de Pagos</h1>
          <p className={styles.brandDescription}>
            Plataforma integral para gestionar los pagos y administración de parcelas de manera 
            eficiente, segura y transparente para todos los copropietarios.
          </p>
        </div>
        <div className={`${styles.decorationCircle} ${styles.circle1}`}></div>
        <div className={`${styles.decorationCircle} ${styles.circle2}`}></div>
      </div>
      
      <div className={styles.rightSection}>
        <div className={styles.formContainer}>
          <div className={styles.logoContainer}>
            <div className={styles.logo}>SIGEPA</div>
          </div>
          
          <h2 className={styles.title}>Iniciar Sesión</h2>
          <p className={styles.subtitle}>Ingresa tus credenciales para continuar</p>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Correo Electrónico
                <span className={styles.infoIcon} title="Ingresa el correo con el que te registraste">
                  <FaInfoCircle />
                </span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="email"
                  type="email"
                  className={styles.input}
                  placeholder="juan.perez@gmail.com"
                  autoComplete="email"
                  {...register('email')}
                />
              </div>
              {errors.email && <span className={styles.errorText}>{errors.email.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Contraseña
                <span className={styles.infoIcon} title="Mínimo 6 caracteres">
                  <FaInfoCircle />
                </span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={styles.input}
                  placeholder="**********"
                  autoComplete="current-password"
                  {...register('password')}
                />
                <button 
                  type="button" 
                  className={styles.passwordToggle} 
                  onClick={togglePasswordVisibility}
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <span className={styles.errorText}>{errors.password.message}</span>}
            </div>
            
            <div className={styles.forgot}>
              <Link to="/recuperar-password" className={styles.forgotLink}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button type="submit" className={styles.button} disabled={isLoading}>
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className={styles.links}>
            <Link to="/register" className={styles.link}>
              ¿No tienes una cuenta? Regístrate
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};