const express = require('express');
const router = express.Router();
const ReporteController = require('../controllers/reporteController');

// Exportar agenda a CSV
router.post('/exportar-agenda-csv', ReporteController.exportarAgendaCSV);

// Exportar disponibilidad a CSV
router.post('/exportar-disponibilidad-csv', ReporteController.exportarDisponibilidadCSV);

// Generar reporte de conflictos
router.post('/reporte-conflictos', ReporteController.generarReporteConflictos);


module.exports = router;