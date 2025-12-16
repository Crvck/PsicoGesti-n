const express = require('express');
const router = express.Router();
const EstadisticaController = require('../controllers/estadisticaController');
const verifyToken = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Estadísticas generales
router.get('/generales', requireRole(['coordinador']), EstadisticaController.obtenerEstadisticasGenerales);
router.get('/reporte-comparativo', requireRole(['coordinador']), EstadisticaController.obtenerReporteComparativo);

// Estadísticas por rol/profesional
router.get('/psicologo', requireRole(['coordinador', 'psicologo']), EstadisticaController.obtenerEstadisticasPsicologo);
router.get('/becario', requireRole(['coordinador', 'psicologo', 'becario']), EstadisticaController.obtenerEstadisticasBecario);
router.get('/paciente/:paciente_id', requireRole(['coordinador', 'psicologo']), EstadisticaController.obtenerEstadisticasPaciente);

module.exports = router;