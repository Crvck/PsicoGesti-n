import React, { useState, useEffect } from 'react';
import { 
  FiCalendar, FiClock, FiUser, FiPlus, 
  FiChevronLeft, FiChevronRight, FiFilter,
  FiCheckCircle, FiXCircle, FiEdit2
} from 'react-icons/fi';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

const BecarioCitas = () => {
  const [citas, setCitas] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('day');
  const [showNuevaCitaModal, setShowNuevaCitaModal] = useState(false);
  const [filterEstado, setFilterEstado] = useState('');

  useEffect(() => {
    fetchCitas();
  }, [selectedDate, filterEstado]);

  const fetchCitas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const fecha = format(selectedDate, 'yyyy-MM-dd');
      
      let url = `http://localhost:3000/api/citas/citas-por-fecha?fecha=${fecha}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Filtrar por estado si se especifica
        let citasFiltradas = data.data || [];
        if (filterEstado) {
          citasFiltradas = citasFiltradas.filter(cita => cita.estado === filterEstado);
        }
        
        setCitas(citasFiltradas);
      }
    } catch (error) {
      console.error('Error al obtener citas:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const goToNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const handleEstadoCita = async (citaId, nuevoEstado) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:3000/api/citas/cita/${citaId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      
      if (response.ok) {
        fetchCitas();
        alert(`Cita ${nuevoEstado === 'completada' ? 'completada' : 'cancelada'} exitosamente`);
      }
    } catch (error) {
      console.error('Error al actualizar cita:', error);
      alert('Error al actualizar la cita');
    }
  };

  const formatDateSpanish = (date) => {
    return format(date, "EEEE d 'de' MMMM, yyyy", { locale: es });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Cargando citas...</div>
      </div>
    );
  }

  return (
    <div className="citas-page">
      <div className="page-header">
        <div>
          <h1>Mis Citas</h1>
          <p>Gestión de citas asignadas</p>
        </div>
        <div className="flex-row gap-10">
          <button 
            className="btn-primary"
            onClick={() => setShowNuevaCitaModal(true)}
          >
            <FiPlus /> Nueva Cita
          </button>
        </div>
      </div>

      <div className="calendar-controls">
        <div className="view-selector">
          <button 
            className={`btn-text ${view === 'day' ? 'active' : ''}`}
            onClick={() => setView('day')}
          >
            Día
          </button>
          <button 
            className={`btn-text ${view === 'week' ? 'active' : ''}`}
            onClick={() => setView('week')}
          >
            Semana
          </button>
        </div>

        <div className="date-navigation">
          <button className="btn-text" onClick={goToPreviousDay}>
            <FiChevronLeft /> Ayer
          </button>
          
          <div className="current-date">
            <h3>{formatDateSpanish(selectedDate)}</h3>
          </div>
          
          <button className="btn-text" onClick={goToNextDay}>
            Mañana <FiChevronRight />
          </button>
        </div>

        <div className="quick-actions">
          <button className="btn-secondary" onClick={goToToday}>
            Hoy
          </button>
          <div className="filter-select">
            <select 
              value={filterEstado} 
              onChange={(e) => setFilterEstado(e.target.value)}
              className="form-select"
              style={{ width: '150px' }}
            >
              <option value="">Todos los estados</option>
              <option value="programada">Programadas</option>
              <option value="confirmada">Confirmadas</option>
              <option value="completada">Completadas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Citas */}
      <div className="day-citas-list">
        <h3>Citas para {formatDateSpanish(selectedDate)} ({citas.length})</h3>
        
        {citas.length > 0 ? (
          <div className="citas-cards">
            {citas.map((cita) => (
              <div key={cita.id} className="cita-card">
                <div className="cita-card-header">
                  <div className="cita-time">
                    <FiClock /> {cita.hora} ({cita.duracion || 50} min)
                  </div>
                  <div className={`cita-status badge ${
                    cita.estado === 'confirmada' ? 'badge-success' :
                    cita.estado === 'completada' ? 'badge-primary' :
                    cita.estado === 'programada' ? 'badge-warning' :
                    'badge-danger'
                  }`}>
                    {cita.estado}
                  </div>
                </div>
                
                <div className="cita-card-body">
                  <div className="cita-paciente">
                    <FiUser /> {cita.paciente_nombre || 'Paciente'}
                  </div>
                  
                  <div className="cita-info">
                    <div className="cita-tipo">
                      {cita.tipo_consulta === 'presencial' ? '📋 Presencial' : '💻 Virtual'}
                    </div>
                    
                    {cita.paciente_telefono && (
                      <div className="cita-contacto">
                        📞 {cita.paciente_telefono}
                      </div>
                    )}
                    
                    {cita.psicologo_nombre && (
                      <div className="cita-psicologo">
                        👨‍⚕️ {cita.psicologo_nombre}
                      </div>
                    )}
                    
                    {cita.notas && (
                      <div className="cita-notas">
                        <strong>Notas:</strong> {cita.notas}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="cita-card-footer">
                  <button className="btn-text">
                    <FiEdit2 /> Editar
                  </button>
                  
                  {cita.estado === 'confirmada' && (
                    <button 
                      className="btn-text text-success"
                      onClick={() => handleEstadoCita(cita.id, 'completada')}
                    >
                      <FiCheckCircle /> Completar
                    </button>
                  )}
                  
                  {(cita.estado === 'programada' || cita.estado === 'confirmada') && (
                    <button 
                      className="btn-text text-danger"
                      onClick={() => handleEstadoCita(cita.id, 'cancelada')}
                    >
                      <FiXCircle /> Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-citas">
            <div className="no-citas-icon">📅</div>
            <div>No hay citas programadas para este día</div>
            <button 
              className="btn-text" 
              onClick={() => setShowNuevaCitaModal(true)}
            >
              Agendar nueva cita
            </button>
          </div>
        )}
      </div>

      {/* Modal para nueva cita (simplificado) */}
      {showNuevaCitaModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Nueva Cita</h3>
              <button className="modal-close" onClick={() => setShowNuevaCitaModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <p>Funcionalidad de nueva cita. Esta función está en desarrollo.</p>
              <p>Por ahora, contacta al coordinador para agendar nuevas citas.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowNuevaCitaModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BecarioCitas;