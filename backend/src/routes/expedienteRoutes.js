const express = require('express');
const router = express.Router();
const ExpedienteController = require('../controllers/expedienteController');
const verifyToken = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Obtener expedientes
router.get('/paciente/:paciente_id/completo', requireRole(['psicologo', 'becario', 'coordinador']), ExpedienteController.obtenerExpedienteCompleto);
router.get('/paciente/:paciente_id/resumen', requireRole(['psicologo', 'becario', 'coordinador']), ExpedienteController.obtenerResumenExpediente);

// Crear y actualizar expedientes
router.post('/paciente/:paciente_id', requireRole(['psicologo', 'coordinador']), ExpedienteController.crearExpediente);
router.put('/paciente/:paciente_id', requireRole(['psicologo', 'coordinador']), ExpedienteController.actualizarExpediente);

// Notas confidenciales
router.post('/paciente/:paciente_id/nota-confidencial', requireRole(['psicologo', 'coordinador']), ExpedienteController.agregarNotaConfidencial);

module.exports = router;