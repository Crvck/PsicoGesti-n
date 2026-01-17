// frontend/src/pages/coordinador/DashboardPage.js
import React, { useState, useEffect } from 'react';
import { 
  FiUsers, FiCalendar, FiTrendingUp, FiBarChart2,
  FiUserCheck, FiClock, FiAlertCircle, FiRefreshCw,
  FiDollarSign, FiActivity, FiInfo, FiUser, FiFileText,
  FiCheckCircle, FiList, FiUserPlus, FiTarget, FiClipboard,
  FiUsers as FiUsersGroup, FiCalendar as FiCalendarGlobal
} from 'react-icons/fi';
import './coordinador.css';
import { useNavigate } from 'react-router-dom'; // Importamos useNavigate
import notifications from '../../utils/notifications';
import DashboardService from '../../services/dashboardService';

const CoordinadorDashboard = () => {
  const navigate = useNavigate(); // Para navegación
  
  const [estadisticas, setEstadisticas] = useState({
    becariosActivos: 0,
    psicologosActivos: 0,
    pacientesActivos: 0,
    citasHoy: 0,
    citasCompletadasHoy: 0,
    altasMesActual: 0
  });
  
  const [actividadReciente, setActividadReciente] = useState([]);
  const [distribucionPsicologos, setDistribucionPsicologos] = useState([]);
  const [becariosCarga, setBecariosCarga] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Cargando dashboard...');
      const response = await DashboardService.obtenerDashboardCoordinador();
      
      const datosTransformados = DashboardService.transformarDatosCoordinador(response);
      
      setEstadisticas(datosTransformados.estadisticas);
      setActividadReciente(datosTransformados.actividadReciente);
      setDistribucionPsicologos(datosTransformados.distribucionPsicologos);
      setBecariosCarga(datosTransformados.becariosCarga || []);
      setAlertas(datosTransformados.alertas);
      
      
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      setError(`Error al cargar datos: ${error.message}`);
      notifications.error('Error', 'No se pudieron cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar "Ver todo" en Actividad Reciente
  const handleVerTodaActividad = () => {
    navigate('/coordinador/agenda'); // Redirige a la agenda
  };

  // Funciones para las Acciones de Coordinación
  const handleGestionarUsuarios = () => {
    navigate('/coordinador/usuarios');
  };

  const handleAsignarPacientes = () => {
    navigate('/coordinador/asignaciones');
  };

  const handleGenerarReporteMensual = () => {
    navigate('/coordinador/reportes');
  };

  const handleRevisarAltas = () => {
    navigate('/coordinador/altas');
  };

  const handleVerAgendaGlobal = () => {
    navigate('/coordinador/agenda');
  };

  // Función para manejar "Reasignar" en Carga de Pacientes
  const handleReasignar = () => {
    navigate('/coordinador/asignaciones');
  };

  // Función para manejar "Resolver" en Alertas
  const handleResolverAlertas = () => {
    // Aquí puedes implementar lógica para marcar alertas como resueltas
    setAlertas([]);
    notifications.success('Alertas resueltas', 'Las alertas han sido marcadas como resueltas');
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
      title: 'Alertas Pendientes',
      value: alertas.reduce((total, alerta) => total + (alerta.cantidad || 0), 0),
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
          {error && (
            <div className="alert alert-warning mt-10">
              <FiAlertCircle /> {error}
            </div>
          )}
        </div>
        <button className="btn-secondary" onClick={fetchDashboardData} disabled={loading}>
          <FiRefreshCw /> {loading ? 'Cargando...' : 'Actualizar'}
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
            <button className="btn-text" onClick={handleVerTodaActividad}>
              Ver todo
            </button>
          </div>
          
          <div className="timeline">
            {actividadReciente.length > 0 ? (
              actividadReciente.map((actividad) => (
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
              ))
            ) : (
              <div className="timeline-item">
                <div className="timeline-content">
                  <div className="flex-row justify-between">
                    <strong>No hay actividad reciente</strong>
                    <FiClock className="text-small" />
                  </div>
                  <div className="text-small mt-5">
                    El sistema no registra actividad en este momento
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Distribución de Citas */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Citas Completadas por Psicólogo</h3>
          </div>
          
          <div className="distribution-list-simple">
            {distribucionPsicologos.length > 0 ? (
              <div className="psychologist-list">
                {distribucionPsicologos.map((psicologo, index) => (
                  <div key={index} className="psychologist-item">
                    <div className="psychologist-info">
                      <div className="psychologist-name">{psicologo.nombre}</div>
                      <div className="psychologist-citas-count">{psicologo.citas} citas completadas</div>
                    </div>
                    <div 
                      className="psychologist-badge"
                      style={{ backgroundColor: psicologo.color }}
                    >
                      {psicologo.citas}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-message">
                <FiBarChart2 size={40} />
                <p>No hay datos disponibles</p>
              </div>
            )}
          </div>
        </div>

        {/* Becarios por Carga */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Carga de Pacientes por Becario</h3>
            <button className="btn-text" onClick={handleReasignar}>
              Reasignar
            </button>
          </div>
          
          <div className="becarios-list">
            {becariosCarga.length > 0 ? (
              <div className="becarios-items">
                {becariosCarga.map((becario) => (
                  <div key={becario.id} className="becario-item">
                    <div className="becario-header">
                      <div className="becario-name">{becario.nombre}</div>
                      <div className="becario-stats">
                        <span className="stat-badge">{becario.pacientes_asignados} pacientes</span>
                        <span className="stat-badge secondary">{becario.citas_mes} citas</span>
                      </div>
                    </div>
                    {becario.pacientes.length > 0 && (
                      <div className="becario-pacientes">
                        <div className="pacientes-label">Pacientes asignados:</div>
                        <div className="pacientes-list">
                          {becario.pacientes.map((paciente, idx) => (
                            <div key={idx} className="paciente-tag">{paciente}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-message">
                <FiUser size={40} />
                <p>No hay becarios con pacientes asignados</p>
              </div>
            )}
          </div>
        </div>

        {/* Alertas Pendientes */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Alertas Pendientes</h3>
            {/* <button className="btn-text" onClick={handleResolverAlertas}>
              Resolver
            </button> */}
          </div>
          
          <div className="alertas-list">
            {alertas.length > 0 ? (
              alertas.map((alerta, index) => (
                <div key={index} className="alerta-item">
                  <div className="alerta-icon">
                    <FiAlertCircle style={{ color: 'var(--rl)' }} />
                  </div>
                  <div className="alerta-content">
                    <div className="alerta-titulo">{alerta.descripcion}</div>
                    <div className="alerta-subtitulo">
                      {alerta.cantidad} {alerta.cantidad === 1 ? 'elemento' : 'elementos'} pendientes
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="alerta-item alerta-item-success">
                <div className="alerta-icon">
                  <FiCheckCircle style={{ color: 'var(--grnb)' }} />
                </div>
                <div className="alerta-content">
                  <div className="alerta-titulo">Sin alertas pendientes</div>
                  <div className="alerta-subtitulo">Todo está al día en el sistema</div>
                </div>
              </div>
            )}
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default CoordinadorDashboard;