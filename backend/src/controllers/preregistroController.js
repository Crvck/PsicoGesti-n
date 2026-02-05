const Solicitud = require('../models/Solicitud');
const sequelize = require('../config/db');
// IMPORTAMOS EL SERVICIO NUEVO
const notificationService = require('../services/notificationService'); 

exports.crearSolicitud = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { 
      nombre, email, telefono, esEstudiante, 
      matricula, institucionProcedencia, horasALiberar, motivo 
    } = req.body;

    // ... (Validaciones previas de email duplicado igual que antes) ...

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
      estado: 'PENDIENTE'
    }, { transaction: t });


    // 2. USAR EL SERVICIO DE NOTIFICACIÓN
    // "Oye servicio, avísale a todos los COORDINADORES que pasó esto"
    await notificationService.notificarRol(
        'COORDINADOR', // Rol destino
        {
            titulo: 'Nueva Solicitud de Ingreso',
            mensaje: `${nombre} ha solicitado ingresar como practicante.`,
            tipo: 'alerta_sistema', // Debe coincidir con tu ENUM
            prioridad: 'media',
            accion_url: `/dashboard/solicitudes/${nuevaSolicitud.id}`, // Link al detalle
            extra: { 
                solicitud_id: nuevaSolicitud.id,
                origen: esEstudiante ? 'CESUN' : 'Externo'
            }
        }, 
        t // Pasamos la transacción para que si falla algo, no se cree nada
    );


    await t.commit(); // Todo salió bien

    res.status(201).json({
      success: true,
      message: 'Solicitud enviada correctamente'
    });

  } catch (error) {
    await t.rollback(); // Si falla, se borra la solicitud y la notificación
    console.error('Error en pre-registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor.'
    });
  }
};