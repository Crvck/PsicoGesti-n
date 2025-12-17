import React, { useState, useEffect } from 'react';
import { 
  FiUsers, FiCalendar, FiTrendingUp, FiBarChart2,
  FiUserCheck, FiClock, FiAlertCircle, FiRefreshCw,
  FiDollarSign, FiActivity
} from 'react-icons/fi';
import './coordinador.css';
import notifications from '../../utils/notifications';
import confirmations from '../../utils/confirmations';

const CoordinadorDashboard = () => {
  const [estadisticas, setEstadisticas] = useState({
    becariosActivos: 0,
    psicologosActivos: 0,
    pacientesActivos: 0,
    citasHoy: 0,
    citasCompletadasHoy: 0,
    altasMesActual: 0
  });
  const [actividadReciente, setActividadReciente] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Simulación de datos
      setTimeout(() => {
        setEstadisticas({
          becariosActivos: 4,
          psicologosActivos: 2,
          pacientesActivos: 25,
          citasHoy: 12,
          citasCompletadasHoy: 6,
          altasMesActual: 3
        });
        
        setActividadReciente([
          { id: 1, tipo: 'nueva_cita', descripcion: 'Nueva cita agendada para Carlos Gómez', fecha: '2024-01-10 09:30:00', usuario: 'Juan Pérez' },
          { id: 2, tipo: 'alta_paciente', descripcion: 'Ana Rodríguez dada de alta terapéutica', fecha: '2024-01-10 08:15:00', usuario: 'Lic. Luis Fernández' },
          { id: 3, tipo: 'nuevo_usuario', descripcion: 'Nuevo becario registrado: Pedro Hernández', fecha: '2024-01-09 16:45:00', usuario: 'Coordinador' },
          { id: 4, tipo: 'asignacion', descripcion: 'Paciente asignado a becario Sofía Ramírez', fecha: '2024-01-09 14:20:00', usuario: 'Coordinador' }
        ]);
        
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Becarios Activos',
      value: estadisticas.becariosActivos,
      icon: <FiUserCheck />,
      color: 'var(--grnb)',
      change: 'En formación'
    },
    {
      title: 'Psicólogos Activos',
      value: estadisticas.psicologosActivos,
      icon: <FiUsers />,
      color: 'var(--blu)',
      change: 'En supervisión'
    },
    {
      title: 'Pacientes Activos',
      value: estadisticas.pacientesActivos,
      icon: <FiActivity />,
      color: 'var(--yy)',
      change: 'En tratamiento'
    },
    {
      title: 'Citas Hoy',
      value: estadisticas.citasHoy,
      icon: <FiCalendar />,
      color: 'var(--grnd)',
      change: `${estadisticas.citasCompletadasHoy} completadas`
    },
    {
      title: 'Altas Este Mes',
      value: estadisticas.altasMesActual,
      icon: <FiTrendingUp />,
      color: 'var(--grnl)',
      change: 'Pacientes finalizados'
    },
    {
      title: 'Sesiones Promedio',
      value: '8.5',
      icon: <FiBarChart2 />,
      color: 'var(--rr)',
      change: 'Por paciente/mes'
    },
    {
      title: 'Ingresos Estimados',
      value: '$24,500',
      icon: <FiDollarSign />,
      color: 'var(--grnb)',
      change: 'Este mes'
    },
    {
      title: 'Alertas Pendientes',
      value: '3',
      icon: <FiAlertCircle />,
      color: 'var(--rl)',
      change: 'Requieren atención'
    }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Cargando panel de coordinación...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Panel de Coordinación</h1>
          <p>Vista general del sistema y gestión administrativa</p>
        </div>
        <button className="btn-secondary" onClick={fetchDashboardData}>
          <FiRefreshCw /> Actualizar
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-header">
              <div className="stat-icon" style={{ color: stat.color }}>
                {stat.icon}
              </div>
              <h3>{stat.title}</h3>
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-change">{stat.change}</div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content-grid">
        {/* Actividad Reciente */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Actividad Reciente del Sistema</h3>
            <button className="btn-text">Ver todo</button>
          </div>
          
          <div className="timeline">
            {actividadReciente.map((actividad) => (
              <div key={actividad.id} className="timeline-item">
                <div className="timeline-content">
                  <div className="flex-row justify-between">
                    <strong>{actividad.descripcion}</strong>
                    <span className="text-small">
                      {new Date(actividad.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div className="text-small mt-5">
                    Por: {actividad.usuario} • {new Date(actividad.fecha).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribución de Citas */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Distribución de Citas por Psicólogo</h3>
          </div>
          
          <div className="activity-chart">
            <div className="chart-placeholder">
              <div className="chart-bars">
                {[
                  { nombre: 'Luis Fernández', citas: 8, color: 'var(--grnb)' },
                  { nombre: 'Laura Gutiérrez', citas: 4, color: 'var(--blu)' }
                ].map((psicologo, index) => (
                  <div key={index} className="chart-bar" style={{ flex: psicologo.citas }}>
                    <div 
                      className="bar-fill"
                      style={{ 
                        height: `${(psicologo.citas / 12) * 100}%`,
                        background: psicologo.color
                      }}
                    ></div>
                    <div className="bar-label">{psicologo.nombre.split(' ')[1]}</div>
                    <div className="bar-value">{psicologo.citas} citas</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Becarios por Carga */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Carga de Pacientes por Becario</h3>
            <button className="btn-text">Reasignar</button>
          </div>
          
          <div className="pacientes-list">
            {[
              { id: 1, nombre: 'Juan Pérez', pacientes: 3, capacidad: 5, porcentaje: 60 },
              { id: 2, nombre: 'Sofía Ramírez', pacientes: 2, capacidad: 4, porcentaje: 50 },
              { id: 3, nombre: 'Pedro Hernández', pacientes: 1, capacidad: 3, porcentaje: 33 },
              { id: 4, nombre: 'Nuevo Becario', pacientes: 0, capacidad: 3, porcentaje: 0 }
            ].map((becario) => (
              <div key={becario.id} className="paciente-item">
                <div className="paciente-info">
                  <div className="paciente-nombre">{becario.nombre}</div>
                  <div className="paciente-fecha">
                    {becario.pacientes} / {becario.capacidad} pacientes
                  </div>
                </div>
                <div className="paciente-progreso">
                  <div className="progress-container">
                    <div 
                      className="progress-bar"
                      style={{ width: `${becario.porcentaje}%` }}
                    ></div>
                  </div>
                  <span className="progreso-text">{becario.porcentaje}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Acciones de Coordinación</h3>
          </div>
          
          <div className="quick-actions">
            <button className="btn-primary w-100 mb-10">
              Gestionar Usuarios
            </button>
            <button className="btn-secondary w-100 mb-10">
              Asignar Pacientes
            </button>
            <button className="btn-warning w-100 mb-10">
              Generar Reporte Mensual
            </button>
            <button className="btn-danger w-100">
              Revisar Altas
            </button>
            <button className="btn-text w-100 mt-10">
              Ver Agenda Global
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinadorDashboard;