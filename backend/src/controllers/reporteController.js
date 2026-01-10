// backend/src/controllers/reporteController.js - Añade este método
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');
const Cita = require('../models/citaModel');
const Paciente = require('../models/pacienteModel');
const User = require('../models/userModel');
const { Op } = require('sequelize');
const sequelize = require('../config/db');

class ReporteController {
    // Método para exportar agenda a CSV
    static async exportarAgendaCSV(req, res) {
        try {
            const { 
                fecha_inicio, 
                fecha_fin, 
                psicologo_id, 
                tipo_consulta 
            } = req.body;

            // Construir condiciones de filtro
            const whereClause = {};
            
            if (fecha_inicio && fecha_fin) {
                whereClause.fecha = {
                    [Op.between]: [fecha_inicio, fecha_fin]
                };
            }
            
            if (psicologo_id) whereClause.psicologo_id = psicologo_id;
            if (tipo_consulta) whereClause.tipo_consulta = tipo_consulta;

            // Obtener citas con información relacionada
            const citas = await Cita.findAll({
                where: whereClause,
                include: [
                    {
                        model: Paciente,
                        attributes: ['nombre', 'apellido', 'telefono', 'email']
                    },
                    {
                        model: User,
                        as: 'Psicologo',
                        attributes: ['nombre', 'apellido', 'especialidad']
                    },
                    {
                        model: User,
                        as: 'Becario',
                        attributes: ['nombre', 'apellido']
                    }
                ],
                order: [
                    ['fecha', 'ASC'],
                    ['hora', 'ASC']
                ]
            });

            // Preparar datos para CSV
            const datosCSV = citas.map(cita => ({
                Fecha: cita.fecha,
                Hora: cita.hora,
                'Duración (min)': cita.duracion,
                Paciente: cita.Paciente ? `${cita.Paciente.nombre} ${cita.Paciente.apellido}` : '',
                'Teléfono Paciente': cita.Paciente?.telefono || '',
                'Email Paciente': cita.Paciente?.email || '',
                Psicólogo: cita.Psicologo ? `${cita.Psicologo.nombre} ${cita.Psicologo.apellido}` : '',
                Especialidad: cita.Psicologo?.especialidad || '',
                Becario: cita.Becario ? `${cita.Becario.nombre} ${cita.Becario.apellido}` : '',
                'Tipo Consulta': cita.tipo_consulta === 'presencial' ? 'Presencial' : 'Virtual',
                Estado: cita.estado,
                Notas: cita.notas || '',
                'Motivo Cancelación': cita.motivo_cancelacion || ''
            }));

            // Convertir a CSV
            const json2csvParser = new Parser();
            const csv = json2csvParser.parse(datosCSV);

            // Crear nombre de archivo
            const fechaActual = new Date().toISOString().split('T')[0];
            const nombreArchivo = `agenda_${fecha_inicio || fechaActual}_a_${fecha_fin || fechaActual}.csv`;

            // Configurar headers para descarga
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
            
            res.send(csv);

        } catch (error) {
            console.error('Error exportando agenda a CSV:', error);
            res.status(500).json({
                success: false,
                message: 'Error al exportar agenda',
                error: error.message
            });
        }
    }

    // Método para exportar disponibilidad a CSV
    static async exportarDisponibilidadCSV(req, res) {
        try {
            const { fecha } = req.body;
            const fechaConsulta = fecha || new Date().toISOString().split('T')[0];
            
            // Consulta de disponibilidad
            const disponibilidad = await sequelize.query(`
                SELECT 
                    u.id,
                    CONCAT(u.nombre, ' ', u.apellido) as profesional,
                    u.rol,
                    u.especialidad,
                    d.dia_semana,
                    TIME_FORMAT(d.hora_inicio, '%H:%i') as hora_inicio,
                    TIME_FORMAT(d.hora_fin, '%H:%i') as hora_fin,
                    d.max_citas_dia,
                    (SELECT COUNT(*) FROM citas c 
                     WHERE c.psicologo_id = u.id 
                     AND c.fecha = ? 
                     AND c.estado IN ('programada', 'confirmada')) as citas_programadas
                FROM users u
                LEFT JOIN disponibilidades d ON u.id = d.usuario_id 
                    AND d.activo = TRUE
                WHERE u.rol IN ('psicologo', 'becario')
                AND u.activo = TRUE
                ORDER BY u.rol, u.apellido, u.nombre, d.dia_semana
            `, {
                replacements: [fechaConsulta],
                type: QueryTypes.SELECT
            });

            // Preparar datos para CSV
            const datosCSV = disponibilidad.map(item => ({
                Profesional: item.profesional,
                Rol: item.rol,
                Especialidad: item.especialidad || '',
                'Día Semana': item.dia_semana || '',
                'Hora Inicio': item.hora_inicio || '',
                'Hora Fin': item.hora_fin || '',
                'Máx. Citas/Día': item.max_citas_dia || 8,
                'Citas Programadas': item.citas_programadas || 0,
                'Disponibilidad': item.citas_programadas >= (item.max_citas_dia || 8) ? 'Completo' : 'Disponible'
            }));

            // Convertir a CSV
            const json2csvParser = new Parser();
            const csv = json2csvParser.parse(datosCSV);

            // Configurar headers para descarga
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="disponibilidad_${fechaConsulta}.csv"`);
            
            res.send(csv);

        } catch (error) {
            console.error('Error exportando disponibilidad a CSV:', error);
            res.status(500).json({
                success: false,
                message: 'Error al exportar disponibilidad',
                error: error.message
            });
        }
    }

    static async generarReporteConflictos(req, res) {
        try {
            const { fecha_inicio, fecha_fin } = req.body;

            // Buscar citas solapadas
            const conflictos = await sequelize.query(`
                SELECT 
                    c1.id as cita1_id,
                    c1.paciente_id as paciente1_id,
                    p1.nombre as paciente1_nombre,
                    p1.apellido as paciente1_apellido,
                    c1.psicologo_id as psicologo1_id,
                    u1.nombre as psicologo1_nombre,
                    u1.apellido as psicologo1_apellido,
                    c1.fecha as fecha_conflicto,
                    c1.hora as hora_inicio1,
                    ADDTIME(c1.hora, SEC_TO_TIME(c1.duracion * 60)) as hora_fin1,
                    
                    c2.id as cita2_id,
                    c2.paciente_id as paciente2_id,
                    p2.nombre as paciente2_nombre,
                    p2.apellido as paciente2_apellido,
                    c2.psicologo_id as psicologo2_id,
                    u2.nombre as psicologo2_nombre,
                    u2.apellido as psicologo2_apellido,
                    c2.hora as hora_inicio2,
                    ADDTIME(c2.hora, SEC_TO_TIME(c2.duracion * 60)) as hora_fin2
                    
                FROM citas c1
                JOIN citas c2 ON 
                    c1.psicologo_id = c2.psicologo_id 
                    AND c1.fecha = c2.fecha
                    AND c1.id < c2.id
                    AND (
                        (c1.hora BETWEEN c2.hora AND ADDTIME(c2.hora, SEC_TO_TIME(c2.duracion * 60)))
                        OR 
                        (c2.hora BETWEEN c1.hora AND ADDTIME(c1.hora, SEC_TO_TIME(c1.duracion * 60)))
                    )
                JOIN pacientes p1 ON c1.paciente_id = p1.id
                JOIN pacientes p2 ON c2.paciente_id = p2.id
                JOIN users u1 ON c1.psicologo_id = u1.id
                JOIN users u2 ON c2.psicologo_id = u2.id
                WHERE c1.estado IN ('programada', 'confirmada')
                    AND c2.estado IN ('programada', 'confirmada')
                    ${fecha_inicio && fecha_fin ? 'AND c1.fecha BETWEEN ? AND ?' : ''}
                ORDER BY c1.fecha, c1.hora
            `, {
                replacements: fecha_inicio && fecha_fin ? [fecha_inicio, fecha_fin] : [],
                type: QueryTypes.SELECT
            });

            res.json({
                success: true,
                data: {
                    conflictos,
                    total_conflictos: conflictos.length,
                    periodo: fecha_inicio && fecha_fin ? `${fecha_inicio} a ${fecha_fin}` : 'Todo el período'
                }
            });

        } catch (error) {
            console.error('Error generando reporte de conflictos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al generar reporte de conflictos',
                error: error.message
            });
        }
    }

    // Guardar un reporte generado (recibe base64 para el archivo y metadatos)
    static async guardarReporte(req, res) {
        try {
            const { nombre, tipo, fecha, generado_por, archivo_base64, archivo_ext = 'docx' } = req.body;
            if (!archivo_base64) {
                return res.status(400).json({ success: false, message: 'No se recibió archivo' });
            }

            const buffer = Buffer.from(archivo_base64, 'base64');
            const timestamp = Date.now();
            const filename = `reporte_${timestamp}.${archivo_ext}`;
            const dir = path.join(__dirname, '..', '..', 'public', 'temp', 'reportes');
            fs.mkdirSync(dir, { recursive: true });
            const filePath = path.join(dir, filename);
            fs.writeFileSync(filePath, buffer);

            const archivoUrl = `/temp/reportes/${filename}`;

            // Responder con la URL y metadatos (no usamos BD por simplicidad)
            res.json({
                success: true,
                data: {
                    archivo_url: archivoUrl,
                    nombre,
                    tipo,
                    fecha,
                    generado_por
                }
            });
        } catch (error) {
            console.error('Error guardando reporte:', error);
            res.status(500).json({ success: false, message: 'Error al guardar reporte', error: error.message });
        }
    }

    // Listar reportes guardados en disco
    static async listarReportes(req, res) {
        try {
            const dir = path.join(__dirname, '..', '..', 'public', 'temp', 'reportes');
            if (!fs.existsSync(dir)) {
                return res.json({ success: true, data: [] });
            }

            const files = fs.readdirSync(dir).filter(f => f.endsWith('.docx'));
            const reportes = files.map(f => {
                const stat = fs.statSync(path.join(dir, f));
                return {
                    nombre: f,
                    archivo_url: `/temp/reportes/${f}`,
                    fecha: new Date(stat.mtime).toISOString(),
                    size: stat.size
                };
            });

            res.json({ success: true, data: reportes });
        } catch (error) {
            console.error('Error listando reportes:', error);
            res.status(500).json({ success: false, message: 'Error al listar reportes', error: error.message });
        }
    }
}

module.exports = ReporteController;