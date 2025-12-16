const Cita = require('../models/citaModel');
const Paciente = require('../models/pacienteModel');
const User = require('../models/userModel');
const Disponibilidad = require('../models/disponibilidadModel');
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
            
            const usuarioId = req.user.id;
            const usuarioRol = req.user.rol;
            
            // Construir condiciones de filtro
            const whereClause = {};
            const includeConditions = [];
            
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
            
            // Para becarios y psicólogos, limitar a sus pacientes
            if (usuarioRol === 'becario') {
                whereClause.becario_id = usuarioId;
            } else if (usuarioRol === 'psicologo') {
                whereClause.psicologo_id = usuarioId;
            }
            
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
            
            // Para coordinador, incluir estadísticas
            let estadisticas = null;
            if (usuarioRol === 'coordinador') {
                const [stats] = await sequelize.query(`
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
                    WHERE ${Object.keys(whereClause).length > 0 ? 
                        this.construirWhereSQL(whereClause) : '1=1'}
                `, { type: QueryTypes.SELECT });
                
                estadisticas = stats;
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
            console.error('Error en obtenerAgendaGlobal:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener agenda global'
            });
        }
    }
    
    static async obtenerAgendaDiaria(req, res) {
        try {
            const { fecha } = req.query;
            const usuarioId = req.user.id;
            const usuarioRol = req.user.rol;
            
            const fechaConsulta = fecha || new Date().toISOString().split('T')[0];
            
            let query = `
                SELECT 
                    c.id,
                    c.fecha,
                    TIME_FORMAT(c.hora, '%H:%i') as hora,
                    c.estado,
                    c.tipo_consulta,
                    c.duracion_minutos,
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
            `;
            
            const replacements = [fechaConsulta];
            
            // Filtrar por rol
            if (usuarioRol === 'psicologo') {
                query += ` AND c.psicologo_id = ?`;
                replacements.push(usuarioId);
            } else if (usuarioRol === 'becario') {
                query += ` AND c.becario_id = ?`;
                replacements.push(usuarioId);
            }
            
            query += ` ORDER BY c.hora`;
            
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
            const usuarioId = req.user.id;
            const usuarioRol = req.user.rol;
            
            const mesActual = mes || new Date().getMonth() + 1;
            const anioActual = anio || new Date().getFullYear();
            
            // Obtener citas del mes
            let query = `
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
            `;
            
            const replacements = [mesActual, anioActual];
            
            // Filtrar por rol
            if (usuarioRol === 'psicologo') {
                query += ` AND c.psicologo_id = ?`;
                replacements.push(usuarioId);
            } else if (usuarioRol === 'becario') {
                query += ` AND c.becario_id = ?`;
                replacements.push(usuarioId);
            }
            
            query += ` GROUP BY c.fecha ORDER BY c.fecha`;
            
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
                    ROUND(AVG(duracion_minutos), 1) as duracion_promedio
                FROM citas
                WHERE MONTH(fecha) = ? AND YEAR(fecha) = ?
                ${usuarioRol === 'psicologo' ? 'AND psicologo_id = ?' : ''}
                ${usuarioRol === 'becario' ? 'AND becario_id = ?' : ''}
            `, {
                replacements: usuarioRol === 'psicologo' ? [mesActual, anioActual, usuarioId] :
                           usuarioRol === 'becario' ? [mesActual, anioActual, usuarioId] :
                           [mesActual, anioActual],
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
            const usuarioId = req.user.id;
            const usuarioRol = req.user.rol;
            
            const cita = await Cita.findByPk(id);
            
            if (!cita) {
                return res.status(404).json({
                    success: false,
                    message: 'Cita no encontrada'
                });
            }
            
            // Verificar permisos
            if (usuarioRol === 'becario' && cita.becario_id !== usuarioId) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para reprogramar esta cita'
                });
            }
            
            if (usuarioRol === 'psicologo' && cita.psicologo_id !== usuarioId) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para reprogramar esta cita'
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
            const notificaciones = [];
            
            // Notificar al paciente (si tiene email)
            const [paciente] = await sequelize.query(
                'SELECT email, nombre, apellido FROM pacientes WHERE id = ?',
                { replacements: [cita.paciente_id], type: QueryTypes.SELECT }
            );
            
            if (paciente && paciente.email) {
                // Aquí se podría integrar con el servicio de email
                notificaciones.push({
                    tipo: 'email',
                    destinatario: paciente.email,
                    asunto: 'Cita reprogramada',
                    mensaje: `Estimad@ ${paciente.nombre}, su cita ha sido reprogramada para el ${nueva_fecha} a las ${nueva_hora}.`
                });
            }
            
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
            
            // Log
            await sequelize.query(`
                INSERT INTO logs_sistema (usuario_id, tipo_log, modulo, accion, descripcion, datos_antes, datos_despues, created_at)
                VALUES (?, 'modificacion', 'agenda', 'Reprogramar cita', ?, ?, ?, NOW())
            `, {
                replacements: [
                    usuarioId,
                    `Cita ${id} reprogramada`,
                    JSON.stringify(datosOriginales),
                    JSON.stringify({
                        fecha: nueva_fecha,
                        hora: nueva_hora,
                        estado: 'programada'
                    })
                ]
            });
            
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
            const diaSemana = this.obtenerDiaSemana(fechaConsulta);
            
            const disponibilidad = await sequelize.query(`
                SELECT 
                    u.id,
                    CONCAT(u.nombre, ' ', u.apellido) as profesional,
                    u.rol,
                    u.especialidad,
                    d.hora_inicio,
                    d.hora_fin,
                    d.max_citas_dia,
                    d.intervalo_citas,
                    (SELECT COUNT(*) FROM citas c 
                     WHERE (c.psicologo_id = u.id OR c.becario_id = u.id)
                     AND c.fecha = ?
                     AND c.estado IN ('programada', 'confirmada')) as citas_programadas,
                    (d.max_citas_dia - 
                     (SELECT COUNT(*) FROM citas c 
                      WHERE (c.psicologo_id = u.id OR c.becario_id = u.id)
                      AND c.fecha = ?
                      AND c.estado IN ('programada', 'confirmada'))
                    ) as cupos_disponibles
                FROM users u
                LEFT JOIN disponibilidades d ON u.id = d.usuario_id 
                    AND d.dia_semana = ?
                    AND d.activo = TRUE
                WHERE u.rol IN ('psicologo', 'becario')
                AND u.activo = TRUE
                AND d.id IS NOT NULL
                ORDER BY u.rol, u.apellido, u.nombre
            `, {
                replacements: [fechaConsulta, fechaConsulta, diaSemana],
                type: QueryTypes.SELECT
            });
            
            res.json({
                success: true,
                data: {
                    fecha: fechaConsulta,
                    dia_semana: diaSemana,
                    disponibilidad,
                    total_profesionales: disponibilidad.length
                }
            });
            
        } catch (error) {
            console.error('Error en obtenerDisponibilidadProfesionales:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener disponibilidad de profesionales'
            });
        }
    }
    
    // Métodos auxiliares
    static obtenerDiaSemana(fecha) {
        const dias = [
            'domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'
        ];
        const fechaObj = new Date(fecha);
        return dias[fechaObj.getDay()];
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