const express = require('express');
const router = express.Router();
const SesionController = require('../controllers/sesionController');
const verifyToken = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Registrar sesión (solo psicólogos y coordinadores)
router.post('/', requireRole(['psicologo', 'coordinador']), SesionController.registrarSesion);

// Obtener sesiones por paciente
router.get('/paciente/:paciente_id', requireRole(['psicologo', 'becario', 'coordinador']), SesionController.obtenerSesionesPaciente);
// Obtener sesiones recientes (global)
router.get('/recientes', requireRole(['psicologo', 'becario', 'coordinador']), SesionController.obtenerSesionesRecientes);
// Obtener detalle
router.get('/:id', requireRole(['psicologo', 'becario', 'coordinador']), SesionController.obtenerSesionDetalle);

// Actualizar sesión (solo psicólogo creador o coordinador)
router.put('/:id', requireRole(['psicologo', 'coordinador']), SesionController.actualizarSesion);

module.exports = router;