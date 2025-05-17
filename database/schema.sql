-- Crear el usuario si no existe
CREATE USER IF NOT EXISTS 'admin'@'%' IDENTIFIED BY 'tu_contraseña_real';

-- Dar todos los privilegios
GRANT ALL PRIVILEGES ON sigepa_db.* TO 'admin'@'%';

-- Aplicar los cambios
FLUSH PRIVILEGES;

-- -- NUEVA ACTUALIZACION DE BD

-- Eliminar todas las tablas en orden correcto (para evitar problemas de claves foráneas)
DROP TABLE IF EXISTS Actividad;
DROP TABLE IF EXISTS UsuarioAviso;
DROP TABLE IF EXISTS Aviso;
DROP TABLE IF EXISTS Pago;
DROP TABLE IF EXISTS GastoParcela;
DROP TABLE IF EXISTS GastoComun;
DROP TABLE IF EXISTS Parcela;
DROP TABLE IF EXISTS Notificacion;
DROP TABLE IF EXISTS Contrato;
DROP TABLE IF EXISTS Usuario;
DROP TABLE IF EXISTS Comunidad;

-- Recrear la base de datos desde cero (opcional)
 DROP DATABASE IF EXISTS sigepa_db;
 CREATE DATABASE sigepa_db;
 USE sigepa_db;

-- -----------------------------------------------------
-- Tabla Comunidad
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Comunidad (
  idComunidad INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  fecha_creacion DATE NOT NULL DEFAULT (CURRENT_DATE)
);

-- -----------------------------------------------------
-- Tabla Usuario (RUT almacenado como hash SHA-256)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Usuario (
  idUsuario INT PRIMARY KEY AUTO_INCREMENT,
  nombreCompleto VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  contrasena CHAR(64) NOT NULL, -- Hash SHA-256
  rol ENUM('Administrador', 'Copropietario') NOT NULL,
  rut CHAR(64) NOT NULL, -- Hash del RUT (SHA-256)
  idComunidad INT NOT NULL,
  FOREIGN KEY (idComunidad) REFERENCES Comunidad(idComunidad)
);

-- -----------------------------------------------------
-- Tabla Parcela (Datos geoespaciales y nuevos campos)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Parcela (
  idParcela INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  direccion VARCHAR(255) NOT NULL,
  ubicacion GEOMETRY NOT NULL SRID 4326,
  area DECIMAL(10,2) NOT NULL COMMENT 'En hectáreas',
  estado ENUM('Al día', 'Pendiente', 'Atrasado') DEFAULT 'Al día',
  fechaAdquisicion DATE NOT NULL,
  valorCatastral DECIMAL(12,2) NOT NULL,
  idUsuario INT NOT NULL,
  idComunidad INT NOT NULL,
  FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario),
  FOREIGN KEY (idComunidad) REFERENCES Comunidad(idComunidad),
  SPATIAL INDEX (ubicacion)
);

-- -----------------------------------------------------
-- Tabla GastoComun (Actualizada con tipo de gasto)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS GastoComun (
  idGasto INT PRIMARY KEY AUTO_INCREMENT,
  concepto VARCHAR(255) NOT NULL,
  montoTotal DECIMAL(10,2) NOT NULL,
  fechaVencimiento DATE NOT NULL,
  tipo ENUM('Cuota Ordinaria', 'Cuota Extraordinaria', 'Multa', 'Otro') NOT NULL DEFAULT 'Cuota Ordinaria',
  idComunidad INT NOT NULL,
  estado ENUM('Pendiente', 'Activo', 'Cerrado') DEFAULT 'Pendiente',
  FOREIGN KEY (idComunidad) REFERENCES Comunidad(idComunidad)
);

-- -----------------------------------------------------
-- Tabla GastoParcela (Prorrateo con estado)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS GastoParcela (
  idGasto INT,
  idParcela INT,
  monto_prorrateado DECIMAL(10,2) NOT NULL,
  estado ENUM('Pendiente', 'Pagado', 'Atrasado') DEFAULT 'Pendiente',
  PRIMARY KEY (idGasto, idParcela),
  FOREIGN KEY (idGasto) REFERENCES GastoComun(idGasto),
  FOREIGN KEY (idParcela) REFERENCES Parcela(idParcela)
);

-- -----------------------------------------------------
-- Tabla Pago (Vinculación mejorada con comprobante - CORREGIDA)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Pago (
  idPago INT PRIMARY KEY AUTO_INCREMENT,
  montoPagado DECIMAL(10,2) NOT NULL,
  fechaPago DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('Pendiente', 'Pagado', 'Fallido') DEFAULT 'Pendiente',
  transaccion_id VARCHAR(255) UNIQUE COMMENT 'ID Transbank',
  comprobante VARCHAR(50) NOT NULL,
  descripcion TEXT,
  idUsuario INT NOT NULL,
  idGasto INT NOT NULL,
  idParcela INT NOT NULL,
  FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario),
  FOREIGN KEY (idGasto, idParcela) REFERENCES GastoParcela(idGasto, idParcela)
);

-- -----------------------------------------------------
-- Tabla Contrato (Actualizada con comunidad)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Contrato (
  idContrato INT PRIMARY KEY AUTO_INCREMENT,
  idComunidad INT NOT NULL,
  pdf_ruta VARCHAR(255) NOT NULL,
  estado ENUM('Vigente', 'Expirado') DEFAULT 'Vigente',
  FOREIGN KEY (idComunidad) REFERENCES Comunidad(idComunidad)
);

-- -----------------------------------------------------
-- Tabla Notificacion (Existente)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Notificacion (
  idNotificacion INT PRIMARY KEY AUTO_INCREMENT,
  tipo ENUM('email', 'push') NOT NULL,
  contenido TEXT NOT NULL,
  fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
  idUsuario INT NOT NULL,
  leida BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario)
);

-- -----------------------------------------------------
-- Tabla Aviso (Nueva para avisos comunitarios)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Aviso (
  idAviso INT PRIMARY KEY AUTO_INCREMENT,
  titulo VARCHAR(255) NOT NULL,
  contenido TEXT NOT NULL,
  fechaPublicacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fechaExpiracion DATE,
  idComunidad INT NOT NULL,
  FOREIGN KEY (idComunidad) REFERENCES Comunidad(idComunidad)
);

-- -----------------------------------------------------
-- Tabla UsuarioAviso (Relación N:M)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS UsuarioAviso (
  idUsuario INT NOT NULL,
  idAviso INT NOT NULL,
  leido BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (idUsuario, idAviso),
  FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario),
  FOREIGN KEY (idAviso) REFERENCES Aviso(idAviso)
);

-- -----------------------------------------------------
-- Tabla Actividad (Nueva para registro de actividades)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Actividad (
  idActividad INT PRIMARY KEY AUTO_INCREMENT,
  tipo ENUM('Pago', 'Documento', 'Notificación', 'Otro') NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  idUsuario INT NOT NULL,
  idParcela INT NOT NULL,
  FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario),
  FOREIGN KEY (idParcela) REFERENCES Parcela(idParcela)
);

CREATE TABLE IF NOT EXISTS CodigoVerificacion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  codigo VARCHAR(6) NOT NULL,
  fecha_expiracion DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_email (email)
);

-- -----------------------------------------------------
-- Índices para optimización
-- -----------------------------------------------------
CREATE INDEX idx_usuario_comunidad ON Usuario(idComunidad);
CREATE INDEX idx_gasto_comunidad ON GastoComun(idComunidad);
CREATE INDEX idx_pago_fecha ON Pago(fechaPago);
CREATE INDEX idx_gasto_vencimiento ON GastoComun(fechaVencimiento);
CREATE INDEX idx_actividad_usuario ON Actividad(idUsuario);
CREATE INDEX idx_actividad_fecha ON Actividad(fecha);
CREATE INDEX idx_aviso_comunidad ON Aviso(idComunidad);
CREATE INDEX idx_aviso_fecha ON Aviso(fechaPublicacion);


-- -----------------------------------------------------
-- INSERTS DATA EN LAS TABLAS
-- -----------------------------------------------------

-- Los datos incluyen:
-- 3 comunidades
-- 25 usuarios:
-- 5 administradores
-- 20 copropietarios
-- 15 parcelas distribuidas entre las comunidades
-- 9 gastos comunes
-- 25 registros de gastos por parcela
-- 9 pagos registrados
-- 6 avisos comunitarios
-- 15 registros de usuarios que han visto avisos
-- 10 notificaciones
-- 10 actividades registradas
-- 3 contratos
-- Para utilizar estos datos:
-- Primero ejecuta tu script para crear las tablas
-- Luego ejecuta el archivo inserts_sigepa.sql para poblar las tablas
-- Todos los usuarios tienen la misma contraseña (hash SHA-256 de "password123") para facilitar las pruebas.


-- Inserts para la tabla Comunidad
INSERT INTO Comunidad (nombre) VALUES ('Villa Los Pinos');
INSERT INTO Comunidad (nombre) VALUES ('Parcelación El Mirador');
INSERT INTO Comunidad (nombre) VALUES ('Condominio Las Acacias');

-- Inserts para la tabla Comunidad
INSERT INTO Comunidad (nombre) VALUES ('Villa Los Pinos');
INSERT INTO Comunidad (nombre) VALUES ('Parcelación El Mirador');
INSERT INTO Comunidad (nombre) VALUES ('Condominio Las Acacias');

-- Inserts para la tabla Usuario con contraseñas legibles y RUTs en formato chileno
-- Administradores
INSERT INTO Usuario (nombreCompleto, email, contrasena, rol, rut, idComunidad) VALUES 
('Ana Martínez', 'ana.martinez@ejemplo.com', SHA2('Admin123', 256), 'Administrador', SHA2('12.345.678-9', 256), 1),
('Carlos Rodríguez', 'carlos.rodriguez@ejemplo.com', SHA2('Admin456', 256), 'Administrador', SHA2('15.876.543-2', 256), 2),
('María López', 'maria.lopez@ejemplo.com', SHA2('Admin789', 256), 'Administrador', SHA2('9.654.321-K', 256), 3),
('Javier Salinas', 'javier.salinas@ejemplo.com', SHA2('Admin2023', 256), 'Administrador', SHA2('17.289.456-3', 256), 1),
('Patricia Díaz', 'patricia.diaz@ejemplo.com', SHA2('AdminPD2023', 256), 'Administrador', SHA2('14.567.890-1', 256), 2);

-- Copropietarios
INSERT INTO Usuario (nombreCompleto, email, contrasena, rol, rut, idComunidad) VALUES 
('Roberto Fuentes', 'roberto.fuentes@ejemplo.com', SHA2('Coprorf2023', 256), 'Copropietario', SHA2('18.987.654-3', 256), 1),
('Sofía Vega', 'sofia.vega@ejemplo.com', SHA2('Coprosv2023', 256), 'Copropietario', SHA2('16.789.012-4', 256), 1),
('Esteban Núñez', 'esteban.nunez@ejemplo.com', SHA2('Coproen2023', 256), 'Copropietario', SHA2('13.456.789-0', 256), 1),
('Laura Torres', 'laura.torres@ejemplo.com', SHA2('Coprolt2023', 256), 'Copropietario', SHA2('19.345.678-2', 256), 1),
('Gabriel Ruiz', 'gabriel.ruiz@ejemplo.com', SHA2('Coprogr2023', 256), 'Copropietario', SHA2('11.234.567-8', 256), 1),
('Camila Soto', 'camila.soto@ejemplo.com', SHA2('Coprocs2023', 256), 'Copropietario', SHA2('20.123.456-7', 256), 2),
('Andrés Pérez', 'andres.perez@ejemplo.com', SHA2('Coproap2023', 256), 'Copropietario', SHA2('15.678.901-2', 256), 2),
('Valentina Ramos', 'valentina.ramos@ejemplo.com', SHA2('Coprovr2023', 256), 'Copropietario', SHA2('17.890.123-4', 256), 2),
('Nicolás Castro', 'nicolas.castro@ejemplo.com', SHA2('Copronc2023', 256), 'Copropietario', SHA2('14.901.234-5', 256), 2),
('Daniela Morales', 'daniela.morales@ejemplo.com', SHA2('Coprodm2023', 256), 'Copropietario', SHA2('18.012.345-6', 256), 2),
('Felipe Ortiz', 'felipe.ortiz@ejemplo.com', SHA2('Coprofo2023', 256), 'Copropietario', SHA2('13.789.012-3', 256), 3),
('Isidora Vargas', 'isidora.vargas@ejemplo.com', SHA2('Coproiv2023', 256), 'Copropietario', SHA2('19.890.123-4', 256), 3),
('Sebastián Silva', 'sebastian.silva@ejemplo.com', SHA2('Copross2023', 256), 'Copropietario', SHA2('16.901.234-5', 256), 3),
('Antonia Paredes', 'antonia.paredes@ejemplo.com', SHA2('Coproap2023', 256), 'Copropietario', SHA2('20.012.345-6', 256), 3),
('Benjamín Muñoz', 'benjamin.munoz@ejemplo.com', SHA2('Coprobm2023', 256), 'Copropietario', SHA2('12.123.456-7', 256), 3),
('Javiera Molina', 'javiera.molina@ejemplo.com', SHA2('Coprojm2023', 256), 'Copropietario', SHA2('17.234.567-8', 256), 1),
('Matías Espinoza', 'matias.espinoza@ejemplo.com', SHA2('Coprome2023', 256), 'Copropietario', SHA2('15.345.678-9', 256), 2),
('Constanza Rojas', 'constanza.rojas@ejemplo.com', SHA2('Coprocr2023', 256), 'Copropietario', SHA2('18.456.789-0', 256), 3),
('Tomás Navarro', 'tomas.navarro@ejemplo.com', SHA2('Coprotn2023', 256), 'Copropietario', SHA2('14.567.890-1', 256), 3),
('Paula Miranda', 'paula.miranda@ejemplo.com', SHA2('Copropm2023', 256), 'Copropietario', SHA2('16.678.901-2', 256), 2);

-- Inserts para la tabla Parcela
INSERT INTO Parcela (nombre, direccion, ubicacion, area, fechaAdquisicion, valorCatastral, idUsuario, idComunidad) VALUES 
('Parcela A1', 'Camino Los Pinos 123', ST_GeomFromText('POINT(-70.6506 -33.4378)', 4326), 1.5, '2022-01-15', 45000000, 6, 1),
('Parcela A2', 'Camino Los Pinos 145', ST_GeomFromText('POINT(-70.6512 -33.4382)', 4326), 1.8, '2022-02-20', 52000000, 7, 1),
('Parcela A3', 'Camino Los Pinos 167', ST_GeomFromText('POINT(-70.6518 -33.4386)', 4326), 2.0, '2022-03-10', 58000000, 8, 1),
('Parcela A4', 'Camino Los Pinos 189', ST_GeomFromText('POINT(-70.6524 -33.4390)', 4326), 1.6, '2022-04-05', 48000000, 9, 1),
('Parcela A5', 'Camino Los Pinos 211', ST_GeomFromText('POINT(-70.6530 -33.4394)', 4326), 1.9, '2022-05-12', 55000000, 10, 1),
('Parcela B1', 'Mirador Alto 234', ST_GeomFromText('POINT(-70.6606 -33.4478)', 4326), 2.2, '2022-01-20', 65000000, 11, 2),
('Parcela B2', 'Mirador Alto 256', ST_GeomFromText('POINT(-70.6612 -33.4482)', 4326), 2.4, '2022-02-25', 70000000, 12, 2),
('Parcela B3', 'Mirador Alto 278', ST_GeomFromText('POINT(-70.6618 -33.4486)', 4326), 2.1, '2022-03-15', 62000000, 13, 2),
('Parcela B4', 'Mirador Alto 300', ST_GeomFromText('POINT(-70.6624 -33.4490)', 4326), 2.3, '2022-04-10', 68000000, 14, 2),
('Parcela B5', 'Mirador Alto 322', ST_GeomFromText('POINT(-70.6630 -33.4494)', 4326), 2.5, '2022-05-18', 72000000, 15, 2),
('Parcela C1', 'Las Acacias 345', ST_GeomFromText('POINT(-70.6706 -33.4578)', 4326), 1.4, '2022-01-25', 42000000, 16, 3),
('Parcela C2', 'Las Acacias 367', ST_GeomFromText('POINT(-70.6712 -33.4582)', 4326), 1.7, '2022-02-28', 50000000, 17, 3),
('Parcela C3', 'Las Acacias 389', ST_GeomFromText('POINT(-70.6718 -33.4586)', 4326), 1.6, '2022-03-20', 47000000, 18, 3),
('Parcela C4', 'Las Acacias 411', ST_GeomFromText('POINT(-70.6724 -33.4590)', 4326), 1.5, '2022-04-15', 45000000, 19, 3),
('Parcela C5', 'Las Acacias 433', ST_GeomFromText('POINT(-70.6730 -33.4594)', 4326), 1.8, '2022-05-22', 53000000, 20, 3);

-- Inserts para la tabla GastoComun
INSERT INTO GastoComun (concepto, montoTotal, fechaVencimiento, tipo, idComunidad, estado) VALUES
('Mantención áreas verdes Enero 2023', 1200000, '2023-01-31', 'Cuota Ordinaria', 1, 'Activo'),
('Reparación caminos internos', 3500000, '2023-02-28', 'Cuota Extraordinaria', 1, 'Activo'),
('Seguridad Febrero 2023', 1500000, '2023-02-28', 'Cuota Ordinaria', 1, 'Activo'),
('Mantención áreas verdes Enero 2023', 950000, '2023-01-31', 'Cuota Ordinaria', 2, 'Activo'),
('Ampliación sistema de riego', 2800000, '2023-02-28', 'Cuota Extraordinaria', 2, 'Activo'),
('Seguridad Febrero 2023', 1300000, '2023-02-28', 'Cuota Ordinaria', 2, 'Activo'),
('Mantención áreas verdes Enero 2023', 1050000, '2023-01-31', 'Cuota Ordinaria', 3, 'Activo'),
('Renovación iluminación comunal', 2500000, '2023-02-28', 'Cuota Extraordinaria', 3, 'Activo'),
('Seguridad Febrero 2023', 1400000, '2023-02-28', 'Cuota Ordinaria', 3, 'Activo');

-- Inserts para la tabla GastoParcela
INSERT INTO GastoParcela (idGasto, idParcela, monto_prorrateado, estado) VALUES
(1, 1, 240000, 'Pagado'),
(1, 2, 240000, 'Pagado'),
(1, 3, 240000, 'Pagado'),
(1, 4, 240000, 'Pendiente'),
(1, 5, 240000, 'Pendiente'),
(2, 1, 700000, 'Pendiente'),
(2, 2, 700000, 'Pendiente'),
(2, 3, 700000, 'Atrasado'),
(2, 4, 700000, 'Atrasado'),
(2, 5, 700000, 'Pendiente'),
(3, 1, 300000, 'Pagado'),
(3, 2, 300000, 'Pagado'),
(3, 3, 300000, 'Pendiente'),
(3, 4, 300000, 'Pendiente'),
(3, 5, 300000, 'Pendiente'),
(4, 6, 190000, 'Pagado'),
(4, 7, 190000, 'Pagado'),
(4, 8, 190000, 'Pagado'),
(4, 9, 190000, 'Pagado'),
(4, 10, 190000, 'Pendiente'),
(5, 6, 560000, 'Pendiente'),
(5, 7, 560000, 'Pendiente'),
(5, 8, 560000, 'Pendiente'),
(5, 9, 560000, 'Atrasado'),
(5, 10, 560000, 'Atrasado');

-- Inserts para la tabla Pago
INSERT INTO Pago (montoPagado, fechaPago, estado, transaccion_id, comprobante, descripcion, idUsuario, idGasto, idParcela) VALUES
(240000, '2023-01-25 10:15:30', 'Pagado', 'TRX-001-2023', 'COMP-001-2023', 'Pago mantención áreas verdes enero', 6, 1, 1),
(240000, '2023-01-26 11:20:45', 'Pagado', 'TRX-002-2023', 'COMP-002-2023', 'Pago mantención áreas verdes enero', 7, 1, 2),
(240000, '2023-01-27 09:30:15', 'Pagado', 'TRX-003-2023', 'COMP-003-2023', 'Pago mantención áreas verdes enero', 8, 1, 3),
(300000, '2023-02-20 14:45:30', 'Pagado', 'TRX-004-2023', 'COMP-004-2023', 'Pago seguridad febrero', 6, 3, 1),
(300000, '2023-02-21 16:10:45', 'Pagado', 'TRX-005-2023', 'COMP-005-2023', 'Pago seguridad febrero', 7, 3, 2),
(190000, '2023-01-24 10:20:30', 'Pagado', 'TRX-006-2023', 'COMP-006-2023', 'Pago mantención áreas verdes enero', 11, 4, 6),
(190000, '2023-01-25 11:30:45', 'Pagado', 'TRX-007-2023', 'COMP-007-2023', 'Pago mantención áreas verdes enero', 12, 4, 7),
(190000, '2023-01-26 09:45:15', 'Pagado', 'TRX-008-2023', 'COMP-008-2023', 'Pago mantención áreas verdes enero', 13, 4, 8),
(190000, '2023-01-27 14:20:30', 'Pagado', 'TRX-009-2023', 'COMP-009-2023', 'Pago mantención áreas verdes enero', 14, 4, 9);

-- Inserts para la tabla Aviso
INSERT INTO Aviso (titulo, contenido, fechaPublicacion, fechaExpiracion, idComunidad) VALUES
('Corte de agua programado', 'Se realizará un corte de agua el día 15 de marzo desde las 09:00 hasta las 14:00 horas para mantenimiento de la red.', '2023-03-10 10:00:00', '2023-03-16', 1),
('Asamblea anual de copropietarios', 'Se convoca a todos los copropietarios a la asamblea anual que se realizará el día 25 de marzo a las 19:00 horas en la sede comunitaria.', '2023-03-01 11:30:00', '2023-03-26', 1),
('Campaña de vacunación mascotas', 'El día 20 de marzo se realizará una campaña de vacunación para mascotas en la plaza central de 10:00 a 16:00 horas.', '2023-03-05 09:45:00', '2023-03-21', 1),
('Corte de energía programado', 'La empresa eléctrica realizará trabajos de mantención el día 18 de marzo. El corte será desde las 10:00 hasta las 15:00 horas.', '2023-03-12 14:20:00', '2023-03-19', 2),
('Asamblea extraordinaria', 'Se convoca a asamblea extraordinaria para discutir el proyecto de ampliación de áreas comunes el día 22 de marzo a las 20:00 horas.', '2023-03-08 16:30:00', '2023-03-23', 2),
('Mantención piscina comunitaria', 'La piscina permanecerá cerrada los días 13 y 14 de marzo por trabajos de mantención y limpieza.', '2023-03-06 13:15:00', '2023-03-15', 3);

-- Inserts para la tabla UsuarioAviso
INSERT INTO UsuarioAviso (idUsuario, idAviso, leido) VALUES
(6, 1, true),
(7, 1, true),
(8, 1, false),
(9, 1, false),
(10, 1, false),
(6, 2, true),
(7, 2, false),
(8, 2, false),
(9, 2, false),
(10, 2, false),
(11, 4, true),
(12, 4, true),
(13, 4, false),
(14, 4, false),
(15, 4, false);

-- Inserts para la tabla Notificacion
INSERT INTO Notificacion (tipo, contenido, fecha_envio, idUsuario, leida) VALUES
('email', 'Se ha registrado su pago por concepto de mantención de áreas verdes.', '2023-01-25 10:20:30', 6, true),
('push', 'Recordatorio: Vence plazo para pago de cuota extraordinaria.', '2023-02-25 09:00:00', 6, false),
('email', 'Se ha registrado su pago por concepto de seguridad.', '2023-02-20 14:50:30', 6, true),
('email', 'Se ha registrado su pago por concepto de mantención de áreas verdes.', '2023-01-26 11:25:45', 7, true),
('push', 'Recordatorio: Vence plazo para pago de cuota extraordinaria.', '2023-02-25 09:00:00', 7, false),
('email', 'Se ha publicado un nuevo aviso en la comunidad.', '2023-03-10 10:05:00', 6, false),
('email', 'Se ha publicado un nuevo aviso en la comunidad.', '2023-03-10 10:05:00', 7, false),
('email', 'Se ha publicado un nuevo aviso en la comunidad.', '2023-03-10 10:05:00', 8, false),
('email', 'Se ha publicado un nuevo aviso en la comunidad.', '2023-03-10 10:05:00', 9, false),
('email', 'Se ha publicado un nuevo aviso en la comunidad.', '2023-03-10 10:05:00', 10, false);

-- Inserts para la tabla Actividad
INSERT INTO Actividad (tipo, descripcion, fecha, idUsuario, idParcela) VALUES
('Pago', 'Pago de cuota de mantención de áreas verdes', '2023-01-25 10:15:30', 6, 1),
('Pago', 'Pago de cuota de mantención de áreas verdes', '2023-01-26 11:20:45', 7, 2),
('Pago', 'Pago de cuota de mantención de áreas verdes', '2023-01-27 09:30:15', 8, 3),
('Notificación', 'Envío de recordatorio de pago', '2023-02-25 09:00:00', 6, 1),
('Notificación', 'Envío de recordatorio de pago', '2023-02-25 09:00:00', 7, 2),
('Pago', 'Pago de cuota de seguridad', '2023-02-20 14:45:30', 6, 1),
('Pago', 'Pago de cuota de seguridad', '2023-02-21 16:10:45', 7, 2),
('Notificación', 'Aviso de corte de agua programado', '2023-03-10 10:05:00', 6, 1),
('Notificación', 'Aviso de corte de agua programado', '2023-03-10 10:05:00', 7, 2),
('Notificación', 'Aviso de corte de agua programado', '2023-03-10 10:05:00', 8, 3);

-- Inserts para la tabla Contrato
INSERT INTO Contrato (idComunidad, pdf_ruta, estado) VALUES
(1, '/contratos/villa_los_pinos_2023.pdf', 'Vigente'),
(2, '/contratos/el_mirador_2023.pdf', 'Vigente'),
(3, '/contratos/las_acacias_2023.pdf', 'Vigente');


