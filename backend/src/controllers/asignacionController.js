const Asignacion = require('../models/asignacionModel');
const Paciente = require('../models/pacienteModel');
const User = require('../models/userModel');
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');

class AsignacionController {
    
    static async crearAsignacion(req, res) {
        try {
            const { paciente_id, psicologo_id, becario_id, notas } = req.body;
            const usuarioId = req.user.id;
            
            // Validar que el paciente existe y está activo
            const paciente = await Paciente.findByPk(paciente_id);
            if (!paciente || !paciente.activo) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado o inactivo'
                });
            }
            
            // Validar que el psicólogo existe y es psicólogo
            const psicologo = await User.findOne({
                where: { id: psicologo_id, rol: 'psicologo', activo: true }
            });
            
            if (!psicologo) {
                return res.status(404).json({
                    success: false,
                    message: 'Psicólogo no encontrado o inactivo'
                });
            }
            
            // Validar que el becario existe si se especifica
            if (becario_id) {
                const becario = await User.findOne({
                    where: { id: becario_id, rol: 'becario', activo: true }
                });
                
                if (!becario) {
                    return res.status(404).json({
                        success: false,
                        message: 'Becario no encontrado o inactivo'
                    });
                }
            }
            
            // Verificar que no haya asignación activa
            const asignacionExistente = await Asignacion.findOne({
                where: {
                    paciente_id,
                    estado: 'activa'
                }
            });
            
            if (asignacionExistente) {
                // Finalizar asignación anterior
                await asignacionExistente.update({
                    estado: 'finalizada',
                    fecha_fin: new Date().toISOString().split('T')[0],
                    motivo_fin: 'Reasignación'
                });
            }
            
            // Crear nueva asignación
            const asignacion = await Asignacion.create({
                paciente_id,
                psicologo_id,
                becario_id,
                notas,
                fecha_inicio: new Date().toISOString().split('T')[0]
            });
            
            // Actualizar paciente con psicólogo asignado
            await paciente.update({ fundacion_id: psicologo.fundacion_id });
            
            // Crear notificaciones
            await sequelize.query(`
                INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, created_at)
                VALUES 
                (?, 'asignacion_nueva', 'Nueva asignación', CONCAT('Se le ha asignado el paciente: ', ?), NOW()),
                (?, 'asignacion_nueva', 'Nueva asignación', CONCAT('Ha sido asignado como supervisor del paciente: ', ?), NOW())
            `, {
                replacements: [
                    psicologo_id,
                    `${paciente.nombre} ${paciente.apellido}`,
                    usuarioId,
                    `${paciente.nombre} ${paciente.apellido}`
                ]
            });
            
            if (becario_id) {
                await sequelize.query(`
                    INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, created_at)
                    VALUES (?, 'asignacion_nueva', 'Nueva asignación', CONCAT('Se le ha asignado el paciente: ', ?), NOW())
                `, {
                    replacements: [
                        becario_id,
                        `${paciente.nombre} ${paciente.apellido}`
                    ]
                });
            }
            
            // Log
            await sequelize.query(`
                INSERT INTO logs_sistema (usuario_id, tipo_log, modulo, accion, descripcion, created_at)
                VALUES (?, 'creacion', 'asignaciones', 'Crear asignación', ?, NOW())
            `, {
                replacements: [
                    usuarioId,
                    `Asignación creada: Paciente ${paciente.id} → Psicólogo ${psicologo_id}${becario_id ? ` + Becario ${becario_id}` : ''}`
                ]
            });
            
            // Recuperar asignación creada con asociaciones para devolver datos completos al cliente
            const asignacionCompleta = await Asignacion.findOne({
                where: { id: asignacion.id },
                include: [
                    { model: Paciente, attributes: ['id', 'nombre', 'apellido'] },
                    { model: User, as: 'Psicologo', attributes: ['id', 'nombre', 'apellido', 'email'] },
                    { model: User, as: 'Becario', attributes: ['id', 'nombre', 'apellido', 'email'] }
                ]
            });

            console.log('Asignacion creada (completa):', JSON.stringify(asignacionCompleta, null, 2));

            res.json({
                success: true,
                message: 'Asignación creada exitosamente',
                data: asignacionCompleta
            });
            
        } catch (error) {
            console.error('Error en crearAsignacion:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear asignación',
                error: error.message
            });
        }
    }
    
    static async obtenerAsignacionesActivas(req, res) {
        try {
            const { psicologo_id, becario_id, paciente_id } = req.query;
            const usuarioId = req.user.id;
            
            const whereClause = { estado: 'activa' };
            
            if (psicologo_id) whereClause.psicologo_id = psicologo_id;
            if (becario_id) whereClause.becario_id = becario_id;
            if (paciente_id) whereClause.paciente_id = paciente_id;
            
            const asignaciones = await Asignacion.findAll({
                where: whereClause,
                include: [
                    {
                        model: Paciente,
                        attributes: ['id', 'nombre', 'apellido', 'email', 'telefono', 'estado']
                    },
                    {
                        model: User,
                        as: 'Psicologo',
                        attributes: ['id', 'nombre', 'apellido', 'email', 'especialidad']
                    },
                    {
                        model: User,
                        as: 'Becario',
                        attributes: ['id', 'nombre', 'apellido', 'email']
                    }
                ],
                order: [['fecha_inicio', 'DESC']]
            });
            
            res.json({
                success: true,
                data: asignaciones,
                count: asignaciones.length
            });
            
        } catch (error) {
            console.error('Error en obtenerAsignacionesActivas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener asignaciones'
            });
        }
    }
    
    static async obtenerMisPacientes(req, res) {
        try {
            const usuarioId = req.user.id;
            const usuarioRol = req.user.rol;
            
            let query = '';
            let replacements = [usuarioId];
            
            if (usuarioRol === 'psicologo') {
                query = `
                    SELECT 
                        p.*,
                        a.fecha_inicio,
                        a.becario_id,
                        u_bec.nombre AS becario_nombre,
                        u_bec.apellido AS becario_apellido,
                        (SELECT COUNT(*) FROM citas c 
                         WHERE c.paciente_id = p.id 
                         AND c.estado = 'completada') AS sesiones_completadas,
                        (SELECT COUNT(*) FROM citas c 
                         WHERE c.paciente_id = p.id 
                         AND c.estado = 'programada'
                         AND c.fecha >= CURDATE()) AS citas_pendientes
                    FROM asignaciones a
                    JOIN pacientes p ON a.paciente_id = p.id
                    LEFT JOIN users u_bec ON a.becario_id = u_bec.id
                    WHERE a.psicologo_id = ? 
                    AND a.estado = 'activa'
                    AND p.activo = TRUE
                    ORDER BY p.apellido, p.nombre
                `;
            } else if (usuarioRol === 'becario') {
                query = `
                    SELECT 
                        p.*,
                        a.fecha_inicio,
                        a.psicologo_id,
                        u_psi.nombre AS psicologo_nombre,
                        u_psi.apellido AS psicologo_apellido,
                        (SELECT COUNT(*) FROM citas c 
                         WHERE c.paciente_id = p.id 
                         AND c.becario_id = ?
                         AND c.estado = 'completada') AS sesiones_completadas,
                        (SELECT COUNT(*) FROM citas c 
                         WHERE c.paciente_id = p.id 
                         AND c.becario_id = ?
                         AND c.estado = 'programada'
                         AND c.fecha >= CURDATE()) AS citas_pendientes
                    FROM asignaciones a
                    JOIN pacientes p ON a.paciente_id = p.id
                    JOIN users u_psi ON a.psicologo_id = u_psi.id
                    WHERE a.becario_id = ? 
                    AND a.estado = 'activa'
                    AND p.activo = TRUE
                    ORDER BY p.apellido, p.nombre
                `;
                replacements = [usuarioId, usuarioId, usuarioId];
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso no permitido para este rol'
                });
            }
            
            const pacientes = await sequelize.query(query, {
                replacements,
                type: QueryTypes.SELECT
            });
            
            res.json({
                success: true,
                data: pacientes,
                count: pacientes.length
            });
            
        } catch (error) {
            console.error('Error en obtenerMisPacientes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener pacientes asignados'
            });
        }
    }
    
    static async finalizarAsignacion(req, res) {
        try {
            const { id } = req.params;
            const { motivo_fin, notas } = req.body;
            const usuarioId = req.user.id;
            
            const asignacion = await Asignacion.findByPk(id);
            
            if (!asignacion || asignacion.estado !== 'activa') {
                return res.status(404).json({
                    success: false,
                    message: 'Asignación activa no encontrada'
                });
            }
            
            // Obtener datos antes para log
            const datosAntes = { ...asignacion.toJSON() };
            
            await asignacion.update({
                estado: 'finalizada',
                fecha_fin: new Date().toISOString().split('T')[0],
                motivo_fin: motivo_fin || 'Finalización manual',
                notas: notas ? `${asignacion.notas || ''}\n--- Finalización ---\n${notas}` : asignacion.notas
            });
            
            // Log
            await sequelize.query(`
                INSERT INTO logs_sistema (usuario_id, tipo_log, modulo, accion, descripcion, datos_antes, datos_despues, created_at)
                VALUES (?, 'modificacion', 'asignaciones', 'Finalizar asignación', ?, ?, ?, NOW())
            `, {
                replacements: [
                    usuarioId,
                    `Asignación finalizada ID: ${id}`,
                    JSON.stringify(datosAntes),
                    JSON.stringify(asignacion.toJSON())
                ]
            });
            
            res.json({
                success: true,
                message: 'Asignación finalizada exitosamente'
            });
            
        } catch (error) {
            console.error('Error en finalizarAsignacion:', error);
            res.status(500).json({
                success: false,
                message: 'Error al finalizar asignación'
            });
        }
    }
    
    static async obtenerHistorialAsignaciones(req, res) {
        try {
            const { paciente_id } = req.params;
            
            const asignaciones = await Asignacion.findAll({
                where: { paciente_id },
                include: [
                    {
                        model: User,
                        as: 'Psicologo',
                        attributes: ['id', 'nombre', 'apellido', 'email']
                    },
                    {
                        model: User,
                        as: 'Becario',
                        attributes: ['id', 'nombre', 'apellido', 'email']
                    }
                ],
                order: [['fecha_inicio', 'DESC']]
            });
            
            res.json({
                success: true,
                data: asignaciones,
                count: asignaciones.length
            });
            
        } catch (error) {
            console.error('Error en obtenerHistorialAsignaciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener historial de asignaciones'
            });
        }
    }
}

module.exports = AsignacionController;