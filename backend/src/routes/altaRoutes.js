const express = require('express');
const router = express.Router();
const AltaController = require('../controllers/altaController');
const verifyToken = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Rutas específicas primero (antes de las genéricas con :id)
// Psicólogo propone un paciente para alta
router.post('/proponer/:paciente_id', requireRole(['psicologo']), AltaController.proponerAlta);

// Coordinador procesa propuesta (aprueba/rechaza)
router.put('/:id/procesar', requireRole(['coordinador']), AltaController.procesarPropuesta);

// Obtener estadísticas
router.get('/estadisticas', requireRole(['coordinador']), AltaController.obtenerEstadisticasAltas);

// Dar de alta paciente (ruta heredada, se mantiene)
router.post('/', requireRole(['psicologo', 'coordinador']), AltaController.darAltaPaciente);

// Obtener altas
router.get('/', requireRole(['coordinador', 'psicologo']), AltaController.obtenerAltas);

// Obtener detalle de alta (última, porque :id puede coincidir con todo)
router.get('/:id', requireRole(['coordinador', 'psicologo']), AltaController.obtenerAltaDetalle);

module.exports = router;