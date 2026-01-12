import React, { useState, useEffect } from 'react';
import { 
  FiCalendar, FiClock, FiUser, FiFilter, 
  FiChevronLeft, FiChevronRight, FiRefreshCw,
  FiCheckCircle, FiXCircle, FiEdit2
} from 'react-icons/fi';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import notifications from '../../utils/notifications';
import confirmations from '../../utils/confirmations';

const PsicologoCitas = () => {
  const [citas, setCitas] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [filterBecario, setFilterBecario] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [becarios, setBecarios] = useState([]);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const fechaStr = format(selectedDate, 'yyyy-MM-dd');

      // Obtener citas del backend
      const res = await fetch(`http://localhost:3000/api/citas/citas-por-fecha?fecha=${fechaStr}`, {
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Error en servidor' }));
        console.error('Error fetching citas:', err);
        notifications.error('No se pudieron obtener las citas');
        setCitas([]);
      } else {
        const json = await res.json();
        const data = Array.isArray(json) ? json : (json.data || []);
        setCitas(data);
      }

      // Obtener lista de becarios para filtro
      try {
        const resB = await fetch('http://localhost:3000/api/users/becarios', {
          headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }
        });
        const dataB = await resB.json();
        const normalized = (dataB || []).map(b => ({
          ...b,
          nombre_completo: b.nombre + (b.apellido ? ` ${b.apellido}` : '')
        }));
        setBecarios(normalized);
      } catch (err) {
        console.warn('No se pudieron obtener becarios:', err);
        setBecarios([]);
      }

    } catch (error) {
      console.error('Error al cargar citas:', error);
      notifications.error('Error al cargar citas');
    } finally {
      setLoading(false);
    }
  };

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
        fetchData();
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
        fetchData();
      } catch (err) { console.warn('Error manejando citaActualizada:', err); }
    };

    window.addEventListener('citaCreada', onCitaCreada);
    window.addEventListener('citaActualizada', onCitaActualizada);
    return () => {
      window.removeEventListener('citaCreada', onCitaCreada);
      window.removeEventListener('citaActualizada', onCitaActualizada);
    };
  }, [selectedDate]);

  const filteredCitas = citas.filter(cita => {
    const matchesBecario = !filterBecario || cita.becario_nombre?.includes(filterBecario);
    const matchesEstado = !filterEstado || cita.estado === filterEstado;
    return matchesBecario && matchesEstado;
  });

  const goToPreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const goToNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const formatDateSpanish = (date) => {
    return format(date, "EEEE d 'de' MMMM, yyyy", { locale: es });
  };

  const handleEstadoCita = (citaId, nuevoEstado) => {
    setCitas(prev => 
      prev.map(cita => 
        cita.id === citaId ? { ...cita, estado: nuevoEstado } : cita
      )
    );
    notifications.success(`Cita ${nuevoEstado === 'completada' ? 'marcada como completada' : 'cancelada'}`);
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
          <p>Agenda de sesiones y supervisiones</p>
        </div>
        <button className="btn-secondary" onClick={fetchData}>
          <FiRefreshCw /> Actualizar
        </button>
      </div>

      <div className="calendar-controls">
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
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-container mb-20">
        <div className="grid-2 gap-20">
          <div className="form-group">
            <label>Filtrar por becario</label>
            <select 
              value={filterBecario} 
              onChange={(e) => setFilterBecario(e.target.value)}
              className="select-field"
            >
              <option value="">Todos los becarios</option>
              {becarios.map(becario => (
                <option key={becario.id} value={becario.nombre}>
                  {becario.nombre} {becario.apellido}
                </option>
              ))}
              <option value="sin_becario">Sin becario</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Filtrar por estado</label>
            <select 
              value={filterEstado} 
              onChange={(e) => setFilterEstado(e.target.value)}
              className="select-field"
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
            const hourCitas = filteredCitas.filter(cita => 
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
                      {cita.becario_nombre && (
                        <div className="event-becario">👨‍🎓 {cita.becario_nombre}</div>
                      )}
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

      {/* Lista de Citas */}
      <div className="day-citas-list">
        <h3>Citas para {formatDateSpanish(selectedDate)} ({filteredCitas.length})</h3>
        
        {filteredCitas.length > 0 ? (
          <div className="citas-cards">
            {filteredCitas.map((cita) => (
              <div key={cita.id} className="cita-card">
                <div className="cita-card-header">
                  <div className="cita-time">
                    <FiClock /> {cita.hora} ({cita.duracion} min)
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
                    <FiUser /> {cita.paciente_nombre}
                  </div>
                  
                  <div className="cita-info">
                    <div className="cita-tipo">
                      {cita.tipo_consulta === 'presencial' ? '📋 Presencial' : '💻 Virtual'}
                    </div>
                    
                    {cita.becario_nombre && (
                      <div className="cita-becario">
                        👨‍🎓 {cita.becario_nombre}
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
            <p className="text-small mt-10">Prueba con otros filtros o selecciona otra fecha</p>
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
            <p>Con becario: {citas.filter(c => c.becario_nombre).length}</p>
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
            <button className="btn-primary w-100">
              Agendar Cita
            </button>
            <button className="btn-secondary w-100">
              Ver Agenda Semanal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PsicologoCitas;