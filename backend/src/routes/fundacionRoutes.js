const express = require('express');
const router = express.Router();
const FundacionController = require('../controllers/fundacionController');
const verifyToken = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Rutas para coordinadores
router.post('/', requireRole(['coordinador']), FundacionController.crearFundacion);
router.get('/', requireRole(['coordinador', 'psicologo']), FundacionController.obtenerFundaciones);
router.get('/:id', requireRole(['coordinador', 'psicologo']), FundacionController.obtenerFundacion);
router.put('/:id', requireRole(['coordinador']), FundacionController.actualizarFundacion);
router.put('/:id/desactivar', requireRole(['coordinador']), FundacionController.desactivarFundacion);

module.exports = router;