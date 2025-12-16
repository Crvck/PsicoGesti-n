const express = require('express');
const router = express.Router();
const DisponibilidadController = require('../controllers/disponibilidadController');
const verifyToken = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Gestión de disponibilidad personal
router.post('/', requireRole(['psicologo', 'becario']), DisponibilidadController.crearDisponibilidad);
router.get('/mi-disponibilidad', requireRole(['psicologo', 'becario']), DisponibilidadController.obtenerMiDisponibilidad);
router.put('/:id', requireRole(['psicologo', 'becario']), DisponibilidadController.actualizarDisponibilidad);
router.put('/:id/desactivar', requireRole(['psicologo', 'becario']), DisponibilidadController.desactivarDisponibilidad);

// Consulta de disponibilidad
router.get('/usuario/:usuario_id', requireRole(['coordinador', 'psicologo']), DisponibilidadController.obtenerDisponibilidadUsuario);
router.get('/horarios-disponibles', requireRole(['coordinador', 'psicologo', 'becario']), DisponibilidadController.obtenerHorariosDisponibles);

module.exports = router;