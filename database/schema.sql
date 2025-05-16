-- Esquema de base de datos para SIGEPA V2

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS sigepa_v2;
USE sigepa_v2;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  direccion VARCHAR(255),
  role ENUM('admin', 'copropietario') NOT NULL DEFAULT 'copropietario',
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso DATETIME,
  estado ENUM('activo', 'inactivo', 'suspendido') NOT NULL DEFAULT 'activo'
);

-- Tabla de parcelas
CREATE TABLE IF NOT EXISTS parcelas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_parcela VARCHAR(20) NOT NULL UNIQUE,
  superficie DECIMAL(10,2) NOT NULL COMMENT 'En metros cuadrados',
  ubicacion_geografica POINT,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('disponible', 'asignada', 'en_proceso') NOT NULL DEFAULT 'disponible'
);

-- Tabla de contratos
CREATE TABLE IF NOT EXISTS contratos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  parcela_id INT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  monto_mensual DECIMAL(10,2) NOT NULL,
  dia_pago INT NOT NULL COMMENT 'Día del mes para realizar el pago',
  estado ENUM('activo', 'finalizado', 'cancelado') NOT NULL DEFAULT 'activo',
  documento_url VARCHAR(255),
  notas TEXT,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (parcela_id) REFERENCES parcelas(id) ON DELETE CASCADE
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS pagos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contrato_id INT NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  fecha_pago DATETIME,
  monto DECIMAL(10,2) NOT NULL,
  metodo_pago ENUM('transferencia', 'efectivo', 'cheque', 'otro') DEFAULT NULL,
  comprobante_url VARCHAR(255),
  estado ENUM('pendiente', 'pagado', 'atrasado', 'anulado') NOT NULL DEFAULT 'pendiente',
  notas TEXT,
  FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE CASCADE
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  mensaje TEXT NOT NULL,
  tipo ENUM('informacion', 'alerta', 'pago', 'sistema') NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_lectura DATETIME,
  estado ENUM('no_leida', 'leida', 'archivada') NOT NULL DEFAULT 'no_leida',
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de alertas del sistema
CREATE TABLE IF NOT EXISTS alertas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parcela_id INT,
  contrato_id INT,
  tipo ENUM('pago_vencido', 'contrato_por_vencer', 'mantenimiento', 'otro') NOT NULL,
  descripcion TEXT NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_resolucion DATETIME,
  estado ENUM('activa', 'en_proceso', 'resuelta') NOT NULL DEFAULT 'activa',
  prioridad ENUM('baja', 'media', 'alta', 'critica') NOT NULL DEFAULT 'media',
  FOREIGN KEY (parcela_id) REFERENCES parcelas(id) ON DELETE SET NULL,
  FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE SET NULL
);

-- Tabla de historial de actividades
CREATE TABLE IF NOT EXISTS historial_actividades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  tipo_actividad VARCHAR(50) NOT NULL,
  descripcion TEXT NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS configuracion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clave VARCHAR(50) NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  descripcion VARCHAR(255),
  fecha_modificacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar datos de prueba para usuarios
INSERT INTO usuarios (email, password, nombre, apellido, telefono, direccion, role) VALUES
('admin@sigepa.com', '$2a$10$XlPBVQPNhGK4qMG9/QkX8.4CvI4.lOFzG9RBbRZ9vQ4QUUDm/hJlW', 'Administrador', 'Sistema', '123456789', 'Oficina Central', 'admin'),
('user@sigepa.com', '$2a$10$XlPBVQPNhGK4qMG9/QkX8.4CvI4.lOFzG9RBbRZ9vQ4QUUDm/hJlW', 'Usuario', 'Prueba', '987654321', 'Calle Principal 123', 'copropietario');

-- Insertar datos de prueba para parcelas
INSERT INTO parcelas (numero_parcela, superficie, estado) VALUES
('P001', 1000.00, 'asignada'),
('P002', 1200.00, 'asignada'),
('P003', 800.00, 'disponible'),
('P004', 1500.00, 'disponible');

-- Insertar datos de prueba para contratos
INSERT INTO contratos (usuario_id, parcela_id, fecha_inicio, monto_mensual, dia_pago, estado) VALUES
(2, 1, '2023-01-01', 150000.00, 5, 'activo');

-- Insertar datos de prueba para pagos
INSERT INTO pagos (contrato_id, fecha_vencimiento, fecha_pago, monto, metodo_pago, estado) VALUES
(1, '2023-02-05', '2023-02-03 14:30:00', 150000.00, 'transferencia', 'pagado'),
(1, '2023-03-05', '2023-03-04 10:15:00', 150000.00, 'transferencia', 'pagado'),
(1, '2023-04-05', NULL, 150000.00, NULL, 'pendiente');

-- Insertar datos de prueba para notificaciones
INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo) VALUES
(2, 'Recordatorio de pago', 'Su próximo pago vence el 5 de abril de 2023', 'pago'),
(2, 'Mantenimiento programado', 'Se realizará mantenimiento en el sistema de riego el próximo fin de semana', 'informacion');

-- Insertar datos de prueba para configuración
INSERT INTO configuracion (clave, valor, descripcion) VALUES
('dias_notificacion_pago', '5', 'Días de anticipación para notificar pagos pendientes'),
('dias_alerta_contrato', '30', 'Días de anticipación para alertar sobre contratos por vencer');