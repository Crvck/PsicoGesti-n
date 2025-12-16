const express = require('express');
const router = express.Router();
const AltaController = require('../controllers/altaController');
const verifyToken = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Dar de alta paciente
router.post('/', requireRole(['psicologo', 'coordinador']), AltaController.darAltaPaciente);

// Obtener altas
router.get('/', requireRole(['coordinador', 'psicologo']), AltaController.obtenerAltas);
router.get('/estadisticas', requireRole(['coordinador']), AltaController.obtenerEstadisticasAltas);
router.get('/:id', requireRole(['coordinador', 'psicologo']), AltaController.obtenerAltaDetalle);

module.exports = router;