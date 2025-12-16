const Fundacion = require('../models/fundacionModel');
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');

class FundacionController {
    
    static async crearFundacion(req, res) {
        try {
            const fundacionData = req.body;
            const usuarioId = req.user.id;
            
            const fundacion = await Fundacion.create(fundacionData);
            
            // Log
            await sequelize.query(
                `INSERT INTO logs_sistema (usuario_id, tipo_log, modulo, accion, descripcion, created_at)
                 VALUES (?, 'creacion', 'fundaciones', 'Crear fundación', ?, NOW())`,
                { replacements: [usuarioId, `Nueva fundación: ${fundacion.nombre}`] }
            );
            
            res.json({
                success: true,
                message: 'Fundación creada exitosamente',
                data: fundacion
            });
            
        } catch (error) {
            console.error('Error en crearFundacion:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear fundación',
                error: error.message
            });
        }
    }
    
    static async obtenerFundaciones(req, res) {
        try {
            const { activo } = req.query;
            const whereClause = {};
            
            if (activo !== undefined) {
                whereClause.activo = activo === 'true';
            }
            
            const fundaciones = await Fundacion.findAll({
                where: whereClause,
                order: [['nombre', 'ASC']]
            });
            
            res.json({
                success: true,
                data: fundaciones,
                count: fundaciones.length
            });
            
        } catch (error) {
            console.error('Error en obtenerFundaciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener fundaciones'
            });
        }
    }
    
    static async obtenerFundacion(req, res) {
        try {
            const { id } = req.params;
            
            const fundacion = await Fundacion.findByPk(id);
            
            if (!fundacion) {
                return res.status(404).json({
                    success: false,
                    message: 'Fundación no encontrada'
                });
            }
            
            // Obtener estadísticas de la fundación
            const [estadisticas] = await sequelize.query(`
                SELECT 
                    COUNT(DISTINCT p.id) AS total_pacientes,
                    COUNT(DISTINCT u.id) AS total_profesionales,
                    COUNT(DISTINCT c.id) AS citas_mes_actual,
                    (SELECT COUNT(*) FROM altas a 
                     JOIN pacientes p ON a.paciente_id = p.id 
                     WHERE p.fundacion_id = :fundacionId 
                     AND MONTH(a.fecha_alta) = MONTH(CURDATE())) AS altas_mes_actual
                FROM fundaciones f
                LEFT JOIN pacientes p ON f.id = p.fundacion_id AND p.activo = TRUE
                LEFT JOIN users u ON f.id = u.fundacion_id AND u.activo = TRUE
                LEFT JOIN citas c ON p.id = c.paciente_id 
                    AND MONTH(c.fecha) = MONTH(CURDATE())
                WHERE f.id = :fundacionId
                GROUP BY f.id
            `, {
                replacements: { fundacionId: id },
                type: QueryTypes.SELECT
            });
            
            res.json({
                success: true,
                data: {
                    fundacion: fundacion,
                    estadisticas: estadisticas || {}
                }
            });
            
        } catch (error) {
            console.error('Error en obtenerFundacion:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener fundación'
            });
        }
    }
    
    static async actualizarFundacion(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const usuarioId = req.user.id;
            
            const fundacion = await Fundacion.findByPk(id);
            
            if (!fundacion) {
                return res.status(404).json({
                    success: false,
                    message: 'Fundación no encontrada'
                });
            }
            
            // Obtener datos antes para log
            const datosAntes = { ...fundacion.toJSON() };
            
            await fundacion.update(updates);
            
            // Log
            await sequelize.query(
                `INSERT INTO logs_sistema (usuario_id, tipo_log, modulo, accion, descripcion, datos_antes, datos_despues, created_at)
                 VALUES (?, 'modificacion', 'fundaciones', 'Actualizar fundación', ?, ?, ?, NOW())`,
                { 
                    replacements: [
                        usuarioId, 
                        `Fundación actualizada: ${fundacion.nombre}`,
                        JSON.stringify(datosAntes),
                        JSON.stringify(fundacion.toJSON())
                    ] 
                }
            );
            
            res.json({
                success: true,
                message: 'Fundación actualizada exitosamente',
                data: fundacion
            });
            
        } catch (error) {
            console.error('Error en actualizarFundacion:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar fundación'
            });
        }
    }
    
    static async desactivarFundacion(req, res) {
        try {
            const { id } = req.params;
            const { motivo } = req.body;
            const usuarioId = req.user.id;
            
            const fundacion = await Fundacion.findByPk(id);
            
            if (!fundacion) {
                return res.status(404).json({
                    success: false,
                    message: 'Fundación no encontrada'
                });
            }
            
            // Verificar que no haya pacientes activos
            const [pacientesActivos] = await sequelize.query(
                `SELECT COUNT(*) as count FROM pacientes WHERE fundacion_id = ? AND activo = TRUE`,
                { replacements: [id], type: QueryTypes.SELECT }
            );
            
            if (pacientesActivos.count > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No se puede desactivar la fundación porque tiene pacientes activos'
                });
            }
            
            await fundacion.update({ activo: false });
            
            // Log
            await sequelize.query(
                `INSERT INTO logs_sistema (usuario_id, tipo_log, modulo, accion, descripcion, created_at)
                 VALUES (?, 'modificacion', 'fundaciones', 'Desactivar fundación', ?, NOW())`,
                { 
                    replacements: [
                        usuarioId, 
                        `Fundación desactivada: ${fundacion.nombre}. Motivo: ${motivo}`
                    ] 
                }
            );
            
            res.json({
                success: true,
                message: 'Fundación desactivada exitosamente'
            });
            
        } catch (error) {
            console.error('Error en desactivarFundacion:', error);
            res.status(500).json({
                success: false,
                message: 'Error al desactivar fundación'
            });
        }
    }
}

module.exports = FundacionController;