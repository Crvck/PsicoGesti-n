import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FiUsers, 
  FiCalendar, 
  FiTrendingUp, 
  FiAlertCircle,
  FiClock,
  FiDollarSign
} from 'react-icons/fi';

const DashboardPage = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    totalPacientes: 0,
    totalCitasHoy: 0,
    totalCitasProximas: 0,
    promedioSesiones: 0,
    ingresosMes: 0,
    citasPendientes: 0
  });
  const [citasProximas, setCitasProximas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/dashboard/estadisticas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setStats(response.data);
      }
      
      // Simular datos de citas próximas (en un proyecto real vendría del backend)
      setCitasProximas([
        { id: 1, paciente: 'Juan Pérez', hora: '10:00 AM', estado: 'confirmada' },
        { id: 2, paciente: 'María García', hora: '11:30 AM', estado: 'pendiente' },
        { id: 3, paciente: 'Carlos López', hora: '2:00 PM', estado: 'confirmada' },
        { id: 4, paciente: 'Ana Martínez', hora: '4:30 PM', estado: 'cancelada' },
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Pacientes',
      value: stats.totalPacientes,
      icon: <FiUsers size={24} />,
      color: 'var(--blu)',
      change: '+12% este mes'
    },
    {
      title: 'Citas Hoy',
      value: stats.totalCitasHoy,
      icon: <FiCalendar size={24} />,
      color: 'var(--grnb)',
      change: `${stats.citasPendientes} pendientes`
    },
    {
      title: 'Próximas Citas',
      value: stats.totalCitasProximas,
      icon: <FiClock size={24} />,
      color: 'var(--yy)',
      change: 'Próximos 7 días'
    },
    {
      title: 'Ingresos del Mes',
      value: `$${stats.ingresosMes.toLocaleString()}`,
      icon: <FiDollarSign size={24} />,
      color: 'var(--grnd)',
      change: '+8% vs mes anterior'
    },
    {
      title: 'Promedio Sesiones',
      value: stats.promedioSesiones,
      icon: <FiTrendingUp size={24} />,
      color: 'var(--grnl)',
      change: 'por paciente'
    },
    {
      title: 'Alertas',
      value: stats.citasPendientes,
      icon: <FiAlertCircle size={24} />,
      color: 'var(--rr)',
      change: 'Requieren atención'
    }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Resumen general del consultorio</p>
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

      {/* Content Grid */}
      <div className="dashboard-content-grid">
        {/* Próximas Citas */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Próximas Citas</h3>
            <button className="btn-text">Ver todas</button>
          </div>
          
          <div className="citas-list">
            {citasProximas.map((cita) => (
              <div key={cita.id} className="cita-item">
                <div className="cita-info">
                  <div className="cita-paciente">{cita.paciente}</div>
                  <div className="cita-hora">{cita.hora}</div>
                </div>
                <div className={`cita-estado badge ${
                  cita.estado === 'confirmada' ? 'badge-success' :
                  cita.estado === 'pendiente' ? 'badge-warning' :
                  'badge-danger'
                }`}>
                  {cita.estado}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico de Actividad (Placeholder) */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Actividad Semanal</h3>
          </div>
          <div className="activity-chart">
            <div className="chart-placeholder">
              <p>Gráfico de actividad semanal</p>
              <div className="chart-bars">
                {[65, 80, 45, 90, 75, 60, 85].map((height, index) => (
                  <div key={index} className="chart-bar">
                    <div 
                      className="bar-fill"
                      style={{ height: `${height}%` }}
                    ></div>
                    <div className="bar-label">
                      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][index]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pacientes Recientes */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Pacientes Recientes</h3>
            <button className="btn-text">Ver todos</button>
          </div>
          
          <div className="pacientes-list">
            {[
              { id: 1, nombre: 'Juan Pérez', ultimaSesion: '2024-01-10', progreso: 75 },
              { id: 2, nombre: 'María García', ultimaSesion: '2024-01-09', progreso: 60 },
              { id: 3, nombre: 'Carlos López', ultimaSesion: '2024-01-08', progreso: 90 },
              { id: 4, nombre: 'Ana Martínez', ultimaSesion: '2024-01-07', progreso: 45 },
              { id: 5, nombre: 'Roberto Díaz', ultimaSesion: '2024-01-06', progreso: 30 },
            ].map((paciente) => (
              <div key={paciente.id} className="paciente-item">
                <div className="paciente-info">
                  <div className="paciente-nombre">{paciente.nombre}</div>
                  <div className="paciente-fecha">
                    Última: {new Date(paciente.ultimaSesion).toLocaleDateString()}
                  </div>
                </div>
                <div className="paciente-progreso">
                  <div className="progress-container">
                    <div 
                      className="progress-bar"
                      style={{ width: `${paciente.progreso}%` }}
                    ></div>
                  </div>
                  <span className="progreso-text">{paciente.progreso}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Acciones Rápidas</h3>
          </div>
          
          <div className="quick-actions">
            <button className="btn-primary w-100 mb-10">
              Agendar Nueva Cita
            </button>
            <button className="btn-secondary w-100 mb-10">
              Registrar Nuevo Paciente
            </button>
            <button className="btn-warning w-100 mb-10">
              Generar Reporte Mensual
            </button>
            <button className="btn-text w-100">
              Ver Calendario Completo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;