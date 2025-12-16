const express = require('express');
const router = express.Router();
const ReporteController = require('../controllers/reporteController');
const verifyToken = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Generar reportes
router.get('/mensual', requireRole(['coordinador', 'psicologo']), ReporteController.generarReporteMensual);
router.post('/paciente', requireRole(['coordinador', 'psicologo']), ReporteController.generarReportePaciente);
router.get('/excel', requireRole(['coordinador']), ReporteController.generarReporteExcel);

// Obtener reportes generados
router.get('/mis-reportes', ReporteController.obtenerMisReportes);
router.get('/descargar/:id', ReporteController.descargarReporte);

module.exports = router;