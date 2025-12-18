// backend/src/controllers/agendaController.js - Versión simplificada sin verificación de roles
const Cita = require('../models/citaModel');
const Paciente = require('../models/pacienteModel');
const User = require('../models/userModel');
const { QueryTypes, Op } = require('sequelize');
const sequelize = require('../config/db');

class AgendaController {

    static async obtenerAgendaGlobal(req, res) {
        try {
            const { 
                fecha_inicio, 
                fecha_fin, 
                psicologo_id, 
                becario_id, 
                paciente_id,
                estado,
                tipo_consulta,
                limit = 50,
                offset = 0
            } = req.query;
            
            // Construir condiciones de filtro
            const whereClause = {};
            
            if (fecha_inicio && fecha_fin) {
                whereClause.fecha = {
                    [Op.between]: [fecha_inicio, fecha_fin]
                };
            } else if (fecha_inicio) {
                whereClause.fecha = { [Op.gte]: fecha_inicio };
            } else if (fecha_fin) {
                whereClause.fecha = { [Op.lte]: fecha_fin };
            } else {
                // Por defecto, mostrar solo citas futuras y de hoy
                whereClause.fecha = { [Op.gte]: new Date().toISOString().split('T')[0] };
            }
            
            if (psicologo_id) whereClause.psicologo_id = psicologo_id;
            if (becario_id) whereClause.becario_id = becario_id;
            if (paciente_id) whereClause.paciente_id = paciente_id;
            if (estado) whereClause.estado = estado;
            if (tipo_consulta) whereClause.tipo_consulta = tipo_consulta;
            
            console.log('Where clause:', whereClause);
            
            const citas = await Cita.findAll({
                where: whereClause,
                include: [
                    {
                        model: Paciente,
                        attributes: ['id', 'nombre', 'apellido', 'telefono', 'email']
                    },
                    {
                        model: User,
                        as: 'Psicologo',
                        attributes: ['id', 'nombre', 'apellido', 'especialidad']
                    },
                    {
                        model: User,
                        as: 'Becario',
                        attributes: ['id', 'nombre', 'apellido']
                    }
                ],
                order: [
                    ['fecha', 'ASC'],
                    ['hora', 'ASC']
                ],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
            
            console.log('Citas encontradas:', citas.length);
            
            // Incluir estadísticas - consulta simplificada
            let estadisticas = null;
            try {
                // Construir condiciones WHERE para SQL
                let whereSQL = '1=1';
                const replacements = [];
                
                if (fecha_inicio && fecha_fin) {
                    whereSQL += ' AND fecha BETWEEN ? AND ?';
                    replacements.push(fecha_inicio, fecha_fin);
                } else if (fecha_inicio) {
                    whereSQL += ' AND fecha >= ?';
                    replacements.push(fecha_inicio);
                } else if (fecha_fin) {
                    whereSQL += ' AND fecha <= ?';
                    replacements.push(fecha_fin);
                }
                
                if (psicologo_id) {
                    whereSQL += ' AND psicologo_id = ?';
                    replacements.push(psicologo_id);
                }
                
                if (estado) {
                    whereSQL += ' AND estado = ?';
                    replacements.push(estado);
                }
                
                const query = `
                    SELECT 
                        COUNT(*) as total_citas,
                        SUM(CASE WHEN estado = 'programada' THEN 1 ELSE 0 END) as programadas,
                        SUM(CASE WHEN estado = 'confirmada' THEN 1 ELSE 0 END) as confirmadas,
                        SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) as completadas,
                        SUM(CASE WHEN estado = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
                        COUNT(DISTINCT psicologo_id) as psicologos_involucrados,
                        COUNT(DISTINCT becario_id) as becarios_involucrados,
                        COUNT(DISTINCT paciente_id) as pacientes_atendidos
                    FROM citas
                    WHERE ${whereSQL}
                `;
                
                const [stats] = await sequelize.query(query, {
                    replacements,
                    type: QueryTypes.SELECT
                });
                
                estadisticas = stats;
                console.log('Estadísticas:', estadisticas);
                
            } catch (statsError) {
                console.error('Error al obtener estadísticas:', statsError);
                // Continuar sin estadísticas
                estadisticas = {
                    total_citas: citas.length,
                    programadas: citas.filter(c => c.estado === 'programada').length,
                    confirmadas: citas.filter(c => c.estado === 'confirmada').length,
                    completadas: citas.filter(c => c.estado === 'completada').length,
                    canceladas: citas.filter(c => c.estado === 'cancelada').length,
                    psicologos_involucrados: new Set(citas.map(c => c.psicologo_id)).size,
                    becarios_involucrados: new Set(citas.map(c => c.becario_id)).size - 1, // Restar null
                    pacientes_atendidos: new Set(citas.map(c => c.paciente_id)).size
                };
            }
            
            res.json({
                success: true,
                data: {
                    citas,
                    estadisticas,
                    filtros: {
                        fecha_inicio,
                        fecha_fin,
                        psicologo_id,
                        becario_id,
                        paciente_id,
                        estado,
                        tipo_consulta
                    }
                },
                count: citas.length
            });
            
        } catch (error) {
            console.error('Error detallado en obtenerAgendaGlobal:', error);
            console.error('Stack trace:', error.stack);
            res.status(500).json({
                success: false,
                message: 'Error al obtener agenda global',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
    
    static async obtenerAgendaDiaria(req, res) {
        try {
            const { fecha } = req.query;
            
            const fechaConsulta = fecha || new Date().toISOString().split('T')[0];
            
            const query = `
                SELECT 
                    c.id,
                    c.fecha,
                    TIME_FORMAT(c.hora, '%H:%i') as hora,
                    c.estado,
                    c.tipo_consulta,
                    c.duracion as duracion_minutos,
                    c.notas,
                    CONCAT(p.nombre, ' ', p.apellido) as paciente,
                    p.telefono as paciente_telefono,
                    p.email as paciente_email,
                    CONCAT(u_psi.nombre, ' ', u_psi.apellido) as psicologo,
                    CONCAT(u_bec.nombre, ' ', u_bec.apellido) as becario,
                    u_psi.especialidad as psicologo_especialidad
                FROM citas c
                JOIN pacientes p ON c.paciente_id = p.id
                JOIN users u_psi ON c.psicologo_id = u_psi.id
                LEFT JOIN users u_bec ON c.becario_id = u_bec.id
                WHERE c.fecha = ?
                ORDER BY c.hora
            `;
            
            const replacements = [fechaConsulta];
            
            const citas = await sequelize.query(query, {
                replacements,
                type: QueryTypes.SELECT
            });
            
            // Obtener disponibilidad de profesionales para este día
            const diaSemana = this.obtenerDiaSemana(fechaConsulta);
            const [disponibilidad] = await sequelize.query(`
                SELECT 
                    u.id,
                    CONCAT(u.nombre, ' ', u.apellido) as profesional,
                    u.rol,
                    GROUP_CONCAT(
                        CONCAT(
                            TIME_FORMAT(d.hora_inicio, '%H:%i'), 
                            ' - ', 
                            TIME_FORMAT(d.hora_fin, '%H:%i')
                        ) SEPARATOR ', '
                    ) as horarios_disponibles,
                    COUNT(DISTINCT c.id) as citas_programadas
                FROM users u
                LEFT JOIN disponibilidades d ON u.id = d.usuario_id 
                    AND d.dia_semana = ?
                    AND d.activo = TRUE
                LEFT JOIN citas c ON u.id = c.psicologo_id 
                    AND c.fecha = ?
                    AND c.estado IN ('programada', 'confirmada')
                WHERE u.rol IN ('psicologo', 'becario')
                AND u.activo = TRUE
                GROUP BY u.id, u.nombre, u.apellido, u.rol
                ORDER BY u.rol, u.apellido, u.nombre
            `, {
                replacements: [diaSemana, fechaConsulta],
                type: QueryTypes.SELECT
            });
            
            res.json({
                success: true,
                data: {
                    fecha: fechaConsulta,
                    citas,
                    disponibilidad: disponibilidad || [],
                    total_citas: citas.length
                }
            });
            
        } catch (error) {
            console.error('Error en obtenerAgendaDiaria:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener agenda diaria'
            });
        }
    }
    
    static async obtenerCalendarioMensual(req, res) {
        try {
            const { mes, anio } = req.query;
            
            const mesActual = mes || new Date().getMonth() + 1;
            const anioActual = anio || new Date().getFullYear();
            
            // Obtener citas del mes
            const query = `
                SELECT 
                    c.fecha,
                    COUNT(*) as total_citas,
                    SUM(CASE WHEN c.estado = 'programada' THEN 1 ELSE 0 END) as programadas,
                    SUM(CASE WHEN c.estado = 'confirmada' THEN 1 ELSE 0 END) as confirmadas,
                    SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) as completadas,
                    SUM(CASE WHEN c.estado = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
                    GROUP_CONCAT(
                        CONCAT(
                            TIME_FORMAT(c.hora, '%H:%i'), ' ', 
                            SUBSTRING(p.nombre, 1, 1), '. ', p.apellido
                        ) 
                        ORDER BY c.hora 
                        SEPARATOR '; '
                    ) as detalle_citas
                FROM citas c
                JOIN pacientes p ON c.paciente_id = p.id
                WHERE MONTH(c.fecha) = ? AND YEAR(c.fecha) = ?
                GROUP BY c.fecha ORDER BY c.fecha
            `;
            
            const replacements = [mesActual, anioActual];
            
            const citasPorDia = await sequelize.query(query, {
                replacements,
                type: QueryTypes.SELECT
            });
            
            // Crear calendario
            const diasMes = new Date(anioActual, mesActual, 0).getDate();
            const calendario = [];
            
            for (let dia = 1; dia <= diasMes; dia++) {
                const fecha = `${anioActual}-${mesActual.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
                const datosDia = citasPorDia.find(c => c.fecha === fecha);
                
                calendario.push({
                    fecha,
                    dia,
                    dia_semana: this.obtenerDiaSemana(fecha),
                    total_citas: datosDia ? datosDia.total_citas : 0,
                    programadas: datosDia ? datosDia.programadas : 0,
                    confirmadas: datosDia ? datosDia.confirmadas : 0,
                    completadas: datosDia ? datosDia.completadas : 0,
                    canceladas: datosDia ? datosDia.canceladas : 0,
                    detalle_citas: datosDia ? datosDia.detalle_citas : null
                });
            }
            
            // Estadísticas del mes
            const [estadisticasMes] = await sequelize.query(`
                SELECT 
                    COUNT(*) as total_citas_mes,
                    COUNT(DISTINCT paciente_id) as pacientes_unicos,
                    COUNT(DISTINCT psicologo_id) as psicologos_activos,
                    COUNT(DISTINCT becario_id) as becarios_activos,
                    SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) as citas_completadas,
                    ROUND(AVG(duracion), 1) as duracion_promedio
                FROM citas
                WHERE MONTH(fecha) = ? AND YEAR(fecha) = ?
            `, {
                replacements: [mesActual, anioActual],
                type: QueryTypes.SELECT
            });
            
            res.json({
                success: true,
                data: {
                    mes: mesActual,
                    anio: anioActual,
                    calendario,
                    estadisticas: estadisticasMes || {},
                    total_dias: diasMes
                }
            });
            
        } catch (error) {
            console.error('Error en obtenerCalendarioMensual:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener calendario mensual'
            });
        }
    }
    
    static async reprogramarCita(req, res) {
        try {
            const { id } = req.params;
            const { nueva_fecha, nueva_hora, motivo } = req.body;
            
            const cita = await Cita.findByPk(id);
            
            if (!cita) {
                return res.status(404).json({
                    success: false,
                    message: 'Cita no encontrada'
                });
            }
            
            // Verificar que la nueva fecha/hora no se solape
            const [solapamiento] = await sequelize.query(`
                SELECT id FROM citas 
                WHERE (
                    (psicologo_id = ? OR becario_id = ?)
                    AND fecha = ?
                    AND hora = ?
                    AND estado IN ('programada', 'confirmada')
                    AND id != ?
                )
            `, {
                replacements: [
                    cita.psicologo_id,
                    cita.becario_id || 0,
                    nueva_fecha,
                    nueva_hora,
                    id
                ],
                type: QueryTypes.SELECT
            });
            
            if (solapamiento) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe una cita programada en ese horario'
                });
            }
            
            // Guardar datos originales para log
            const datosOriginales = {
                fecha: cita.fecha,
                hora: cita.hora,
                estado: cita.estado
            };
            
            // Actualizar cita
            await cita.update({
                fecha: nueva_fecha,
                hora: nueva_hora,
                estado: 'programada',
                motivo_cancelacion: motivo ? `Reprogramación: ${motivo}` : 'Reprogramación'
            });
            
            // Crear notificaciones
            const [paciente] = await sequelize.query(
                'SELECT email, nombre, apellido FROM pacientes WHERE id = ?',
                { replacements: [cita.paciente_id], type: QueryTypes.SELECT }
            );
            
            // Notificar al psicólogo
            if (cita.psicologo_id) {
                await sequelize.query(`
                    INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, created_at)
                    VALUES (?, 'cita_modificada', 'Cita reprogramada', 
                    CONCAT('Cita reprogramada para el paciente: ', ?, '. Nueva fecha: ', ?, ' ', ?), NOW())
                `, {
                    replacements: [
                        cita.psicologo_id,
                        `${paciente?.nombre || 'Paciente'} ${paciente?.apellido || ''}`,
                        nueva_fecha,
                        nueva_hora
                    ]
                });
            }
            
            // Notificar al becario si está asignado
            if (cita.becario_id) {
                await sequelize.query(`
                    INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, created_at)
                    VALUES (?, 'cita_modificada', 'Cita reprogramada', 
                    CONCAT('Cita reprogramada para el paciente: ', ?, '. Nueva fecha: ', ?, ' ', ?), NOW())
                `, {
                    replacements: [
                        cita.becario_id,
                        `${paciente?.nombre || 'Paciente'} ${paciente?.apellido || ''}`,
                        nueva_fecha,
                        nueva_hora
                    ]
                });
            }
            
            res.json({
                success: true,
                message: 'Cita reprogramada exitosamente',
                data: {
                    cita_id: id,
                    fecha_anterior: datosOriginales.fecha,
                    hora_anterior: datosOriginales.hora,
                    nueva_fecha,
                    nueva_hora
                }
            });
            
        } catch (error) {
            console.error('Error en reprogramarCita:', error);
            res.status(500).json({
                success: false,
                message: 'Error al reprogramar cita'
            });
        }
    }
    
    

    static async obtenerDisponibilidadProfesionales(req, res) {
        try {
            const { fecha } = req.query;
            const fechaConsulta = fecha || new Date().toISOString().split('T')[0];
            
            
            // Función auxiliar para obtener día de la semana
            const obtenerDiaSemana = (fechaStr) => {
                try {
                    const fechaObj = new Date(fechaStr);
                    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
                    return dias[fechaObj.getDay()];
                } catch (error) {
                    console.error('Error parseando fecha:', fechaStr, error);
                    return 'lunes';
                }
            };
            
            const diaSemana = obtenerDiaSemana(fechaConsulta);
            
            // CONSULTA PRINCIPAL: Obtener psicólogos y becarios activos
            const psicologos = await sequelize.query(`
                SELECT 
                    u.id,
                    CONCAT(u.nombre, ' ', u.apellido) as profesional,
                    u.rol,
                    u.especialidad,
                    u.email
                FROM users u
                WHERE u.rol IN ('psicologo', 'becario')
                    AND u.activo = TRUE
                ORDER BY 
                    CASE u.rol 
                        WHEN 'psicologo' THEN 1
                        WHEN 'becario' THEN 2
                        ELSE 3
                    END,
                    u.apellido, u.nombre
            `, {
                type: QueryTypes.SELECT
            });
            
            
            // Para cada profesional, obtener su disponibilidad y citas programadas
            const disponibilidadDetallada = [];
            
            for (const psicologo of psicologos) {
                try {
                    // 1. Obtener disponibilidad del día
                    const [disponibilidad] = await sequelize.query(`
                        SELECT 
                            TIME_FORMAT(hora_inicio, '%H:%i') as hora_inicio,
                            TIME_FORMAT(hora_fin, '%H:%i') as hora_fin,
                            COALESCE(max_citas_dia, 8) as max_citas_dia,
                            intervalo_citas
                        FROM disponibilidades
                        WHERE usuario_id = ?
                            AND dia_semana = ?
                            AND activo = TRUE
                            AND (? BETWEEN fecha_inicio_vigencia AND COALESCE(fecha_fin_vigencia, '2099-12-31'))
                        LIMIT 1
                    `, {
                        replacements: [psicologo.id, diaSemana, fechaConsulta],
                        type: QueryTypes.SELECT
                    });
                    
                    // 2. Obtener citas programadas para la fecha
                    const [citasCount] = await sequelize.query(`
                        SELECT COUNT(*) as citas_programadas
                        FROM citas 
                        WHERE (psicologo_id = ? OR becario_id = ?)
                            AND fecha = ?
                            AND estado IN ('programada', 'confirmada')
                    `, {
                        replacements: [psicologo.id, psicologo.id, fechaConsulta],
                        type: QueryTypes.SELECT
                    });
                    
                    const citasProgramadas = citasCount ? parseInt(citasCount.citas_programadas) : 0;
                    const maxCitas = disponibilidad ? parseInt(disponibilidad.max_citas_dia) : 8;
                    const cuposDisponibles = Math.max(0, maxCitas - citasProgramadas);
                    const porcentajeOcupacion = maxCitas > 0 ? Math.round((citasProgramadas / maxCitas) * 100) : 0;
                    
                    // Determinar estado de disponibilidad
                    let estado = 'disponible';
                    if (cuposDisponibles === 0) estado = 'completo';
                    else if (cuposDisponibles <= 2) estado = 'limitado';
                    
                    disponibilidadDetallada.push({
                        id: psicologo.id,
                        profesional: psicologo.profesional,
                        rol: psicologo.rol,
                        especialidad: psicologo.especialidad || (psicologo.rol === 'becario' ? 'Becario' : 'Psicología General'),
                        email: psicologo.email,
                        hora_inicio: disponibilidad ? disponibilidad.hora_inicio : '09:00',
                        hora_fin: disponibilidad ? disponibilidad.hora_fin : '18:00',
                        max_citas_dia: maxCitas,
                        citas_programadas: citasProgramadas,
                        cupos_disponibles: cuposDisponibles,
                        porcentaje_ocupacion: porcentajeOcupacion,
                        estado: estado,
                        intervalo_citas: disponibilidad ? disponibilidad.intervalo_citas : 50
                    });
                    
                    
                } catch (error) {
                    console.error(`⚠️ Error procesando ${psicologo.profesional}:`, error.message);
                    // Datos de respaldo
                    disponibilidadDetallada.push({
                        id: psicologo.id,
                        profesional: psicologo.profesional,
                        rol: psicologo.rol,
                        especialidad: psicologo.especialidad || 'Psicología General',
                        email: psicologo.email,
                        hora_inicio: '09:00',
                        hora_fin: '18:00',
                        max_citas_dia: 8,
                        citas_programadas: 0,
                        cupos_disponibles: 8,
                        porcentaje_ocupacion: 0,
                        estado: 'disponible',
                        intervalo_citas: 50
                    });
                }
            }
            
            // Estadísticas generales
            const totalProfesionales = disponibilidadDetallada.length;
            const totalCupos = disponibilidadDetallada.reduce((sum, p) => sum + p.max_citas_dia, 0);
            const totalCitasProgramadas = disponibilidadDetallada.reduce((sum, p) => sum + p.citas_programadas, 0);
            const totalCuposDisponibles = disponibilidadDetallada.reduce((sum, p) => sum + p.cupos_disponibles, 0);
            const porcentajeTotalOcupacion = totalCupos > 0 ? Math.round((totalCitasProgramadas / totalCupos) * 100) : 0;
            
            console.log(`📊 Estadísticas: ${totalCitasProgramadas}/${totalCupos} citas (${porcentajeTotalOcupacion}% ocupado)`);
            
            res.json({
                success: true,
                data: {
                    fecha: fechaConsulta,
                    dia_semana: diaSemana,
                    disponibilidad: disponibilidadDetallada,
                    total_profesionales: totalProfesionales,
                    estadisticas: {
                        total_cupos: totalCupos,
                        total_citas_programadas: totalCitasProgramadas,
                        total_cupos_disponibles: totalCuposDisponibles,
                        porcentaje_ocupacion_total: porcentajeTotalOcupacion,
                        profesionales_disponibles: disponibilidadDetallada.filter(p => p.estado === 'disponible').length,
                        profesionales_limitados: disponibilidadDetallada.filter(p => p.estado === 'limitado').length,
                        profesionales_completos: disponibilidadDetallada.filter(p => p.estado === 'completo').length
                    }
                }
            });
            
        } catch (error) {
            console.error('❌ Error CRÍTICO en obtenerDisponibilidadProfesionales:', error);
            console.error('Stack trace:', error.stack);
            
            // Respuesta de error controlada
            res.status(500).json({
                success: false,
                message: 'Error al obtener disponibilidad de profesionales',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
                data: {
                    fecha: req.query.fecha || new Date().toISOString().split('T')[0],
                    dia_semana: 'lunes',
                    disponibilidad: [],
                    total_profesionales: 0,
                    estadisticas: {
                        total_cupos: 0,
                        total_citas_programadas: 0,
                        total_cupos_disponibles: 0,
                        porcentaje_ocupacion_total: 0,
                        profesionales_disponibles: 0,
                        profesionales_limitados: 0,
                        profesionales_completos: 0
                    }
                }
            });
        }
    }

    // Método auxiliar para obtener día de la semana
    static obtenerDiaSemana(fecha) {
        try {
            const fechaObj = new Date(fecha);
            const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
            return dias[fechaObj.getDay()];
        } catch (error) {
            return 'lunes'; // Valor por defecto
        }
    }
    
    static construirWhereSQL(whereClause) {
        const condiciones = [];
        
        for (const [key, value] of Object.entries(whereClause)) {
            if (typeof value === 'object' && value[Op.between]) {
                condiciones.push(`${key} BETWEEN '${value[Op.between][0]}' AND '${value[Op.between][1]}'`);
            } else if (typeof value === 'object' && value[Op.gte]) {
                condiciones.push(`${key} >= '${value[Op.gte]}'`);
            } else if (typeof value === 'object' && value[Op.lte]) {
                condiciones.push(`${key} <= '${value[Op.lte]}'`);
            } else {
                condiciones.push(`${key} = ${typeof value === 'string' ? `'${value}'` : value}`);
            }
        }
        
        return condiciones.join(' AND ');
    }
    
}

module.exports = AgendaController;