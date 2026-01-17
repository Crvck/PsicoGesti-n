const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');

class DashboardController {
    
    static async obtenerDashboardCoordinador(req, res) {
        try {
            const usuarioId = req.user.id;
            const usuarioRol = req.user.rol;
            
            
            // Estadísticas generales
            let estadisticas = {};
            let citasPorDia = [];
            let topPsicologos = [];
            let becariosConCarga = [];
            let actividadReciente = [];
            let alertas = [];
            let evolucionMensual = [];
            
            try {
                const [estResult] = await sequelize.query(`
                    SELECT 
                        (SELECT COUNT(*) FROM pacientes WHERE activo = TRUE) as pacientes_activos,
                        (SELECT COUNT(*) FROM pacientes WHERE activo = FALSE) as pacientes_inactivos,
                        (SELECT COUNT(*) FROM pacientes WHERE DATE(created_at) = CURDATE()) as pacientes_nuevos_hoy,
                        (SELECT COUNT(*) FROM citas WHERE fecha = CURDATE() AND estado IN ('programada', 'confirmada')) as citas_hoy,
                        (SELECT COUNT(*) FROM citas WHERE fecha = CURDATE() AND estado = 'completada') as citas_completadas_hoy,
                        (SELECT COUNT(*) FROM citas WHERE fecha = CURDATE() AND estado = 'cancelada') as citas_canceladas_hoy,
                        (SELECT COUNT(*) FROM citas WHERE fecha BETWEEN DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND CURDATE()) as citas_semana,
                        (SELECT COUNT(*) FROM users WHERE rol = 'psicologo' AND activo = TRUE) as psicologos_activos,
                        (SELECT COUNT(*) FROM users WHERE rol = 'becario' AND activo = TRUE) as becarios_activos,
                        (SELECT COUNT(*) FROM users WHERE rol = 'coordinador' AND activo = TRUE) as coordinadores_activos,
                        (SELECT COUNT(*) FROM asignaciones WHERE estado = 'activa') as asignaciones_activas,
                        (SELECT COUNT(*) FROM asignaciones WHERE estado = 'finalizada' AND fecha_fin >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as asignaciones_finalizadas_mes,
                        (SELECT COUNT(*) FROM altas WHERE fecha_alta >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as altas_mes,
                        (SELECT COUNT(*) FROM altas WHERE fecha_alta = CURDATE()) as altas_hoy
                `, { type: QueryTypes.SELECT });
                estadisticas = estResult || {};
            } catch (e) {
                console.warn('Error en estadísticas:', e.message);
                estadisticas = {};
            }
            
            // Citas por día
            try {
                citasPorDia = await sequelize.query(`
                    SELECT 
                        DAYNAME(fecha) as dia,
                        COUNT(*) as total_citas,
                        SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) as completadas,
                        SUM(CASE WHEN estado = 'cancelada' THEN 1 ELSE 0 END) as canceladas
                    FROM citas
                    WHERE YEARWEEK(fecha, 1) = YEARWEEK(CURDATE(), 1)
                    GROUP BY DAYNAME(fecha), DAYOFWEEK(fecha)
                    ORDER BY DAYOFWEEK(fecha)
                `, { type: QueryTypes.SELECT });
            } catch (e) {
                console.warn('Error en citas por día:', e.message);
                citasPorDia = [];
            }
            
            // Top psicólogos
            try {
                topPsicologos = await sequelize.query(`
                    SELECT 
                        u.id,
                        CONCAT(u.nombre, ' ', u.apellido) as nombre_completo,
                        COUNT(c.id) as total_citas,
                        SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) as citas_completadas
                    FROM users u
                    LEFT JOIN citas c ON u.id = c.psicologo_id AND c.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                    WHERE u.rol = 'psicologo' AND u.activo = TRUE
                    GROUP BY u.id, u.nombre, u.apellido
                    ORDER BY citas_completadas DESC
                    LIMIT 5
                `, { type: QueryTypes.SELECT });
            } catch (e) {
                console.warn('Error en top psicólogos:', e.message);
                topPsicologos = [];
            }
            
            // Becarios con carga
            try {
                becariosConCarga = await sequelize.query(`
                    SELECT 
                        u.id,
                        CONCAT(u.nombre, ' ', u.apellido) as nombre_completo,
                        COUNT(DISTINCT a.paciente_id) as pacientes_asignados,
                        COUNT(DISTINCT c.id) as citas_este_mes,
                        GROUP_CONCAT(DISTINCT CONCAT(p.nombre, ' ', p.apellido) ORDER BY p.nombre SEPARATOR ', ') as pacientes
                    FROM users u
                    LEFT JOIN asignaciones a ON u.id = a.becario_id AND a.estado = 'activa'
                    LEFT JOIN pacientes p ON a.paciente_id = p.id
                    LEFT JOIN citas c ON u.id = c.becario_id AND c.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                    WHERE u.rol = 'becario' AND u.activo = TRUE
                    GROUP BY u.id, u.nombre, u.apellido
                    ORDER BY pacientes_asignados DESC
                    LIMIT 5
                `, { type: QueryTypes.SELECT });
            } catch (e) {
                console.warn('Error en becarios con carga:', e.message);
                becariosConCarga = [];
            }
            
            // Actividad reciente
            try {
                actividadReciente = await sequelize.query(`
                    SELECT 
                        c.id,
                        c.paciente_id,
                        c.fecha,
                        c.created_at as fecha_evento,
                        'Cita creada' as tipo_evento,
                        CONCAT(u.nombre, ' ', u.apellido) as usuario,
                        u.nombre as nombre_usuario,
                        CONCAT(p.nombre, ' ', p.apellido) as paciente_nombre,
                        'cita' as entidad_tipo
                    FROM citas c
                    LEFT JOIN users u ON c.psicologo_id = u.id
                    LEFT JOIN pacientes p ON c.paciente_id = p.id
                    WHERE c.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                    ORDER BY c.created_at DESC
                    LIMIT 5
                `, { type: QueryTypes.SELECT });
            } catch (e) {
                console.warn('Error en actividad reciente:', e.message);
                actividadReciente = [];
            }
            
            // Alertas
            try {
                alertas = await sequelize.query(`
                    SELECT 
                        'citas_sin_confirmar' as tipo,
                        COUNT(*) as cantidad,
                        'Citas programadas sin confirmar' as descripcion
                    FROM citas
                    WHERE estado = 'programada' AND fecha = CURDATE()
                    
                    UNION ALL
                    
                    SELECT 
                        'altas_pendientes' as tipo,
                        COUNT(*) as cantidad,
                        'Pacientes pendientes de revisión para alta' as descripcion
                    FROM pacientes p
                    WHERE p.activo = TRUE 
                    AND NOT EXISTS (SELECT 1 FROM altas a WHERE a.paciente_id = p.id)
                    AND (SELECT COUNT(*) FROM citas c WHERE c.paciente_id = p.id AND c.estado = 'completada') >= 4
                `, { type: QueryTypes.SELECT });
            } catch (e) {
                console.warn('Error en alertas:', e.message);
                alertas = [];
            }
            
            // Evolución mensual
            try {
                evolucionMensual = await sequelize.query(`
                    SELECT 
                        DATE_FORMAT(fecha_alta, '%Y-%m') as mes,
                        COUNT(*) as altas,
                        SUM(CASE WHEN tipo_alta = 'terapeutica' THEN 1 ELSE 0 END) as altas_terapeuticas,
                        SUM(CASE WHEN tipo_alta = 'abandono' THEN 1 ELSE 0 END) as abandonos
                    FROM altas
                    WHERE fecha_alta >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                    GROUP BY DATE_FORMAT(fecha_alta, '%Y-%m')
                    ORDER BY mes DESC
                    LIMIT 6
                `, { type: QueryTypes.SELECT });
            } catch (e) {
                console.warn('Error en evolución mensual:', e.message);
                evolucionMensual = [];
            }
            
            res.json({
                success: true,
                data: {
                    estadisticas,
                    citas_por_dia: citasPorDia,
                    top_psicologos: topPsicologos,
                    becarios_carga: becariosConCarga,
                    actividad_reciente: actividadReciente,
                    alertas,
                    evolucion_mensual: evolucionMensual.length > 0 ? evolucionMensual.reverse() : [],
                    ultima_actualizacion: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('Error en obtenerDashboardCoordinador:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener dashboard de coordinador'
            });
        }
    }
    
    static async obtenerDashboardPsicologo(req, res) {
        try {
            const usuarioId = req.user.id;
            const usuarioRol = req.user.rol;
            
            
            // Estadísticas del psicólogo
            const [estadisticas] = await sequelize.query(`
                SELECT 
                    -- Pacientes asignados
                    (SELECT COUNT(DISTINCT paciente_id) FROM asignaciones WHERE psicologo_id = ? AND estado = 'activa') as pacientes_asignados,
                    
                    -- Becarios supervisados
                    (SELECT COUNT(DISTINCT becario_id) FROM asignaciones WHERE psicologo_id = ? AND becario_id IS NOT NULL AND estado = 'activa') as becarios_supervisados,
                    
                    -- Citas
                    (SELECT COUNT(*) FROM citas WHERE psicologo_id = ? AND fecha = CURDATE() AND estado IN ('programada', 'confirmada')) as citas_hoy,
                    (SELECT COUNT(*) FROM citas WHERE psicologo_id = ? AND fecha = CURDATE() AND estado = 'completada') as citas_completadas_hoy,
                    (SELECT COUNT(*) FROM citas WHERE psicologo_id = ? AND fecha BETWEEN DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND CURDATE()) as citas_semana,
                    
                    -- Sesiones registradas
                    (SELECT COUNT(*) FROM sesiones WHERE psicologo_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as sesiones_mes,
                    
                    -- Observaciones realizadas
                    (SELECT COUNT(*) FROM observaciones_becarios WHERE supervisor_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as observaciones_mes,
                    
                    -- Altas realizadas
                    (SELECT COUNT(*) FROM altas WHERE usuario_id = ? AND fecha_alta >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as altas_mes
            `, {
                replacements: [usuarioId, usuarioId, usuarioId, usuarioId, usuarioId, usuarioId, usuarioId, usuarioId],
                type: QueryTypes.SELECT
            });
            
            // Próximas citas
            const proximasCitas = await sequelize.query(`
                SELECT 
                    c.id,
                    c.fecha,
                    TIME_FORMAT(c.hora, '%H:%i') as hora,
                    c.estado,
                    c.tipo_consulta,
                    CONCAT(p.nombre, ' ', p.apellido) as paciente,
                    p.telefono as paciente_telefono,
                    u_bec.nombre as becario_nombre
                FROM citas c
                JOIN pacientes p ON c.paciente_id = p.id
                LEFT JOIN users u_bec ON c.becario_id = u_bec.id
                WHERE c.psicologo_id = ?
                AND c.fecha >= CURDATE()
                AND c.estado IN ('programada', 'confirmada')
                ORDER BY c.fecha, c.hora
                LIMIT 10
            `, {
                replacements: [usuarioId],
                type: QueryTypes.SELECT
            });
            
            // Pacientes con seguimiento pendiente
            const pacientesSeguimiento = await sequelize.query(`
                SELECT 
                    p.id,
                    CONCAT(p.nombre, ' ', p.apellido) as paciente,
                    MAX(c.fecha) as ultima_sesion,
                    DATEDIFF(CURDATE(), MAX(c.fecha)) as dias_desde_ultima,
                    COUNT(c.id) as total_sesiones
                FROM asignaciones a
                JOIN pacientes p ON a.paciente_id = p.id
                LEFT JOIN citas c ON p.id = c.paciente_id AND c.estado = 'completada'
                WHERE a.psicologo_id = ?
                AND a.estado = 'activa'
                AND p.activo = TRUE
                GROUP BY p.id, p.nombre, p.apellido
                HAVING DATEDIFF(CURDATE(), MAX(c.fecha)) > 14 OR MAX(c.fecha) IS NULL
                ORDER BY dias_desde_ultima DESC
                LIMIT 5
            `, {
                replacements: [usuarioId],
                type: QueryTypes.SELECT
            });
            
            // Observaciones recientes de becarios
            const observacionesRecientes = await sequelize.query(`
                SELECT 
                    ob.id,
                    ob.fecha,
                    ob.aspecto_evaluado,
                    ob.calificacion,
                    CONCAT(u_bec.nombre, ' ', u_bec.apellido) as becario,
                    ob.plan_accion,
                    ob.fecha_seguimiento
                FROM observaciones_becarios ob
                JOIN users u_bec ON ob.becario_id = u_bec.id
                WHERE ob.supervisor_id = ?
                ORDER BY ob.fecha DESC, ob.created_at DESC
                LIMIT 5
            `, {
                replacements: [usuarioId],
                type: QueryTypes.SELECT
            });
            
            // Disponibilidad para la semana
            const disponibilidadSemana = await sequelize.query(`
                SELECT 
                    d.dia_semana,
                    TIME_FORMAT(d.hora_inicio, '%H:%i') as hora_inicio,
                    TIME_FORMAT(d.hora_fin, '%H:%i') as hora_fin,
                    COUNT(c.id) as citas_programadas
                FROM disponibilidades d
                LEFT JOIN citas c ON d.usuario_id = c.psicologo_id 
                    AND c.fecha BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                    AND c.estado IN ('programada', 'confirmada')
                    AND DAYNAME(c.fecha) = d.dia_semana
                    AND TIME(c.hora) BETWEEN d.hora_inicio AND d.hora_fin
                WHERE d.usuario_id = ?
                AND d.activo = TRUE
                GROUP BY d.dia_semana, d.hora_inicio, d.hora_fin
                ORDER BY FIELD(d.dia_semana, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo')
            `, {
                replacements: [usuarioId],
                type: QueryTypes.SELECT
            });
            
            res.json({
                success: true,
                data: {
                    estadisticas,
                    proximas_citas: proximasCitas,
                    pacientes_seguimiento: pacientesSeguimiento,
                    observaciones_recientes: observacionesRecientes,
                    disponibilidad_semana: disponibilidadSemana,
                    ultima_actualizacion: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('Error en obtenerDashboardPsicologo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener dashboard de psicólogo'
            });
        }
    }
    
    static async obtenerDashboardBecario(req, res) {
        try {
            const usuarioId = req.user.id;
            const usuarioRol = req.user.rol;
            
            
            // Estadísticas del becario
            const [estadisticas] = await sequelize.query(`
                SELECT 
                    -- Pacientes asignados
                    (SELECT COUNT(DISTINCT paciente_id) FROM asignaciones WHERE becario_id = ? AND estado = 'activa') as pacientes_asignados,
                    
                    -- Citas de hoy
                    (SELECT COUNT(*) FROM citas WHERE becario_id = ? AND fecha = CURDATE() AND estado IN ('programada', 'confirmada')) as citas_hoy,
                    (SELECT COUNT(*) FROM citas WHERE becario_id = ? AND fecha = CURDATE() AND estado = 'completada') as citas_completadas_hoy,
                    
                    -- Citas totales
                    (SELECT COUNT(*) FROM citas WHERE becario_id = ? AND fecha BETWEEN DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND CURDATE()) as citas_mes,
                    (SELECT COUNT(*) FROM citas WHERE becario_id = ? AND estado = 'completada') as citas_completadas_total,
                    
                    -- Observaciones recibidas
                    (SELECT COUNT(*) FROM observaciones_becarios WHERE becario_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as observaciones_mes,
                    (SELECT AVG(calificacion) FROM observaciones_becarios WHERE becario_id = ?) as promedio_calificacion,
                    
                    -- Supervisor
                    (SELECT CONCAT(u.nombre, ' ', u.apellido) FROM asignaciones a 
                     JOIN users u ON a.psicologo_id = u.id 
                     WHERE a.becario_id = ? AND a.estado = 'activa' LIMIT 1) as supervisor
            `, {
                replacements: [usuarioId, usuarioId, usuarioId, usuarioId, usuarioId, usuarioId, usuarioId, usuarioId],
                type: QueryTypes.SELECT
            });
            
            // Citas de hoy
            const citasHoy = await sequelize.query(`
                SELECT 
                    c.id,
                    TIME_FORMAT(c.hora, '%H:%i') as hora,
                    c.estado,
                    c.tipo_consulta,
                    CONCAT(p.nombre, ' ', p.apellido) as paciente,
                    p.telefono as paciente_telefono,
                    u_psi.nombre as psicologo_nombre
                FROM citas c
                JOIN pacientes p ON c.paciente_id = p.id
                LEFT JOIN users u_psi ON c.psicologo_id = u_psi.id
                WHERE c.becario_id = ?
                AND c.fecha = CURDATE()
                AND c.estado IN ('programada', 'confirmada', 'completada')
                ORDER BY c.hora
            `, {
                replacements: [usuarioId],
                type: QueryTypes.SELECT
            });
            
            // Próximas citas
            const proximasCitas = await sequelize.query(`
                SELECT 
                    c.id,
                    c.fecha,
                    TIME_FORMAT(c.hora, '%H:%i') as hora,
                    c.estado,
                    CONCAT(p.nombre, ' ', p.apellido) as paciente,
                    p.telefono as paciente_telefono
                FROM citas c
                JOIN pacientes p ON c.paciente_id = p.id
                WHERE c.becario_id = ?
                AND c.fecha > CURDATE()
                AND c.estado IN ('programada', 'confirmada')
                ORDER BY c.fecha, c.hora
                LIMIT 10
            `, {
                replacements: [usuarioId],
                type: QueryTypes.SELECT
            });
            
            // Observaciones recientes
            const observacionesRecientes = await sequelize.query(`
                SELECT 
                    ob.id,
                    ob.fecha,
                    ob.aspecto_evaluado,
                    ob.calificacion,
                    ob.fortalezas,
                    ob.areas_mejora,
                    CONCAT(u_sup.nombre, ' ', u_sup.apellido) as supervisor,
                    ob.fecha_seguimiento
                FROM observaciones_becarios ob
                JOIN users u_sup ON ob.supervisor_id = u_sup.id
                WHERE ob.becario_id = ?
                ORDER BY ob.fecha DESC
                LIMIT 5
            `, {
                replacements: [usuarioId],
                type: QueryTypes.SELECT
            });
            
            // Tareas pendientes (sesiones sin registro)
            const tareasPendientes = await sequelize.query(`
                SELECT 
                    c.id as cita_id,
                    c.fecha,
                    TIME_FORMAT(c.hora, '%H:%i') as hora,
                    CONCAT(p.nombre, ' ', p.apellido) as paciente,
                    DATEDIFF(CURDATE(), c.fecha) as dias_pasados
                FROM citas c
                JOIN pacientes p ON c.paciente_id = p.id
                WHERE c.becario_id = ?
                AND c.estado = 'completada'
                AND NOT EXISTS (SELECT 1 FROM sesiones s WHERE s.cita_id = c.id)
                AND c.fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                ORDER BY c.fecha DESC
                LIMIT 5
            `, {
                replacements: [usuarioId],
                type: QueryTypes.SELECT
            });
            
            // Disponibilidad
            const disponibilidad = await sequelize.query(`
                SELECT 
                    dia_semana,
                    TIME_FORMAT(hora_inicio, '%H:%i') as hora_inicio,
                    TIME_FORMAT(hora_fin, '%H:%i') as hora_fin
                FROM disponibilidades
                WHERE usuario_id = ?
                AND activo = TRUE
                ORDER BY FIELD(dia_semana, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo')
            `, {
                replacements: [usuarioId],
                type: QueryTypes.SELECT
            });
            
            res.json({
                success: true,
                data: {
                    estadisticas,
                    citas_hoy,
                    proximas_citas,
                    observaciones_recientes,
                    tareas_pendientes,
                    disponibilidad,
                    ultima_actualizacion: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('Error en obtenerDashboardBecario:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener dashboard de becario'
            });
        }
    }
    
    static async obtenerMetricasGlobales(req, res) {
        try {
            const { periodo = 'mes' } = req.query; // mes, trimestre, semestre, año
            
            let intervalo;
            switch (periodo) {
                case 'mes':
                    intervalo = 'INTERVAL 30 DAY';
                    break;
                case 'trimestre':
                    intervalo = 'INTERVAL 90 DAY';
                    break;
                case 'semestre':
                    intervalo = 'INTERVAL 180 DAY';
                    break;
                case 'año':
                    intervalo = 'INTERVAL 365 DAY';
                    break;
                default:
                    intervalo = 'INTERVAL 30 DAY';
            }
            
            // Métricas principales
            const [metricas] = await sequelize.query(`
                SELECT 
                    -- Pacientes
                    COUNT(DISTINCT p.id) as total_pacientes,
                    COUNT(DISTINCT CASE WHEN p.activo = TRUE THEN p.id END) as pacientes_activos,
                    COUNT(DISTINCT CASE WHEN p.activo = FALSE THEN p.id END) as pacientes_inactivos,
                    
                    -- Citas
                    COUNT(DISTINCT c.id) as total_citas,
                    COUNT(DISTINCT CASE WHEN c.estado = 'completada' THEN c.id END) as citas_completadas,
                    COUNT(DISTINCT CASE WHEN c.estado = 'cancelada' THEN c.id END) as citas_canceladas,
                    
                    -- Sesiones
                    COUNT(DISTINCT s.id) as sesiones_registradas,
                    
                    -- Altas
                    COUNT(DISTINCT a.id) as altas_realizadas,
                    COUNT(DISTINCT CASE WHEN a.tipo_alta = 'terapeutica' THEN a.id END) as altas_terapeuticas,
                    
                    -- Tasa de completitud
                    ROUND(COUNT(DISTINCT CASE WHEN c.estado = 'completada' THEN c.id END) * 100.0 / 
                          NULLIF(COUNT(DISTINCT c.id), 0), 2) as tasa_completitud_citas,
                    
                    -- Tasa de abandono
                    ROUND(COUNT(DISTINCT CASE WHEN a.tipo_alta = 'abandono' THEN a.id END) * 100.0 / 
                          NULLIF(COUNT(DISTINCT a.id), 0), 2) as tasa_abandono
                    
                FROM pacientes p
                LEFT JOIN citas c ON p.id = c.paciente_id AND c.fecha >= DATE_SUB(CURDATE(), ${intervalo})
                LEFT JOIN sesiones s ON c.id = s.cita_id
                LEFT JOIN altas a ON p.id = a.paciente_id AND a.fecha_alta >= DATE_SUB(CURDATE(), ${intervalo})
                WHERE p.created_at >= DATE_SUB(CURDATE(), ${intervalo})
            `, { type: QueryTypes.SELECT });
            
            // Evolución semanal
            const evolucionSemanal = await sequelize.query(`
                SELECT 
                    YEARWEEK(c.fecha, 1) as semana,
                    COUNT(DISTINCT c.id) as total_citas,
                    COUNT(DISTINCT CASE WHEN c.estado = 'completada' THEN c.id END) as citas_completadas,
                    COUNT(DISTINCT p.id) as pacientes_atendidos,
                    COUNT(DISTINCT a.id) as altas_realizadas
                FROM citas c
                LEFT JOIN pacientes p ON c.paciente_id = p.id
                LEFT JOIN altas a ON p.id = a.paciente_id AND YEARWEEK(a.fecha_alta, 1) = YEARWEEK(c.fecha, 1)
                WHERE c.fecha >= DATE_SUB(CURDATE(), ${intervalo})
                GROUP BY YEARWEEK(c.fecha, 1)
                ORDER BY semana DESC
                LIMIT 12
            `, { type: QueryTypes.SELECT });
            
            // Distribución por tipo de consulta
            const distribucionConsulta = await sequelize.query(`
                SELECT 
                    c.tipo_consulta,
                    COUNT(*) as cantidad,
                    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as porcentaje
                FROM citas c
                WHERE c.fecha >= DATE_SUB(CURDATE(), ${intervalo})
                GROUP BY c.tipo_consulta
            `, { type: QueryTypes.SELECT });
            
            // Distribución por motivo de alta
            const distribucionAlta = await sequelize.query(`
                SELECT 
                    a.tipo_alta,
                    COUNT(*) as cantidad,
                    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as porcentaje
                FROM altas a
                WHERE a.fecha_alta >= DATE_SUB(CURDATE(), ${intervalo})
                GROUP BY a.tipo_alta
            `, { type: QueryTypes.SELECT });
            
            res.json({
                success: true,
                data: {
                    periodo,
                    metricas,
                    evolucion_semanal: evolucionSemanal.reverse(),
                    distribucion_consulta: distribucionConsulta,
                    distribucion_alta: distribucionAlta,
                    fecha_consulta: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('Error en obtenerMetricasGlobales:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener métricas globales'
            });
        }
    }
}

module.exports = DashboardController;