```sql
-- -----------------------------------------------------
-- Schema sigepa_db
-- -----------------------------------------------------
CREATE DATABASE IF NOT EXISTS `sigepa_db`
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_0900_ai_ci;

USE `sigepa_db`;

-- -----------------------------------------------------
-- Table `Comunidad`
-- -----------------------------------------------------
   CREATE TABLE IF NOT EXISTS `Comunidad` (
     `idComunidad` INT NOT NULL AUTO_INCREMENT,
     `nombre` VARCHAR(255) NOT NULL,
     `fecha_creacion` DATE NOT NULL DEFAULT (CURDATE()),
     `direccion_administrativa` VARCHAR(255),
     `telefono_contacto` VARCHAR(20),
     `email_contacto` VARCHAR(255),
     `sitio_web` VARCHAR(255),
     PRIMARY KEY (`idComunidad`)
   ) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `Usuario`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Usuario` (
  `idUsuario` INT NOT NULL AUTO_INCREMENT,
  `nombreCompleto` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `contrasena` CHAR(64) NOT NULL,
  `rol` ENUM('Administrador','Copropietario') NOT NULL,
  `rut` CHAR(64) NOT NULL,
  `idComunidad` INT NOT NULL,
  `rut_original` VARCHAR(20) NULL,
  `direccion` VARCHAR(255) NULL,
  `telefono` VARCHAR(20) NULL,
  `fechaRegistro` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idUsuario`),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC),
  INDEX `idx_usuario_comunidad` (`idComunidad` ASC),
  CONSTRAINT `fk_Usuario_Comunidad`
    FOREIGN KEY (`idComunidad`)
    REFERENCES `Comunidad` (`idComunidad`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `Parcela`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Parcela` (
  `idParcela` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `direccion` VARCHAR(255) NOT NULL,
  `ubicacion` GEOMETRY NOT NULL SRID 4326,
  `area` DECIMAL(10,2) NOT NULL COMMENT 'En hectáreas',
  `estado` ENUM('Al día','Pendiente','Atrasado') DEFAULT 'Al día',
  `fechaAdquisicion` DATE NOT NULL,
  `valorCatastral` DECIMAL(12,2) NOT NULL,
  `idUsuario` INT NOT NULL,
  `idComunidad` INT NOT NULL,
  PRIMARY KEY (`idParcela`),
  SPATIAL INDEX `ubicacion` (`ubicacion`),
  INDEX `fk_Parcela_Usuario_idx` (`idUsuario` ASC),
  INDEX `fk_Parcela_Comunidad1_idx` (`idComunidad` ASC),
  CONSTRAINT `fk_Parcela_Usuario`
    FOREIGN KEY (`idUsuario`)
    REFERENCES `Usuario` (`idUsuario`),
  CONSTRAINT `fk_Parcela_Comunidad1`
    FOREIGN KEY (`idComunidad`)
    REFERENCES `Comunidad` (`idComunidad`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `Actividad`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Actividad` (
  `idActividad` INT NOT NULL AUTO_INCREMENT,
  `tipo` ENUM('Pago','Documento','Notificación','Otro') NOT NULL,
  `descripcion` VARCHAR(255) NOT NULL,
  `fecha` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `idUsuario` INT NOT NULL,
  `idParcela` INT NOT NULL,
  PRIMARY KEY (`idActividad`),
  INDEX `idx_actividad_usuario` (`idUsuario` ASC),
  INDEX `idx_actividad_fecha` (`fecha` ASC),
  INDEX `fk_Actividad_Parcela1_idx` (`idParcela` ASC),
  CONSTRAINT `fk_Actividad_Usuario1`
    FOREIGN KEY (`idUsuario`)
    REFERENCES `Usuario` (`idUsuario`),
  CONSTRAINT `fk_Actividad_Parcela1`
    FOREIGN KEY (`idParcela`)
    REFERENCES `Parcela` (`idParcela`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `Aviso`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Aviso` (
  `idAviso` INT NOT NULL AUTO_INCREMENT,
  `titulo` VARCHAR(255) NOT NULL,
  `contenido` TEXT NOT NULL,
  `fechaPublicacion` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `fechaExpiracion` DATE NULL,
  `idComunidad` INT NOT NULL,
  `tipo` ENUM('informacion','alerta','pago','sistema') NOT NULL DEFAULT 'informacion',
  `idAutor` INT NOT NULL,
  `destinatarios` ENUM('todos','seleccionados') NOT NULL DEFAULT 'todos',
  PRIMARY KEY (`idAviso`),
  INDEX `idx_aviso_comunidad` (`idComunidad` ASC),
  INDEX `idx_aviso_fecha` (`fechaPublicacion` ASC),
  INDEX `idx_aviso_autor` (`idAutor` ASC),
  CONSTRAINT `fk_Aviso_Comunidad1`
    FOREIGN KEY (`idComunidad`)
    REFERENCES `Comunidad` (`idComunidad`),
  CONSTRAINT `fk_Aviso_Usuario1`
    FOREIGN KEY (`idAutor`)
    REFERENCES `Usuario` (`idUsuario`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `Contrato`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Contrato` (
  `idContrato` INT NOT NULL AUTO_INCREMENT,
  `idComunidad` INT NOT NULL,
  `idParcela` INT NULL,
  `idPropietario` INT NULL,
  `fechaInicio` DATE NULL,
  `fechaFin` DATE NULL,
  `pdf_ruta` VARCHAR(255) NOT NULL,
  `estado` ENUM('Vigente','Expirado') DEFAULT 'Vigente',
  PRIMARY KEY (`idContrato`),
  INDEX `fk_Contrato_Comunidad1_idx` (`idComunidad` ASC),
  INDEX `fk_Contrato_Parcela1_idx` (`idParcela` ASC),
  INDEX `fk_Contrato_Usuario1_idx` (`idPropietario` ASC),
  CONSTRAINT `fk_Contrato_Comunidad1`
    FOREIGN KEY (`idComunidad`)
    REFERENCES `Comunidad` (`idComunidad`),
  CONSTRAINT `fk_Contrato_Parcela1`
    FOREIGN KEY (`idParcela`)
    REFERENCES `Parcela` (`idParcela`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_Contrato_Usuario1`
    FOREIGN KEY (`idPropietario`)
    REFERENCES `Usuario` (`idUsuario`)
    ON DELETE SET NULL
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `GastoComun`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `GastoComun` (
  `idGasto` INT NOT NULL AUTO_INCREMENT,
  `concepto` VARCHAR(255) NOT NULL,
  `montoTotal` DECIMAL(10,2) NOT NULL,
  `fechaVencimiento` DATE NOT NULL,
  `tipo` ENUM('Cuota Ordinaria','Cuota Extraordinaria','Multa','Otro') NOT NULL DEFAULT 'Cuota Ordinaria',
  `idComunidad` INT NOT NULL,
  `estado` ENUM('Pendiente','Activo','Cerrado') DEFAULT 'Pendiente',
  PRIMARY KEY (`idGasto`),
  INDEX `idx_gasto_comunidad` (`idComunidad` ASC),
  INDEX `idx_gasto_vencimiento` (`fechaVencimiento` ASC),
  CONSTRAINT `fk_GastoComun_Comunidad1`
    FOREIGN KEY (`idComunidad`)
    REFERENCES `Comunidad` (`idComunidad`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `GastoParcela`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `GastoParcela` (
  `idGasto` INT NOT NULL,
  `idParcela` INT NOT NULL,
  `monto_prorrateado` DECIMAL(10,2) NOT NULL,
  `estado` ENUM('Pendiente','Pagado','Atrasado') DEFAULT 'Pendiente',
  PRIMARY KEY (`idGasto`, `idParcela`),
  INDEX `fk_GastoParcela_Parcela1_idx` (`idParcela` ASC),
  CONSTRAINT `fk_GastoParcela_GastoComun1`
    FOREIGN KEY (`idGasto`)
    REFERENCES `GastoComun` (`idGasto`),
  CONSTRAINT `fk_GastoParcela_Parcela1`
    FOREIGN KEY (`idParcela`)
    REFERENCES `Parcela` (`idParcela`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `Pago`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Pago` (
  `idPago` INT NOT NULL AUTO_INCREMENT,
  `montoPagado` DECIMAL(10,2) NOT NULL,
  `fechaPago` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` ENUM('Pendiente','Pagado','Fallido') DEFAULT 'Pendiente',
  `transaccion_id` VARCHAR(255) NULL COMMENT 'ID Transbank',
  `comprobante` VARCHAR(50) NOT NULL,
  `descripcion` TEXT NULL,
  `idUsuario` INT NOT NULL,
  `idGasto` INT NOT NULL,
  `idParcela` INT NOT NULL,
  PRIMARY KEY (`idPago`),
  UNIQUE INDEX `transaccion_id_UNIQUE` (`transaccion_id` ASC),
  INDEX `idx_pago_fecha` (`fechaPago` ASC),
  INDEX `fk_Pago_Usuario1_idx` (`idUsuario` ASC),
  INDEX `fk_Pago_GastoParcela1_idx` (`idGasto` ASC, `idParcela` ASC),
  CONSTRAINT `fk_Pago_Usuario1`
    FOREIGN KEY (`idUsuario`)
    REFERENCES `Usuario` (`idUsuario`),
  CONSTRAINT `fk_Pago_GastoParcela1`
    FOREIGN KEY (`idGasto` , `idParcela`)
    REFERENCES `GastoParcela` (`idGasto` , `idParcela`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `Notificacion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Notificacion` (
  `idNotificacion` INT NOT NULL AUTO_INCREMENT,
  `tipo` ENUM('email','push') NOT NULL,
  `contenido` TEXT NOT NULL,
  `fecha_envio` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `idUsuario` INT NOT NULL,
  `leida` TINYINT NULL DEFAULT 0,
  PRIMARY KEY (`idNotificacion`),
  INDEX `fk_Notificacion_Usuario1_idx` (`idUsuario` ASC),
  CONSTRAINT `fk_Notificacion_Usuario1`
    FOREIGN KEY (`idUsuario`)
    REFERENCES `Usuario` (`idUsuario`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `UsuarioAviso`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `UsuarioAviso` (
  `idUsuario` INT NOT NULL,
  `idAviso` INT NOT NULL,
  `leido` TINYINT NULL DEFAULT 0,
  `fechaLectura` DATETIME NULL,
  `respondido` TINYINT NULL DEFAULT 0,
  `fechaRespuesta` DATETIME NULL,
  `respuesta` TEXT NULL,
  PRIMARY KEY (`idUsuario`, `idAviso`),
  INDEX `fk_UsuarioAviso_Aviso1_idx` (`idAviso` ASC),
  CONSTRAINT `fk_UsuarioAviso_Usuario1`
    FOREIGN KEY (`idUsuario`)
    REFERENCES `Usuario` (`idUsuario`),
  CONSTRAINT `fk_UsuarioAviso_Aviso1`
    FOREIGN KEY (`idAviso`)
    REFERENCES `Aviso` (`idAviso`)
    ON DELETE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `CodigoVerificacion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `CodigoVerificacion` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `codigo` VARCHAR(6) NOT NULL,
  `fecha_expiracion` DATETIME NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `unique_email` (`email` ASC)
) ENGINE = InnoDB;
```

-- **Relaciones principales:**
-- 1. **Comunidad** tiene muchos **Usuarios** y **Parcelas**
-- 2. **Parcela** pertenece a un **Usuario** y una **Comunidad**
-- 3. **GastoComun** se divide en **GastoParcela** para cada parcela
-- 4. **Pagos** están asociados a **GastoParcela** y **Usuario**
-- 5. **Actividades** registran acciones de usuarios sobre parcelas
-- 6. **Avisos** se relacionan con comunidades y usuarios mediante **UsuarioAviso**
-- 7. **Notificaciones** se envían a usuarios específicos

-- **Características técnicas:**
-- - Motor InnoDB
-- - Codificación UTF8MB4
-- - Índices espaciales para coordenadas en Parcela
-- - Enums para estados predefinidos
-- - Triggers implícitos en campos con DEFAULT CURRENT_TIMESTAMP
-- - Relaciones con integridad referencial mediante FOREIGN KEYS





-- INSERCION DE DATOS DE PRUEBA

-- Insertar Comunidades
INSERT INTO Comunidad (nombre, fecha_creacion, direccion_administrativa, telefono_contacto, email_contacto, sitio_web) VALUES
('Bosque Verde', '2018-05-15', 'Av. Principal 1234, Santiago', '+56228887777', 'admin@bosqueverde.cl', 'www.bosqueverde.cl'),
('Los Alerces', '2020-02-20', 'Calle Los Pinos 567, Valparaíso', '+56332221111', 'contacto@losalerces.cl', 'www.losalercescomunidad.cl');

-- Insertar Administradores (1 por comunidad)
INSERT INTO Usuario (nombreCompleto, email, contrasena, rol, rut, idComunidad, rut_original, direccion, telefono) VALUES
('María González', 'maria.gonzalez.admin@gmail.com', SHA2('AdminPass123', 256), 'Administrador', SHA2('16255848-5', 256), 1, '16.255.848-5', 'Av. Principal 1234, Santiago', '+56991234567'),
('Pedro Sánchez', 'pedro.sanchez.admin@gmail.com', SHA2('AdminPass456', 256), 'Administrador', SHA2('18765432-3', 256), 2, '18.765.432-3', 'Calle Los Pinos 567, Valparaíso', '+56987654321');

-- Insertar Copropietarios (25 en total)
INSERT INTO Usuario (nombreCompleto, email, contrasena, rol, rut, idComunidad, rut_original, direccion, telefono)
VALUES
  ('Juan Pérez',     'juan.perez.cp1@gmail.com',    SHA2('UserPass123', 256), 'Copropietario', SHA2('12345678-9', 256), 1, '12.345.678-9', 'Calle Flores 123, Santiago',     '+56912345678'),
  ('Ana Riquelme',   'ana.riquelme.cp2@gmail.com',  SHA2('UserPass123', 256), 'Copropietario', SHA2('11222333-4', 256), 1, '11.222.333-4', 'Av. Parque 456, Santiago',       '+56923456789'),
  ('Carlos Muñoz',   'carlos.munoz.cp3@gmail.com',  SHA2('UserPass123', 256), 'Copropietario', SHA2('13444555-6', 256), 1, '13.444.555-6', 'Pasaje Central 789, Santiago',     '+56934567890'),
  ('Laura Silva',    'laura.silva.cp4@gmail.com',   SHA2('UserPass123', 256), 'Copropietario', SHA2('15666777-8', 256), 1, '15.666.777-8', 'Callejón Alto 321, Santiago',      '+56945678901'),
  ('Fernando Díaz',  'fernando.diaz.cp5@gmail.com', SHA2('UserPass123', 256), 'Copropietario', SHA2('17888999-1', 256), 1, '17.888.999-1', 'Camino Real 654, Santiago',        '+56956789012'),
  ('Isabel Morales', 'isabel.morales.cp6@gmail.com',SHA2('UserPass123', 256), 'Copropietario', SHA2('19000111-2', 256), 1, '19.000.111-2', 'Sendero Verde 987, Santiago',      '+56967890123'),
  ('Ricardo Soto',   'ricardo.soto.cp7@gmail.com',  SHA2('UserPass123', 256), 'Copropietario', SHA2('11111222-3', 256), 1, '11.111.222-3', 'Paseo del Bosque 147, Santiago',    '+56978901234'),
  ('Camila Vargas',  'camila.vargas.cp8@gmail.com', SHA2('UserPass123', 256), 'Copropietario', SHA2('12222333-4', 256), 1, '12.222.333-4', 'Rotonda Norte 258, Santiago',      '+56989012345'),
  ('Héctor Núñez',   'hector.nunez.cp9@gmail.com',  SHA2('UserPass123', 256), 'Copropietario', SHA2('13333444-5', 256), 1, '13.333.444-5', 'Mirador Sur 369, Santiago',        '+56990123456'),
  ('Valentina Ríos', 'valentina.rios.cp10@gmail.com',SHA2('UserPass123', 256),'Copropietario', SHA2('14444555-6', 256), 1, '14.444.555-6', 'Cuesta Arriba 753, Santiago',      '+56901234567'),
  ('Francisco Mora', 'francisco.mora.cp11@gmail.com',SHA2('UserPass123', 256),'Copropietario', SHA2('15555666-7', 256), 1, '15.555.666-7', 'Quebrada 951, Santiago',           '+56911223344'),
  ('Daniela Castro', 'daniela.castro.cp12@gmail.com',SHA2('UserPass123', 256),'Copropietario', SHA2('16666777-8', 256), 1, '16.666.777-8', 'Altos del Valle 357, Santiago',    '+56922334455');

INSERT INTO Usuario (nombreCompleto, email, contrasena, rol, rut, idComunidad, rut_original, direccion, telefono)
VALUES
-- Comunidad 2 (13 copropietarios)
('Marta Herrera', 'marta.herrera.cp13@gmail.com', SHA2('UserPass123', 256), 'Copropietario', SHA2('17777888-9', 256), 2, '17.777.888-9', 'Av. Costera 159, Valparaíso', '+56933445566'),
('Alejandro Guzmán', 'alejandro.guzman.cp14@gmail.com', SHA2('UserPass123', 256), 'Copropietario', SHA2('18888999-0', 256), 2, '18.888.999-0', 'Callejón del Mar 753, Valparaíso', '+56944556677'),
('Paulina Sánchez', 'paulina.sanchez.cp15@gmail.com', SHA2('UserPass123', 256), 'Copropietario', SHA2('19999000-1', 256), 2, '19.999.000-1', 'Subida El Faro 456, Valparaíso', '+56955667788'),
('Roberto Navarro', 'roberto.navarro.cp16@gmail.com', SHA2('UserPass123', 256), 'Copropietario', SHA2('20000111-2', 256), 2, '20.000.111-2', 'Playa Ancha 852, Valparaíso', '+56966778899'),
('Carolina Pizarro', 'carolina.pizarro.cp17@gmail.com', SHA2('UserPass123', 256), 'Copropietario', SHA2('21111222-3', 256), 2, '21.111.222-3', 'Cerro Alegre 654, Valparaíso', '+56977889900'),
('Gustavo Rojas', 'gustavo.rojas.cp18@gmail.com', SHA2('UserPass123', 256), 'Copropietario', SHA2('22222333-4', 256), 2, '22.222.333-4', 'Pasaje Atkinson 321, Valparaíso', '+56988990011'),
('Natalia Quiroz', 'natalia.quiroz.cp19@gmail.com', SHA2('UserPass123', 256), 'Copropietario', SHA2('23333444-5', 256), 2, '23.333.444-5', 'Av. Alemania 987, Valparaíso', '+56999001122'),
('Pablo Contreras', 'pablo.contreras.cp20@gmail.com', SHA2('UserPass123', 256), 'Copropietario', SHA2('24444555-6', 256), 2, '24.444.555-6', 'Cumbre del Sol 741, Valparaíso', '+56900112233'),
('Gabriela Muñoz', 'gabriela.munoz.cp21@gmail.com', SHA2('UserPass123', 256), 'Copropietario', SHA2('25555666-7', 256), 2, '25.555.666-7', 'Bajada Ecuador 369, Valparaíso', '+56911223344'),
('Diego Espinoza', 'diego.espinoza.cp22@gmail.com', SHA2('UserPass123', 256), 'Copropietario', SHA2('26666777-8', 256), 2, '26.666.777-8', 'Plaza Sotomayor 258, Valparaíso', '+56922334455'),
('Javiera Riquelme', 'javiera.riquelme.cp23@gmail.com', SHA2('UserPass123', 256), 'Copropietario', SHA2('27777888-9', 256), 2, '27.777.888-9', 'Paseo Yugoslavo 147, Valparaíso', '+56933445566'),
('Mauricio Lagos', 'mauricio.lagos.cp24@gmail.com', SHA2('UserPass123', 256), 'Copropietario', SHA2('28888999-0', 256), 2, '28.888.999-0', 'Cerro Florida 963, Valparaíso', '+56944556677'),
('Constanza Vera', 'constanza.vera.cp25@gmail.com', SHA2('UserPass123', 256), 'Copropietario', SHA2('29999000-1', 256), 2, '29.999.000-1', 'Av. Argentina 852, Valparaíso', '+56955667788');

-- Insertar Parcelas (5 por comunidad)
INSERT INTO Parcela (nombre, direccion, ubicacion, area, estado, fechaAdquisicion, valorCatastral, idUsuario, idComunidad) VALUES
-- Comunidad 1
('Parcela B1', 'Sector A, Lote 5', ST_GeomFromText('POINT(-33.4489 -70.6693)', 4326), 0.5, 'Al día', '2021-03-15', 150000000, 3, 1),
('Parcela B2', 'Sector B, Lote 12', ST_GeomFromText('POINT(-33.4495 -70.6701)', 4326), 0.8, 'Al día', '2020-12-10', 240000000, 4, 1),
('Parcela B3', 'Sector C, Lote 8', ST_GeomFromText('POINT(-33.4502 -70.6715)', 4326), 1.2, 'Atrasado', '2019-07-22', 360000000, 5, 1),
('Parcela B4', 'Sector D, Lote 3', ST_GeomFromText('POINT(-33.4510 -70.6720)', 4326), 0.6, 'Pendiente', '2022-01-05', 180000000, 6, 1),
('Parcela B5', 'Sector E, Lote 7', ST_GeomFromText('POINT(-33.4523 -70.6734)', 4326), 1.0, 'Al día', '2023-04-18', 300000000, 7, 1),

-- Comunidad 2
('Parcela A1', 'Manzana 2, Solar 4', ST_GeomFromText('POINT(-33.0455 -71.6193)', 4326), 0.7, 'Al día', '2021-08-12', 210000000, 16, 2),
('Parcela A2', 'Manzana 3, Solar 9', ST_GeomFromText('POINT(-33.0462 -71.6201)', 4326), 0.9, 'Al día', '2020-05-30', 270000000, 17, 2),
('Parcela A3', 'Manzana 5, Solar 2', ST_GeomFromText('POINT(-33.0470 -71.6215)', 4326), 1.5, 'Atrasado', '2019-11-15', 450000000, 18, 2),
('Parcela A4', 'Manzana 1, Solar 6', ST_GeomFromText('POINT(-33.0478 -71.6223)', 4326), 1.1, 'Pendiente', '2022-09-20', 330000000, 19, 2),
('Parcela A5', 'Manzana 4, Solar 8', ST_GeomFromText('POINT(-33.0485 -71.6230)', 4326), 0.4, 'Al día', '2023-02-10', 120000000, 20, 2);

-- Insertar Actividades
INSERT INTO Actividad (tipo, descripcion, fecha, idUsuario, idParcela) VALUES
('Pago', 'Pago cuota mensual mantención', '2023-10-05 15:30:00', 3, 1),
('Documento', 'Subida de escritura de propiedad', '2023-09-20 10:15:00', 4, 2),
('Notificación', 'Recordatorio pago cuota extraordinaria', '2023-10-10 09:00:00', 5, 3),
('Pago', 'Pago cuota ordinaria', '2023-10-07 16:45:00', 16, 6),
('Documento', 'Actualización de reglamento interno', '2023-10-12 11:20:00', 17, 7);

-- Insertar Avisos
INSERT INTO Aviso (titulo, contenido, fechaPublicacion, fechaExpiracion, idComunidad, tipo, idAutor, destinatarios) VALUES
('Mantención áreas comunes', 'Se informa corte de agua el 15/10 de 09:00 a 13:00 hrs', NOW(), '2023-10-15', 1, 'informacion', 1, 'todos'),
('Asamblea extraordinaria', 'Convocatoria a asamblea el 25/10 a las 19:00 hrs en sala de reuniones', NOW(), '2023-10-25', 2, 'informacion', 2, 'todos');

-- Insertar Gastos Comunes
INSERT INTO GastoComun (concepto, montoTotal, fechaVencimiento, tipo, idComunidad, estado) VALUES
('Mantención piscina y jardines', 1250000, '2023-11-05', 'Cuota Ordinaria', 1, 'Activo'),
('Reparación ascensores', 850000, '2023-11-10', 'Cuota Extraordinaria', 2, 'Activo');

-- Insertar Gastos por Parcela
INSERT INTO GastoParcela (idGasto, idParcela, monto_prorrateado, estado) VALUES
(1, 1, 250000, 'Pagado'),
(1, 2, 250000, 'Pendiente'),
(2, 6, 170000, 'Pagado'),
(2, 7, 170000, 'Atrasado');

-- Insertar Pagos
INSERT INTO Pago (montoPagado, fechaPago, estado, transaccion_id, comprobante, descripcion, idUsuario, idGasto, idParcela) VALUES
(250000, '2023-10-05 15:30:00', 'Pagado', 'TBK-123456', 'COMP-001', 'Pago mantención', 3, 1, 1),
(170000, '2023-10-06 10:15:00', 'Pagado', 'TBK-789012', 'COMP-002', 'Reparación ascensores', 16, 2, 6);

-- Insertar Notificaciones
INSERT INTO Notificacion (tipo, contenido, fecha_envio, idUsuario, leida) VALUES
('email', 'Su pago fue procesado exitosamente', NOW(), 3, 1),
('push', 'Tiene un pago pendiente de $250.000', NOW(), 4, 0);

-- Insertar Relación Usuario-Aviso
INSERT INTO UsuarioAviso (idUsuario, idAviso, leido, fechaLectura) VALUES
(3, 1, 1, NOW()),
(16, 2, 0, NULL);