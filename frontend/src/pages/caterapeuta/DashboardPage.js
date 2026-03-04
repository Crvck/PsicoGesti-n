import React, { useState, useEffect } from 'react';
import { 
  FiCalendar, FiUsers, FiClock, 
  FiAlertCircle, FiRefreshCw 
} from 'react-icons/fi';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import notifications from '../../utils/notifications';

const BecarioDashboard = () => {
  const [estadisticas, setEstadisticas] = useState({
    citasHoy: 0,
    citasProximas: 0,
    pacientesAsignados: 0,
    citasCompletadas: 0
  });
  const [citasHoy, setCitasHoy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [misPacientes, setMisPacientes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' };

      // Decode userId from JWT
      try {
        const payload = token?.split('.')[1];
        const json = payload ? JSON.parse(atob(payload)) : null;
        setUserId(json?.id || json?.userId || null);
      } catch (_) {
        setUserId(null);
      }

      const apiUrl = process.env.REACT_APP_API_URL;

      // Mis pacientes (asignaciones)
      const misPacRes = await fetch(`${apiUrl}/api/asignaciones/mis-pacientes`, { headers });
      const misPacJson = await misPacRes.json().catch(() => ({}));
      const misPacArr = Array.isArray(misPacJson) ? misPacJson : (Array.isArray(misPacJson?.data) ? misPacJson.data : []);
      const pacientesAsignados = misPacArr.length;
      setMisPacientes(misPacArr);

      // Citas de hoy (filtradas al becario actual)
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const citasHoyRes = await fetch(`${apiUrl}/api/citas/citas-por-fecha?fecha=${todayStr}`, { headers });
      const citasHoyJson = await citasHoyRes.json().catch(() => ({}));
      const citasHoyArr = Array.isArray(citasHoyJson) ? citasHoyJson : (Array.isArray(citasHoyJson?.data) ? citasHoyJson.data : []);
      const citasHoyFiltradas = userId ? citasHoyArr.filter(c => String(c.becario_id) === String(userId)) : citasHoyArr;
      setCitasHoy(citasHoyFiltradas);

      // Próximas citas (próximos 7 días) para el becario
      let citasProximas = 0;
      for (let i = 1; i <= 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const dStr = format(d, 'yyyy-MM-dd');
        const res = await fetch(`${apiUrl}/api/citas/citas-por-fecha?fecha=${dStr}`, { headers });
        const j = await res.json().catch(() => ({}));
        const arr = Array.isArray(j) ? j : (Array.isArray(j?.data) ? j.data : []);
        citasProximas += (userId ? arr.filter(c => String(c.becario_id) === String(userId)).length : arr.length);
      }

      // Citas completadas (últimos 7 días)
      let citasCompletadas = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = format(d, 'yyyy-MM-dd');
        const res = await fetch(`${apiUrl}/api/citas/citas-por-fecha?fecha=${dStr}`, { headers });
        const j = await res.json().catch(() => ({}));
        const arr = Array.isArray(j) ? j : (Array.isArray(j?.data) ? j.data : []);
        citasCompletadas += (userId ? arr.filter(c => String(c.becario_id) === String(userId) && c.estado === 'completada').length : arr.filter(c => c.estado === 'completada').length);
      }

      setEstadisticas({ citasHoy: citasHoyFiltradas.length, pacientesAsignados, citasProximas, citasCompletadas });
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      notifications.error('Error cargando panel del becario');
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
      value: estadisticas.citasProximas,
      icon: <FiClock />,
      color: 'var(--yy)',
      change: 'Próximos 7 días'
    },
    {
      title: 'Citas Completadas',
      value: estadisticas.citasCompletadas,
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
            <button className="btn-text" onClick={() => navigate('/becario/citas')}>Ver Calendario</button>
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

        {/* Pacientes Asignados */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Mis Pacientes</h3>
            <button className="btn-text">Ver todos</button>
          </div>
          
          <div className="pacientes-list">
            {misPacientes.length > 0 ? (
              misPacientes.slice(0, 6).map((p) => (
                <div key={p.id} className="paciente-item">
                  <div className="paciente-info">
                    <div className="paciente-nombre">{`${p.nombre} ${p.apellido}`.trim()}</div>
                    <div className="paciente-fecha">
                      Última sesión: {p.ultima_sesion ? new Date(p.ultima_sesion).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  <button className="btn-text">Ver</button>
                </div>
              ))
            ) : (
              <div className="no-citas">
                <div className="no-citas-icon">👥</div>
                <div>No tienes pacientes asignados</div>
              </div>
            )}
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default BecarioDashboard;