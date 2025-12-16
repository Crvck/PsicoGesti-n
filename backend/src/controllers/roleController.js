const sequelize = require('../config/db');
const { QueryTypes } = require('sequelize');

class RoleController {
    
    static async getMyPermissions(req, res) {
        try {
            const userId = req.user.id;
            
            const query = `
                SELECT p.nombre, p.descripcion, p.categoria, up.concedido
                FROM usuario_permisos up
                JOIN permisos p ON up.permiso_id = p.id
                WHERE up.usuario_id = ?
                AND up.concedido = TRUE
            `;
            
            const permissions = await sequelize.query(query, {
                replacements: [userId],
                type: QueryTypes.SELECT
            });
            
            res.json({
                success: true,
                data: permissions
            });
            
        } catch (error) {
            console.error('Error en getMyPermissions:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener permisos'
            });
        }
    }
    
    static async getUserRoleInfo(req, res) {
        try {
            const userId = req.user.id;
            
            const query = `
                SELECT 
                    u.id,
                    u.email,
                    u.nombre,
                    u.apellido,
                    u.rol,
                    u.especialidad,
                    (SELECT COUNT(*) FROM citas WHERE becario_id = u.id AND fecha = CURDATE()) as citas_hoy,
                    (SELECT COUNT(*) FROM asignaciones WHERE becario_id = u.id AND fecha_fin IS NULL) as pacientes_asignados
                FROM users u
                WHERE u.id = ?
            `;
            
            const [userInfo] = await sequelize.query(query, {
                replacements: [userId],
                type: QueryTypes.SELECT
            });
            
            if (!userInfo) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
            
            // Agregar estadísticas específicas por rol
            let estadisticas = {};
            
            switch (userInfo.rol) {
                case 'coordinador':
                    const [coordinadorStats] = await sequelize.query(`
                        SELECT 
                            (SELECT COUNT(*) FROM users WHERE rol = 'becario' AND activo = TRUE) as becarios_activos,
                            (SELECT COUNT(*) FROM users WHERE rol = 'psicologo' AND activo = TRUE) as psicologos_activos,
                            (SELECT COUNT(*) FROM pacientes WHERE activo = TRUE) as pacientes_activos,
                            (SELECT COUNT(*) FROM citas WHERE fecha = CURDATE() AND estado IN ('programada', 'confirmada')) as citas_hoy,
                            (SELECT COUNT(*) FROM citas WHERE fecha = CURDATE() AND estado = 'completada') as citas_completadas_hoy
                    `, { type: QueryTypes.SELECT });
                    estadisticas = coordinadorStats;
                    break;
                    
                case 'psicologo':
                    const [psicologoStats] = await sequelize.query(`
                        SELECT 
                            (SELECT COUNT(*) FROM asignaciones WHERE psicologo_id = ? AND fecha_fin IS NULL) as pacientes_asignados,
                            (SELECT COUNT(*) FROM citas WHERE psicologo_id = ? AND fecha = CURDATE() AND estado IN ('programada', 'confirmada')) as citas_hoy,
                            (SELECT COUNT(*) FROM asignaciones WHERE psicologo_id = ? AND becario_id IS NOT NULL AND fecha_fin IS NULL) as becarios_asignados
                    `, {
                        replacements: [userId, userId, userId],
                        type: QueryTypes.SELECT
                    });
                    estadisticas = psicologoStats;
                    break;
                    
                case 'becario':
                    const [becarioStats] = await sequelize.query(`
                        SELECT 
                            (SELECT COUNT(*) FROM asignaciones WHERE becario_id = ? AND fecha_fin IS NULL) as pacientes_asignados,
                            (SELECT COUNT(*) FROM citas WHERE becario_id = ? AND fecha = CURDATE() AND estado IN ('programada', 'confirmada')) as citas_hoy,
                            (SELECT COUNT(*) FROM observaciones_becarios WHERE becario_id = ? AND fecha = CURDATE()) as observaciones_hoy
                    `, {
                        replacements: [userId, userId, userId],
                        type: QueryTypes.SELECT
                    });
                    estadisticas = becarioStats;
                    break;
            }
            
            res.json({
                success: true,
                data: {
                    user: userInfo,
                    estadisticas: estadisticas
                }
            });
            
        } catch (error) {
            console.error('Error en getUserRoleInfo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener información del rol'
            });
        }
    }
    
    static async checkPermission(req, res) {
        try {
            const { permission } = req.params;
            const userId = req.user.id;
            
            const query = `
                SELECT EXISTS(
                    SELECT 1 FROM usuario_permisos up
                    JOIN permisos p ON up.permiso_id = p.id
                    WHERE up.usuario_id = ?
                    AND p.nombre = ?
                    AND up.concedido = TRUE
                ) as has_permission
            `;
            
            const [result] = await sequelize.query(query, {
                replacements: [userId, permission],
                type: QueryTypes.SELECT
            });
            
            res.json({
                success: true,
                hasPermission: result.has_permission === 1
            });
            
        } catch (error) {
            console.error('Error en checkPermission:', error);
            res.status(500).json({
                success: false,
                message: 'Error al verificar permiso'
            });
        }
    }
}

module.exports = RoleController;