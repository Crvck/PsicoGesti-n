import React, { useState, useEffect } from 'react';
import {
  FiUsers, FiCalendar, FiUserCheck, FiClock, FiRefreshCw
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import notifications from '../../utils/notifications';

const PsicologoDashboard = () => {
  const [estadisticas, setEstadisticas] = useState({
    pacientesActivos: 0,
    citasHoy: 0,
    citasSemana: 0,
    becariosAsignados: 0
  });
  const [citasHoy, setCitasHoy] = useState([]);
  const [becarios, setBecarios] = useState([]);
  const [citasSemanaList, setCitasSemanaList] = useState([]);
  const [pacientesAsignados, setPacientesAsignados] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' };

      const today = new Date();
      const toISODate = (d) => new Date(d).toISOString().split('T')[0];
      const todayStr = toISODate(today);

      const safeJson = async (res) => {
        try { const j = await res.json(); return j; } catch { return {}; }
      };
      const normalizeArray = (j) => Array.isArray(j) ? j : (Array.isArray(j?.data) ? j.data : []);

      // Decodificar userId
      let decodedUserId = null;
      try {
        const payload = token?.split('.')[1];
        const json = payload ? JSON.parse(atob(payload)) : null;
        decodedUserId = json?.id || json?.userId || null;
      } catch (_) {
        decodedUserId = null;
      }

      // Agenda semanal del terapeuta
      const start = startOfWeek(today, { weekStartsOn: 1 });
      const end = endOfWeek(today, { weekStartsOn: 1 });
      const fechaInicio = format(start, 'yyyy-MM-dd');
      const fechaFin = format(end, 'yyyy-MM-dd');

      const agendaQuery = new URLSearchParams({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        psicologo_id: decodedUserId || ''
      });

      const agendaRes = await fetch(`http://localhost:3000/api/agenda/global?${agendaQuery.toString()}`, { headers });
      const agendaJson = await safeJson(agendaRes);
      const citasRaw = Array.isArray(agendaJson) ? agendaJson : (agendaJson.data?.citas || agendaJson.data || []);
      const citasWeek = citasRaw.map((c) => ({
        id: c.id,
        fecha: typeof c.fecha === 'string' ? c.fecha.split('T')[0] : format(new Date(c.fecha), 'yyyy-MM-dd'),
        hora: typeof c.hora === 'string' ? c.hora.slice(0, 5) : c.hora,
        tipo: c.tipo_consulta || 'presencial',
        estado: c.estado,
        color: c.color || c.cita_color || null,
        paciente_nombre: c.Paciente ? `${c.Paciente.nombre} ${c.Paciente.apellido}` : (c.paciente_nombre || 'Paciente'),
        paciente_telefono: c.Paciente?.telefono || c.paciente_telefono || '',
        paciente_email: c.Paciente?.email || c.paciente_email || '',
        coterapeuta_nombre: c.Becario ? `${c.Becario.nombre} ${c.Becario.apellido}` : (c.becario_nombre || '')
      }));

      setCitasSemanaList(citasWeek);

      // Citas hoy
      const citasHoyArr = citasWeek.filter(c => c.fecha === todayStr).map(c => ({
        id: c.id,
        paciente: c.paciente_nombre,
        hora: c.hora || '',
        tipo: c.tipo,
        coterapeuta: c.coterapeuta_nombre || ''
      }));
      setCitasHoy(citasHoyArr);

      // Becarios asignados para citas (desde agenda semanal)
      const becariosFromCitas = [...new Set(citasWeek.map(c => c.coterapeuta_nombre).filter(Boolean))]
        .map((nombre, idx) => ({ id: `bec-${idx}`, nombre, pacientes: 0, observaciones: 0 }));
      setBecarios(becariosFromCitas);

      // Pacientes asignados (desde asignaciones)
      const asigRes = await fetch('http://localhost:3000/api/asignaciones', { headers });
      const asigJson = await safeJson(asigRes);
      const asigArr = normalizeArray(asigJson).filter(a =>
        String(a.terapeuta_id || a.psicologo_id || a.Psicologo?.id) === String(decodedUserId)
      );
      const pacientesSet = new Map();
      asigArr.forEach(a => {
        const id = a.paciente_id || a.Paciente?.id || a.paciente?.id || a.id;
        const nombre = a.Paciente ? `${a.Paciente.nombre} ${a.Paciente.apellido}` : (a.paciente || '').trim();
        if (id && nombre) pacientesSet.set(id, nombre);
      });
      const pacientesAsignadosList = Array.from(pacientesSet.entries()).map(([id, nombre]) => ({ id, nombre }));
      setPacientesAsignados(pacientesAsignadosList);

      const pacientesActivos = pacientesAsignadosList.length;
      const becariosAsignados = becariosFromCitas.length;
      const citasSemana = citasWeek.length;

      setEstadisticas({ pacientesActivos, citasHoy: citasHoyArr.length, citasSemana, becariosAsignados });
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      notifications.error('Error cargando panel');
    } finally {
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
            <button className="btn-text" onClick={() => navigate('/psicologo/citas')}>Ver Agenda</button>
          </div>

          <div className="citas-list">
            {citasHoy.map((cita) => (
              <div key={cita.id} className="cita-item">
                <div className="cita-info">
                  <div className="cita-paciente">{cita.paciente}</div>
                  <div className="cita-hora">{cita.hora} • {cita.tipo === 'presencial' ? 'Presencial' : 'Virtual'} • {cita.coterapeuta || 'Sin coterapeuta'}</div>
                </div>
                <button className="btn-text">Ver</button>
              </div>
            ))}
          </div>
        </div>

        {/* Pacientes asignados */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Pacientes asignados</h3>
            <button className="btn-text" onClick={() => navigate('/psicologo/pacientes')}>Ver todos</button>
          </div>

          <div className="pacientes-list">
            {pacientesAsignados.map((paciente) => (
              <div key={paciente.id} className="paciente-item">
                <div className="paciente-info">
                  <div className="paciente-nombre">{paciente.nombre}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Becarios Asignados */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Coterapeutas en citas</h3>
            <button className="btn-text" onClick={() => navigate('/psicologo/citas')}>Ver agenda</button>
          </div>

          <div className="pacientes-list">
            {becarios.map((becario) => (
              <div key={becario.id} className="paciente-item">
                <div className="paciente-info">
                  <div className="paciente-nombre">{becario.nombre}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PsicologoDashboard;