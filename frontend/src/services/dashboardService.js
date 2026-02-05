// frontend/src/services/dashboardService.js
import ApiService from './api';

class DashboardService {
  static async obtenerDashboardCoordinador() {
    try {
      console.log('Obteniendo dashboard coordinador...');
      const response = await ApiService.getDashboardCoordinador();
      console.log('Respuesta recibida:', response);
      // Ajuste: A veces axios devuelve la data en response.data, a veces directo.
      return response.data || response; 
    } catch (error) {
      console.error('Error obteniendo dashboard coordinador:', error);
      throw error;
    }
  }

  static async obtenerMetricasGlobales(periodo = 'mes') {
    try {
      const response = await ApiService.getMetricasGlobales(periodo);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo métricas globales:', error);
      throw error;
    }
  }

  static async obtenerEstadisticas() {
    try {
      const response = await ApiService.getEstadisticas();
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  // --- MÉTODOS PARA GESTIONAR SOLICITUDES ---
  // Método para aprobar solicitud
  static async aprobarSolicitud(id, rol) {
    try {
      console.log('DashboardService.aprobarSolicitud called with:', { id, rol });
      const response = await ApiService.post('/dashboard/aprobar-solicitud', { 
        solicitudId: id, 
        rolAsignado: rol 
      });
      console.log('DashboardService response:', response);
      return response.data;
    } catch (error) {
      console.error('Error en DashboardService.aprobarSolicitud:', error);
      throw error;
    }
  }

  // Método para denegar solicitud
  static async denegarSolicitud(id) {
    try {
      console.log('DashboardService.denegarSolicitud called with:', { id });
      const response = await ApiService.post('/dashboard/denegar-solicitud', { 
        solicitudId: id 
      });
      console.log('DashboardService denegar response:', response);
      return response.data;
    } catch (error) {
      console.error('Error en DashboardService.denegarSolicitud:', error);
      throw error;
    }
  }
  // ---------------------------------

  // Método para transformar los datos del backend al formato que usa el frontend
  static transformarDatosCoordinador(datosBackend) {
    if (!datosBackend) {
      throw new Error('No se recibieron datos del backend');
    }
    
    console.log('transformarDatosCoordinador recibió:', datosBackend);
    
    // 1. EXTRAEMOS LOS DATOS (Incluyendo 'solicitudes')
    const { 
      estadisticas = {}, 
      top_terapeutas = [], 
      coterapeutas_con_carga = [],
      actividad_reciente = [],
      alertas = [], 
      evolucion_mensual = [], 
      citas_por_dia = [],
      solicitudes_pendientes = [],
      solicitudes = [] // <--- Correcto
    } = datosBackend;
    
    // Transformar estadísticas principales
    const estadisticasTransformadas = {
      coterapeutasActivos: estadisticas.coterapeutas_activos || 0,
      terapeutasActivos: estadisticas.terapeutas_activos || 0,
      pacientesActivos: estadisticas.pacientes_activos || 0,
      citasHoy: estadisticas.citas_hoy || 0,
      citasCompletadasHoy: estadisticas.citas_completadas_hoy || 0,
      altasMesActual: estadisticas.altas_mes || 0
    };

    // Transformar actividad reciente
    const actividadRecienteTr = actividad_reciente.length > 0 
      ? actividad_reciente.map(act => ({
          id: act.id,
          tipo: act.tipo_evento,
          descripcion: `${act.tipo_evento} de ${act.paciente_nombre}`,
          fecha: act.fecha_evento,
          usuario: act.nombre_usuario || 'Sistema'
        }))
      : this.generarActividadReciente(datosBackend);

    // Transformar distribución de citas por terapeuta
    const terapeutasData = top_terapeutas;
    const distribucionTerapeutas = terapeutasData.map(terapeuta => ({
      nombre: terapeuta.nombre_completo || terapeuta.nombre || 'Terapeuta',
      citas: terapeuta.citas_completadas || 0,
      color: this.asignarColor(terapeuta.id || 0)
    }));

    // Transformar coterapeutas con carga
    const coterapeutasData = coterapeutas_con_carga;
    const coterapeutasCargaTr = coterapeutasData.map(coterapeuta => ({
      id: coterapeuta.id,
      nombre: coterapeuta.nombre_completo || 'Coterapeuta',
      pacientes_asignados: coterapeuta.pacientes_asignados || 0,
      citas_mes: coterapeuta.citas_este_mes || 0,
      pacientes: coterapeuta.pacientes ? coterapeuta.pacientes.split(', ') : []
    }));

    // Transformar alertas
    const alertasTransformadas = alertas.map((alerta, index) => ({
      id: index + 1,
      tipo: alerta.tipo || 'alerta',
      descripcion: alerta.descripcion || 'Alerta del sistema',
      cantidad: alerta.cantidad || 1
    }));

    // 2. RETORNAMOS EL OBJETO COMPLETO (Incluyendo solicitudes)
    const solicitudesTransformadas = (solicitudes_pendientes.length > 0 ? solicitudes_pendientes : solicitudes).map(sol => ({
      id: sol.id,
      nombre: sol.nombre_completo || sol.nombre || 'Sin nombre',
      email: sol.email || '',
      telefono: sol.telefono || '',
      rol: sol.rol_solicitado || sol.rol || 'No especificado',
      fecha: sol.fecha_solicitud || sol.fecha || new Date().toISOString(),
      estado: sol.estado || 'PENDIENTE'
    }));
    const solicitudesFinales = solicitudesTransformadas;
    console.log('Solicitudes finales:', solicitudesFinales);
    
    return {
      estadisticas: estadisticasTransformadas,
      actividadReciente: actividadRecienteTr,
      distribucionTerapeutas,
      coterapeutasCarga: coterapeutasCargaTr,
      alertas: alertasTransformadas,
      evolucionMensual: evolucion_mensual,
      citasPorDia: citas_por_dia,
      solicitudes: solicitudesFinales // <--- Correcto
    };
  }

  static asignarColor(id) {
    const colores = [
      'var(--grnb)',  // Verde azulado
      'var(--blu)',   // Azul
      'var(--yy)',    // Amarillo
      'var(--grnd)',  // Verde oscuro
      'var(--grnl)',  // Verde claro
      'var(--rr)',    // Rojo
      'var(--rl)'     // Rojo claro
    ];
    return colores[id % colores.length];
  }

  static generarActividadReciente(datosBackend) {
    const actividades = [];
    const ahora = new Date().toISOString();
    
    if (datosBackend.estadisticas) {
      if (datosBackend.estadisticas.altas_hoy > 0) {
        actividades.push({
          id: 1,
          tipo: 'alta_paciente',
          descripcion: `${datosBackend.estadisticas.altas_hoy} paciente(s) dado(s) de alta hoy`,
          fecha: ahora,
          usuario: 'Sistema'
        });
      }

      if (datosBackend.estadisticas.pacientes_nuevos_hoy > 0) {
        actividades.push({
          id: 2,
          tipo: 'nuevo_paciente',
          descripcion: `${datosBackend.estadisticas.pacientes_nuevos_hoy} nuevo(s) paciente(s) registrado(s) hoy`,
          fecha: ahora,
          usuario: 'Sistema'
        });
      }

      if (datosBackend.estadisticas.citas_hoy > 0) {
        actividades.push({
          id: 3,
          tipo: 'citas_hoy',
          descripcion: `${datosBackend.estadisticas.citas_hoy} cita(s) programada(s) para hoy`,
          fecha: ahora,
          usuario: 'Sistema'
        });
      }

      if (datosBackend.estadisticas.citas_completadas_hoy > 0) {
        actividades.push({
          id: 4,
          tipo: 'citas_completadas',
          descripcion: `${datosBackend.estadisticas.citas_completadas_hoy} cita(s) completada(s) hoy`,
          fecha: ahora,
          usuario: 'Sistema'
        });
      }
    }

    if (actividades.length === 0) {
      actividades.push({
        id: 1,
        tipo: 'sistema',
        descripcion: 'Sistema sincronizado con el backend',
        fecha: ahora,
        usuario: 'Sistema'
      });
    }

    return actividades;
  }
}

export default DashboardService;