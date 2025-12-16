-- =============================================
-- BASE DE DATOS: PsicoGestion
-- =============================================

CREATE DATABASE IF NOT EXISTS psicogestion_db;
USE psicogestion_db;

-- =============================================
-- TABLA DE FUNDACIONES/INSTITUCIONES
-- =============================================
CREATE TABLE fundaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(200) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    contacto_nombre VARCHAR(100),
    contacto_email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLA DE USUARIOS (Becarios/Psicólogos/Coordinadores)
-- =============================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    rol ENUM('coordinador', 'psicologo', 'becario') NOT NULL DEFAULT 'becario',
    especialidad VARCHAR(100),
    fundacion_id INT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (fundacion_id) REFERENCES fundaciones(id) ON DELETE SET NULL
);



-- =============================================
-- TABLA DE PACIENTES
-- =============================================
CREATE TABLE pacientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE,
    genero ENUM('masculino', 'femenino', 'otro'),
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    es_estudiante BOOLEAN DEFAULT FALSE,
    matricula VARCHAR(50),
    institucion_educativa VARCHAR(200),
    contacto_emergencia_nombre VARCHAR(100),
    contacto_emergencia_telefono VARCHAR(20),
    motivo_consulta TEXT,
    antecedentes TEXT,
    activo BOOLEAN DEFAULT TRUE,
    estado ENUM('activo', 'alta_terapeutica', 'abandono', 'traslado') DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- TABLA DE ASIGNACIONES (Psicólogo-Becario-Paciente)
-- =============================================
CREATE TABLE asignaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    psicologo_id INT NOT NULL,
    becario_id INT,
    paciente_id INT NOT NULL,
    fecha_asignacion DATE NOT NULL,
    fecha_fin DATE,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (psicologo_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (becario_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    UNIQUE KEY asignacion_activa (paciente_id, psicologo_id, fecha_fin)
);

-- =============================================
-- TABLA DE CITAS
-- =============================================
CREATE TABLE citas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    paciente_id INT NOT NULL,
    psicologo_id INT NOT NULL,
    becario_id INT,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    duracion_minutos INT DEFAULT 50,
    tipo_consulta ENUM('presencial', 'virtual') DEFAULT 'presencial',
    estado ENUM('programada', 'confirmada', 'en_progreso', 'completada', 'cancelada', 'no_asistio') DEFAULT 'programada',
    motivo TEXT,
    sala_consultorio VARCHAR(50),
    link_virtual VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (psicologo_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (becario_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_fecha (fecha),
    INDEX idx_estado (estado)
);

-- =============================================
-- TABLA DE SESIONES/EXPEDIENTE CLÍNICO
-- =============================================
CREATE TABLE sesiones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cita_id INT NOT NULL,
    psicologo_id INT NOT NULL,
    paciente_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME,
    hora_fin TIME,
    motivo_consulta TEXT,
    contenido_sesion TEXT,
    observaciones TEXT,
    tareas_asignadas TEXT,
    proxima_sesion DATE,
    archivos_adjuntos JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE CASCADE,
    FOREIGN KEY (psicologo_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    INDEX idx_paciente_fecha (paciente_id, fecha)
);

-- =============================================
-- TABLA DE NOTIFICACIONES
-- =============================================
CREATE TABLE notificaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    tipo ENUM('cita_nueva', 'cita_cancelada', 'cita_modificada', 'asignacion', 'mensaje', 'sistema') NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    link VARCHAR(500),
    fecha_notificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_leida TIMESTAMP NULL,
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_usuario_leida (usuario_id, leida)
);

-- =============================================
-- TABLA DE ALTAS
-- =============================================
CREATE TABLE altas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    paciente_id INT NOT NULL,
    psicologo_id INT NOT NULL,
    fecha_alta DATE NOT NULL,
    tipo_alta ENUM('alta_terapeutica', 'abandono', 'traslado', 'otro') NOT NULL,
    motivo TEXT,
    recomendaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (psicologo_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- TABLA DE REPORTES/ESTADÍSTICAS
-- =============================================
CREATE TABLE reportes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    tipo_reporte ENUM('mensual', 'trimestral', 'semestral', 'anual', 'personalizado') NOT NULL,
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    datos JSON,
    generado_por INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (generado_por) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- TABLA DE OBSERVACIONES DIARIAS (BECARIOS)
-- =============================================
CREATE TABLE observaciones_becarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    becario_id INT NOT NULL,
    fecha DATE NOT NULL,
    observaciones TEXT,
    dificultades TEXT,
    logros TEXT,
    preguntas_supervisor TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (becario_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY idx_becario_fecha (becario_id, fecha)
);

-- =============================================
-- TABLA DE DISPONIBILIDAD (PSICÓLOGOS/BECARIOS)
-- =============================================
CREATE TABLE disponibilidad (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    dia_semana ENUM('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo') NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY idx_usuario_dia (usuario_id, dia_semana)
);

-- =============================================
-- INSERCIÓN DE DATOS DE EJEMPLO
-- =============================================

-- Insertar algunas fundaciones
INSERT INTO fundaciones (nombre, telefono, contacto_nombre) VALUES
('Fundación Salud Mental Comunitaria', '555-1234', 'Dra. María González'),
('Asociación de Psicología Aplicada', '555-5678', 'Lic. Carlos Rodríguez');

-- Insertar usuarios de ejemplo (coordinador, psicólogo, becario)
-- Las contraseñas están hasheadas con bcrypt: 'cesun'
INSERT INTO users (email, password, nombre, apellido, telefono, rol, especialidad, fundacion_id) VALUES
('coordinador@psicogestion.com', '$2b$12$hae1TqJNVYIumXT7aPXKCO/lVf418E5.nXUCem30mFsG5itFuLDjq', 'Ana', 'Martínez', '555-1111', 'coordinador', 'Coordinación Clínica', 1),
('psicologo1@psicogestion.com', '$2b$12$hae1TqJNVYIumXT7aPXKCO/lVf418E5.nXUCem30mFsG5itFuLDjq', 'Luis', 'Fernández', '555-2222', 'psicologo', 'Terapia Cognitivo-Conductual', 1),
('becario1@psicogestion.com', '$2b$12$hae1TqJNVYIumXT7aPXKCO/lVf418E5.nXUCem30mFsG5itFuLDjq', 'Juan', 'Pérez', '555-3333', 'becario', 'Practicante de Psicología', 1),
('becario2@psicogestion.com', '$2b$12$hae1TqJNVYIumXT7aPXKCO/lVf418E5.nXUCem30mFsG5itFuLDjq', 'Sofía', 'Ramírez', '555-4444', 'becario', 'Practicante de Psicología', 2);

-- Insertar pacientes de ejemplo
INSERT INTO pacientes (nombre, apellido, fecha_nacimiento, genero, telefono, email, es_estudiante, matricula, institucion_educativa, motivo_consulta) VALUES
('Carlos', 'Gómez', '1998-05-15', 'masculino', '555-0011', 'carlos@gmail.com', TRUE, 'A123456', 'Universidad Nacional', 'Ansiedad académica'),
('Mariana', 'López', '1995-08-22', 'femenino', '555-0022', 'mariana@hotmail.com', FALSE, NULL, NULL, 'Estrés laboral'),
('Roberto', 'Sánchez', '2000-02-10', 'masculino', '555-0033', 'roberto@yahoo.com', TRUE, 'B789012', 'Instituto Tecnológico', 'Problemas de adaptación');

-- Insertar asignaciones
INSERT INTO asignaciones (psicologo_id, becario_id, paciente_id, fecha_asignacion) VALUES
(2, 3, 1, CURDATE()),
(2, 4, 2, CURDATE()),
(2, NULL, 3, CURDATE());

-- Insertar citas de ejemplo
INSERT INTO citas (paciente_id, psicologo_id, becario_id, fecha, hora, estado, tipo_consulta) VALUES
(1, 2, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', 'programada', 'presencial'),
(2, 2, 4, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:00:00', 'confirmada', 'virtual'),
(3, 2, NULL, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '09:00:00', 'programada', 'presencial');

-- Insertar notificaciones de ejemplo
INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje) VALUES
(3, 'cita_nueva', 'Nueva cita asignada', 'Tienes una nueva cita con Carlos Gómez para mañana a las 10:00 AM'),
(4, 'cita_modificada', 'Cita modificada', 'La cita con Mariana López ha sido cambiada a modalidad virtual');

-- =============================================
-- VISTAS ÚTILES PARA EL SISTEMA
-- =============================================

-- Vista para citas del día (para becarios)
CREATE OR REPLACE VIEW vista_citas_hoy AS
SELECT 
    c.id,
    CONCAT(p.nombre, ' ', p.apellido) AS paciente,
    c.fecha,
    c.hora,
    c.estado,
    c.tipo_consulta,
    c.sala_consultorio
FROM citas c
JOIN pacientes p ON c.paciente_id = p.id
WHERE c.fecha = CURDATE()
AND c.estado IN ('programada', 'confirmada')
ORDER BY c.hora;

-- Vista para pacientes asignados a cada becario/psicólogo
CREATE OR REPLACE VIEW vista_pacientes_asignados AS
SELECT 
    a.id,
    CONCAT(p.nombre, ' ', p.apellido) AS paciente,
    p.telefono,
    p.email,
    CONCAT(u.nombre, ' ', u.apellido) AS psicologo,
    CONCAT(ub.nombre, ' ', ub.apellido) AS becario,
    a.fecha_asignacion,
    (SELECT COUNT(*) FROM citas WHERE paciente_id = p.id AND estado = 'completada') AS sesiones_completadas
FROM asignaciones a
JOIN pacientes p ON a.paciente_id = p.id
JOIN users u ON a.psicologo_id = u.id
LEFT JOIN users ub ON a.becario_id = ub.id
WHERE p.activo = TRUE;

-- Vista para resumen de coordinación
CREATE OR REPLACE VIEW vista_resumen_coordinacion AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE rol = 'becario' AND activo = TRUE) AS becarios_activos,
    (SELECT COUNT(*) FROM users WHERE rol = 'psicologo' AND activo = TRUE) AS psicologos_activos,
    (SELECT COUNT(*) FROM pacientes WHERE activo = TRUE) AS pacientes_activos,
    (SELECT COUNT(*) FROM citas WHERE fecha = CURDATE() AND estado IN ('programada', 'confirmada')) AS citas_hoy,
    (SELECT COUNT(*) FROM citas WHERE fecha = CURDATE() AND estado = 'completada') AS citas_completadas_hoy,
    (SELECT COUNT(*) FROM altas WHERE MONTH(fecha_alta) = MONTH(CURDATE())) AS altas_mes_actual;

-- Vista para historial de sesiones por paciente
CREATE OR REPLACE VIEW vista_historial_sesiones AS
SELECT 
    s.id,
    s.fecha,
    CONCAT(p.nombre, ' ', p.apellido) AS paciente,
    CONCAT(u.nombre, ' ', u.apellido) AS psicologo,
    s.contenido_sesion,
    s.observaciones,
    s.tareas_asignadas,
    s.proxima_sesion
FROM sesiones s
JOIN pacientes p ON s.paciente_id = p.id
JOIN users u ON s.psicologo_id = u.id
ORDER BY s.fecha DESC;

-- =============================================
-- PROCEDIMIENTOS ALMACENADOS ÚTILES
-- =============================================

-- Procedimiento para obtener citas por fecha y becario
DELIMITER $$
CREATE PROCEDURE sp_obtener_citas_por_fecha_becario(
    IN p_fecha DATE,
    IN p_becario_id INT
)
BEGIN
    SELECT 
        c.*,
        CONCAT(p.nombre, ' ', p.apellido) AS paciente_nombre,
        p.telefono AS paciente_telefono
    FROM citas c
    JOIN pacientes p ON c.paciente_id = p.id
    WHERE c.fecha = p_fecha
    AND (c.becario_id = p_becario_id OR p_becario_id IS NULL)
    ORDER BY c.hora;
END$$
DELIMITER ;

-- Procedimiento para generar reporte mensual
DELIMITER $$
CREATE PROCEDURE sp_generar_reporte_mensual(
    IN p_mes INT,
    IN p_anio INT,
    IN p_psicologo_id INT
)
BEGIN
    SELECT 
        p.id,
        CONCAT(p.nombre, ' ', p.apellido) AS paciente,
        COUNT(c.id) AS total_sesiones,
        SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) AS sesiones_completadas,
        SUM(CASE WHEN c.estado = 'cancelada' THEN 1 ELSE 0 END) AS sesiones_canceladas
    FROM pacientes p
    LEFT JOIN citas c ON p.id = c.paciente_id 
        AND MONTH(c.fecha) = p_mes 
        AND YEAR(c.fecha) = p_anio
        AND (c.psicologo_id = p_psicologo_id OR p_psicologo_id IS NULL)
    WHERE p.activo = TRUE
    GROUP BY p.id, p.nombre, p.apellido;
END$$
DELIMITER ;

-- =============================================
-- TRIGGERS PARA AUTOMATIZACIÓN
-- =============================================

-- Trigger para actualizar estado del paciente cuando se da de alta
DELIMITER $$
CREATE TRIGGER tr_after_insert_alta
AFTER INSERT ON altas
FOR EACH ROW
BEGIN
    UPDATE pacientes 
    SET estado = NEW.tipo_alta,
        activo = FALSE,
        updated_at = NOW()
    WHERE id = NEW.paciente_id;
    
    -- Cancelar citas futuras del paciente
    UPDATE citas 
    SET estado = 'cancelada',
        updated_at = NOW()
    WHERE paciente_id = NEW.paciente_id 
    AND fecha > CURDATE()
    AND estado IN ('programada', 'confirmada');
END$$
DELIMITER ;

-- Trigger para notificar cambios en citas
DELIMITER $$
CREATE TRIGGER tr_after_update_cita
AFTER UPDATE ON citas
FOR EACH ROW
BEGIN
    IF OLD.fecha != NEW.fecha OR OLD.hora != NEW.hora OR OLD.tipo_consulta != NEW.tipo_consulta THEN
        -- Notificar al paciente (si tiene email)
        IF (SELECT email FROM pacientes WHERE id = NEW.paciente_id) IS NOT NULL THEN
            INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje)
            SELECT 
                u.id,
                'cita_modificada',
                'Cita modificada',
                CONCAT('Tu cita ha sido modificada. Nueva fecha: ', NEW.fecha, ' ', NEW.hora)
            FROM users u
            WHERE u.id IN (NEW.psicologo_id, NEW.becario_id)
            AND u.id IS NOT NULL;
        END IF;
    END IF;
END$$
DELIMITER ;

-- =============================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =============================================

CREATE INDEX idx_pacientes_activo ON pacientes(activo);
CREATE INDEX idx_citas_psicologo_fecha ON citas(psicologo_id, fecha, estado);
CREATE INDEX idx_sesiones_paciente ON sesiones(paciente_id);
CREATE INDEX idx_asignaciones_psicologo ON asignaciones(psicologo_id, fecha_fin);
CREATE INDEX idx_users_rol_activo ON users(rol, activo);

-- =============================================
-- PERMISOS DE USUARIO (OPCIONAL)
-- =============================================

-- Crear usuario para la aplicación (ajusta la contraseña)
CREATE USER IF NOT EXISTS 'psicogestion_user'@'localhost' IDENTIFIED BY 'SecurePass123!';
GRANT SELECT, INSERT, UPDATE, DELETE ON psicogestion_db.* TO 'psicogestion_user'@'localhost';
FLUSH PRIVILEGES;

-- =============================================
-- COMENTARIOS FINALES
-- =============================================

/*
ESTRUCTURA DE LA BASE DE DATOS:
1. users - Todos los usuarios del sistema
2. fundaciones - Instituciones a las que pertenecen los becarios
3. pacientes - Información de pacientes
4. asignaciones - Relación entre psicólogos, becarios y pacientes
5. citas - Agenda de citas
6. sesiones - Expediente clínico y notas de sesiones
7. notificaciones - Sistema de notificaciones
8. altas - Registro de altas de pacientes
9. reportes - Reportes y estadísticas
10. observaciones_becarios - Bitácora de becarios
11. disponibilidad - Horarios de psicólogos/becarios

VISTAS DISPONIBLES:
- vista_citas_hoy
- vista_pacientes_asignados
- vista_resumen_coordinacion
- vista_historial_sesiones

PROCEDIMIENTOS:
- sp_obtener_citas_por_fecha_becario
- sp_generar_reporte_mensual

NOTAS:
1. La contraseña de los usuarios debe ser hasheada con bcrypt antes de insertar
2. Para pruebas, puedes usar la contraseña 'cesun' hasheada
3. Ajusta los dominios de email y estructuras según tus necesidades
*/