import { useState } from 'react';
import { Layout } from '../../../components/layout/Layout';
import styles from './PerfilAdmin.module.css';

interface AdminData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  cargo: string;
  fechaRegistro: string;
  ultimoAcceso: string;
}

export const PerfilAdmin = () => {
  const [adminData, setAdminData] = useState<AdminData>({
    nombre: 'Admin',
    apellido: 'Sistema',
    email: 'admin@sigepa.com',
    telefono: '+56 9 1234 5678',
    cargo: 'Administrador General',
    fechaRegistro: '01/01/2023',
    ultimoAcceso: '15/06/2023'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<AdminData>(adminData);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para actualizar los datos en el backend
    setAdminData(formData);
    setIsEditing(false);
    setMessage({ text: 'Perfil actualizado correctamente', type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validar que las contraseñas coincidan
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ text: 'Las contraseñas no coinciden', type: 'error' });
      return;
    }
    
    // Aquí iría la lógica para actualizar la contraseña en el backend
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordForm(false);
    setMessage({ text: 'Contraseña actualizada correctamente', type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>Mi Perfil</h1>
        
        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}
        
        <div className={styles.profileContainer}>
          <div className={styles.profileHeader}>
            <div className={styles.avatarContainer}>
              <div className={styles.avatar}>
                {adminData.nombre.charAt(0)}{adminData.apellido.charAt(0)}
              </div>
            </div>
            <div className={styles.profileInfo}>
              <h2>{adminData.nombre} {adminData.apellido}</h2>
              <p className={styles.cargo}>{adminData.cargo}</p>
              <p className={styles.email}>{adminData.email}</p>
            </div>
          </div>
          
          <div className={styles.profileBody}>
            {!isEditing ? (
              <div className={styles.infoSection}>
                <h3>Información Personal</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Nombre:</span>
                    <span>{adminData.nombre} {adminData.apellido}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Email:</span>
                    <span>{adminData.email}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Teléfono:</span>
                    <span>{adminData.telefono}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Cargo:</span>
                    <span>{adminData.cargo}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Fecha de Registro:</span>
                    <span>{adminData.fechaRegistro}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Último Acceso:</span>
                    <span>{adminData.ultimoAcceso}</span>
                  </div>
                </div>
                
                <div className={styles.actions}>
                  <button 
                    className={styles.btnEditar}
                    onClick={() => setIsEditing(true)}
                  >
                    Editar Perfil
                  </button>
                  <button 
                    className={styles.btnPassword}
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                  >
                    Cambiar Contraseña
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form}>
                <h3>Editar Información Personal</h3>
                
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="nombre">Nombre</label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="apellido">Apellido</label>
                    <input
                      type="text"
                      id="apellido"
                      name="apellido"
                      value={formData.apellido}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="telefono">Teléfono</label>
                    <input
                      type="tel"
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="cargo">Cargo</label>
                    <input
                      type="text"
                      id="cargo"
                      name="cargo"
                      value={formData.cargo}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className={styles.formActions}>
                  <button type="submit" className={styles.btnGuardar}>
                    Guardar Cambios
                  </button>
                  <button 
                    type="button" 
                    className={styles.btnCancelar}
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(adminData);
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
            
            {showPasswordForm && !isEditing && (
              <form onSubmit={handlePasswordSubmit} className={styles.passwordForm}>
                <h3>Cambiar Contraseña</h3>
                
                <div className={styles.formGroup}>
                  <label htmlFor="currentPassword">Contraseña Actual</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="newPassword">Nueva Contraseña</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                
                <div className={styles.formActions}>
                  <button type="submit" className={styles.btnGuardar}>
                    Actualizar Contraseña
                  </button>
                  <button 
                    type="button" 
                    className={styles.btnCancelar}
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};