-- Datos de prueba para la base de datos de SIGEPA
USE sigepa_db;

-- Crear comunidad por defecto
INSERT INTO Comunidad (idComunidad, nombre, fecha_creacion) 
VALUES (1, 'Comunidad Parcelación Los Aromos', CURRENT_DATE) 
ON DUPLICATE KEY UPDATE nombre = 'Comunidad Parcelación Los Aromos';

-- Crear usuarios de prueba
-- Contraseña en texto plano: admin123 y user123 (en un sistema real, usaríamos hash)
INSERT INTO Usuario (idUsuario, nombreCompleto, email, contrasena, rol, rut, idComunidad) 
VALUES 
(1, 'Administrador Sistema', 'admin@sigepa.com', 'admin123', 'Administrador', 'rutHash', 1),
(2, 'Usuario Prueba', 'usuario@sigepa.com', 'user123', 'Copropietario', 'rutHash', 1) 
ON DUPLICATE KEY UPDATE email = email;

-- Crear parcelas de prueba
-- Usar POINT para la ubicación geoespacial
INSERT INTO Parcela (idParcela, nombre, direccion, ubicacion, area, estado, fechaAdquisicion, valorCatastral, idUsuario, idComunidad) 
VALUES 
(1, 'Parcela A-1', 'Camino Principal Km 5', ST_GeomFromText('POINT(-70.6683 -33.4489)', 4326), 1.5, 'Al día', '2023-01-15', 50000000, 2, 1),
(2, 'Parcela A-2', 'Camino Principal Km 5.5', ST_GeomFromText('POINT(-70.6690 -33.4492)', 4326), 2.0, 'Al día', '2023-02-10', 65000000, 2, 1),
(3, 'Parcela B-1', 'Camino Secundario Km 1', ST_GeomFromText('POINT(-70.6675 -33.4480)', 4326), 1.2, 'Pendiente', '2023-03-05', 45000000, 2, 1),
(4, 'Parcela B-2', 'Camino Secundario Km 1.5', ST_GeomFromText('POINT(-70.6670 -33.4485)', 4326), 1.8, 'Al día', '2023-01-20', 55000000, 2, 1)
ON DUPLICATE KEY UPDATE nombre = nombre;

-- Crear contratos de prueba
INSERT INTO Contrato (idContrato, idComunidad, pdf_ruta, estado) 
VALUES 
(1, 1, '/documentos/contrato1.pdf', 'Vigente'),
(2, 1, '/documentos/contrato2.pdf', 'Vigente')
ON DUPLICATE KEY UPDATE estado = estado;

-- Crear gastos comunes de prueba
INSERT INTO GastoComun (idGasto, concepto, montoTotal, fechaVencimiento, tipo, idComunidad, estado) 
VALUES 
(1, 'Cuota mensual Enero 2023', 300000, '2023-01-31', 'Cuota Ordinaria', 1, 'Cerrado'),
(2, 'Cuota mensual Febrero 2023', 300000, '2023-02-28', 'Cuota Ordinaria', 1, 'Cerrado'),
(3, 'Cuota mensual Marzo 2023', 300000, '2023-03-31', 'Cuota Ordinaria', 1, 'Activo'),
(4, 'Reparación camino principal', 500000, '2023-04-15', 'Cuota Extraordinaria', 1, 'Activo')
ON DUPLICATE KEY UPDATE concepto = concepto;

-- Crear gastos por parcela
INSERT INTO GastoParcela (idGasto, idParcela, monto_prorrateado, estado) 
VALUES 
-- Gasto 1
(1, 1, 75000, 'Pagado'),
(1, 2, 100000, 'Pagado'),
(1, 3, 60000, 'Pagado'),
(1, 4, 65000, 'Pagado'),
-- Gasto 2
(2, 1, 75000, 'Pagado'),
(2, 2, 100000, 'Pagado'),
(2, 3, 60000, 'Pendiente'),
(2, 4, 65000, 'Pagado'),
-- Gasto 3
(3, 1, 75000, 'Pendiente'),
(3, 2, 100000, 'Pendiente'),
(3, 3, 60000, 'Pendiente'),
(3, 4, 65000, 'Pendiente'),
-- Gasto 4
(4, 1, 125000, 'Pendiente'),
(4, 2, 166666, 'Pendiente'),
(4, 3, 100000, 'Pendiente'),
(4, 4, 108334, 'Pendiente')
ON DUPLICATE KEY UPDATE monto_prorrateado = monto_prorrateado;

-- Crear pagos de prueba
INSERT INTO Pago (idPago, montoPagado, fechaPago, estado, transaccion_id, comprobante, descripcion, idUsuario, idGasto, idParcela) 
VALUES 
(1, 75000, '2023-01-20 10:15:00', 'Pagado', 'TR123456', 'COMP-001', 'Pago cuota enero parcela A-1', 2, 1, 1),
(2, 100000, '2023-01-22 14:30:00', 'Pagado', 'TR123457', 'COMP-002', 'Pago cuota enero parcela A-2', 2, 1, 2),
(3, 60000, '2023-01-25 11:45:00', 'Pagado', 'TR123458', 'COMP-003', 'Pago cuota enero parcela B-1', 2, 1, 3),
(4, 65000, '2023-01-28 09:20:00', 'Pagado', 'TR123459', 'COMP-004', 'Pago cuota enero parcela B-2', 2, 1, 4),
(5, 75000, '2023-02-15 10:30:00', 'Pagado', 'TR123460', 'COMP-005', 'Pago cuota febrero parcela A-1', 2, 2, 1),
(6, 100000, '2023-02-18 16:15:00', 'Pagado', 'TR123461', 'COMP-006', 'Pago cuota febrero parcela A-2', 2, 2, 2),
(7, 65000, '2023-02-20 13:45:00', 'Pagado', 'TR123462', 'COMP-007', 'Pago cuota febrero parcela B-2', 2, 2, 4)
ON DUPLICATE KEY UPDATE estado = estado;

-- Crear notificaciones de prueba
INSERT INTO Notificacion (idNotificacion, tipo, contenido, fecha_envio, idUsuario, leida) 
VALUES 
(1, 'email', 'Recordatorio de pago de cuota mensual de marzo', '2023-03-01 08:00:00', 2, true),
(2, 'email', 'Aviso de cuota extraordinaria por reparación de camino', '2023-03-15 10:30:00', 2, false),
(3, 'push', 'Recordatorio: Vencimiento próximo de cuota extraordinaria', '2023-04-01 09:00:00', 2, false)
ON DUPLICATE KEY UPDATE contenido = contenido;

-- Crear avisos comunitarios
INSERT INTO Aviso (idAviso, titulo, contenido, fechaPublicacion, fechaExpiracion, idComunidad) 
VALUES 
(1, 'Mantenimiento de caminos', 'Se realizará mantenimiento de caminos durante el mes de abril.', '2023-03-15 10:00:00', '2023-04-30', 1),
(2, 'Reunión de copropietarios', 'Se convoca a reunión el día 20 de abril a las 18:00 hrs.', '2023-03-20 15:30:00', '2023-04-20', 1),
(3, 'Corte programado de agua', 'El día 10 de abril habrá un corte programado de agua de 09:00 a 14:00 hrs.', '2023-04-01 08:00:00', NULL, 1)
ON DUPLICATE KEY UPDATE titulo = titulo;

-- Crear registros de usuario_aviso
INSERT INTO UsuarioAviso (idUsuario, idAviso, leido) 
VALUES 
(1, 1, true),
(1, 2, true),
(1, 3, true),
(2, 1, true),
(2, 2, false),
(2, 3, false)
ON DUPLICATE KEY UPDATE leido = leido;

-- Crear actividades de prueba
INSERT INTO Actividad (idActividad, tipo, descripcion, fecha, idUsuario, idParcela) 
VALUES 
(1, 'Pago', 'Pago de cuota enero realizado', '2023-01-20 10:15:00', 2, 1),
(2, 'Pago', 'Pago de cuota febrero realizado', '2023-02-15 10:30:00', 2, 1),
(3, 'Documento', 'Documento de contrato firmado', '2023-01-15 14:20:00', 2, 1),
(4, 'Notificación', 'Notificación de reunión enviada', '2023-03-20 15:30:00', 1, 1)
ON DUPLICATE KEY UPDATE descripcion = descripcion; 