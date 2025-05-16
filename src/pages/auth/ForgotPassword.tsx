import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaInfoCircle, FaCheck, FaLock, FaEnvelope, FaKey } from 'react-icons/fa';
import styles from './ForgotPassword.module.css';

// Esquema para el paso 1: Solicitar correo
const emailSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
});

// Esquema para el paso 2: Verificar código
const verifyCodeSchema = z.object({
  code: z.string().min(6, 'El código debe tener al menos 6 caracteres'),
});

// Esquema para el paso 3: Cambiar contraseña
const resetPasswordSchema = z.object({
  oldPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'La confirmación debe tener al menos 6 caracteres'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type EmailForm = z.infer<typeof emailSchema>;
type VerifyCodeForm = z.infer<typeof verifyCodeSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Formulario para paso 1
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: errorsEmail },
    reset: resetEmail,
  } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  });

  // Formulario para paso 2
  const {
    register: registerCode,
    handleSubmit: handleSubmitCode,
    formState: { errors: errorsCode },
    reset: resetCode,
  } = useForm<VerifyCodeForm>({
    resolver: zodResolver(verifyCodeSchema),
  });

  // Formulario para paso 3
  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: errorsReset },
    reset: resetPassword,
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Limpiar formularios al cambiar de paso
  useEffect(() => {
    resetEmail();
    resetCode();
    resetPassword();
  }, [currentStep]);

  // Manejar envío de email
  const onSubmitEmail = async (data: EmailForm) => {
    setIsLoading(true);
    setError(null);
    try {
      // Simular envío de código al correo
      console.log(`Código de verificación para ${data.email}: 123456`);
      setEmail(data.email);
      setSuccess(`Código enviado a ${data.email}. Revisa la consola para ver el código.`);
      setTimeout(() => {
        setCurrentStep(2);
        setSuccess(null);
      }, 1500);
    } catch (err) {
      setError('Error al enviar el código. Por favor, inténtalo nuevamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar verificación de código
  const onSubmitCode = async (data: VerifyCodeForm) => {
    setIsLoading(true);
    setError(null);
    try {
      // Simular verificación de código
      if (data.code === '123456') {
        setSuccess('Código verificado correctamente.');
        setTimeout(() => {
          setCurrentStep(3);
          setSuccess(null);
        }, 1500);
      } else {
        setError('Código incorrecto. Por favor, verifica e intenta nuevamente.');
      }
    } catch (err) {
      setError('Error al verificar el código. Por favor, inténtalo nuevamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar cambio de contraseña
  const onSubmitReset = async (data: ResetPasswordForm) => {
    setIsLoading(true);
    setError(null);
    try {
      // Simular cambio de contraseña
      console.log('Contraseña restablecida para:', email);
      console.log('Contraseña antigua:', data.oldPassword);
      console.log('Contraseña nueva:', data.newPassword);
      setSuccess('¡Contraseña actualizada correctamente!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError('Error al restablecer la contraseña. Por favor, inténtalo nuevamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar el formulario según el paso actual
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <form onSubmit={handleSubmitEmail(onSubmitEmail)} className={styles.form}>
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
                  {...registerEmail('email')}
                />
              </div>
              {errorsEmail.email && <span className={styles.errorText}>{errorsEmail.email.message}</span>}
            </div>

            <button type="submit" className={styles.button} disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Enviar código de verificación'}
            </button>
          </form>
        );
      case 2:
        return (
          <form onSubmit={handleSubmitCode(onSubmitCode)} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="code" className={styles.label}>
                Código de verificación
                <span className={styles.infoIcon} title="Ingresa el código enviado a tu correo">
                  <FaInfoCircle />
                </span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="code"
                  type="text"
                  className={styles.input}
                  placeholder="Ingresa el código de 6 dígitos"
                  {...registerCode('code')}
                />
              </div>
              {errorsCode.code && <span className={styles.errorText}>{errorsCode.code.message}</span>}
            </div>

            <button type="submit" className={styles.button} disabled={isLoading}>
              {isLoading ? 'Verificando...' : 'Verificar código'}
            </button>
            
            <button 
              type="button" 
              className={styles.secondaryButton}
              onClick={() => setCurrentStep(1)}
            >
              Volver atrás
            </button>
          </form>
        );
      case 3:
        return (
          <form onSubmit={handleSubmitReset(onSubmitReset)} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="oldPassword" className={styles.label}>
                Contraseña Actual
                <span className={styles.infoIcon} title="Ingresa tu contraseña actual">
                  <FaInfoCircle />
                </span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="oldPassword"
                  type={showOldPassword ? "text" : "password"}
                  className={styles.input}
                  placeholder="Contraseña actual"
                  {...registerReset('oldPassword')}
                />
                <button 
                  type="button" 
                  className={styles.passwordToggle} 
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  title={showOldPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showOldPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errorsReset.oldPassword && 
                <span className={styles.errorText}>{errorsReset.oldPassword.message}</span>
              }
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="newPassword" className={styles.label}>
                Nueva Contraseña
                <span className={styles.infoIcon} title="La contraseña debe tener al menos 6 caracteres">
                  <FaInfoCircle />
                </span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  className={styles.input}
                  placeholder="Mínimo 6 caracteres"
                  {...registerReset('newPassword')}
                />
                <button 
                  type="button" 
                  className={styles.passwordToggle} 
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  title={showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errorsReset.newPassword && 
                <span className={styles.errorText}>{errorsReset.newPassword.message}</span>
              }
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirmar Nueva Contraseña
                <span className={styles.infoIcon} title="Repite tu nueva contraseña">
                  <FaInfoCircle />
                </span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className={styles.input}
                  placeholder="Confirma tu nueva contraseña"
                  {...registerReset('confirmPassword')}
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
              {errorsReset.confirmPassword && 
                <span className={styles.errorText}>{errorsReset.confirmPassword.message}</span>
              }
            </div>

            <button type="submit" className={styles.button} disabled={isLoading}>
              {isLoading ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
            
            <button 
              type="button" 
              className={styles.secondaryButton}
              onClick={() => setCurrentStep(2)}
            >
              Volver atrás
            </button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftSection}>
        <div className={styles.brandingContent}>
          <div className={styles.brandLogo}>SIGEPA</div>
          <h1 className={styles.brandTitle}>Recuperar contraseña</h1>
          <p className={styles.brandDescription}>
            ¿Olvidaste tu contraseña? No te preocupes. Te ayudaremos a recuperar el acceso a tu cuenta en tres sencillos pasos.
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
          
          <h2 className={styles.title}>Recuperar contraseña</h2>
          <p className={styles.subtitle}>Sigue los pasos para recuperar tu acceso</p>

          <div className={styles.progressContainer}>
            <div className={`${styles.progressItem} ${currentStep >= 1 ? styles.active : ''}`}>
              <div className={styles.progressIcon}>
                {currentStep > 1 ? <FaCheck /> : <FaEnvelope />}
              </div>
              <span>Verificar correo</span>
            </div>
            <div className={styles.progressLine}></div>
            <div className={`${styles.progressItem} ${currentStep >= 2 ? styles.active : ''}`}>
              <div className={styles.progressIcon}>
                {currentStep > 2 ? <FaCheck /> : <FaKey />}
              </div>
              <span>Código</span>
            </div>
            <div className={styles.progressLine}></div>
            <div className={`${styles.progressItem} ${currentStep >= 3 ? styles.active : ''}`}>
              <div className={styles.progressIcon}>
                <FaLock />
              </div>
              <span>Nueva contraseña</span>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          {renderStep()}

          <div className={styles.links}>
            <Link to="/login" className={styles.link}>
              Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}; 