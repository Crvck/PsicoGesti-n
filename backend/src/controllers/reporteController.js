const Reporte = require('../models/reporteModel');
const ReporteService = require('../services/reporteService');
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');
const path = require('path');
const fs = require('fs').promises;

class ReporteController {
    
    static async generarReporteMensual(req, res) {
        try {
            const { mes, anio, formato = 'excel' } = req.query;
            const usuarioId = req.user.id;
            
            if (!mes || !anio) {
                return res.status(400).json({
                    success: false,
                    message: 'Los parámetros mes y anio son requeridos'
                });
            }
            
            // Crear registro de reporte
            const reporte = await Reporte.create({
                usuario_id: usuarioId,
                tipo_reporte: 'mensual',
                nombre: `Reporte Mensual ${mes}/${anio}`,
                descripcion: `Reporte de actividades del mes ${mes} del año ${anio}`,
                parametros: { mes, anio, formato },
                fecha_inicio: `${anio}-${mes.padStart(2, '0')}-01`,
                fecha_fin: this.obtenerUltimoDiaMes(anio, mes),
                formato,
                estado: 'generando'
            });
            
            // Generar reporte en segundo plano
            this.generarReporteEnSegundoPlano(reporte.id, { mes, anio, formato, usuarioId });
            
            res.json({
                success: true,
                message: 'Reporte en proceso de generación',
                data: {
                    reporteId: reporte.id,
                    estado: 'generando',
                    formatoSolicitado: formato
                }
            });
            
        } catch (error) {
            console.error('Error en generarReporteMensual:', error);
            res.status(500).json({
                success: false,
                message: 'Error al generar reporte mensual',
                error: error.message
            });
        }
    }
    
    static async generarReportePaciente(req, res) {
        try {
            const { paciente_id, fecha_inicio, fecha_fin, formato = 'pdf' } = req.body;
            const usuarioId = req.user.id;
            
            // Verificar que el paciente existe
            const [paciente] = await sequelize.query(
                'SELECT id, nombre, apellido FROM pacientes WHERE id = ?',
                { replacements: [paciente_id], type: QueryTypes.SELECT }
            );
            
            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }
            
            // Crear registro de reporte
            const reporte = await Reporte.create({
                usuario_id: usuarioId,
                tipo_reporte: 'paciente',
                nombre: `Reporte Paciente ${paciente.nombre} ${paciente.apellido}`,
                descripcion: `Reporte completo del paciente ${paciente.nombre} ${paciente.apellido}`,
                parametros: { paciente_id, fecha_inicio, fecha_fin, formato },
                fecha_inicio: fecha_inicio || null,
                fecha_fin: fecha_fin || null,
                formato,
                estado: 'generando'
            });
            
            // Generar reporte en segundo plano
            this.generarReportePacienteEnSegundoPlano(reporte.id, { paciente_id, fecha_inicio, fecha_fin, formato, usuarioId });
            
            res.json({
                success: true,
                message: 'Reporte de paciente en proceso de generación',
                data: {
                    reporteId: reporte.id,
                    estado: 'generando',
                    paciente: `${paciente.nombre} ${paciente.apellido}`
                }
            });
            
        } catch (error) {
            console.error('Error en generarReportePaciente:', error);
            res.status(500).json({
                success: false,
                message: 'Error al generar reporte de paciente'
            });
        }
    }
    
    static async generarReporteExcel(req, res) {
        try {
            const { tipo, mes, anio, psicologo_id, becario_id, fecha_inicio, fecha_fin } = req.query;
            const usuarioId = req.user.id;
            
            // Obtener datos según tipo
            let datos;
            let nombreReporte;
            
            switch (tipo) {
                case 'citas':
                    datos = await this.obtenerDatosCitasExcel({ mes, anio, psicologo_id, becario_id, fecha_inicio, fecha_fin });
                    nombreReporte = `Reporte_Citas_${mes || 'personalizado'}_${anio || new Date().getFullYear()}`;
                    break;
                    
                case 'pacientes':
                    datos = await this.obtenerDatosPacientesExcel({ fecha_inicio, fecha_fin });
                    nombreReporte = `Reporte_Pacientes_${new Date().toISOString().slice(0, 10)}`;
                    break;
                    
                case 'sesiones':
                    datos = await this.obtenerDatosSesionesExcel({ mes, anio, psicologo_id, fecha_inicio, fecha_fin });
                    nombreReporte = `Reporte_Sesiones_${mes || 'personalizado'}_${anio || new Date().getFullYear()}`;
                    break;
                    
                case 'becarios':
                    datos = await this.obtenerDatosBecariosExcel({ mes, anio, fecha_inicio, fecha_fin });
                    nombreReporte = `Reporte_Becarios_${mes || 'personalizado'}_${anio || new Date().getFullYear()}`;
                    break;
                    
                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Tipo de reporte no válido'
                    });
            }
            
            // Generar Excel
            const buffer = await ReporteService.generarExcel(datos, tipo);
            
            // Crear registro
            await Reporte.create({
                usuario_id: usuarioId,
                tipo_reporte: tipo,
                nombre: nombreReporte,
                descripcion: `Reporte de ${tipo} generado el ${new Date().toLocaleDateString()}`,
                parametros: { tipo, mes, anio, psicologo_id, becario_id, fecha_inicio, fecha_fin },
                formato: 'excel',
                estado: 'completado'
            });
            
            // Configurar respuesta
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${nombreReporte}.xlsx"`);
            
            res.send(buffer);
            
        } catch (error) {
            console.error('Error en generarReporteExcel:', error);
            res.status(500).json({
                success: false,
                message: 'Error al generar reporte Excel'
            });
        }
    }
    
    static async obtenerMisReportes(req, res) {
        try {
            const usuarioId = req.user.id;
            const { tipo_reporte, estado, limit = 20, offset = 0 } = req.query;
            
            const whereClause = { usuario_id: usuarioId };
            
            if (tipo_reporte) whereClause.tipo_reporte = tipo_reporte;
            if (estado) whereClause.estado = estado;
            
            const reportes = await Reporte.findAll({
                where: whereClause,
                order: [['created_at', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
            
            res.json({
                success: true,
                data: reportes,
                count: reportes.length
            });
            
        } catch (error) {
            console.error('Error en obtenerMisReportes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener reportes'
            });
        }
    }
    
    static async descargarReporte(req, res) {
        try {
            const { id } = req.params;
            const usuarioId = req.user.id;
            
            const reporte = await Reporte.findByPk(id);
            
            if (!reporte) {
                return res.status(404).json({
                    success: false,
                    message: 'Reporte no encontrado'
                });
            }
            
            // Verificar permisos
            if (reporte.usuario_id !== usuarioId && 
                (!reporte.compartido_con || !reporte.compartido_con.includes(usuarioId.toString()))) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para descargar este reporte'
                });
            }
            
            if (reporte.estado !== 'completado' || !reporte.archivo_url) {
                return res.status(400).json({
                    success: false,
                    message: 'El reporte no está disponible para descarga'
                });
            }
            
            // Obtener ruta del archivo
            const filePath = path.join(__dirname, '..', '..', reporte.archivo_url);
            
            // Verificar que el archivo existe
            try {
                await fs.access(filePath);
            } catch {
                return res.status(404).json({
                    success: false,
                    message: 'Archivo no encontrado'
                });
            }
            
            // Determinar Content-Type
            let contentType;
            switch (reporte.formato) {
                case 'pdf':
                    contentType = 'application/pdf';
                    break;
                case 'excel':
                    contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                    break;
                case 'csv':
                    contentType = 'text/csv';
                    break;
                default:
                    contentType = 'application/octet-stream';
            }
            
            // Enviar archivo
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${reporte.nombre}.${reporte.formato}"`);
            
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
            
        } catch (error) {
            console.error('Error en descargarReporte:', error);
            res.status(500).json({
                success: false,
                message: 'Error al descargar reporte'
            });
        }
    }
    
    // Métodos auxiliares para obtener datos
    static async obtenerDatosCitasExcel(params) {
        const query = `
            SELECT 
                c.fecha as DIA,
                TIME_FORMAT(c.hora, '%H:%i') as HORA,
                CONCAT(p.nombre, ' ', p.apellido) as ESTUDIANTE,
                p.matricula as MATRICULA,
                p.carrera as CARRERA,
                p.edad as EDAD,
                p.sexo as SEXO,
                p.telefono as TELEFONO,
                p.email as CORREO,
                c.tipo_consulta as MODALIDAD,
                c.estado as ESTATUS,
                u_bec.nombre as PRACTICANTE,
                u_psi.nombre as ATIENDE,
                c.motivo as OBSERVACIONES,
                MONTH(c.fecha) as MES
            FROM citas c
            JOIN pacientes p ON c.paciente_id = p.id
            LEFT JOIN users u_bec ON c.becario_id = u_bec.id
            LEFT JOIN users u_psi ON c.psicologo_id = u_psi.id
            WHERE 1=1
        `;
        
        const replacements = [];
        let whereClause = '';
        
        if (params.mes && params.anio) {
            whereClause += ` AND MONTH(c.fecha) = ? AND YEAR(c.fecha) = ?`;
            replacements.push(params.mes, params.anio);
        }
        
        if (params.fecha_inicio && params.fecha_fin) {
            whereClause += ` AND c.fecha BETWEEN ? AND ?`;
            replacements.push(params.fecha_inicio, params.fecha_fin);
        }
        
        if (params.psicologo_id) {
            whereClause += ` AND c.psicologo_id = ?`;
            replacements.push(params.psicologo_id);
        }
        
        if (params.becario_id) {
            whereClause += ` AND c.becario_id = ?`;
            replacements.push(params.becario_id);
        }
        
        const finalQuery = query + whereClause + ' ORDER BY c.fecha, c.hora';
        
        return await sequelize.query(finalQuery, {
            replacements,
            type: QueryTypes.SELECT
        });
    }
    
    static async obtenerDatosPacientesExcel(params) {
        const query = `
            SELECT 
                p.nombre as NOMBRE,
                p.apellido as APELLIDO,
                p.matricula as MATRICULA,
                p.telefono as TELEFONO,
                p.carrera as CARRERA,
                p.cuatri as CUATRI,
                p.tipo_servicio as TIPO_DE_SERVICIO,
                p.fecha_presentacion as FECHA_DE_PRESENTACION,
                (SELECT COUNT(*) FROM citas c WHERE c.paciente_id = p.id AND c.estado = 'completada') as No_de_sesiones_terapeuticas_personales,
                a.fecha_aceptacion as FECHA_DE_ACEPTACION,
                p.mmpi2_rf as MMPI_2_RF,
                al.fecha_alta as FECHA_DE_TERMINO,
                al.carta_liberacion as CARTA_DE_LIBERACION,
                p.horas_objetivo as HORAS_OBJETIVO,
                p.horas_realizadas as HORAS_REALIZADAS,
                p.horas_faltantes as HORAS_FALTANTES,
                p.servicio_comunitario_liberado as SERVICIO_COMUNITARIO_LIBERADO,
                u_psi.nombre as QUIEN_ATIENDE,
                p.observaciones as OBSERVACIONES
            FROM pacientes p
            LEFT JOIN asignaciones a ON p.id = a.paciente_id AND a.estado = 'activa'
            LEFT JOIN users u_psi ON a.psicologo_id = u_psi.id
            LEFT JOIN altas al ON p.id = al.paciente_id
            WHERE p.activo = TRUE
        `;
        
        const replacements = [];
        let whereClause = '';
        
        if (params.fecha_inicio && params.fecha_fin) {
            whereClause += ` AND p.created_at BETWEEN ? AND ?`;
            replacements.push(params.fecha_inicio, params.fecha_fin);
        }
        
        const finalQuery = query + whereClause + ' ORDER BY p.apellido, p.nombre';
        
        return await sequelize.query(finalQuery, {
            replacements,
            type: QueryTypes.SELECT
        });
    }
    
    // Método auxiliar para generar reporte en segundo plano
    static async generarReporteEnSegundoPlano(reporteId, params) {
        try {
            // Aquí iría la lógica para generar el reporte
            // Por ahora simulamos la generación
            
            setTimeout(async () => {
                try {
                    const reporte = await Reporte.findByPk(reporteId);
                    if (reporte) {
                        await reporte.update({
                            estado: 'completado',
                            archivo_url: `/reports/${reporteId}.${params.formato}`
                        });
                        
                        // Notificar al usuario
                        await sequelize.query(`
                            INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, created_at)
                            VALUES (?, 'reporte_generado', 'Reporte listo', 
                            'Su reporte mensual ha sido generado y está listo para descargar.', NOW())
                        `, { replacements: [params.usuarioId] });
                    }
                } catch (error) {
                    console.error('Error al actualizar reporte:', error);
                }
            }, 5000); // Simulamos 5 segundos de procesamiento
            
        } catch (error) {
            console.error('Error en generarReporteEnSegundoPlano:', error);
        }
    }
    
    // Método auxiliar para obtener último día del mes
    static obtenerUltimoDiaMes(anio, mes) {
        return new Date(anio, mes, 0).toISOString().split('T')[0];
    }
}

module.exports = ReporteController;