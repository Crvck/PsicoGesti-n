const express = require('express');
const router = express.Router();
const ObservacionController = require('../controllers/observacionController');
const verifyToken = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Crear observación (solo psicólogos y coordinadores)
router.post('/', requireRole(['psicologo', 'coordinador']), ObservacionController.crearObservacion);

// Obtener observaciones
router.get('/becario/:becario_id', requireRole(['psicologo', 'becario', 'coordinador']), ObservacionController.obtenerObservacionesBecario);
router.get('/supervisor', requireRole(['psicologo', 'coordinador']), ObservacionController.obtenerObservacionesSupervisor);

// Enviar feedback
router.post('/feedback/:becarioId', requireRole(['psicologo', 'coordinador']), ObservacionController.enviarFeedback);

// Actualizar y eliminar observaciones
router.put('/:id', requireRole(['psicologo', 'coordinador']), ObservacionController.actualizarObservacion);
router.delete('/:id', requireRole(['psicologo', 'coordinador']), ObservacionController.eliminarObservacion);

module.exports = router;