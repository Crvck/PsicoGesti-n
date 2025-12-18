const Alta = require('../models/altaModel');
const Paciente = require('../models/pacienteModel');
const Cita = require('../models/citaModel');
const Asignacion = require('../models/asignacionModel');
const { QueryTypes, Op } = require('sequelize'); // AÑADE Op aquí
const sequelize = require('../config/db');

class AltaController {
    
    static async darAltaPaciente(req, res) {
        try {
            const { paciente_id, tipo_alta, motivo_detallado, recomendaciones, 
                    evaluacion_final, seguimiento_recomendado, fecha_seguimiento } = req.body;
            const usuarioId = req.user.id;
            
            // Verificar que el paciente existe y está activo
            const paciente = await Paciente.findByPk(paciente_id);
            
            if (!paciente || !paciente.activo) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado o ya dado de alta'
                });
            }
            
            // Obtener estadísticas del paciente
            const [estadisticas] = await sequelize.query(`
                SELECT 
                    COUNT(*) as total_sesiones,
                    COUNT(CASE WHEN estado = 'completada' THEN 1 END) as sesiones_completadas,
                    MIN(fecha) as primera_sesion,
                    MAX(fecha) as ultima_sesion
                FROM citas 
                WHERE paciente_id = ?
                AND estado IN ('completada', 'cancelada')
            `, {
                replacements: [paciente_id],
                type: QueryTypes.SELECT
            });
            
            // Iniciar transacción
            const transaction = await sequelize.transaction();
            
            try {
                // 1. Registrar el alta
                const alta = await Alta.create({
                    paciente_id,
                    usuario_id: usuarioId,
                    tipo_alta,
                    fecha_alta: new Date().toISOString().split('T')[0],
                    motivo_detallado,
                    recomendaciones,
                    sesiones_totales: estadisticas?.sesiones_completadas || 0,
                    evaluacion_final,
                    seguimiento_recomendado,
                    fecha_seguimiento: seguimiento_recomendado ? fecha_seguimiento : null
                }, { transaction });
                
                // 2. Desactivar paciente
                await paciente.update({
                    activo: false,
                    estado: `alta_${tipo_alta}`,
                    updated_at: new Date()
                }, { transaction });
                
                // 3. Finalizar asignaciones activas
                await Asignacion.update({
                    estado: 'finalizada',
                    fecha_fin: new Date().toISOString().split('T')[0],
                    motivo_fin: `Paciente dado de alta (${tipo_alta})`
                }, {
                    where: { paciente_id, estado: 'activa' },
                    transaction
                });
                
                // 4. Cancelar citas futuras - VERSIÓN CORREGIDA
                const fechaHoy = new Date().toISOString().split('T')[0];
                
                await Cita.update({
                    estado: 'cancelada',
                    motivo_cancelacion: `Paciente dado de alta (${tipo_alta})`,
                    updated_at: new Date()
                }, {
                    where: {
                        paciente_id,
                        fecha: { [Op.gte]: fechaHoy },
                        estado: { [Op.in]: ['programada', 'confirmada'] }
                    },
                    transaction
                });
                
                // 5. Obtener profesionales asignados para notificaciones
                const [profesionales] = await sequelize.query(`
                    SELECT DISTINCT 
                        a.psicologo_id,
                        a.becario_id
                    FROM asignaciones a
                    WHERE a.paciente_id = ?
                    AND a.estado = 'activa'
                `, {
                    replacements: [paciente_id],
                    type: QueryTypes.SELECT,
                    transaction
                });
                
                // 6. Crear notificaciones
                if (profesionales) {
                    const notificaciones = [];
                    const titulo = 'Paciente dado de alta';
                    const mensaje = `El paciente ${paciente.nombre} ${paciente.apellido} ha sido dado de alta (${tipo_alta}).`;
                    
                    if (profesionales.psicologo_id) {
                        notificaciones.push([profesionales.psicologo_id, 'alerta_sistema', titulo, mensaje]);
                    }
                    
                    if (profesionales.becario_id) {
                        notificaciones.push([profesionales.becario_id, 'alerta_sistema', titulo, mensaje]);
                    }
                    
                    for (const [usuarioIdNotif, tipo, tituloNotif, mensajeNotif] of notificaciones) {
                        await sequelize.query(`
                            INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, created_at)
                            VALUES (?, ?, ?, ?, NOW())
                        `, {
                            replacements: [usuarioIdNotif, tipo, tituloNotif, mensajeNotif],
                            transaction
                        });
                    }
                }
                
                // 7. Registrar log
                await sequelize.query(`
                    INSERT INTO logs_sistema (usuario_id, tipo_log, modulo, accion, descripcion, created_at)
                    VALUES (?, 'modificacion', 'altas', 'Dar de alta paciente', ?, NOW())
                `, {
                    replacements: [usuarioId, `Alta paciente ${paciente_id} - Tipo: ${tipo_alta}`],
                    transaction
                });
                
                // Commit transacción
                await transaction.commit();
                
                res.json({
                    success: true,
                    message: 'Paciente dado de alta exitosamente',
                    data: {
                        alta,
                        paciente: {
                            id: paciente.id,
                            nombre: paciente.nombre,
                            apellido: paciente.apellido,
                            estado: paciente.estado
                        },
                        estadisticas
                    }
                });
                
            } catch (error) {
                await transaction.rollback();
                console.error('Error en transacción de alta:', error);
                throw error;
            }
            
        } catch (error) {
            console.error('Error en darAltaPaciente:', error);
            res.status(500).json({
                success: false,
                message: 'Error al dar de alta paciente',
                error: error.message
            });
        }
    }
    
    static async obtenerAltas(req, res) {
        try {
            const { fecha_inicio, fecha_fin, tipo_alta, psicologo_id } = req.query;
            
            let query = `
                SELECT 
                    a.*,
                    p.nombre AS paciente_nombre,
                    p.apellido AS paciente_apellido,
                    p.telefono AS paciente_telefono,
                    u.nombre AS usuario_nombre,
                    u.apellido AS usuario_apellido,
                    COUNT(DISTINCT c.id) AS total_sesiones
                FROM altas a
                JOIN pacientes p ON a.paciente_id = p.id
                JOIN users u ON a.usuario_id = u.id
                LEFT JOIN citas c ON a.paciente_id = c.paciente_id AND c.estado = 'completada'
                WHERE 1=1
            `;
            
            const replacements = [];
            
            if (fecha_inicio) {
                query += ` AND a.fecha_alta >= ?`;
                replacements.push(fecha_inicio);
            }
            
            if (fecha_fin) {
                query += ` AND a.fecha_alta <= ?`;
                replacements.push(fecha_fin);
            }
            
            if (tipo_alta) {
                query += ` AND a.tipo_alta = ?`;
                replacements.push(tipo_alta);
            }
            
            if (psicologo_id) {
                query += ` AND EXISTS (
                    SELECT 1 FROM asignaciones asig 
                    WHERE asig.paciente_id = a.paciente_id 
                    AND asig.psicologo_id = ?
                    AND asig.estado = 'finalizada'
                )`;
                replacements.push(psicologo_id);
            }
            
            query += ` GROUP BY a.id, p.id, u.id
                      ORDER BY a.fecha_alta DESC, p.apellido, p.nombre`;
            
            const altas = await sequelize.query(query, {
                replacements,
                type: QueryTypes.SELECT
            });
            
            res.json({
                success: true,
                data: altas,
                count: altas.length
            });
            
        } catch (error) {
            console.error('Error en obtenerAltas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener altas'
            });
        }
    }
    
    static async obtenerAltaDetalle(req, res) {
        try {
            const { id } = req.params;
            
            const query = `
                SELECT 
                    a.*,
                    p.nombre AS paciente_nombre,
                    p.apellido AS paciente_apellido,
                    p.fecha_nacimiento,
                    p.genero,
                    p.email AS paciente_email,
                    p.telefono AS paciente_telefono,
                    u.nombre AS usuario_nombre,
                    u.apellido AS usuario_apellido,
                    u_psi.nombre AS psicologo_nombre,
                    u_psi.apellido AS psicologo_apellido,
                    (SELECT COUNT(*) FROM citas WHERE paciente_id = a.paciente_id AND estado = 'completada') AS total_sesiones,
                    (SELECT GROUP_CONCAT(DISTINCT DATE_FORMAT(fecha, '%Y-%m-%d') ORDER BY fecha DESC SEPARATOR ', ') 
                    FROM citas WHERE paciente_id = a.paciente_id AND estado = 'completada' LIMIT 10) AS ultimas_sesiones
                FROM altas a
                JOIN pacientes p ON a.paciente_id = p.id
                JOIN users u ON a.usuario_id = u.id
                LEFT JOIN (
                    SELECT paciente_id, psicologo_id 
                    FROM asignaciones 
                    WHERE paciente_id = ? 
                    ORDER BY fecha_inicio DESC 
                    LIMIT 1
                ) asig ON p.id = asig.paciente_id
                LEFT JOIN users u_psi ON asig.psicologo_id = u_psi.id
                WHERE a.id = ?
            `;
            
            const [alta] = await sequelize.query(query, {
                replacements: [id, id],
                type: QueryTypes.SELECT
            });
            
            if (!alta) {
                return res.status(404).json({
                    success: false,
                    message: 'Alta no encontrada'
                });
            }
            
            res.json({
                success: true,
                data: alta
            });
            
        } catch (error) {
            console.error('Error en obtenerAltaDetalle:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener detalle de alta'
            });
        }
    }
    
    static async obtenerEstadisticasAltas(req, res) {
        try {
            const { fecha_inicio, fecha_fin } = req.query;
            
            let query = `
                SELECT 
                    tipo_alta,
                    COUNT(*) as total,
                    MONTH(fecha_alta) as mes,
                    YEAR(fecha_alta) as anio,
                    AVG(sesiones_totales) as promedio_sesiones,
                    SUM(CASE WHEN seguimiento_recomendado = TRUE THEN 1 ELSE 0 END) as seguimientos_recomendados
                FROM altas
                WHERE 1=1
            `;
            
            let replacements = [];
            
            if (fecha_inicio) {
                query += ` AND fecha_alta >= ?`;
                replacements.push(fecha_inicio);
            }
            
            if (fecha_fin) {
                query += ` AND fecha_alta <= ?`;
                replacements.push(fecha_fin);
            }
            
            query += ` GROUP BY tipo_alta, YEAR(fecha_alta), MONTH(fecha_alta)
                    ORDER BY anio DESC, mes DESC, total DESC`;
            
            const estadisticas = await sequelize.query(query, {
                replacements,
                type: QueryTypes.SELECT
            });
            
            // Totales generales - AQUÍ ESTABA EL ERROR PRINCIPAL
            // Crear la query para totales de forma dinámica
            let totalesQuery = `
                SELECT 
                    COUNT(*) as total_altas,
                    AVG(sesiones_totales) as promedio_sesiones_global,
                    MIN(fecha_alta) as primera_alta,
                    MAX(fecha_alta) as ultima_alta
                FROM altas
                WHERE 1=1
            `;
            
            let totalesReplacements = [];
            
            if (fecha_inicio) {
                totalesQuery += ` AND fecha_alta >= ?`;
                totalesReplacements.push(fecha_inicio);
            }
            
            if (fecha_fin) {
                totalesQuery += ` AND fecha_alta <= ?`;
                totalesReplacements.push(fecha_fin);
            }
            
            const [totales] = await sequelize.query(totalesQuery, {
                replacements: totalesReplacements,
                type: QueryTypes.SELECT
            });
            
            res.json({
                success: true,
                data: {
                    estadisticas,
                    totales
                }
            });
            
        } catch (error) {
            console.error('Error en obtenerEstadisticasAltas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas de altas'
            });
        }
    }
    
    // Método auxiliar para verificar permisos
    static async verificarPermisoAlta(usuarioId, pacienteId) {
        const usuarioRol = await this.obtenerRolUsuario(usuarioId);
        
        if (usuarioRol === 'coordinador') return true;
        
        if (usuarioRol === 'psicologo') {
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
    
    static async obtenerRolUsuario(usuarioId) {
        const [usuario] = await sequelize.query(
            'SELECT rol FROM users WHERE id = ?',
            { replacements: [usuarioId], type: QueryTypes.SELECT }
        );
        
        return usuario?.rol;
    }
}

module.exports = AltaController;