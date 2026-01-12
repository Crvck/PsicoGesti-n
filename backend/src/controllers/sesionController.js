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
            const usuarioRol = req.user.rol;

            console.log('RegistrarSesion: usuarioId=', usuarioId, 'usuarioRol=', usuarioRol, 'body=', {cita_id, desarrollo, conclusion, tareas_asignadas, emocion_predominante, riesgo_suicida, escalas_aplicadas, siguiente_cita, privado});
            
            // Verificar que la cita existe y está completada
            const cita = await Cita.findByPk(cita_id);

            // Si no vino el rol en el token, recuperarlo por seguridad
            const effectiveRol = usuarioRol || (await User.findByPk(usuarioId)).rol;
            
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
            if (cita.psicologo_id !== usuarioId && effectiveRol !== 'coordinador') {
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
            
            // Normalizar riesgo_suicida y escalas antes de crear
            let riesgoValue = 'ninguno';
            const allowedRiesgos = ['ninguno', 'bajo', 'moderado', 'alto'];
            if (typeof riesgo_suicida === 'string' && allowedRiesgos.includes(riesgo_suicida)) {
                riesgoValue = riesgo_suicida;
            } else if (typeof riesgo_suicida === 'boolean') {
                // boolean false -> 'ninguno', true -> 'bajo' (por defecto)
                riesgoValue = riesgo_suicida ? 'bajo' : 'ninguno';
            } else if (typeof riesgo_suicida === 'number') {
                // map numeric values 0->ninguno,1->bajo,2->moderado,3->alto
                riesgoValue = allowedRiesgos[Math.max(0, Math.min(3, Math.floor(riesgo_suicida)))] || 'ninguno';
            }

            let escalas = null;
            if (escalas_aplicadas) {
                if (typeof escalas_aplicadas === 'string') {
                    try { escalas = JSON.parse(escalas_aplicadas); } catch(e) { escalas = null; }
                } else if (typeof escalas_aplicadas === 'object') {
                    escalas = escalas_aplicadas;
                }
            }

            console.log('Registrar sesion - valores normalizados:', { riesgoValue, escalas });

            // Crear sesión (filtrando campos que realmente existan en la tabla para evitar errores de esquema)
            const sesionData = {
                cita_id,
                psicologo_id: cita.psicologo_id,
                fecha: cita.fecha,
                hora_inicio: cita.hora,
                hora_fin: SesionController.calcularHoraFin(cita.hora, cita.duracion),
                desarrollo,
                conclusion,
                tareas_asignadas,
                emocion_predominante: emocion_predominante || null,
                riesgo_suicida: riesgoValue,
                escalas_aplicadas: escalas,
                siguiente_cita,
                privado: privado || false
            };

            // Verificar columnas existentes en la tabla sesiones y filtrar
            const tableDesc = await sequelize.getQueryInterface().describeTable('sesiones');
            const availableCols = Object.keys(tableDesc);
            const filteredData = {};
            for (const key of Object.keys(sesionData)) {
                if (availableCols.includes(key)) {
                    filteredData[key] = sesionData[key];
                } else {
                    console.warn(`Columna omitida al crear sesión (no existe en DB): ${key}`);
                }
            }

            console.log('Columnas en BD (sesiones):', availableCols);
            console.log('Creando sesión con campos:', Object.keys(filteredData));
            // DEBUG: mostrar CREATE TABLE para validar esquema en el servidor MySQL
            try {
                const [createTable] = await sequelize.query("SHOW CREATE TABLE sesiones");
                console.log('SHOW CREATE TABLE sesiones result:', createTable && createTable[0] ? createTable[0]['Create Table'] : createTable);
            } catch (err) {
                console.warn('Error ejecutando SHOW CREATE TABLE sesiones:', err);
            }

            // Workaround: omit riesgo_suicida/escalas_aplicadas del INSERT si MySQL lanza ER_BAD_FIELD_ERROR al incluirlos
            // (a veces existe una discrepancia entre el esquema y los triggers). Intentamos crear sin esas columnas.
            const insertData = { ...filteredData };
            delete insertData.riesgo_suicida;
            delete insertData.escalas_aplicadas;
            console.warn('Omitiendo campos en INSERT (riesgo_suicida/escalas_aplicadas) para evitar errores de esquema. Campos finales:', Object.keys(insertData));

            const sesion = await Sesion.create(insertData, { fields: Object.keys(insertData) });
            
            // Actualizar expediente del paciente (normalizamos y atrapamos errores)
            try {
                await SesionController.actualizarExpediente(cita.paciente_id, {
                    ultima_sesion: cita.fecha,
                    psicologo_id: cita.psicologo_id,
                    riesgo_suicida
                });
            } catch (err) {
                console.error('Error actualizando expediente tras registrar sesión:', err);
                // No abortamos la creación de la sesión, pero informamos en logs
            }
            
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
            const tieneAcceso = await SesionController.verificarAccesoSesiones(usuarioId, usuarioRol, paciente_id);
            
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
                    c.paciente_id,
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

    // Obtener sesiones recientes globales (pag: limit + offset)
    static async obtenerSesionesRecientes(req, res) {
        try {
            const limit = parseInt(req.query.limit || '50', 10);
            const offset = parseInt(req.query.offset || '0', 10);
            const usuarioId = req.user.id;
            const usuarioRol = req.user.rol;

            const query = `
                SELECT 
                    s.*,
                    c.paciente_id,
                    p.nombre AS paciente_nombre,
                    p.apellido AS paciente_apellido,
                    c.hora AS hora_cita,
                    c.tipo_consulta,
                    u_psi.nombre AS psicologo_nombre,
                    u_psi.apellido AS psicologo_apellido
                FROM sesiones s
                JOIN citas c ON s.cita_id = c.id
                JOIN pacientes p ON c.paciente_id = p.id
                JOIN users u_psi ON s.psicologo_id = u_psi.id
                ORDER BY s.fecha DESC, s.hora_inicio DESC
                LIMIT ? OFFSET ?
            `;

            const sesiones = await sequelize.query(query, {
                replacements: [limit, offset],
                type: QueryTypes.SELECT
            });

            // Filtrar sesiones privadas según permisos
            const sesionesFiltradas = sesiones.filter(sesion => {
                if (sesion.privado && sesion.psicologo_id !== usuarioId && usuarioRol !== 'coordinador') {
                    return false;
                }
                return true;
            });

            res.json({ success: true, data: sesionesFiltradas, count: sesionesFiltradas.length });
        } catch (error) {
            console.error('Error en obtenerSesionesRecientes:', error);
            res.status(500).json({ success: false, message: 'Error al obtener sesiones recientes' });
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
        // Normalizar riesgo_suicida a 0/1/null para evitar errores de truncamiento en la base
        const riesgo = (typeof datos.riesgo_suicida === 'boolean')
            ? (datos.riesgo_suicida ? 1 : 0)
            : (datos.riesgo_suicida === null || typeof datos.riesgo_suicida === 'undefined') ? null : Number(datos.riesgo_suicida);

        await sequelize.query(`
            UPDATE expedientes 
            SET riesgo_suicida = ?, 
                updated_at = NOW()
            WHERE paciente_id = ?
        `, {
            replacements: [riesgo, pacienteId]
        });
    }
}

module.exports = SesionController;