const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const verifyToken = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Dashboards por rol
router.get('/coordinador', requireRole(['coordinador']), DashboardController.obtenerDashboardCoordinador);
router.get('/psicologo', requireRole(['psicologo']), DashboardController.obtenerDashboardPsicologo);
router.get('/becario', requireRole(['becario']), DashboardController.obtenerDashboardBecario);

// Métricas globales
router.get('/metricas-globales', requireRole(['coordinador']), DashboardController.obtenerMetricasGlobales);

module.exports = router;