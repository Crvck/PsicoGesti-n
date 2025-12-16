const Sesion = require('../models/sesionModel');
const Cita = require('../models/citaModel');
const Paciente = require('../models/pacienteModel');
const User = require('../models/userModel');
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');

class SesionController {
    
    static async registrarSesion(req, res) {
        try {
            const { cita_id, desarrollo, conclusion, tareas_asignadas, 
                    emocion_predominante, riesgo_suicida, escalas_aplicadas, 
                    siguiente_cita, privado } = req.body;
            const usuarioId = req.user.id;
            
            // Verificar que la cita existe y está completada
            const cita = await Cita.findByPk(cita_id);
            
            if (!cita) {
                return res.status(404).json({
                    success: false,
                    message: 'Cita no encontrada'
                });
            }
            
            if (cita.estado !== 'completada') {
                return res.status(400).json({
                    success: false,
                    message: 'La cita debe estar en estado "completada" para registrar sesión'
                });
            }
            
            // Verificar que el usuario es el psicólogo asignado
            if (cita.psicologo_id !== usuarioId && req.user.rol !== 'coordinador') {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para registrar esta sesión'
                });
            }
            
            // Verificar que no exista ya una sesión para esta cita
            const sesionExistente = await Sesion.findOne({
                where: { cita_id }
            });
            
            if (sesionExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe una sesión registrada para esta cita'
                });
            }
            
            // Crear sesión
            const sesion = await Sesion.create({
                cita_id,
                psicologo_id: cita.psicologo_id,
                fecha: cita.fecha,
                hora_inicio: cita.hora,
                hora_fin: this.calcularHoraFin(cita.hora, cita.duracion),
                desarrollo,
                conclusion,
                tareas_asignadas,
                emocion_predominante,
                riesgo_suicida,
                escalas_aplicadas,
                siguiente_cita,
                privado: privado || false
            });
            
            // Actualizar expediente del paciente
            await this.actualizarExpediente(cita.paciente_id, {
                ultima_sesion: cita.fecha,
                psicologo_id: cita.psicologo_id,
                riesgo_suicida
            });
            
            // Notificar al becario si está asignado
            if (cita.becario_id) {
                await sequelize.query(`
                    INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, created_at)
                    VALUES (?, 'observacion_nueva', 'Sesión registrada', 
                    CONCAT('Se ha registrado la sesión del paciente: ', 
                    (SELECT CONCAT(nombre, ' ', apellido) FROM pacientes WHERE id = ?)), NOW())
                `, {
                    replacements: [cita.becario_id, cita.paciente_id]
                });
            }
            
            // Log
            await sequelize.query(`
                INSERT INTO logs_sistema (usuario_id, tipo_log, modulo, accion, descripcion, created_at)
                VALUES (?, 'creacion', 'sesiones', 'Registrar sesión', ?, NOW())
            `, {
                replacements: [usuarioId, `Sesión registrada para cita ${cita_id}`]
            });
            
            res.json({
                success: true,
                message: 'Sesión registrada exitosamente',
                data: sesion
            });
            
        } catch (error) {
            console.error('Error en registrarSesion:', error);
            res.status(500).json({
                success: false,
                message: 'Error al registrar sesión',
                error: error.message
            });
        }
    }
    
    static async obtenerSesionesPaciente(req, res) {
        try {
            const { paciente_id } = req.params;
            const usuarioId = req.user.id;
            const usuarioRol = req.user.rol;
            
            // Verificar permisos
            const tieneAcceso = await this.verificarAccesoSesiones(usuarioId, usuarioRol, paciente_id);
            
            if (!tieneAcceso) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para ver las sesiones de este paciente'
                });
            }
            
            const query = `
                SELECT 
                    s.*,
                    c.hora AS hora_cita,
                    c.tipo_consulta,
                    u_psi.nombre AS psicologo_nombre,
                    u_psi.apellido AS psicologo_apellido,
                    u_bec.nombre AS becario_nombre,
                    u_bec.apellido AS becario_apellido
                FROM sesiones s
                JOIN citas c ON s.cita_id = c.id
                JOIN users u_psi ON s.psicologo_id = u_psi.id
                LEFT JOIN users u_bec ON c.becario_id = u_bec.id
                WHERE c.paciente_id = ?
                ORDER BY s.fecha DESC, s.hora_inicio DESC
            `;
            
            const sesiones = await sequelize.query(query, {
                replacements: [paciente_id],
                type: QueryTypes.SELECT
            });
            
            // Filtrar sesiones privadas si no es el psicólogo
            const sesionesFiltradas = sesiones.filter(sesion => {
                if (sesion.privado && sesion.psicologo_id !== usuarioId && usuarioRol !== 'coordinador') {
                    return false;
                }
                return true;
            });
            
            res.json({
                success: true,
                data: sesionesFiltradas,
                count: sesionesFiltradas.length
            });
            
        } catch (error) {
            console.error('Error en obtenerSesionesPaciente:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener sesiones del paciente'
            });
        }
    }
    
    static async obtenerSesionDetalle(req, res) {
        try {
            const { id } = req.params;
            const usuarioId = req.user.id;
            const usuarioRol = req.user.rol;
            
            const query = `
                SELECT 
                    s.*,
                    c.paciente_id,
                    c.hora AS hora_cita,
                    c.tipo_consulta,
                    p.nombre AS paciente_nombre,
                    p.apellido AS paciente_apellido,
                    u_psi.nombre AS psicologo_nombre,
                    u_psi.apellido AS psicologo_apellido,
                    u_bec.nombre AS becario_nombre,
                    u_bec.apellido AS becario_apellido
                FROM sesiones s
                JOIN citas c ON s.cita_id = c.id
                JOIN pacientes p ON c.paciente_id = p.id
                JOIN users u_psi ON s.psicologo_id = u_psi.id
                LEFT JOIN users u_bec ON c.becario_id = u_bec.id
                WHERE s.id = ?
            `;
            
            const [sesion] = await sequelize.query(query, {
                replacements: [id],
                type: QueryTypes.SELECT
            });
            
            if (!sesion) {
                return res.status(404).json({
                    success: false,
                    message: 'Sesión no encontrada'
                });
            }
            
            // Verificar acceso a sesión privada
            if (sesion.privado && sesion.psicologo_id !== usuarioId && usuarioRol !== 'coordinador') {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para ver esta sesión privada'
                });
            }
            
            // Verificar acceso general al paciente
            const tieneAcceso = await this.verificarAccesoSesiones(usuarioId, usuarioRol, sesion.paciente_id);
            
            if (!tieneAcceso) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para ver esta sesión'
                });
            }
            
            res.json({
                success: true,
                data: sesion
            });
            
        } catch (error) {
            console.error('Error en obtenerSesionDetalle:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener detalle de sesión'
            });
        }
    }
    
    static async actualizarSesion(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const usuarioId = req.user.id;
            const usuarioRol = req.user.rol;
            
            const sesion = await Sesion.findByPk(id);
            
            if (!sesion) {
                return res.status(404).json({
                    success: false,
                    message: 'Sesión no encontrada'
                });
            }
            
            // Verificar permisos (solo psicólogo asignado o coordinador)
            if (sesion.psicologo_id !== usuarioId && usuarioRol !== 'coordinador') {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para actualizar esta sesión'
                });
            }
            
            // Campos que no se pueden modificar
            const camposBloqueados = ['cita_id', 'psicologo_id', 'fecha', 'hora_inicio', 'hora_fin'];
            for (const campo of camposBloqueados) {
                if (updates[campo]) {
                    delete updates[campo];
                }
            }
            
            if (Object.keys(updates).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No se proporcionaron campos válidos para actualizar'
                });
            }
            
            // Obtener datos antes para log
            const datosAntes = { ...sesion.toJSON() };
            
            await sesion.update(updates);
            
            // Log
            await sequelize.query(`
                INSERT INTO logs_sistema (usuario_id, tipo_log, modulo, accion, descripcion, datos_antes, datos_despues, created_at)
                VALUES (?, 'modificacion', 'sesiones', 'Actualizar sesión', ?, ?, ?, NOW())
            `, {
                replacements: [
                    usuarioId,
                    `Sesión actualizada ID: ${id}`,
                    JSON.stringify(datosAntes),
                    JSON.stringify(sesion.toJSON())
                ]
            });
            
            res.json({
                success: true,
                message: 'Sesión actualizada exitosamente',
                data: sesion
            });
            
        } catch (error) {
            console.error('Error en actualizarSesion:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar sesión'
            });
        }
    }
    
    // Métodos auxiliares
    static calcularHoraFin(horaInicio, duracionMinutos) {
        const [horas, minutos] = horaInicio.split(':').map(Number);
        const fecha = new Date();
        fecha.setHours(horas, minutos + duracionMinutos, 0, 0);
        return fecha.toTimeString().slice(0, 8);
    }
    
    static async verificarAccesoSesiones(usuarioId, usuarioRol, pacienteId) {
        if (usuarioRol === 'coordinador') return true;
        
        const query = `
            SELECT 1 FROM asignaciones 
            WHERE paciente_id = ? 
            AND estado = 'activa'
            AND (psicologo_id = ? OR becario_id = ?)
        `;
        
        const [result] = await sequelize.query(query, {
            replacements: [pacienteId, usuarioId, usuarioId],
            type: QueryTypes.SELECT
        });
        
        return !!result;
    }
    
    static async actualizarExpediente(pacienteId, datos) {
        await sequelize.query(`
            UPDATE expedientes 
            SET riesgo_suicida = ?, 
                updated_at = NOW()
            WHERE paciente_id = ?
        `, {
            replacements: [datos.riesgo_suicida, pacienteId]
        });
    }
}

module.exports = SesionController;