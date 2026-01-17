import React, { useState, useEffect } from 'react';
import { 
  FiCalendar, FiClock, FiUser, FiPlus, 
  FiChevronLeft, FiChevronRight, FiFilter,
  FiCheckCircle, FiXCircle, FiEdit2, FiRefreshCw
} from 'react-icons/fi';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import notifications from '../../utils/notifications';
import confirmations from '../../utils/confirmations';

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

  // Escuchar eventos de creación o actualización de cita para refrescar sin recargar manualmente
  React.useEffect(() => {
    const onCitaCreada = (e) => {
      try {
        console.log('Evento citaCreada recibido (citas):', e.detail);
        const nueva = e?.detail?.cita;
        if (nueva) {
          const nuevaFecha = nueva.fecha;
          const fechaSeleccionada = format(selectedDate, 'yyyy-MM-dd');
          if (nuevaFecha === fechaSeleccionada) {
            // Insertar optimísticamente la nueva cita en la lista
            setCitas(prev => [nueva, ...prev]);
            return;
          }
        }
        // Si no coincide la fecha, recargar datos
        fetchCitas();
      } catch (err) {
        console.warn('Error manejando citaCreada:', err);
      }
    };

    const onCitaActualizada = (e) => {
      try {
        console.log('Evento citaActualizada recibido (citas):', e.detail);
        const updated = e?.detail?.cita;
        if (updated) {
          const fechaSeleccionada = format(selectedDate, 'yyyy-MM-dd');
          if (updated.fecha === fechaSeleccionada) {
            setCitas(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
          } else {
            // Si cambió de fecha, remover de lista actual
            setCitas(prev => prev.filter(c => c.id !== updated.id));
          }
          return;
        }
        fetchCitas();
      } catch (err) { console.warn('Error manejando citaActualizada:', err); }
    };

    window.addEventListener('citaCreada', onCitaCreada);
    window.addEventListener('citaActualizada', onCitaActualizada);
    return () => {
      window.removeEventListener('citaCreada', onCitaCreada);
      window.removeEventListener('citaActualizada', onCitaActualizada);
    };
  }, [selectedDate]);

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
        notifications.success(`Cita ${nuevoEstado === 'completada' ? 'completada' : 'cancelada'} exitosamente`);
      }
    } catch (error) {
      console.error('Error al actualizar cita:', error);
      notifications.error('Error al actualizar la cita');
    }
  };

  const handleCancelarCita = async (cita) => {
    try {
      const confirmado = await confirmations.warning(`¿Estás seguro de cancelar la cita de ${cita.paciente_nombre} el ${cita.fecha} ${cita.hora}?`);
      if (!confirmado) return;

      // Pedir motivo (opcional)
      const motivo = window.prompt('Motivo de la cancelación (opcional):', '');

      const token = localStorage.getItem('token');
      // Optimistic UI: marcar como cancelada
      setCitas(prev => prev.map(c => c.id === cita.id ? { ...c, estado: 'cancelada', motivo_cancelacion: motivo || '' } : c));

      // Petición al backend
      const res = await fetch(`http://localhost:3000/api/citas/cita/${cita.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ estado: 'cancelada', motivo_cancelacion: motivo || '' })
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        // Rollback
        setCitas(prev => prev.map(c => c.id === cita.id ? { ...c, estado: cita.estado } : c));
        console.error('Error cancelando cita:', json);
        notifications.error(json.message || 'No se pudo cancelar la cita');
        return;
      }

      const updated = json.data || { ...cita, estado: 'cancelada', motivo_cancelacion: motivo || '' };
      // Reemplazar con datos retornados
      setCitas(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
      notifications.success('Cita cancelada');

      // Emitir evento para sincronizar otras vistas
      window.dispatchEvent(new CustomEvent('citaActualizada', { detail: { cita: updated } }));

    } catch (error) {
      console.error('Error en handleCancelarCita:', error);
      notifications.error('Error cancelando la cita');
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
          <button className="btn-secondary" onClick={fetchCitas}>
            <FiRefreshCw /> Actualizar
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

      {/* Vista de Calendario */}
      {view === 'day' && (
        <div className="calendar-day-view mb-20">
          <div className="time-column">
            {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(hour => (
              <div key={hour} className="time-slot">
                <span className="time-label">{hour}:00</span>
              </div>
            ))}
          </div>

          <div className="events-column">
            {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(hour => {
              const hourCitas = citas.filter(cita => 
                parseInt(cita.hora.split(':')[0]) === hour
              );

              return (
                <div key={hour} className="hour-slot">
                  {hourCitas.map((cita) => (
                    <div 
                      key={cita.id}
                      className={`event-item ${
                        cita.estado === 'confirmada' ? 'event-confirmed' :
                        cita.estado === 'completada' ? 'event-completed' :
                        cita.estado === 'programada' ? 'event-pending' :
                        'event-cancelled'
                      }`}
                    >
                      <div className="event-header">
                        <div className="event-time">
                          <FiClock /> {cita.hora}
                        </div>
                        <div className="event-type">{cita.tipo_consulta}</div>
                      </div>
                      <div className="event-content">
                        <div className="event-patient">
                          <FiUser /> {cita.paciente_nombre}
                        </div>
                        {cita.notas && (
                          <div className="event-notes">{cita.notas}</div>
                        )}
                      </div>
                      <div className="event-footer">
                        <span className={`badge ${
                          cita.estado === 'confirmada' ? 'badge-success' :
                          cita.estado === 'completada' ? 'badge-primary' :
                          cita.estado === 'programada' ? 'badge-warning' :
                          'badge-danger'
                        }`}>
                          {cita.estado}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                      onClick={() => handleCancelarCita(cita)}
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

      {/* Estadísticas del Día */}
      <div className="grid-3 mt-20">
        <div className="card">
          <h4>Resumen del Día</h4>
          <div className="mt-10">
            <p>Total: {citas.length}</p>
            <p>Confirmadas: {citas.filter(c => c.estado === 'confirmada').length}</p>
            <p>Completadas: {citas.filter(c => c.estado === 'completada').length}</p>
          </div>
        </div>
        
        <div className="card">
          <h4>Tipos de Consulta</h4>
          <div className="mt-10">
            <p>Presencial: {citas.filter(c => c.tipo_consulta === 'presencial').length}</p>
            <p>Virtual: {citas.filter(c => c.tipo_consulta === 'virtual').length}</p>
          </div>
        </div>
        
        <div className="card">
          <h4>Acciones</h4>
          <div className="mt-10 flex-col gap-10">
            <button className="btn-primary w-100" onClick={() => setShowNuevaCitaModal(true)}>
              Agendar Cita
            </button>
            <button className="btn-secondary w-100" onClick={() => setView(view === 'day' ? 'week' : 'day')}>
              {view === 'day' ? 'Vista Semanal' : 'Vista Diaria'}
            </button>
          </div>
        </div>
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