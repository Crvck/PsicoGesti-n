const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const bcrypt = require('bcryptjs');
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

// Obtener todos los usuarios (coordinadores pueden acceder)
router.get('/', verifyToken, requireRole(['coordinador']), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'nombre', 'apellido', 'email', 'telefono', 'rol', 'especialidad', 'fundacion_id', 'activo', 'created_at'],
      order: [['apellido', 'ASC'], ['nombre', 'ASC']]
    });

    // Mapear created_at a fecha_registro para compatibilidad con frontend
    const mapped = users.map(u => ({
      id: u.id,
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
      telefono: u.telefono,
      rol: u.rol,
      especialidad: u.especialidad,
      fundacion_id: u.fundacion_id,
      activo: u.activo,
      fecha_registro: u.created_at
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

// Crear nuevo usuario (solo coordinadores)
router.post('/', verifyToken, requireRole(['coordinador']), async (req, res) => {
  try {
    const { nombre, apellido, email, telefono, rol, especialidad, fundacion_id, activo, password } = req.body;

    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      nombre,
      apellido,
      email,
      telefono,
      rol: rol || 'becario',
      especialidad,
      fundacion_id: fundacion_id || null,
      activo: typeof activo === 'boolean' ? activo : true,
      password: hashed
    });

    res.status(201).json({
      id: newUser.id,
      nombre: newUser.nombre,
      apellido: newUser.apellido,
      email: newUser.email,
      telefono: newUser.telefono,
      rol: newUser.rol,
      especialidad: newUser.especialidad,
      fundacion_id: newUser.fundacion_id,
      activo: newUser.activo,
      fecha_registro: newUser.created_at
    });

  } catch (error) {
    console.error('Error al crear usuario:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'El correo ya está registrado' });
    }
    res.status(500).json({ message: 'Error al crear usuario' });
  }
});

// Actualizar usuario (solo coordinadores)
router.put('/:id', verifyToken, requireRole(['coordinador']), async (req, res) => {
  try {
    const id = req.params.id;
    const { nombre, apellido, email, telefono, rol, especialidad, fundacion_id, activo, password } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const updatedFields = {
      nombre: nombre ?? user.nombre,
      apellido: apellido ?? user.apellido,
      email: email ?? user.email,
      telefono: telefono ?? user.telefono,
      rol: rol ?? user.rol,
      especialidad: especialidad ?? user.especialidad,
      fundacion_id: fundacion_id ?? user.fundacion_id,
      activo: typeof activo === 'boolean' ? activo : user.activo
    };

    // Si envían password, hashearla
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updatedFields.password = await bcrypt.hash(password, salt);
    }

    await user.update(updatedFields);

    res.json({
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      telefono: user.telefono,
      rol: user.rol,
      especialidad: user.especialidad,
      fundacion_id: user.fundacion_id,
      activo: user.activo,
      fecha_registro: user.created_at
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'El correo ya está registrado' });
    }
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
});

// Eliminar usuario (soft-delete colocando activo=false) (solo coordinadores)
router.delete('/:id', verifyToken, requireRole(['coordinador']), async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Soft-delete
    await user.update({ activo: false });

    res.json({ message: 'Usuario eliminado (inactivado) correctamente', id: user.id });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
});

module.exports = router;