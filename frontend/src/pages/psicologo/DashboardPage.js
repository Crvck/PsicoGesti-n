import React, { useState, useEffect } from 'react';
import { 
  FiUsers, FiCalendar, FiTrendingUp, FiBarChart2,
  FiUserCheck, FiClock, FiRefreshCw
} from 'react-icons/fi';

const PsicologoDashboard = () => {
  const [estadisticas, setEstadisticas] = useState({
    pacientesActivos: 0,
    citasHoy: 0,
    citasSemana: 0,
    becariosAsignados: 0,
    sesionesMes: 0,
    altasMes: 0
  });
  const [citasHoy, setCitasHoy] = useState([]);
  const [becarios, setBecarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Simulación de datos
      setTimeout(() => {
        setEstadisticas({
          pacientesActivos: 12,
          citasHoy: 4,
          citasSemana: 15,
          becariosAsignados: 2,
          sesionesMes: 48,
          altasMes: 2
        });
        
        setCitasHoy([
          { id: 1, paciente: 'Carlos Gómez', hora: '10:00 AM', tipo: 'presencial' },
          { id: 2, paciente: 'Mariana López', hora: '11:30 AM', tipo: 'virtual' },
          { id: 3, paciente: 'Roberto Sánchez', hora: '02:00 PM', tipo: 'presencial' },
          { id: 4, paciente: 'Ana Rodríguez', hora: '04:30 PM', tipo: 'virtual' }
        ]);
        
        setBecarios([
          { id: 1, nombre: 'Juan Pérez', pacientes: 3, observaciones: 5 },
          { id: 2, nombre: 'Sofía Ramírez', pacientes: 2, observaciones: 3 }
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
      title: 'Pacientes Activos',
      value: estadisticas.pacientesActivos,
      icon: <FiUsers />,
      color: 'var(--grnb)',
      change: 'En tratamiento'
    },
    {
      title: 'Citas Hoy',
      value: estadisticas.citasHoy,
      icon: <FiCalendar />,
      color: 'var(--blu)',
      change: 'Programadas'
    },
    {
      title: 'Citas Esta Semana',
      value: estadisticas.citasSemana,
      icon: <FiClock />,
      color: 'var(--yy)',
      change: 'Próximos 7 días'
    },
    {
      title: 'Becarios Asignados',
      value: estadisticas.becariosAsignados,
      icon: <FiUserCheck />,
      color: 'var(--grnd)',
      change: 'En supervisión'
    },
    {
      title: 'Sesiones Mes',
      value: estadisticas.sesionesMes,
      icon: <FiTrendingUp />,
      color: 'var(--grnl)',
      change: 'Realizadas'
    },
    {
      title: 'Altas Este Mes',
      value: estadisticas.altasMes,
      icon: <FiBarChart2 />,
      color: 'var(--rr)',
      change: 'Pacientes dados de alta'
    }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Cargando panel del psicólogo...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Panel del Psicólogo</h1>
          <p>Supervisión y gestión de pacientes</p>
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
        {/* Citas de Hoy */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Citas de Hoy</h3>
            <button className="btn-text">Ver Agenda</button>
          </div>
          
          <div className="citas-list">
            {citasHoy.map((cita) => (
              <div key={cita.id} className="cita-item">
                <div className="cita-info">
                  <div className="cita-paciente">{cita.paciente}</div>
                  <div className="cita-hora">{cita.hora} • {cita.tipo === 'presencial' ? 'Presencial' : 'Virtual'}</div>
                </div>
                <button className="btn-text">Ver</button>
              </div>
            ))}
          </div>
        </div>

        {/* Becarios Asignados */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Becarios en Supervisión</h3>
            <button className="btn-text">Ver todos</button>
          </div>
          
          <div className="pacientes-list">
            {becarios.map((becario) => (
              <div key={becario.id} className="paciente-item">
                <div className="paciente-info">
                  <div className="paciente-nombre">{becario.nombre}</div>
                  <div className="paciente-fecha">
                    {becario.pacientes} pacientes • {becario.observaciones} observaciones
                  </div>
                </div>
                <div className="paciente-progreso">
                  <div className="progress-container">
                    <div 
                      className="progress-bar"
                      style={{ width: `${(becario.observaciones / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="progreso-text">
                    {Math.round((becario.observaciones / 10) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estadísticas Mensuales */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Estadísticas del Mes</h3>
          </div>
          
          <div className="activity-chart">
            <div className="chart-placeholder">
              <div className="chart-bars">
                {[65, 80, 45, 90, 75, 60, 85, 70, 95, 50, 65, 80].map((height, index) => (
                  <div key={index} className="chart-bar">
                    <div 
                      className="bar-fill"
                      style={{ height: `${height}%` }}
                    ></div>
                    <div className="bar-label">
                      {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][index]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Acciones Rápidas</h3>
          </div>
          
          <div className="quick-actions">
            <button className="btn-primary w-100 mb-10">
              Ver Mis Pacientes
            </button>
            <button className="btn-secondary w-100 mb-10">
              Registrar Sesión
            </button>
            <button className="btn-warning w-100 mb-10">
              Revisar Observaciones
            </button>
            <button className="btn-text w-100">
              Generar Reporte Mensual
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PsicologoDashboard;