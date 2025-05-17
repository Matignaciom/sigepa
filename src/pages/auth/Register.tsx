import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Register.module.css';
import { FaEye, FaEyeSlash, FaInfoCircle } from 'react-icons/fa';

// URL base de API
const API_URL = import.meta.env.VITE_API_URL || '/.netlify/functions';

// Validador de RUT chileno mejorado
const validateRut = (rut: string) => {
  if (!rut) return false;
  
  // Eliminar todos los caracteres no alfanuméricos excepto K/k
  const rutLimpio = rut.replace(/[^0-9kK]/g, '');
  
  // Verificar que tenga al menos 2 caracteres (1 número + dígito verificador)
  if (rutLimpio.length < 2) return false;
  
  // Separar el cuerpo del dígito verificador
  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1).toLowerCase();
  
  // Calcular dígito verificador
  let suma = 0;
  let multiplicador = 2;
  
  // Recorrer el cuerpo de derecha a izquierda
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  
  // Calcular dígito verificador esperado
  const dvEsperado = 11 - (suma % 11);
  let dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'k' : dvEsperado.toString();
  
  // Comparar dígito verificador calculado con el proporcionado
  return dvCalculado === dv;
};

const registerSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'La confirmación de contraseña debe tener al menos 6 caracteres'),
  rut: z.string().refine(validateRut, { message: 'RUT inválido. Formato correcto: 12.345.678-9' }),
  community: z.string().min(1, 'Seleccione una comunidad'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

// Tipo para las comunidades
type Community = {
  idComunidad: string;  // Cambiado de id a idComunidad
  nombre: string;       // Cambiado de name a nombre
};

// Función para formatear RUT chileno automáticamente
const formatRut = (value: string) => {
  // Eliminar puntos y guiones
  let rut = value.replace(/\./g, '').replace(/-/g, '');

  // Eliminar caracteres no numéricos ni K/k
  rut = rut.replace(/[^0-9kK]/g, '');

  // Separar dígito verificador
  let dv = '';
  if (rut.length > 1) {
    dv = rut.slice(-1);
    rut = rut.slice(0, -1);
  }

  // Formatear con puntos
  let rutFormateado = '';
  for (let i = rut.length; i > 0; i -= 3) {
    const inicio = Math.max(0, i - 3);
    rutFormateado = '.' + rut.substring(inicio, i) + rutFormateado;
  }

  // Eliminar el primer punto
  rutFormateado = rutFormateado.substring(1);

  // Agregar guión y dígito verificador si existe
  if (dv) {
    rutFormateado = rutFormateado + '-' + dv;
  }

  return rutFormateado;
};

export const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  // Eliminar la declaración de rutValue que no se usa
  // Eliminar la función handleRutChange que no se usa

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      community: '',
    }
  });

  // Cargar comunidades al montar el componente
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await fetch(`${API_URL}/obtener-comunidades`);
        const data = await response.json();

        if (response.ok && data.success) {
          setCommunities(data.comunidades);  // Cambiado de data.communities a data.comunidades
        } else {
          console.error('Error al cargar comunidades:', data.error);
        }
      } catch (error) {
        console.error('Error al cargar comunidades:', error);
      } finally {
        setLoadingCommunities(false);
      }
    };

    fetchCommunities();
  }, []);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await registerUser(data.name, data.email, data.password, data.rut, data.community);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Error al registrar usuario. Por favor, intente nuevamente.');
      }
    } catch (err) {
      setError('Ocurrió un error durante el registro. Por favor, intente nuevamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftSection}>
        <div className={styles.brandingContent}>
          <div className={styles.brandLogo}>SIGEPA</div>
          <h1 className={styles.brandTitle}>Únete a la comunidad</h1>
          <p className={styles.brandDescription}>
            Registra tu cuenta para acceder a todas las herramientas de gestión de pagos y administración de tu comunidad. En minutos podrás estar al día con gastos comunes y comunicados importantes.
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
          <h1 className={styles.title}>Crear cuenta</h1>
          <p className={styles.subtitle}>Completa tus datos para registrarte en el sistema</p>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>
                Nombre Completo
                <span className={styles.infoIcon} title="Ingresa tu nombre y apellidos completos">
                  <FaInfoCircle />
                </span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="name"
                  type="text"
                  className={styles.input}
                  placeholder="Juan Pérez González"
                  {...register('name')}
                />
              </div>
              {errors.name && <span className={styles.errorText}>{errors.name.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Correo Electrónico
                <span className={styles.infoIcon} title="Ingresa un correo electrónico válido">
                  <FaInfoCircle />
                </span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="email"
                  type="email"
                  className={styles.input}
                  placeholder="juan.perez@gmail.com"
                  {...register('email')}
                />
              </div>
              {errors.email && <span className={styles.errorText}>{errors.email.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="rut" className={styles.label}>
                RUT
                <span className={styles.infoIcon} title="Ingresa tu RUT con guión y dígito verificador">
                  <FaInfoCircle />
                </span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="rut"
                  type="text"
                  className={styles.input}
                  placeholder="12.345.678-9"
                  {...register('rut', {
                    onChange: (e) => {
                      const formattedValue = formatRut(e.target.value);
                      e.target.value = formattedValue;
                    }
                  })}
                />
              </div>
              {errors.rut && <span className={styles.errorText}>{errors.rut.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="community" className={styles.label}>
                Comunidad
                <span className={styles.infoIcon} title="Selecciona la comunidad a la que perteneces">
                  <FaInfoCircle />
                </span>
              </label>
              <div className={styles.inputWrapper}>
                <select
                  id="community"
                  className={styles.select}
                  {...register('community')}
                  disabled={loadingCommunities}
                >
                  <option value="">Selecciona tu comunidad</option>
                  {communities.map(community => (
                    <option key={community.idComunidad} value={community.idComunidad}>
                      {community.nombre}
                    </option>
                  ))}
                </select>
              </div>
              {errors.community && <span className={styles.errorText}>{errors.community.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Contraseña
                <span className={styles.infoIcon} title="La contraseña debe tener al menos 6 caracteres">
                  <FaInfoCircle />
                </span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={styles.input}
                  placeholder="Mínimo 6 caracteres"
                  {...register('password')}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <span className={styles.errorText}>{errors.password.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirmar Contraseña
                <span className={styles.infoIcon} title="Repite tu contraseña para confirmar">
                  <FaInfoCircle />
                </span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className={styles.input}
                  placeholder="Confirme su contraseña"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  title={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className={styles.errorText}>{errors.confirmPassword.message}</span>
              )}
            </div>

            <button type="submit" className={styles.button} disabled={isLoading}>
              {isLoading ? 'Registrando...' : 'Crear cuenta'}
            </button>
          </form>

          <div className={styles.links}>
            <Link to="/login" className={styles.link}>
              ¿Ya tienes una cuenta? Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};