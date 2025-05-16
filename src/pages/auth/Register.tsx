import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Register.module.css';
import { FaEye, FaEyeSlash, FaInfoCircle } from 'react-icons/fa';

// Validador de RUT chileno
const validateRut = (rut: string) => {
  if (!/^[0-9]+-[0-9kK]{1}$/.test(rut)) return false;
  
  const [number, verifier] = rut.split('-');
  let sum = 0;
  let multiplier = 2;
  
  for (let i = number.length - 1; i >= 0; i--) {
    sum += parseInt(number[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedVerifier = 11 - (sum % 11);
  let calculatedVerifier = expectedVerifier === 11 ? '0' : expectedVerifier === 10 ? 'K' : expectedVerifier.toString();
  
  return calculatedVerifier.toLowerCase() === verifier.toLowerCase();
};

const registerSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'La confirmación de contraseña debe tener al menos 6 caracteres'),
  rut: z.string().refine(validateRut, { message: 'RUT inválido. Formato correcto: 12345678-9' }),
  role: z.enum(['admin', 'coproprietario'], { 
    errorMap: () => ({ message: 'Seleccione un rol' }) 
  }),
  community: z.string().min(1, 'Seleccione una comunidad'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

// Lista de comunidades (simulada)
const COMMUNITIES = [
  { id: '1', name: 'Edificio Las Palmas' },
  { id: '2', name: 'Condominio El Bosque' },
  { id: '3', name: 'Edificio Parque Central' },
  { id: '4', name: 'Condominio Los Alpes' },
  { id: '5', name: 'Edificio Mirador' },
];

export const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: '',
      community: '',
    }
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Aquí añadiríamos los campos adicionales al registro
      const success = await registerUser(data.name, data.email, data.password);
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
                  {...register('rut')}
                />
              </div>
              {errors.rut && <span className={styles.errorText}>{errors.rut.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="role" className={styles.label}>
                Rol
                <span className={styles.infoIcon} title="Selecciona tu rol en el sistema">
                  <FaInfoCircle />
                </span>
              </label>
              <div className={styles.inputWrapper}>
                <select
                  id="role"
                  className={styles.select}
                  {...register('role')}
                >
                  <option value="">Selecciona tu rol</option>
                  <option value="admin">Administrador</option>
                  <option value="coproprietario">Copropietario</option>
                </select>
              </div>
              {errors.role && <span className={styles.errorText}>{errors.role.message}</span>}
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
                >
                  <option value="">Selecciona tu comunidad</option>
                  {COMMUNITIES.map(community => (
                    <option key={community.id} value={community.id}>
                      {community.name}
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