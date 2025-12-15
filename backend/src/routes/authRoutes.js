const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// Definir ruta POST para /login
router.post('/login', AuthController.login);

module.exports = router;