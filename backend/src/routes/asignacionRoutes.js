const express = require('express');
const router = express.Router();
const AsignacionController = require('../controllers/asignacionController');
const verifyToken = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Rutas para coordinadores
router.post('/', requireRole(['coordinador']), AsignacionController.crearAsignacion);
router.get('/', requireRole(['coordinador']), AsignacionController.obtenerAsignacionesActivas);
router.put('/:id/finalizar', requireRole(['coordinador', 'psicologo']), AsignacionController.finalizarAsignacion);
router.get('/paciente/:paciente_id/historial', requireRole(['coordinador', 'psicologo']), AsignacionController.obtenerHistorialAsignaciones);

// Rutas para psicólogos y becarios
router.get('/mis-pacientes', requireRole(['psicologo', 'becario']), AsignacionController.obtenerMisPacientes);
router.get('/mis-becarios', requireRole(['psicologo']), AsignacionController.obtenerMisBecarios);

module.exports = router;