import React, { useState, useEffect } from 'react';
import { 
  FiCalendar, FiUsers, FiClock, FiBell, 
  FiTrendingUp, FiAlertCircle, FiRefreshCw 
} from 'react-icons/fi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import notifications from '../../utils/notifications';
import confirmations from '../../utils/confirmations';

const BecarioDashboard = () => {
  const [estadisticas, setEstadisticas] = useState({
    citasHoy: 0,
    citasProximas: 0,
    pacientesAsignados: 0,
    observacionesPendientes: 0,
    notificacionesSinLeer: 0,
    citasCompletadas: 0
  });
  const [citasHoy, setCitasHoy] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Obtener estadísticas
      const statsResponse = await fetch('http://localhost:3000/api/roles/my-role-info', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setEstadisticas(statsData.data.estadisticas || {
          citasHoy: 3,
          pacientesAsignados: 2,
          observacionesPendientes: 1
        });
      }
      
      // Obtener citas de hoy
      const today = format(new Date(), 'yyyy-MM-dd');
      const citasResponse = await fetch(`http://localhost:3000/api/citas/citas-por-fecha?fecha=${today}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (citasResponse.ok) {
        const citasData = await citasResponse.json();
        setCitasHoy(citasData.data || []);
      }
      
      // Obtener notificaciones
      const notifResponse = await fetch('http://localhost:3000/api/notificaciones/mis-notificaciones', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (notifResponse.ok) {
        const notifData = await notifResponse.json();
        setNotificaciones(notifData.data || []);
      }
      
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Citas Hoy',
      value: estadisticas.citasHoy,
      icon: <FiCalendar />,
      color: 'var(--grnb)',
      change: 'Programadas para hoy'
    },
    {
      title: 'Pacientes Asignados',
      value: estadisticas.pacientesAsignados,
      icon: <FiUsers />,
      color: 'var(--blu)',
      change: 'A tu cargo'
    },
    {
      title: 'Próximas Citas',
      value: estadisticas.citasProximas || 5,
      icon: <FiClock />,
      color: 'var(--yy)',
      change: 'Próximos 7 días'
    },
    {
      title: 'Notificaciones',
      value: estadisticas.notificacionesSinLeer || notificaciones.filter(n => !n.leida).length,
      icon: <FiBell />,
      color: 'var(--rr)',
      change: 'Sin leer'
    },
    {
      title: 'Observaciones Pendientes',
      value: estadisticas.observacionesPendientes,
      icon: <FiTrendingUp />,
      color: 'var(--grnd)',
      change: 'Por registrar'
    },
    {
      title: 'Citas Completadas',
      value: estadisticas.citasCompletadas || 12,
      icon: <FiAlertCircle />,
      color: 'var(--grnl)',
      change: 'Este mes'
    }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Cargando panel del becario...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Panel del Becario</h1>
          <p>Bienvenido a tu centro de gestión de citas y pacientes</p>
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
            <button className="btn-text">Ver Calendario</button>
          </div>
          
          <div className="citas-list">
            {citasHoy.length > 0 ? (
              citasHoy.slice(0, 5).map((cita) => (
                <div key={cita.id} className="cita-item">
                  <div className="cita-info">
                    <div className="cita-paciente">{cita.paciente_nombre}</div>
                    <div className="cita-hora">{cita.hora}</div>
                  </div>
                  <div className={`cita-estado badge ${
                    cita.estado === 'confirmada' ? 'badge-success' :
                    cita.estado === 'programada' ? 'badge-warning' :
                    'badge-danger'
                  }`}>
                    {cita.estado}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-citas">
                <div className="no-citas-icon">📅</div>
                <div>No hay citas programadas para hoy</div>
              </div>
            )}
          </div>
        </div>

        {/* Notificaciones Recientes */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Notificaciones Recientes</h3>
            <button className="btn-text">Ver todas</button>
          </div>
          
          <div className="notifications-list">
            {notificaciones.slice(0, 5).map((notif) => (
              <div key={notif.id} className={`notification-item ${!notif.leida ? 'unread' : ''}`}>
                <div>
                  <h4>{notif.titulo}</h4>
                  <p>{notif.mensaje}</p>
                  <small>{new Date(notif.fecha_notificacion).toLocaleTimeString()}</small>
                </div>
                {!notif.leida && <span className="badge badge-info">Nuevo</span>}
              </div>
            ))}
            
            {notificaciones.length === 0 && (
              <div className="no-citas">
                <div className="no-citas-icon">🔔</div>
                <div>No hay notificaciones</div>
              </div>
            )}
          </div>
        </div>

        {/* Pacientes Asignados */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Mis Pacientes</h3>
            <button className="btn-text">Ver todos</button>
          </div>
          
          <div className="pacientes-list">
            {[
              { id: 1, nombre: 'Carlos Gómez', ultimaSesion: '2024-01-10' },
              { id: 2, nombre: 'Mariana López', ultimaSesion: '2024-01-09' },
              { id: 3, nombre: 'Ana Martínez', ultimaSesion: '2024-01-08' }
            ].map((paciente) => (
              <div key={paciente.id} className="paciente-item">
                <div className="paciente-info">
                  <div className="paciente-nombre">{paciente.nombre}</div>
                  <div className="paciente-fecha">
                    Última sesión: {new Date(paciente.ultimaSesion).toLocaleDateString()}
                  </div>
                </div>
                <button className="btn-text">Ver</button>
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
              Ver Mis Citas
            </button>
            <button className="btn-secondary w-100 mb-10">
              Registrar Observación
            </button>
            <button className="btn-warning w-100 mb-10">
              Marcar Cita como Completada
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

export default BecarioDashboard;