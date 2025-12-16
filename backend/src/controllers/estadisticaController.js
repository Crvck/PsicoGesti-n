const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');

class EstadisticaController {
    
    static async obtenerEstadisticasGenerales(req, res) {
        try {
            const { fecha_inicio, fecha_fin } = req.query;
            
            // Construir condiciones de fecha
            let condicionesFecha = '';
            const replacements = [];
            
            if (fecha_inicio && fecha_fin) {
                condicionesFecha = 'WHERE fecha BETWEEN ? AND ?';
                replacements.push(fecha_inicio, fecha_fin);
            } else if (fecha_inicio) {
                condicionesFecha = 'WHERE fecha >= ?';
                replacements.push(fecha_inicio);
            } else if (fecha_fin) {
                condicionesFecha = 'WHERE fecha <= ?';
                replacements.push(fecha_fin);
            }
            
            // Estadísticas de citas
            const [estadisticasCitas] = await sequelize.query(`
                SELECT 
                    COUNT(*) as total_citas,
                    SUM(CASE WHEN estado = 'programada' THEN 1 ELSE 0 END) as programadas,
                    SUM(CASE WHEN estado = 'confirmada' THEN 1 ELSE 0 END) as confirmadas,
                    SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) as completadas,
                    SUM(CASE WHEN estado = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
                    ROUND(SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as tasa_completitud,
                    ROUND(SUM(CASE WHEN estado = 'cancelada' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as tasa_cancelacion,
                    COUNT(DISTINCT paciente_id) as pacientes_unicos,
                    COUNT(DISTINCT psicologo_id) as psicologos_activos,
                    COUNT(DISTINCT becario_id) as becarios_activos,
                    ROUND(AVG(duracion_minutos), 1) as duracion_promedio
                FROM citas
                ${condicionesFecha}
            `, { replacements, type: QueryTypes.SELECT });
            
            // Estadísticas de pacientes
            const [estadisticasPacientes] = await sequelize.query(`
                SELECT 
                    COUNT(*) as total_pacientes,
                    SUM(CASE WHEN activo = TRUE THEN 1 ELSE 0 END) as pacientes_activos,
                    SUM(CASE WHEN activo = FALSE THEN 1 ELSE 0 END) as pacientes_inactivos,
                    COUNT(DISTINCT genero) as generos_unicos,
                    ROUND(AVG(YEAR(CURDATE()) - YEAR(fecha_nacimiento)), 1) as edad_promedio,
                    (SELECT COUNT(*) FROM altas ${condicionesFecha.replace('fecha', 'fecha_alta')}) as altas_totales
                FROM pacientes
            `, { replacements, type: QueryTypes.SELECT });
            
            // Distribución por género
            const distribucionGenero = await sequelize.query(`
                SELECT 
                    COALESCE(genero, 'no especificado') as genero,
                    COUNT(*) as cantidad,
                    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as porcentaje
                FROM pacientes
                GROUP BY genero
                ORDER BY cantidad DESC
            `, { type: QueryTypes.SELECT });
            
            // Evolución mensual
            const evolucionMensual = await sequelize.query(`
                SELECT 
                    DATE_FORMAT(fecha, '%Y-%m') as mes,
                    COUNT(*) as total_citas,
                    SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) as citas_completadas,
                    COUNT(DISTINCT paciente_id) as pacientes_unicos,
                    COUNT(DISTINCT psicologo_id) as psicologos_activos
                FROM citas
                ${condicionesFecha ? condicionesFecha.replace('fecha', 'fecha') : 'WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)'}
                GROUP BY DATE_FORMAT(fecha, '%Y-%m')
                ORDER BY mes DESC
                LIMIT 12
            `, { replacements, type: QueryTypes.SELECT });
            
            // Top psicólogos por productividad
            const topPsicologos = await sequelize.query(`
                SELECT 
                    u.id,
                    CONCAT(u.nombre, ' ', u.apellido) as psicologo,
                    u.especialidad,
                    COUNT(c.id) as total_citas,
                    SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) as citas_completadas,
                    ROUND(SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) * 100.0 / COUNT(c.id), 2) as tasa_completitud,
                    COUNT(DISTINCT c.paciente_id) as pacientes_unicos,
                    ROUND(AVG(c.duracion_minutos), 1) as duracion_promedio
                FROM users u
                LEFT JOIN citas c ON u.id = c.psicologo_id ${condicionesFecha ? `AND ${condicionesFecha.replace('WHERE', '')}` : ''}
                WHERE u.rol = 'psicologo' AND u.activo = TRUE
                GROUP BY u.id, u.nombre, u.apellido, u.especialidad
                ORDER BY citas_completadas DESC
                LIMIT 10
            `, { replacements, type: QueryTypes.SELECT });
            
            res.json({
                success: true,
                data: {
                    periodo: {
                        fecha_inicio: fecha_inicio || 'No especificado',
                        fecha_fin: fecha_fin || 'No especificado'
                    },
                    citas: estadisticasCitas,
                    pacientes: estadisticasPacientes,
                    distribucion_genero: distribucionGenero,
                    evolucion_mensual: evolucionMensual.reverse(),
                    top_psicologos: topPsicologos,
                    fecha_consulta: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('Error en obtenerEstadisticasGenerales:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas generales'
            });
        }
    }
    
    static async obtenerEstadisticasPsicologo(req, res) {
        try {
            const { psicologo_id, fecha_inicio, fecha_fin } = req.query;
            const usuarioId = req.user.id;
            const usuarioRol = req.user.rol;
            
            // Verificar permisos
            let psicologoConsulta = psicologo_id;
            if (!psicologoConsulta && usuarioRol === 'psicologo') {
                psicologoConsulta = usuarioId;
            } else if (!psicologoConsulta) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere especificar un psicólogo'
                });
            }
            
            // Verificar que el psicólogo existe
            const [psicologo] = await sequelize.query(
                'SELECT id, nombre, apellido, especialidad FROM users WHERE id = ? AND rol = "psicologo"',
                { replacements: [psicologoConsulta], type: QueryTypes.SELECT }
            );
            
            if (!psicologo) {
                return res.status(404).json({
                    success: false,
                    message: 'Psicólogo no encontrado'
                });
            }
            
            // Construir condiciones de fecha
            let condicionesFecha = '';
            const replacements = [psicologoConsulta];
            
            if (fecha_inicio && fecha_fin) {
                condicionesFecha = 'AND c.fecha BETWEEN ? AND ?';
                replacements.push(fecha_inicio, fecha_fin);
            } else if (fecha_inicio) {
                condicionesFecha = 'AND c.fecha >= ?';
                replacements.push(fecha_inicio);
            } else if (fecha_fin) {
                condicionesFecha = 'AND c.fecha <= ?';
                replacements.push(fecha_fin);
            }
            
            // Estadísticas generales del psicólogo
            const [estadisticas] = await sequelize.query(`
                SELECT 
                    -- Citas
                    COUNT(c.id) as total_citas,
                    SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) as citas_completadas,
                    SUM(CASE WHEN c.estado = 'cancelada' THEN 1 ELSE 0 END) as citas_canceladas,
                    ROUND(SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) * 100.0 / COUNT(c.id), 2) as tasa_completitud,
                    
                    -- Pacientes
                    COUNT(DISTINCT c.paciente_id) as pacientes_unicos,
                    (SELECT COUNT(DISTINCT paciente_id) FROM asignaciones WHERE psicologo_id = ? AND estado = 'activa') as pacientes_activos,
                    
                    -- Sesiones
                    COUNT(s.id) as sesiones_registradas,
                    ROUND(AVG(TIMESTAMPDIFF(MINUTE, s.hora_inicio, s.hora_fin)), 1) as duracion_promedio_sesiones,
                    
                    -- Becarios supervisados
                    COUNT(DISTINCT a.becario_id) as becarios_supervisados,
                    
                    -- Observaciones
                    COUNT(ob.id) as observaciones_realizadas,
                    ROUND(AVG(ob.calificacion), 2) as promedio_calificacion_observaciones,
                    
                    -- Altas
                    COUNT(al.id) as altas_realizadas,
                    SUM(CASE WHEN al.tipo_alta = 'terapeutica' THEN 1 ELSE 0 END) as altas_terapeuticas
                    
                FROM users u
                LEFT JOIN citas c ON u.id = c.psicologo_id ${condicionesFecha}
                LEFT JOIN sesiones s ON c.id = s.cita_id
                LEFT JOIN asignaciones a ON u.id = a.psicologo_id AND a.estado = 'activa'
                LEFT JOIN observaciones_becarios ob ON u.id = ob.supervisor_id
                LEFT JOIN altas al ON u.id = al.usuario_id ${condicionesFecha.replace('c.fecha', 'al.fecha_alta')}
                WHERE u.id = ?
                GROUP BY u.id
            `, { replacements, type: QueryTypes.SELECT });
            
            // Evolución mensual
            const evolucionMensual = await sequelize.query(`
                SELECT 
                    DATE_FORMAT(c.fecha, '%Y-%m') as mes,
                    COUNT(c.id) as total_citas,
                    SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) as citas_completadas,
                    COUNT(DISTINCT c.paciente_id) as pacientes_unicos,
                    COUNT(s.id) as sesiones_registradas,
                    COUNT(al.id) as altas_realizadas
                FROM citas c
                LEFT JOIN sesiones s ON c.id = s.cita_id
                LEFT JOIN altas al ON c.paciente_id = al.paciente_id AND DATE_FORMAT(al.fecha_alta, '%Y-%m') = DATE_FORMAT(c.fecha, '%Y-%m')
                WHERE c.psicologo_id = ?
                ${condicionesFecha ? condicionesFecha : 'AND c.fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)'}
                GROUP BY DATE_FORMAT(c.fecha, '%Y-%m')
                ORDER BY mes DESC
                LIMIT 6
            `, { replacements: [psicologoConsulta, ...(condicionesFecha ? replacements.slice(1) : [])], type: QueryTypes.SELECT });
            
            // Distribución por tipo de consulta
            const distribucionConsulta = await sequelize.query(`
                SELECT 
                    c.tipo_consulta,
                    COUNT(*) as cantidad,
                    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as porcentaje
                FROM citas c
                WHERE c.psicologo_id = ?
                ${condicionesFecha}
                GROUP BY c.tipo_consulta
                ORDER BY cantidad DESC
            `, { replacements, type: QueryTypes.SELECT });
            
            // Pacientes con más sesiones
            const pacientesTop = await sequelize.query(`
                SELECT 
                    p.id,
                    CONCAT(p.nombre, ' ', p.apellido) as paciente,
                    COUNT(c.id) as total_sesiones,
                    MIN(c.fecha) as primera_sesion,
                    MAX(c.fecha) as ultima_sesion,
                    AVG(c.duracion_minutos) as duracion_promedio
                FROM citas c
                JOIN pacientes p ON c.paciente_id = p.id
                WHERE c.psicologo_id = ?
                AND c.estado = 'completada'
                ${condicionesFecha}
                GROUP BY p.id, p.nombre, p.apellido
                ORDER BY total_sesiones DESC
                LIMIT 10
            `, { replacements, type: QueryTypes.SELECT });
            
            // Horarios más productivos
            const horariosProductivos = await sequelize.query(`
                SELECT 
                    HOUR(c.hora) as hora,
                    COUNT(*) as total_citas,
                    SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) as citas_completadas,
                    ROUND(SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as tasa_completitud
                FROM citas c
                WHERE c.psicologo_id = ?
                ${condicionesFecha}
                GROUP BY HOUR(c.hora)
                ORDER BY total_citas DESC
                LIMIT 8
            `, { replacements, type: QueryTypes.SELECT });
            
            res.json({
                success: true,
                data: {
                    psicologo,
                    periodo: {
                        fecha_inicio: fecha_inicio || 'No especificado',
                        fecha_fin: fecha_fin || 'No especificado'
                    },
                    estadisticas: estadisticas || {},
                    evolucion_mensual: evolucionMensual.reverse(),
                    distribucion_consulta: distribucionConsulta,
                    pacientes_top: pacientesTop,
                    horarios_productivos: horariosProductivos,
                    fecha_consulta: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('Error en obtenerEstadisticasPsicologo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas del psicólogo'
            });
        }
    }
    
    static async obtenerEstadisticasBecario(req, res) {
        try {
            const { becario_id, fecha_inicio, fecha_fin } = req.query;
            const usuarioId = req.user.id;
            const usuarioRol = req.user.rol;
            
            // Verificar permisos
            let becarioConsulta = becario_id;
            if (!becarioConsulta && usuarioRol === 'becario') {
                becarioConsulta = usuarioId;
            } else if (!becarioConsulta) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere especificar un becario'
                });
            }
            
            // Verificar que el becario existe
            const [becario] = await sequelize.query(
                'SELECT id, nombre, apellido FROM users WHERE id = ? AND rol = "becario"',
                { replacements: [becarioConsulta], type: QueryTypes.SELECT }
            );
            
            if (!becario) {
                return res.status(404).json({
                    success: false,
                    message: 'Becario no encontrado'
                });
            }
            
            // Construir condiciones de fecha
            let condicionesFecha = '';
            const replacements = [becarioConsulta];
            
            if (fecha_inicio && fecha_fin) {
                condicionesFecha = 'AND c.fecha BETWEEN ? AND ?';
                replacements.push(fecha_inicio, fecha_fin);
            } else if (fecha_inicio) {
                condicionesFecha = 'AND c.fecha >= ?';
                replacements.push(fecha_inicio);
            } else if (fecha_fin) {
                condicionesFecha = 'AND c.fecha <= ?';
                replacements.push(fecha_fin);
            }
            
            // Estadísticas generales del becario
            const [estadisticas] = await sequelize.query(`
                SELECT 
                    -- Citas
                    COUNT(c.id) as total_citas,
                    SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) as citas_completadas,
                    SUM(CASE WHEN c.estado = 'cancelada' THEN 1 ELSE 0 END) as citas_canceladas,
                    ROUND(SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) * 100.0 / COUNT(c.id), 2) as tasa_completitud,
                    
                    -- Pacientes
                    COUNT(DISTINCT c.paciente_id) as pacientes_unicos,
                    (SELECT COUNT(DISTINCT paciente_id) FROM asignaciones WHERE becario_id = ? AND estado = 'activa') as pacientes_activos,
                    
                    -- Observaciones recibidas
                    COUNT(ob.id) as observaciones_recibidas,
                    ROUND(AVG(ob.calificacion), 2) as promedio_calificacion,
                    MIN(ob.calificacion) as calificacion_minima,
                    MAX(ob.calificacion) as calificacion_maxima,
                    
                    -- Supervisor
                    (SELECT CONCAT(u.nombre, ' ', u.apellido) FROM asignaciones a 
                     JOIN users u ON a.psicologo_id = u.id 
                     WHERE a.becario_id = ? AND a.estado = 'activa' LIMIT 1) as supervisor,
                    
                    -- Disponibilidad
                    (SELECT COUNT(*) FROM disponibilidades WHERE usuario_id = ? AND activo = TRUE) as horarios_configurados,
                    
                    -- Tiempo promedio entre citas
                    ROUND(AVG(DATEDIFF(
                        (SELECT MIN(c2.fecha) FROM citas c2 
                         WHERE c2.becario_id = c.becario_id 
                         AND c2.paciente_id = c.paciente_id 
                         AND c2.id > c.id),
                        c.fecha
                    )), 1) as dias_promedio_entre_citas
                    
                FROM users u
                LEFT JOIN citas c ON u.id = c.becario_id ${condicionesFecha}
                LEFT JOIN observaciones_becarios ob ON u.id = ob.becario_id
                WHERE u.id = ?
                GROUP BY u.id
            `, { replacements: [...replacements, becarioConsulta, becarioConsulta], type: QueryTypes.SELECT });
            
            // Evolución de calificaciones
            const evolucionCalificaciones = await sequelize.query(`
                SELECT 
                    DATE_FORMAT(ob.fecha, '%Y-%m') as mes,
                    COUNT(ob.id) as total_observaciones,
                    ROUND(AVG(ob.calificacion), 2) as promedio_calificacion,
                    MIN(ob.calificacion) as calificacion_minima,
                    MAX(ob.calificacion) as calificacion_maxima
                FROM observaciones_becarios ob
                WHERE ob.becario_id = ?
                ${condicionesFecha ? condicionesFecha.replace('c.fecha', 'ob.fecha') : 'AND ob.fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)'}
                GROUP BY DATE_FORMAT(ob.fecha, '%Y-%m')
                ORDER BY mes DESC
                LIMIT 6
            `, { replacements: [becarioConsulta, ...(condicionesFecha ? replacements.slice(1) : [])], type: QueryTypes.SELECT });
            
            // Distribución por aspecto evaluado
            const distribucionAspectos = await sequelize.query(`
                SELECT 
                    ob.aspecto_evaluado,
                    COUNT(*) as cantidad,
                    ROUND(AVG(ob.calificacion), 2) as promedio_calificacion,
                    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as porcentaje
                FROM observaciones_becarios ob
                WHERE ob.becario_id = ?
                ${condicionesFecha ? condicionesFecha.replace('c.fecha', 'ob.fecha') : ''}
                GROUP BY ob.aspecto_evaluado
                ORDER BY cantidad DESC
            `, { replacements, type: QueryTypes.SELECT });
            
            // Citas por día de la semana
            const citasPorDia = await sequelize.query(`
                SELECT 
                    DAYNAME(c.fecha) as dia_semana,
                    COUNT(*) as total_citas,
                    SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) as citas_completadas,
                    ROUND(SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as tasa_completitud
                FROM citas c
                WHERE c.becario_id = ?
                ${condicionesFecha}
                GROUP BY DAYNAME(c.fecha), DAYOFWEEK(c.fecha)
                ORDER BY DAYOFWEEK(c.fecha)
            `, { replacements, type: QueryTypes.SELECT });
            
            // Pacientes atendidos
            const pacientesAtendidos = await sequelize.query(`
                SELECT 
                    p.id,
                    CONCAT(p.nombre, ' ', p.apellido) as paciente,
                    COUNT(c.id) as total_sesiones,
                    MIN(c.fecha) as primera_sesion,
                    MAX(c.fecha) as ultima_sesion,
                    (SELECT COUNT(*) FROM sesiones s 
                     JOIN citas c2 ON s.cita_id = c2.id 
                     WHERE c2.paciente_id = p.id AND c2.becario_id = ?) as sesiones_registradas
                FROM citas c
                JOIN pacientes p ON c.paciente_id = p.id
                WHERE c.becario_id = ?
                AND c.estado = 'completada'
                ${condicionesFecha}
                GROUP BY p.id, p.nombre, p.apellido
                ORDER BY total_sesiones DESC
                LIMIT 10
            `, { replacements: [becarioConsulta, ...replacements], type: QueryTypes.SELECT });
            
            res.json({
                success: true,
                data: {
                    becario,
                    periodo: {
                        fecha_inicio: fecha_inicio || 'No especificado',
                        fecha_fin: fecha_fin || 'No especificado'
                    },
                    estadisticas: estadisticas || {},
                    evolucion_calificaciones: evolucionCalificaciones.reverse(),
                    distribucion_aspectos: distribucionAspectos,
                    citas_por_dia: citasPorDia,
                    pacientes_atendidos: pacientesAtendidos,
                    fecha_consulta: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('Error en obtenerEstadisticasBecario:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas del becario'
            });
        }
    }
    
    static async obtenerEstadisticasPaciente(req, res) {
        try {
            const { paciente_id } = req.params;
            
            // Verificar que el paciente existe
            const [paciente] = await sequelize.query(
                'SELECT id, nombre, apellido, fecha_nacimiento, genero FROM pacientes WHERE id = ?',
                { replacements: [paciente_id], type: QueryTypes.SELECT }
            );
            
            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }
            
            // Estadísticas del paciente
            const [estadisticas] = await sequelize.query(`
                SELECT 
                    -- Citas
                    COUNT(c.id) as total_citas,
                    SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) as citas_completadas,
                    SUM(CASE WHEN c.estado = 'cancelada' THEN 1 ELSE 0 END) as citas_canceladas,
                    ROUND(SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) * 100.0 / COUNT(c.id), 2) as tasa_asistencia,
                    
                    -- Tiempo
                    MIN(c.fecha) as primera_cita,
                    MAX(c.fecha) as ultima_cita,
                    DATEDIFF(MAX(c.fecha), MIN(c.fecha)) as dias_tratamiento,
                    ROUND(AVG(c.duracion_minutos), 1) as duracion_promedio,
                    
                    -- Profesionales
                    COUNT(DISTINCT c.psicologo_id) as psicologos_atendieron,
                    COUNT(DISTINCT c.becario_id) as becarios_atendieron,
                    
                    -- Sesiones registradas
                    COUNT(s.id) as sesiones_registradas,
                    
                    -- Asignaciones
                    COUNT(DISTINCT a.id) as total_asignaciones,
                    (SELECT COUNT(*) FROM asignaciones WHERE paciente_id = ? AND estado = 'activa') as asignaciones_activas,
                    
                    -- Altas
                    (SELECT tipo_alta FROM altas WHERE paciente_id = ? ORDER BY fecha_alta DESC LIMIT 1) as ultimo_tipo_alta
                    
                FROM pacientes p
                LEFT JOIN citas c ON p.id = c.paciente_id
                LEFT JOIN sesiones s ON c.id = s.cita_id
                LEFT JOIN asignaciones a ON p.id = a.paciente_id
                WHERE p.id = ?
                GROUP BY p.id
            `, { replacements: [paciente_id, paciente_id, paciente_id], type: QueryTypes.SELECT });
            
            // Evolución de citas
            const evolucionCitas = await sequelize.query(`
                SELECT 
                    DATE_FORMAT(c.fecha, '%Y-%m') as mes,
                    COUNT(c.id) as total_citas,
                    SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) as citas_completadas,
                    GROUP_CONCAT(
                        CONCAT(
                            DAY(c.fecha), ': ',
                            CASE c.estado 
                                WHEN 'completada' THEN '✓'
                                WHEN 'cancelada' THEN '✗'
                                ELSE '○'
                            END
                        ) 
                        ORDER BY c.fecha 
                        SEPARATOR ', '
                    ) as detalle_dias
                FROM citas c
                WHERE c.paciente_id = ?
                GROUP BY DATE_FORMAT(c.fecha, '%Y-%m')
                ORDER BY mes DESC
                LIMIT 6
            `, { replacements: [paciente_id], type: QueryTypes.SELECT });
            
            // Distribución por psicólogo
            const distribucionPsicologos = await sequelize.query(`
                SELECT 
                    u.id,
                    CONCAT(u.nombre, ' ', u.apellido) as psicologo,
                    u.especialidad,
                    COUNT(c.id) as total_citas,
                    SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) as citas_completadas,
                    ROUND(SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) * 100.0 / COUNT(c.id), 2) as tasa_completitud,
                    MIN(c.fecha) as primera_cita,
                    MAX(c.fecha) as ultima_cita
                FROM citas c
                JOIN users u ON c.psicologo_id = u.id
                WHERE c.paciente_id = ?
                GROUP BY u.id, u.nombre, u.apellido, u.especialidad
                ORDER BY total_citas DESC
            `, { replacements: [paciente_id], type: QueryTypes.SELECT });
            
            // Frecuencia de citas
            const frecuenciaCitas = await sequelize.query(`
                SELECT 
                    CONCAT(
                        CASE 
                            WHEN dias BETWEEN 0 AND 7 THEN '1 semana o menos'
                            WHEN dias BETWEEN 8 AND 14 THEN '2 semanas'
                            WHEN dias BETWEEN 15 AND 21 THEN '3 semanas'
                            WHEN dias BETWEEN 22 AND 30 THEN '4 semanas'
                            ELSE 'Más de 1 mes'
                        END
                    ) as intervalo,
                    COUNT(*) as cantidad,
                    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as porcentaje
                FROM (
                    SELECT 
                        DATEDIFF(
                            c2.fecha,
                            (SELECT MAX(c3.fecha) FROM citas c3 
                             WHERE c3.paciente_id = c.paciente_id 
                             AND c3.id < c2.id)
                        ) as dias
                    FROM citas c2
                    WHERE c2.paciente_id = ?
                    AND c2.estado = 'completada'
                    ORDER BY c2.fecha
                ) as intervalos
                WHERE dias IS NOT NULL
                GROUP BY 
                    CASE 
                        WHEN dias BETWEEN 0 AND 7 THEN '1 semana o menos'
                        WHEN dias BETWEEN 8 AND 14 THEN '2 semanas'
                        WHEN dias BETWEEN 15 AND 21 THEN '3 semanas'
                        WHEN dias BETWEEN 22 AND 30 THEN '4 semanas'
                        ELSE 'Más de 1 mes'
                    END
                ORDER BY cantidad DESC
            `, { replacements: [paciente_id], type: QueryTypes.SELECT });
            
            res.json({
                success: true,
                data: {
                    paciente,
                    estadisticas: estadisticas || {},
                    evolucion_citas: evolucionCitas.reverse(),
                    distribucion_psicologos: distribucionPsicologos,
                    frecuencia_citas: frecuenciaCitas,
                    fecha_consulta: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('Error en obtenerEstadisticasPaciente:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas del paciente'
            });
        }
    }
    
    static async obtenerReporteComparativo(req, res) {
        try {
            const { periodo = 'mes', tipo_comparacion = 'psicologos' } = req.query;
            
            let intervalo;
            switch (periodo) {
                case 'semana':
                    intervalo = 'INTERVAL 7 DAY';
                    break;
                case 'mes':
                    intervalo = 'INTERVAL 30 DAY';
                    break;
                case 'trimestre':
                    intervalo = 'INTERVAL 90 DAY';
                    break;
                default:
                    intervalo = 'INTERVAL 30 DAY';
            }
            
            let reporte;
            
            if (tipo_comparacion === 'psicologos') {
                reporte = await this.generarComparativoPsicologos(intervalo);
            } else if (tipo_comparacion === 'becarios') {
                reporte = await this.generarComparativoBecarios(intervalo);
            } else if (tipo_comparacion === 'meses') {
                reporte = await this.generarComparativoMeses(intervalo);
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de comparación no válido'
                });
            }
            
            res.json({
                success: true,
                data: {
                    tipo_comparacion,
                    periodo,
                    reporte,
                    fecha_generacion: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('Error en obtenerReporteComparativo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al generar reporte comparativo'
            });
        }
    }
    
    // Métodos auxiliares para comparativos
    static async generarComparativoPsicologos(intervalo) {
        return await sequelize.query(`
            SELECT 
                u.id,
                CONCAT(u.nombre, ' ', u.apellido) as psicologo,
                u.especialidad,
                COUNT(c.id) as total_citas,
                SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) as citas_completadas,
                SUM(CASE WHEN c.estado = 'cancelada' THEN 1 ELSE 0 END) as citas_canceladas,
                ROUND(SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) * 100.0 / COUNT(c.id), 2) as tasa_completitud,
                COUNT(DISTINCT c.paciente_id) as pacientes_unicos,
                ROUND(AVG(c.duracion_minutos), 1) as duracion_promedio,
                COUNT(s.id) as sesiones_registradas,
                COUNT(DISTINCT a.becario_id) as becarios_supervisados,
                COUNT(ob.id) as observaciones_realizadas
            FROM users u
            LEFT JOIN citas c ON u.id = c.psicologo_id AND c.fecha >= DATE_SUB(CURDATE(), ${intervalo})
            LEFT JOIN sesiones s ON c.id = s.cita_id
            LEFT JOIN asignaciones a ON u.id = a.psicologo_id AND a.estado = 'activa'
            LEFT JOIN observaciones_becarios ob ON u.id = ob.supervisor_id AND ob.fecha >= DATE_SUB(CURDATE(), ${intervalo})
            WHERE u.rol = 'psicologo' AND u.activo = TRUE
            GROUP BY u.id, u.nombre, u.apellido, u.especialidad
            ORDER BY citas_completadas DESC
        `, { type: QueryTypes.SELECT });
    }
    
    static async generarComparativoBecarios(intervalo) {
        return await sequelize.query(`
            SELECT 
                u.id,
                CONCAT(u.nombre, ' ', u.apellido) as becario,
                COUNT(c.id) as total_citas,
                SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) as citas_completadas,
                ROUND(SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) * 100.0 / COUNT(c.id), 2) as tasa_completitud,
                COUNT(DISTINCT c.paciente_id) as pacientes_unicos,
                COUNT(ob.id) as observaciones_recibidas,
                ROUND(AVG(ob.calificacion), 2) as promedio_calificacion,
                (SELECT CONCAT(u2.nombre, ' ', u2.apellido) FROM asignaciones a 
                 JOIN users u2 ON a.psicologo_id = u2.id 
                 WHERE a.becario_id = u.id AND a.estado = 'activa' LIMIT 1) as supervisor
            FROM users u
            LEFT JOIN citas c ON u.id = c.becario_id AND c.fecha >= DATE_SUB(CURDATE(), ${intervalo})
            LEFT JOIN observaciones_becarios ob ON u.id = ob.becario_id AND ob.fecha >= DATE_SUB(CURDATE(), ${intervalo})
            WHERE u.rol = 'becario' AND u.activo = TRUE
            GROUP BY u.id, u.nombre, u.apellido
            ORDER BY citas_completadas DESC
        `, { type: QueryTypes.SELECT });
    }
    
    static async generarComparativoMeses(intervalo) {
        return await sequelize.query(`
            SELECT 
                DATE_FORMAT(c.fecha, '%Y-%m') as mes,
                COUNT(c.id) as total_citas,
                SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) as citas_completadas,
                SUM(CASE WHEN c.estado = 'cancelada' THEN 1 ELSE 0 END) as citas_canceladas,
                ROUND(SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) * 100.0 / COUNT(c.id), 2) as tasa_completitud,
                COUNT(DISTINCT c.paciente_id) as pacientes_unicos,
                COUNT(DISTINCT c.psicologo_id) as psicologos_activos,
                COUNT(DISTINCT c.becario_id) as becarios_activos,
                COUNT(s.id) as sesiones_registradas,
                COUNT(a.id) as altas_realizadas
            FROM citas c
            LEFT JOIN sesiones s ON c.id = s.cita_id
            LEFT JOIN altas a ON c.paciente_id = a.paciente_id AND DATE_FORMAT(a.fecha_alta, '%Y-%m') = DATE_FORMAT(c.fecha, '%Y-%m')
            WHERE c.fecha >= DATE_SUB(CURDATE(), ${intervalo})
            GROUP BY DATE_FORMAT(c.fecha, '%Y-%m')
            ORDER BY mes DESC
        `, { type: QueryTypes.SELECT });
    }
}

module.exports = EstadisticaController;