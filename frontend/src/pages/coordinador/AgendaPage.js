import React, { useState, useEffect } from 'react';
import { 
  FiCalendar, FiClock, FiUsers, FiFilter, 
  FiChevronLeft, FiChevronRight, FiRefreshCw,
  FiUser, FiSearch, FiEye, FiEyeOff
} from 'react-icons/fi';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import './coordinador.css';

const CoordinadorAgenda = () => {
  const [citas, setCitas] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('week');
  const [loading, setLoading] = useState(true);
  const [filterPsicologo, setFilterPsicologo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [psicologos, setPsicologos] = useState([]);
  const [showDetalles, setShowDetalles] = useState(false);
  const [selectedCita, setSelectedCita] = useState(null);
  const [mostrarTodas, setMostrarTodas] = useState(true);

  useEffect(() => {
    fetchData();
    }, [selectedDate, view]);

  const fetchData = async () => {
    try {
        setLoading(true);
        
        // Primero, definir los psicólogos
        const psicologosData = [
        { id: 1, nombre: 'Lic. Luis Fernández', color: 'var(--grnb)', especialidad: 'Terapia Cognitivo-Conductual' },
        { id: 2, nombre: 'Lic. Laura Gutiérrez', color: 'var(--blu)', especialidad: 'Psicología Clínica' }
        ];
        
        setPsicologos(psicologosData);

        // Generar citas de ejemplo para la semana
        const citasSemana = [];
        const startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekDays = eachDayOfInterval({ 
        start: startDate, 
        end: endOfWeek(startDate, { weekStartsOn: 1 }) 
        });
        
        weekDays.forEach((day, dayIndex) => {
        const psicologoId = dayIndex % 2 === 0 ? 1 : 2;
        const psicologo = psicologosData.find(p => p.id === psicologoId);
        
        if (!psicologo) return; // Añadir validación
        
        // Agregar 3-5 citas por día
        const citasCount = 3 + (dayIndex % 3);
        
        for (let i = 0; i < citasCount; i++) {
            const hora = 9 + (i * 2) + (dayIndex % 2);
            citasSemana.push({
            id: `${dayIndex}-${i}`,
            fecha: format(day, 'yyyy-MM-dd'),
            hora: `${hora}:00`,
            duracion: 50,
            paciente_nombre: `Paciente ${dayIndex + 1}${String.fromCharCode(65 + i)}`,
            psicologo_id: psicologoId,
            psicologo_nombre: psicologo.nombre,
            psicologo_color: psicologo.color,
            tipo_consulta: i % 2 === 0 ? 'presencial' : 'virtual',
            estado: i === 0 ? 'confirmada' : i === 1 ? 'programada' : 'completada',
            becario_nombre: i % 2 === 0 ? 'Juan Pérez' : null
            });
        }
        });

        setCitas(citasSemana);
        setLoading(false);
    } catch (error) {
        console.error('Error cargando agenda:', error);
        setLoading(false);
    }
    };

  const filteredCitas = citas.filter(cita => {
    const matchesPsicologo = !filterPsicologo || cita.psicologo_id == filterPsicologo;
    const matchesEstado = !filterEstado || cita.estado === filterEstado;
    return matchesPsicologo && matchesEstado;
    });

  const goToPrevious = () => {
    setSelectedDate(prev => subDays(prev, view === 'day' ? 1 : 7));
  };

  const goToNext = () => {
    setSelectedDate(prev => addDays(prev, view === 'day' ? 1 : 7));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const formatDateSpanish = (date) => {
    return format(date, "EEEE d 'de' MMMM, yyyy", { locale: es });
  };

  const getWeekRange = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return `Semana del ${format(start, 'd MMM')} al ${format(end, 'd MMM, yyyy')}`;
  };

  const generateHours = () => {
    const hours = [];
    for (let i = 9; i <= 20; i++) {
      hours.push(`${i}:00`);
    }
    return hours;
  };

  const getCitasPorDiaYHora = (fecha, hora) => {
    try {
        const fechaStr = format(new Date(fecha), 'yyyy-MM-dd');
        const horaNum = hora.split(':')[0];
        
        return filteredCitas.filter(cita => 
        cita.fecha === fechaStr &&
        cita.hora.startsWith(horaNum)
        );
    } catch (error) {
        console.error('Error filtrando citas:', error);
        return [];
    }
    };

  const showCitaDetalles = (cita) => {
    setSelectedCita(cita);
    setShowDetalles(true);
  };

  const weekDays = view === 'week' ? 
    eachDayOfInterval({ 
      start: startOfWeek(selectedDate, { weekStartsOn: 1 }), 
      end: endOfWeek(selectedDate, { weekStartsOn: 1 }) 
    }) : [selectedDate];

  if (loading) {
    return (
        <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Cargando agenda global...</div>
        </div>
    );
    }

    // También puedes añadir una verificación adicional
    if (!psicologos || psicologos.length === 0) {
    return (
        <div className="empty-state">
        <h3>No hay psicólogos registrados</h3>
        <p>Por favor, registra psicólogos en el sistema primero.</p>
        </div>
    );
    }

  return (
    <div className="citas-page">
      <div className="page-header">
        <div>
          <h1>Agenda Global</h1>
          <p>Vista completa de todas las citas del consultorio</p>
        </div>
        <button className="btn-secondary" onClick={fetchData}>
          <FiRefreshCw /> Actualizar
        </button>
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
          <button className="btn-text" onClick={goToPrevious}>
            <FiChevronLeft /> {view === 'day' ? 'Ayer' : 'Sem. anterior'}
          </button>
          
          <div className="current-date">
            <h3>
              {view === 'day' 
                ? formatDateSpanish(selectedDate)
                : getWeekRange()
              }
            </h3>
            <div className="text-small">
              Total citas: {filteredCitas.length}
            </div>
          </div>
          
          <button className="btn-text" onClick={goToNext}>
            {view === 'day' ? 'Mañana' : 'Próx. semana'} <FiChevronRight />
          </button>
        </div>

        <div className="quick-actions">
          <button className="btn-secondary" onClick={goToToday}>
            Hoy
          </button>
          <button 
            className={`btn-text ${mostrarTodas ? 'text-success' : ''}`}
            onClick={() => setMostrarTodas(!mostrarTodas)}
          >
            {mostrarTodas ? <FiEye /> : <FiEyeOff />}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-container mb-20">
        <div className="grid-3 gap-20">
          <div className="form-group">
            <label>Filtrar por psicólogo</label>
            <select 
              value={filterPsicologo} 
              onChange={(e) => setFilterPsicologo(e.target.value)}
              className="select-field"
            >
              <option value="">Todos los psicólogos</option>
              {psicologos.map(psicologo => (
                <option key={psicologo.id} value={psicologo.id}>
                  {psicologo.nombre}
                </option>
              ))}
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
          
          <div className="form-group">
            <label>Filtrar por tipo</label>
            <select className="select-field">
              <option value="">Todos los tipos</option>
              <option value="presencial">Presencial</option>
              <option value="virtual">Virtual</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calendario Semanal */}
      <div className="calendar-week-view" style={{ height: '600px' }}>
        <div className="week-header">
          <div className="time-header"></div>
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="day-header">
              <div className="day-name">
                {format(day, 'EEE', { locale: es })}
              </div>
              <div className="day-number">
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
        
        <div className="week-body">
          <div className="time-column">
            {generateHours().map(hour => (
              <div key={hour} className="time-slot">{hour}</div>
            ))}
          </div>
          
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="day-column">
              {generateHours().map(hour => {
                const citasHora = getCitasPorDiaYHora(day, hour);
                
                return (
                  <div key={hour} className="hour-cell">
                    {citasHora.slice(0, mostrarTodas ? citasHora.length : 1).map((cita, index) => (
                      <div 
                        key={cita.id}
                        className="week-event"
                        style={{ 
                          backgroundColor: cita.psicologo_color,
                          opacity: 0.8,
                          height: `${100 / (mostrarTodas ? Math.max(citasHora.length, 1) : 1)}%`,
                          top: `${(index / (mostrarTodas ? citasHora.length : 1)) * 100}%`
                        }}
                        onClick={() => showCitaDetalles(cita)}
                        title={`${cita.hora} - ${cita.paciente_nombre} (${cita.psicologo_nombre})`}
                      >
                        <div className="week-event-time">{cita.hora}</div>
                        <div className="week-event-patient">{cita.paciente_nombre}</div>
                        <div className="week-event-psicologo">
                          {cita.psicologo_nombre.split(' ')[1]}
                        </div>
                      </div>
                    ))}
                    {citasHora.length > 1 && !mostrarTodas && (
                      <div className="week-event-more">
                        +{citasHora.length - 1} más
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Resumen por Psicólogo */}
      <div className="grid-3 mt-20">
        {psicologos.map(psicologo => {
          const citasPsicologo = filteredCitas.filter(c => c.psicologo_id === psicologo.id);
          const citasHoy = citasPsicologo.filter(c => c.fecha === format(new Date(), 'yyyy-MM-dd')).length;
          
          return (
            <div key={psicologo.id} className="card">
              <div className="flex-row align-center gap-10 mb-10">
                <div 
                  className="avatar" 
                  style={{ background: psicologo.color }}
                >
                  {psicologo.nombre.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4>{psicologo.nombre}</h4>
                  <p className="text-small">{psicologo.especialidad || 'Psicólogo'}</p>
                </div>
              </div>
              
              <div className="grid-2 gap-10">
                <div>
                  <div className="text-small">Citas totales</div>
                  <div className="font-bold">{citasPsicologo.length}</div>
                </div>
                <div>
                  <div className="text-small">Citas hoy</div>
                  <div className="font-bold">{citasHoy}</div>
                </div>
                <div>
                  <div className="text-small">Confirmadas</div>
                  <div className="font-bold">{citasPsicologo.filter(c => c.estado === 'confirmada').length}</div>
                </div>
                <div>
                  <div className="text-small">Con becario</div>
                  <div className="font-bold">{citasPsicologo.filter(c => c.becario_nombre).length}</div>
                </div>
              </div>
            </div>
          );
        })}
        
        <div className="card">
          <h4>Acciones Rápidas</h4>
          <div className="flex-col gap-10 mt-10">
            <button className="btn-primary w-100">
              Ver Reporte Semanal
            </button>
            <button className="btn-secondary w-100">
              Exportar Agenda
            </button>
            <button className="btn-warning w-100">
              Revisar Conflictos
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Detalles */}
      {showDetalles && selectedCita && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Detalles de Cita</h3>
              <button className="modal-close" onClick={() => setShowDetalles(false)}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="detail-row">
                <strong>Paciente:</strong>
                <span>{selectedCita.paciente_nombre}</span>
              </div>
              
              <div className="detail-row">
                <strong>Fecha y hora:</strong>
                <span>{selectedCita.fecha} {selectedCita.hora}</span>
              </div>
              
              <div className="detail-row">
                <strong>Psicólogo:</strong>
                <span>{selectedCita.psicologo_nombre}</span>
              </div>
              
              <div className="detail-row">
                <strong>Tipo:</strong>
                <span>{selectedCita.tipo_consulta === 'presencial' ? 'Presencial' : 'Virtual'}</span>
              </div>
              
              <div className="detail-row">
                <strong>Estado:</strong>
                <span className={`badge ${
                  selectedCita.estado === 'confirmada' ? 'badge-success' :
                  selectedCita.estado === 'completada' ? 'badge-primary' :
                  selectedCita.estado === 'programada' ? 'badge-warning' :
                  'badge-danger'
                }`}>
                  {selectedCita.estado}
                </span>
              </div>
              
              {selectedCita.becario_nombre && (
                <div className="detail-row">
                  <strong>Becario asignado:</strong>
                  <span>{selectedCita.becario_nombre}</span>
                </div>
              )}
              
              <div className="detail-row">
                <strong>Duración:</strong>
                <span>{selectedCita.duracion} minutos</span>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDetalles(false)}>
                Cerrar
              </button>
              <button className="btn-primary">
                Ver Expediente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinadorAgenda;