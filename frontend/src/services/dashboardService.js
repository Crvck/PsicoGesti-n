// frontend/src/services/dashboardService.js
import ApiService from './api';

class DashboardService {
  static async obtenerDashboardCoordinador() {
    try {
      console.log('Obteniendo dashboard coordinador...');
      const response = await ApiService.getDashboardCoordinador();
      console.log('Respuesta recibida:', response);
      return response.data;
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

  // Método para transformar los datos del backend al formato que usa el frontend
  static transformarDatosCoordinador(datosBackend) {
    if (!datosBackend) {
      throw new Error('No se recibieron datos del backend');
    }
    
    const { 
      estadisticas = {}, 
      top_psicologos = [], 
      becarios_carga = [],
      actividad_reciente = [],
      alertas = [], 
      evolucion_mensual = [], 
      citas_por_dia = [] 
    } = datosBackend;
    
    // Transformar estadísticas principales
    const estadisticasTransformadas = {
      becariosActivos: estadisticas.becarios_activos || 0,
      psicologosActivos: estadisticas.psicologos_activos || 0,
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

    // Transformar distribución de citas por psicólogo (simplificado a máximo 5)
    const distribucionPsicologos = top_psicologos.map(psicologo => ({
      nombre: psicologo.nombre_completo || psicologo.nombre || 'Psicólogo',
      citas: psicologo.citas_completadas || 0,
      color: this.asignarColor(psicologo.id || 0)
    }));

    // Transformar becarios con carga
    const becariosCargaTr = becarios_carga.map(becario => ({
      id: becario.id,
      nombre: becario.nombre_completo || 'Becario',
      pacientes_asignados: becario.pacientes_asignados || 0,
      citas_mes: becario.citas_este_mes || 0,
      pacientes: becario.pacientes ? becario.pacientes.split(', ') : []
    }));

    // Transformar alertas
    const alertasTransformadas = alertas.map((alerta, index) => ({
      id: index + 1,
      tipo: alerta.tipo || 'alerta',
      descripcion: alerta.descripcion || 'Alerta del sistema',
      cantidad: alerta.cantidad || 1
    }));

    return {
      estadisticas: estadisticasTransformadas,
      actividadReciente: actividadRecienteTr,
      distribucionPsicologos,
      becariosCarga: becariosCargaTr,
      alertas: alertasTransformadas,
      evolucionMensual: evolucion_mensual,
      citasPorDia: citas_por_dia
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
      // Si hay nuevas altas hoy
      if (datosBackend.estadisticas.altas_hoy > 0) {
        actividades.push({
          id: 1,
          tipo: 'alta_paciente',
          descripcion: `${datosBackend.estadisticas.altas_hoy} paciente(s) dado(s) de alta hoy`,
          fecha: ahora,
          usuario: 'Sistema'
        });
      }

      // Si hay pacientes nuevos hoy
      if (datosBackend.estadisticas.pacientes_nuevos_hoy > 0) {
        actividades.push({
          id: 2,
          tipo: 'nuevo_paciente',
          descripcion: `${datosBackend.estadisticas.pacientes_nuevos_hoy} nuevo(s) paciente(s) registrado(s) hoy`,
          fecha: ahora,
          usuario: 'Sistema'
        });
      }

      // Si hay citas hoy
      if (datosBackend.estadisticas.citas_hoy > 0) {
        actividades.push({
          id: 3,
          tipo: 'citas_hoy',
          descripcion: `${datosBackend.estadisticas.citas_hoy} cita(s) programada(s) para hoy`,
          fecha: ahora,
          usuario: 'Sistema'
        });
      }

      // Si hay citas completadas hoy
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

    // Si no hay actividades específicas, mostrar mensaje de sistema
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