const express = require('express');
const router = express.Router();
const AgendaController = require('../controllers/agendaController');
const verifyToken = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Obtener agendas
router.get('/global', AgendaController.obtenerAgendaGlobal);
router.get('/diaria', AgendaController.obtenerAgendaDiaria);
router.get('/mensual', AgendaController.obtenerCalendarioMensual);
router.get('/disponibilidad-profesionales', AgendaController.obtenerDisponibilidadProfesionales);

// Reprogramar citas
router.put('/cita/:id/reprogramar', requireRole(['psicologo', 'becario', 'coordinador']), AgendaController.reprogramarCita);

module.exports = router;