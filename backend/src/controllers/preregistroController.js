const Solicitud = require('../models/Solicitud');
const sequelize = require('../config/db');
// IMPORTAMOS EL SERVICIO NUEVO
const notificationService = require('../services/notificationService'); 

exports.crearSolicitud = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { 
      nombre, email, telefono, esEstudiante, 
      matricula, institucionProcedencia, horasALiberar, motivo, disponibilidad
    } = req.body;

    // --- VALIDACIONES ---
    // Validar email no duplicado
    const solicitudExistente = await Solicitud.findOne({
      where: { email },
      transaction: t
    });

    if (solicitudExistente && solicitudExistente.estado === 'APROBADA') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Este email ya está registrado como usuario aprobado.'
      });
    }

    // Validar que tenga al menos un día de disponibilidad
    if (!disponibilidad || disponibilidad.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Debe seleccionar al menos un día de disponibilidad.'
      });
    }

    // 1. Crear la Solicitud
    const nuevaSolicitud = await Solicitud.create({
      nombre_completo: nombre,
      email,
      telefono,
      origen: esEstudiante ? 'CESUN' : 'EXTERNO',
      matricula: esEstudiante ? matricula : null,
      institucion_procedencia: esEstudiante ? 'CESUN' : institucionProcedencia,
      horas_a_liberar: horasALiberar,
      motivo,
      estado: 'PENDIENTE',
      disponibilidad_horaria: JSON.stringify(disponibilidad) // Guardar disponibilidad como JSON en la solicitud
    }, { transaction: t });

    // 2. USAR EL SERVICIO DE NOTIFICACIÓN
    await notificationService.notificarRol(
        'COORDINADOR', 
        {
            titulo: 'Nueva Solicitud de Ingreso',
            mensaje: `${nombre} ha solicitado ingresar como practicante.`,
            tipo: 'alerta_sistema',
            prioridad: 'media',
            accion_url: `/dashboard/solicitudes/${nuevaSolicitud.id}`,
            extra: { 
                solicitud_id: nuevaSolicitud.id,
                origen: esEstudiante ? 'CESUN' : 'Externo'
            }
        }, 
        t
    );

    await t.commit();

    res.status(201).json({
      success: true,
      message: 'Solicitud enviada correctamente'
    });

  } catch (error) {
    await t.rollback();
    console.error('Error en pre-registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor.'
    });
  }
};