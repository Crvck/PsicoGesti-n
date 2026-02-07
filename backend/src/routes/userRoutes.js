const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const { Op } = require('sequelize');
const EmailService = require('../services/emailService');

// Obtener todos los coterapeutas
router.get('/becarios', verifyToken, async (req, res) => {
  try {
    const becarios = await User.findAll({
      where: { rol: 'coterapeuta', activo: true },
      attributes: ['id', 'nombre', 'apellido', 'email'],
      order: [['apellido', 'ASC'], ['nombre', 'ASC']]
    });
    
    res.json(becarios);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener coterapeutas' });
  }
});

// Obtener todos los usuarios (coordinadores pueden acceder)
router.get('/', verifyToken, requireRole(['coordinador']), async (req, res) => {
  try {
    const whereClause = {};
    if (req.query.rol) {
      const rol = req.query.rol;
      if (rol === 'terapeuta') {
        whereClause.rol = { [Op.in]: ['terapeuta', 'psicologo'] };
      } else if (rol === 'coterapeuta') {
        whereClause.rol = { [Op.in]: ['coterapeuta', 'becario'] };
      } else {
        whereClause.rol = rol;
      }
    }
    if (req.query.activo !== undefined) {
      whereClause.activo = req.query.activo === 'true' || req.query.activo === true;
    }

    const users = await User.findAll({
      where: whereClause,
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
      rol: rol || 'coterapeuta',
      especialidad,
      fundacion_id: fundacion_id || null,
      activo: typeof activo === 'boolean' ? activo : true,
      password: hashed
    });

    // Enviar correo con credenciales (no bloqueante)
    EmailService.enviarBienvenidaUsuario({
      nombre,
      apellido,
      email,
      passwordTemporal: password,
      rol: rol || 'coterapeuta'
    }).catch(() => {});

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
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const { nombre, apellido, email, telefono, rol, especialidad, fundacion_id, activo, password, direccion, cedula_profesional } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar permisos: coordinador puede editar todo, usuario puede editar su propio perfil
    const tokenUserId = req.user.id || req.user.userId;
    const isCoordinador = req.user.role === 'coordinador';
    const isSelfEdit = tokenUserId === parseInt(id);

    if (!isCoordinador && !isSelfEdit) {
      return res.status(403).json({ message: 'No tienes permiso para editar este usuario' });
    }

    const updatedFields = {
      nombre: nombre ?? user.nombre,
      apellido: apellido ?? user.apellido,
      telefono: telefono ?? user.telefono,
      especialidad: especialidad ?? user.especialidad,
      direccion: direccion ?? user.direccion,
      cedula_profesional: cedula_profesional ?? user.cedula_profesional
    };

    // Solo coordinadores pueden cambiar rol, email, fundacion y estado
    if (isCoordinador) {
      updatedFields.email = email ?? user.email;
      updatedFields.rol = rol ?? user.rol;
      updatedFields.fundacion_id = fundacion_id ?? user.fundacion_id;
      updatedFields.activo = typeof activo === 'boolean' ? activo : user.activo;
    } else if (email && email !== user.email) {
      // Usuario normal puede cambiar su email
      updatedFields.email = email;
    }

    // Si envían password, hashearla (solo coordinadores)
    if (password && isCoordinador) {
      const salt = await bcrypt.genSalt(10);
      updatedFields.password = await bcrypt.hash(password, salt);
    }

    await user.update(updatedFields);

    res.json({
      success: true,
      data: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        telefono: user.telefono,
        rol: user.rol,
        especialidad: user.especialidad,
        direccion: user.direccion,
        cedula_profesional: user.cedula_profesional,
        fundacion_id: user.fundacion_id,
        activo: user.activo,
        fecha_registro: user.created_at
      }
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

    res.json({
      message: 'Usuario eliminado (inactivado) correctamente',
      id: user.id,
      usuario: {
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
      }
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
});

// Cambiar contraseña (cualquier usuario autenticado)
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id || req.user.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Contraseña actual y nueva son requeridas' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Contraseña actual incorrecta' });
    }

    // Hashear nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await user.update({ password: hashedPassword });

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ message: 'Error al cambiar contraseña' });
  }
});

module.exports = router;