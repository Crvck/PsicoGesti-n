import React, { useState, useEffect } from 'react';
import { 
  FiCalendar, FiClock, FiUser, FiFilter, 
  FiChevronLeft, FiChevronRight, FiRefreshCw,
  FiCheckCircle, FiXCircle, FiEdit2
} from 'react-icons/fi';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

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
      
      // Simulación de datos
      setTimeout(() => {
        setCitas([
          {
            id: 1,
            paciente_nombre: 'Carlos Gómez',
            fecha: format(new Date(), 'yyyy-MM-dd'),
            hora: '10:00',
            tipo_consulta: 'presencial',
            estado: 'confirmada',
            duracion: 50,
            becario_nombre: 'Juan Pérez',
            notas: 'Segunda sesión de exposición gradual'
          },
          {
            id: 2,
            paciente_nombre: 'Mariana López',
            fecha: format(new Date(), 'yyyy-MM-dd'),
            hora: '11:30',
            tipo_consulta: 'virtual',
            estado: 'programada',
            duracion: 45,
            becario_nombre: 'Sofía Ramírez',
            notas: 'Seguimiento de tareas asignadas'
          },
          {
            id: 3,
            paciente_nombre: 'Roberto Sánchez',
            fecha: format(new Date(), 'yyyy-MM-dd'),
            hora: '14:00',
            tipo_consulta: 'presencial',
            estado: 'completada',
            duracion: 60,
            becario_nombre: null,
            notas: 'Evaluación de progreso'
          }
        ]);
        
        setBecarios([
          { id: 1, nombre: 'Juan Pérez', apellido: 'Pérez' },
          { id: 2, nombre: 'Sofía', apellido: 'Ramírez' }
        ]);
        
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error al cargar citas:', error);
      setLoading(false);
    }
  };

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
    alert(`Cita ${nuevoEstado === 'completada' ? 'marcada como completada' : 'cancelada'}`);
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