const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const Paciente = require('../models/pacienteModel');

// Listar pacientes (solo coordinadores)
router.get('/', verifyToken, requireRole(['coordinador']), async (req, res) => {
  try {
    const pacientes = await Paciente.findAll({
      order: [['apellido', 'ASC'], ['nombre', 'ASC']]
    });

    const mapped = pacientes.map(p => ({
      id: p.id,
      nombre: p.nombre,
      apellido: p.apellido,
      email: p.email,
      telefono: p.telefono,
      fecha_nacimiento: p.fecha_nacimiento,
      genero: p.genero,
      direccion: p.direccion,
      estado: p.estado,
      activo: p.activo,
      notas: p.notas,
      fundacion_id: p.fundacion_id,
      fecha_ingreso: p.created_at,
      fecha_alta: p.deleted_at || null // placeholder if needed
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Error al listar pacientes:', error);
    res.status(500).json({ message: 'Error al obtener pacientes' });
  }
});

// Crear paciente (solo coordinadores)
router.post('/', verifyToken, requireRole(['coordinador']), async (req, res) => {
  try {
    const data = req.body;
    if (!data.nombre || !data.apellido || !data.motivo_consulta) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    const paciente = await Paciente.create({
      nombre: data.nombre,
      apellido: data.apellido,
      email: data.email || null,
      telefono: data.telefono || null,
      fecha_nacimiento: data.fecha_nacimiento || null,
      genero: data.genero || null,
      direccion: data.direccion || null,
      estado: data.estado || 'activo',
      activo: typeof data.activo === 'boolean' ? data.activo : true,
      notas: data.antecedentes || null,
      fundacion_id: data.fundacion_id || null
    });

    res.status(201).json({
      id: paciente.id,
      nombre: paciente.nombre,
      apellido: paciente.apellido,
      email: paciente.email,
      telefono: paciente.telefono,
      fecha_nacimiento: paciente.fecha_nacimiento,
      genero: paciente.genero,
      direccion: paciente.direccion,
      estado: paciente.estado,
      activo: paciente.activo,
      fecha_ingreso: paciente.created_at,
      sesiones_completadas: 0
    });
  } catch (error) {
    console.error('Error al crear paciente:', error);
    res.status(500).json({ message: 'Error al crear paciente' });
  }
});

// Actualizar paciente (solo coordinadores)
router.put('/:id', verifyToken, requireRole(['coordinador']), async (req, res) => {
  try {
    const id = req.params.id;
    const paciente = await Paciente.findByPk(id);
    if (!paciente) return res.status(404).json({ message: 'Paciente no encontrado' });

    const data = req.body;
    const updated = await paciente.update({
      nombre: data.nombre ?? paciente.nombre,
      apellido: data.apellido ?? paciente.apellido,
      email: data.email ?? paciente.email,
      telefono: data.telefono ?? paciente.telefono,
      fecha_nacimiento: data.fecha_nacimiento ?? paciente.fecha_nacimiento,
      genero: data.genero ?? paciente.genero,
      direccion: data.direccion ?? paciente.direccion,
      estado: data.estado ?? paciente.estado,
      activo: typeof data.activo === 'boolean' ? data.activo : paciente.activo,
      notas: data.antecedentes ?? paciente.notas,
      fundacion_id: data.fundacion_id ?? paciente.fundacion_id
    });

    res.json({
      id: updated.id,
      nombre: updated.nombre,
      apellido: updated.apellido,
      email: updated.email,
      telefono: updated.telefono,
      fecha_nacimiento: updated.fecha_nacimiento,
      genero: updated.genero,
      direccion: updated.direccion,
      estado: updated.estado,
      activo: updated.activo,
      fecha_ingreso: updated.created_at
    });
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    res.status(500).json({ message: 'Error al actualizar paciente' });
  }
});

// Eliminar paciente (soft-delete) (solo coordinadores)
router.delete('/:id', verifyToken, requireRole(['coordinador']), async (req, res) => {
  try {
    const id = req.params.id;
    const paciente = await Paciente.findByPk(id);
    if (!paciente) return res.status(404).json({ message: 'Paciente no encontrado' });

    await paciente.update({ activo: false, estado: 'alta_terapeutica' });

    res.json({ message: 'Paciente inactivado correctamente', id: paciente.id });
  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    res.status(500).json({ message: 'Error al eliminar paciente' });
  }
});

module.exports = router;