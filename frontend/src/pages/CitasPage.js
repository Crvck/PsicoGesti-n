import React, { useState, useEffect } from 'react';
import { FiCalendar, FiClock, FiUser, FiPlus, FiEdit2 } from 'react-icons/fi';

const CitasPage = () => {
  const [citas, setCitas] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('week'); // 'day', 'week', 'month'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga de citas
    setTimeout(() => {
      setCitas([
        {
          id: 1,
          paciente: 'Juan Pérez',
          fecha: '2024-01-15',
          hora: '10:00',
          duracion: 60,
          tipo: 'Consulta inicial',
          estado: 'confirmada',
          notas: 'Primera consulta'
        },
        {
          id: 2,
          paciente: 'María García',
          fecha: '2024-01-15',
          hora: '11:30',
          duracion: 45,
          tipo: 'Seguimiento',
          estado: 'confirmada',
          notas: 'Sesión 5'
        },
        {
          id: 3,
          paciente: 'Carlos López',
          fecha: '2024-01-15',
          hora: '14:00',
          duracion: 60,
          tipo: 'Terapia',
          estado: 'pendiente',
          notas: 'Evaluación mensual'
        },
        {
          id: 4,
          paciente: 'Ana Martínez',
          fecha: '2024-01-16',
          hora: '09:00',
          duracion: 90,
          tipo: 'Sesión especial',
          estado: 'confirmada',
          notas: 'Sesión familiar'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  // Generar horas del día
  const hours = Array.from({ length: 12 }, (_, i) => {
    const hour = 9 + i;
    return `${hour}:00`;
  });

  // Filtrar citas por fecha seleccionada
  const citasDelDia = citas.filter(cita => 
    cita.fecha === selectedDate.toISOString().split('T')[0]
  );

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
          <h1>Calendario de Citas</h1>
          <p>Gestión de agenda del consultorio</p>
        </div>
        <div className="flex-row gap-10">
          <button className="btn-secondary">
            <FiCalendar /> {selectedDate.toLocaleDateString()}
          </button>
          <button className="btn-primary">
            <FiPlus /> Nueva Cita
          </button>
        </div>
      </div>

      {/* Controles del calendario */}
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
          <button 
            className={`btn-text ${view === 'month' ? 'active' : ''}`}
            onClick={() => setView('month')}
          >
            Mes
          </button>
        </div>

        <div className="date-navigation">
          <button className="btn-text">
            &lt; Anterior
          </button>
          <div className="current-date">
            <h3>Lunes 15 de Enero, 2024</h3>
          </div>
          <button className="btn-text">
            Siguiente &gt;
          </button>
        </div>

        <div className="quick-actions">
          <button className="btn-secondary">
            Hoy
          </button>
        </div>
      </div>

      {/* Vista día */}
      <div className="calendar-day-view">
        <div className="time-column">
          {hours.map((hour) => (
            <div key={hour} className="time-slot">
              <span className="time-label">{hour}</span>
            </div>
          ))}
        </div>

        <div className="events-column">
          {hours.map((hour) => {
            const hourCitas = citasDelDia.filter(cita => 
              cita.hora.startsWith(hour.split(':')[0])
            );

            return (
              <div key={hour} className="hour-slot">
                {hourCitas.map((cita) => (
                  <div 
                    key={cita.id}
                    className={`event-item ${
                      cita.estado === 'confirmada' ? 'event-confirmed' :
                      cita.estado === 'pendiente' ? 'event-pending' :
                      'event-cancelled'
                    }`}
                    style={{ height: `${(cita.duracion / 60) * 100}%` }}
                  >
                    <div className="event-header">
                      <div className="event-time">
                        <FiClock /> {cita.hora}
                      </div>
                      <div className="event-actions">
                        <button className="btn-text">
                          <FiEdit2 />
                        </button>
                      </div>
                    </div>
                    <div className="event-content">
                      <div className="event-patient">
                        <FiUser /> {cita.paciente}
                      </div>
                      <div className="event-type">{cita.tipo}</div>
                      <div className="event-notes">{cita.notas}</div>
                    </div>
                    <div className="event-footer">
                      <span className={`badge ${
                        cita.estado === 'confirmada' ? 'badge-success' :
                        cita.estado === 'pendiente' ? 'badge-warning' :
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

      {/* Lista de citas del día */}
      <div className="day-citas-list">
        <h3>Citas para hoy ({citasDelDia.length})</h3>
        
        {citasDelDia.length > 0 ? (
          <div className="citas-cards">
            {citasDelDia.map((cita) => (
              <div key={cita.id} className="cita-card">
                <div className="cita-card-header">
                  <div className="cita-time">
                    <FiClock /> {cita.hora}
                  </div>
                  <div className={`cita-status badge ${
                    cita.estado === 'confirmada' ? 'badge-success' :
                    cita.estado === 'pendiente' ? 'badge-warning' :
                    'badge-danger'
                  }`}>
                    {cita.estado}
                  </div>
                </div>
                
                <div className="cita-card-body">
                  <div className="cita-paciente">
                    <FiUser /> {cita.paciente}
                  </div>
                  <div className="cita-info">
                    <div className="cita-tipo">{cita.tipo}</div>
                    <div className="cita-duracion">Duración: {cita.duracion} min</div>
                  </div>
                  {cita.notas && (
                    <div className="cita-notas">{cita.notas}</div>
                  )}
                </div>
                
                <div className="cita-card-footer">
                  <button className="btn-text">Editar</button>
                  <button className="btn-text">Confirmar</button>
                  <button className="btn-text text-danger">Cancelar</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-citas">
            <div className="no-citas-icon">📅</div>
            <div>No hay citas programadas para hoy</div>
            <button className="btn-text">Agendar nueva cita</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CitasPage;