const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const User = require('../models/userModel');

// Obtener todos los becarios
router.get('/becarios', verifyToken, async (req, res) => {
  try {
    const becarios = await User.findAll({
      where: { rol: 'becario', activo: true },
      attributes: ['id', 'nombre', 'apellido', 'email'],
      order: [['apellido', 'ASC'], ['nombre', 'ASC']]
    });
    
    res.json(becarios);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener becarios' });
  }
});

module.exports = router;