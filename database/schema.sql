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