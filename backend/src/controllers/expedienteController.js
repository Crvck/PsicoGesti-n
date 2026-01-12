const Expediente = require('../models/expedienteModel');
const Paciente = require('../models/pacienteModel');
const Sesion = require('../models/sesionModel');
const Cita = require('../models/citaModel');
const Asignacion = require('../models/asignacionModel');
const User = require('../models/userModel');
const { QueryTypes, Op } = require('sequelize');
const sequelize = require('../config/db');

class ExpedienteController {
    
    static async obtenerExpedienteCompleto(req, res) {
        try {
            const { paciente_id } = req.params;
            const usuarioId = req.user.id;
            const usuarioRol = req.user.rol;

            // Si el token no incluye rol, buscarlo por seguridad
            const effectiveRol = usuarioRol || (await User.findByPk(usuarioId)).rol;
            console.log(`obtenerExpedienteCompleto: usuarioId=${usuarioId}, usuarioRol=${effectiveRol}, paciente_id=${paciente_id}`);
            const tieneAcceso = await ExpedienteController.verificarAccesoExpediente(usuarioId, effectiveRol, paciente_id);
            if (!tieneAcceso) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para acceder a este expediente'
                });
            }
            
            // Obtener información básica del paciente
            const paciente = await Paciente.findByPk(paciente_id, {
                attributes: { exclude: ['password'] }
            });
            console.log('Paciente lookup result:', paciente ? `id=${paciente.id}` : 'NOT FOUND');
            
            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }
            
            // Obtener expediente clínico
            const expediente = await Expediente.findOne({
                where: { paciente_id },
                include: [
                    {
                        model: User,
                        as: 'Psicologo',
                        attributes: ['id', 'nombre', 'apellido', 'especialidad']
                    }
                ]
            });
            console.log('Expediente found:', !!expediente);
            
            // Obtener asignación actual
            const asignacion = await Asignacion.findOne({
                where: {
                    paciente_id,
                    estado: 'activa'
                },
                include: [
                    {
                        model: User,
                        as: 'Psicologo',
                        attributes: ['id', 'nombre', 'apellido', 'especialidad', 'telefono', 'email']
                    },
                    {
                        model: User,
                        as: 'Becario',
                        attributes: ['id', 'nombre', 'apellido', 'email']
                    }
                ]
            });
            
            // Obtener historial de sesiones: primero obtener IDs de citas del paciente y luego sesiones por cita_id
            const citasPaciente = await Cita.findAll({ where: { paciente_id }, attributes: ['id'] });
            const citaIds = (citasPaciente || []).map(c => c.id);

            let sesiones = [];
            if (citaIds.length > 0) {
                sesiones = await Sesion.findAll({
                    where: { cita_id: { [Op.in]: citaIds } },
                    include: [
                        { model: Cita, attributes: ['id', 'fecha', 'hora', 'tipo_consulta', 'paciente_id'] },
                        { model: User, as: 'Psicologo', attributes: ['id', 'nombre', 'apellido'] }
                    ],
                    order: [['fecha', 'DESC'], ['hora_inicio', 'DESC']],
                    limit: 20
                });
            }

            console.log('Citas encontradas para paciente:', citaIds.length, 'Sesiones encontradas:', sesiones.length);
            
            // Obtener citas futuras
            const citasFuturas = await Cita.findAll({
                where: {
                    paciente_id,
                    fecha: { [Op.gte]: new Date().toISOString().split('T')[0] },
                    estado: { [Op.in]: ['programada', 'confirmada'] }
                },
                include: [
                    {
                        model: User,
                        as: 'Psicologo',
                        attributes: ['id', 'nombre', 'apellido']
                    },
                    {
                        model: User,
                        as: 'Becario',
                        attributes: ['id', 'nombre', 'apellido']
                    }
                ],
                order: [['fecha', 'ASC'], ['hora', 'ASC']]
            });
            console.log('Citas futuras encontradas:', citasFuturas.length);
            
            // Obtener estadísticas
            const [estadisticas] = await sequelize.query(`
                SELECT 
                    COUNT(*) as total_sesiones,
                    COUNT(CASE WHEN c.estado = 'completada' THEN 1 END) as sesiones_completadas,
                    COUNT(CASE WHEN c.estado = 'cancelada' THEN 1 END) as sesiones_canceladas,
                    MIN(c.fecha) as primera_sesion,
                    MAX(c.fecha) as ultima_sesion,
                    AVG(TIMESTAMPDIFF(MINUTE, s.hora_inicio, s.hora_fin)) as duracion_promedio
                FROM citas c
                LEFT JOIN sesiones s ON c.id = s.cita_id
                WHERE c.paciente_id = ?
            `, {
                replacements: [paciente_id],
                type: QueryTypes.SELECT
            });
            
            // Obtener historial de asignaciones
            const historialAsignaciones = await Asignacion.findAll({
                where: { paciente_id },
                include: [
                    {
                        model: User,
                        as: 'Psicologo',
                        attributes: ['id', 'nombre', 'apellido']
                    },
                    {
                        model: User,
                        as: 'Becario',
                        attributes: ['id', 'nombre', 'apellido']
                    }
                ],
                order: [['fecha_inicio', 'DESC']]
            });
            
            // Obtener altas si las hay
            const [altas] = await sequelize.query(`
                SELECT * FROM altas WHERE paciente_id = ? ORDER BY fecha_alta DESC LIMIT 1
            `, {
                replacements: [paciente_id],
                type: QueryTypes.SELECT
            });
            
            res.json({
                success: true,
                data: {
                    paciente,
                    expediente: expediente || {},
                    asignacion_actual: asignacion || null,
                    sesiones,
                    citas_futuras: citasFuturas,
                    estadisticas: estadisticas || {},
                    historial_asignaciones: historialAsignaciones,
                    alta: altas || null
                }
            });
            
        } catch (error) {
            console.error('Error en obtenerExpedienteCompleto:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener expediente completo'
            });
        }
    }
    
    static async crearExpediente(req, res) {
        try {
            const { paciente_id } = req.params;
            const expedienteData = req.body;
            const usuarioId = req.user.id;
            
            // Verificar que el paciente existe
            const paciente = await Paciente.findByPk(paciente_id);
            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }
            
            // Verificar que no exista ya un expediente
            const expedienteExistente = await Expediente.findOne({
                where: { paciente_id }
            });
            
            if (expedienteExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un expediente para este paciente'
                });
            }
            
            // Crear expediente
            const expediente = await Expediente.create({
                paciente_id,
                ...expedienteData
            });
            
            // Log
            await sequelize.query(`
                INSERT INTO logs_sistema (usuario_id, tipo_log, modulo, accion, descripcion, created_at)
                VALUES (?, 'creacion', 'expedientes', 'Crear expediente', ?, NOW())
            `, {
                replacements: [usuarioId, `Expediente creado para paciente ${paciente_id}`]
            });
            
            res.json({
                success: true,
                message: 'Expediente creado exitosamente',
                data: expediente
            });
            
        } catch (error) {
            console.error('Error en crearExpediente:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear expediente'
            });
        }
    }
    
    static async actualizarExpediente(req, res) {
        try {
            const { paciente_id } = req.params;
            const updates = req.body;
            const usuarioId = req.user.id;
            const usuarioRol = req.user.rol;
            
            // Verificar permisos
            const puedeActualizar = await ExpedienteController.verificarPermisoActualizarExpediente(usuarioId, usuarioRol, paciente_id);
            
            if (!puedeActualizar) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para actualizar este expediente'
                });
            }
            
            const expediente = await Expediente.findOne({
                where: { paciente_id }
            });
            
            if (!expediente) {
                return res.status(404).json({
                    success: false,
                    message: 'Expediente no encontrado'
                });
            }
            
            // Obtener datos antes para log
            const datosAntes = { ...expediente.toJSON() };
            
            await expediente.update(updates);
            
            // Log
            await sequelize.query(`
                INSERT INTO logs_sistema (usuario_id, tipo_log, modulo, accion, descripcion, datos_antes, datos_despues, created_at)
                VALUES (?, 'modificacion', 'expedientes', 'Actualizar expediente', ?, ?, ?, NOW())
            `, {
                replacements: [
                    usuarioId,
                    `Expediente actualizado para paciente ${paciente_id}`,
                    JSON.stringify(datosAntes),
                    JSON.stringify(expediente.toJSON())
                ]
            });
            
            res.json({
                success: true,
                message: 'Expediente actualizado exitosamente',
                data: expediente
            });
            
        } catch (error) {
            console.error('Error en actualizarExpediente:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar expediente'
            });
        }
    }
    
    static async agregarNotaConfidencial(req, res) {
        try {
            const { paciente_id } = req.params;
            const { nota } = req.body;
            const usuarioId = req.user.id;
            
            // Verificar que el usuario es psicólogo asignado
            const [asignacion] = await sequelize.query(`
                SELECT 1 FROM asignaciones 
                WHERE paciente_id = ? 
                AND psicologo_id = ?
                AND estado = 'activa'
                LIMIT 1
            `, {
                replacements: [paciente_id, usuarioId],
                type: QueryTypes.SELECT
            });
            
            if (!asignacion && req.user.rol !== 'coordinador') {
                return res.status(403).json({
                    success: false,
                    message: 'Solo el psicólogo asignado puede agregar notas confidenciales'
                });
            }
            
            const expediente = await Expediente.findOne({
                where: { paciente_id }
            });
            
            if (!expediente) {
                return res.status(404).json({
                    success: false,
                    message: 'Expediente no encontrado'
                });
            }
            
            // Agregar nota con timestamp
            const fecha = new Date().toLocaleString('es-MX');
            const nuevaNota = `[${fecha}] ${usuarioId}: ${nota}\n\n`;
            const notasActuales = expediente.notas_confidenciales || '';
            
            await expediente.update({
                notas_confidenciales: nuevaNota + notasActuales
            });
            
            // Log
            await sequelize.query(`
                INSERT INTO logs_sistema (usuario_id, tipo_log, modulo, accion, descripcion, created_at)
                VALUES (?, 'modificacion', 'expedientes', 'Agregar nota confidencial', ?, NOW())
            `, {
                replacements: [usuarioId, `Nota confidencial agregada para paciente ${paciente_id}`]
            });
            
            res.json({
                success: true,
                message: 'Nota confidencial agregada exitosamente'
            });
            
        } catch (error) {
            console.error('Error en agregarNotaConfidencial:', error);
            res.status(500).json({
                success: false,
                message: 'Error al agregar nota confidencial'
            });
        }
    }
    
    static async obtenerResumenExpediente(req, res) {
        try {
            const { paciente_id } = req.params;
            const usuarioId = req.user.id;
            const usuarioRol = req.user.rol;
            
            // Si token no incluye rol, buscarlo
            const effectiveRol = usuarioRol || (await User.findByPk(usuarioId)).rol;

            // Verificar permisos básicos
            const tieneAcceso = await ExpedienteController.verificarAccesoExpediente(usuarioId, effectiveRol, paciente_id);
            
            if (!tieneAcceso) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para acceder a este expediente'
                });
            }
            
            const [resumen] = await sequelize.query(`
                SELECT 
                    p.id,
                    p.nombre,
                    p.apellido,
                    p.fecha_nacimiento,
                    p.genero,
                    p.telefono,
                    p.email,
                    p.estado,
                    e.motivo_consulta,
                    e.diagnostico_presuntivo,
                    e.riesgo_suicida,
                    a.psicologo_id,
                    u_psi.nombre as psicologo_nombre,
                    u_psi.apellido as psicologo_apellido,
                    (SELECT COUNT(*) FROM citas WHERE paciente_id = p.id AND estado = 'completada') as sesiones_completadas,
                    (SELECT COUNT(*) FROM citas WHERE paciente_id = p.id AND estado = 'programada' AND fecha >= CURDATE()) as citas_pendientes,
                    (SELECT MAX(fecha) FROM citas WHERE paciente_id = p.id AND estado = 'completada') as ultima_sesion
                FROM pacientes p
                LEFT JOIN expedientes e ON p.id = e.paciente_id
                LEFT JOIN asignaciones a ON p.id = a.paciente_id AND a.estado = 'activa'
                LEFT JOIN users u_psi ON a.psicologo_id = u_psi.id
                WHERE p.id = ?
            `, {
                replacements: [paciente_id],
                type: QueryTypes.SELECT
            });
            
            if (!resumen) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }
            
            res.json({
                success: true,
                data: resumen
            });
            
        } catch (error) {
            console.error('Error en obtenerResumenExpediente:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener resumen de expediente'
            });
        }
    }
    
    // Métodos auxiliares
    static async verificarAccesoExpediente(usuarioId, usuarioRol, pacienteId) {
        if (usuarioRol === 'coordinador') return true;
        
        // Verificar si el usuario está asignado al paciente
        const [asignacion] = await sequelize.query(`
            SELECT 1 FROM asignaciones 
            WHERE paciente_id = ? 
            AND estado = 'activa'
            AND (psicologo_id = ? OR becario_id = ?)
        `, {
            replacements: [pacienteId, usuarioId, usuarioId],
            type: QueryTypes.SELECT
        });
        
        return !!asignacion;
    }
    
    static async verificarPermisoActualizarExpediente(usuarioId, usuarioRol, pacienteId) {
        if (usuarioRol === 'coordinador') return true;
        
        if (usuarioRol === 'psicologo') {
            // Verificar si es el psicólogo asignado
            const [asignacion] = await sequelize.query(`
                SELECT 1 FROM asignaciones 
                WHERE paciente_id = ? 
                AND psicologo_id = ?
                AND estado = 'activa'
            `, {
                replacements: [pacienteId, usuarioId],
                type: QueryTypes.SELECT
            });
            
            return !!asignacion;
        }
        
        return false;
    }
}

module.exports = ExpedienteController;