import React, { useState, useEffect } from 'react';
import { 
  FiCalendar, 
  FiClock, 
  FiUser, 
  FiPlus, 
  FiEdit2, 
  FiChevronLeft, 
  FiChevronRight,
  FiPhone,
  FiMail,
  FiRefreshCw,
  FiX
} from 'react-icons/fi';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

const CitasPage = () => {
  const [citas, setCitas] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('day');
  const [loading, setLoading] = useState(true);
  const [filterBecario, setFilterBecario] = useState('');
  const [becarios, setBecarios] = useState([]);
  const [selectedCita, setSelectedCita] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showNuevaCitaModal, setShowNuevaCitaModal] = useState(false);
  const [nuevaCitaData, setNuevaCitaData] = useState({
    paciente_nombre: '',
    paciente_apellido: '',
    paciente_telefono: '',
    paciente_email: '',
    fecha: '',
    hora: '',
    tipo_consulta: 'presencial',
    duracion: 50,
    notas: '',
    psicologo_id: '',
    becario_id: ''
  });
  const [error, setError] = useState('');

  const getToken = () => {
    return localStorage.getItem('token');
  };

  const formatDateForAPI = (date) => {
    return format(date, 'yyyy-MM-dd');
  };

  const fetchBecarios = async () => {
    try {
      const token = getToken();
      const response = await fetch('http://localhost:3000/api/users/becarios', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBecarios(data);
      }
    } catch (error) {
      console.error('Error al obtener becarios:', error);
    }
  };

  const fetchCitas = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const fecha = formatDateForAPI(selectedDate);
      
      let url = `http://localhost:3000/api/citas/citas-por-fecha?fecha=${fecha}`;
      
      if (filterBecario) {
        url += `&becario_id=${filterBecario}`;
      }
      
      console.log('🔍 Fetching citas from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // NORMALIZA LOS DATOS
        const citasNormalizadas = (data.data || []).map(cita => {
          return {
            ...cita,
            // Formatea la hora para quitar los segundos
            hora: cita.hora ? cita.hora.substring(0, 5) : '',
            // Usa duracion_minutos como duracion
            duracion: cita.duracion_minutos || cita.duracion || 50,
            // Usa motivo como notas
            notas: cita.motivo || cita.notas || '',
            // Asegura que paciente_nombre exista
            paciente_nombre: cita.paciente_nombre || `Paciente ${cita.id}`
          };
        });
        
        setCitas(citasNormalizadas);
      } else {
        console.error('Error al obtener citas');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCitasSemana = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      const startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const endDate = endOfWeek(selectedDate, { weekStartsOn: 1 });
      
      const promises = eachDayOfInterval({ start: startDate, end: endDate }).map(async (date) => {
        const fecha = formatDateForAPI(date);
        const response = await fetch(`http://localhost:3000/api/citas/citas-por-fecha?fecha=${fecha}${filterBecario ? `&becario_id=${filterBecario}` : ''}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return { fecha, citas: data.data || [] };
        }
        return { fecha, citas: [] };
      });
      
      const results = await Promise.all(promises);
      setCitas(results.flatMap(r => r.citas));
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBecarios();
    if (view === 'day') {
      fetchCitas();
    } else if (view === 'week') {
      fetchCitasSemana();
    }
  }, [selectedDate, view, filterBecario]);

  const goToPreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const goToNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const goToPreviousWeek = () => {
    setSelectedDate(prev => subDays(prev, 7));
  };

  const goToNextWeek = () => {
    setSelectedDate(prev => addDays(prev, 7));
  };

  const formatDateSpanish = (date) => {
    return format(date, "EEEE d 'de' MMMM, yyyy", { locale: es });
  };

  const generateHours = () => {
    const hours = [];
    for (let i = 9; i <= 20; i++) {
      hours.push(`${i}:00`);
      if (i !== 20) {
        hours.push(`${i}:30`);
      }
    }
    return hours;
  };


  const citasDelDia = citas.filter(cita => {
    console.log('🔍 Cita individual:', {
      id: cita.id,
      cita_fecha: cita.fecha,
      cita_fecha_raw: cita.fecha,
      selected_date_formatted: formatDateForAPI(selectedDate),
      cita_date_object: new Date(cita.fecha),
      cita_date_formatted: formatDateForAPI(new Date(cita.fecha))
    });
    
    const isSameDay1 = cita.fecha === formatDateForAPI(selectedDate);
    
    const citaDate = new Date(cita.fecha);
    const selectedDateObj = new Date(selectedDate);
    const isSameDay2 = formatDateForAPI(citaDate) === formatDateForAPI(selectedDateObj);
    
    // Método 3: Comparar año, mes y día
    const isSameDay3 = 
      citaDate.getFullYear() === selectedDateObj.getFullYear() &&
      citaDate.getMonth() === selectedDateObj.getMonth() &&
      citaDate.getDate() === selectedDateObj.getDate();
    
    
    return isSameDay1 || isSameDay2 || isSameDay3;
  });

  const handleConfirmCita = async (citaId) => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/api/citas/cita/${citaId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: 'confirmada' })
      });
      
      if (response.ok) {
        fetchCitas();
      }
    } catch (error) {
      console.error('Error al confirmar cita:', error);
    }
  };

  const handleCancelCita = async (citaId) => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/api/citas/cita/${citaId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          estado: 'cancelada',
          motivo_cancelacion: 'Cancelada por usuario' 
        })
      });
      
      if (response.ok) {
        fetchCitas();
      }
    } catch (error) {
      console.error('Error al cancelar cita:', error);
    }
  };

  const showCitaDetails = (cita) => {
    setSelectedCita(cita);
    setShowModal(true);
  };

  const handleNuevaCitaChange = (e) => {
    const { name, value } = e.target;
    setNuevaCitaData({
      ...nuevaCitaData,
      [name]: value
    });
  };

  const handleNuevaCitaSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!nuevaCitaData.paciente_nombre || !nuevaCitaData.paciente_apellido || !nuevaCitaData.fecha || !nuevaCitaData.hora) {
      setError('Por favor complete los campos requeridos: Nombre, Apellido, Fecha y Hora');
      return;
    }

    try {
      const token = getToken();
      
      const citaData = {
        paciente: {
          nombre: nuevaCitaData.paciente_nombre.trim(),
          apellido: nuevaCitaData.paciente_apellido.trim(),
          telefono: nuevaCitaData.paciente_telefono || '',
          email: nuevaCitaData.paciente_email || ''
        },
        fecha: nuevaCitaData.fecha,
        hora: nuevaCitaData.hora,
        tipo_consulta: nuevaCitaData.tipo_consulta,
        duracion: parseInt(nuevaCitaData.duracion),
        notas: nuevaCitaData.notas || '',
        becario_id: nuevaCitaData.becario_id || null
      };

      console.log('📤 Enviando datos de cita:', citaData);

      const response = await fetch('http://localhost:3000/api/citas/nueva', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(citaData)
      });

      const responseText = await response.text();
      console.log('📥 Respuesta del servidor:', responseText);

      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || 'Error al crear la cita');
        } catch (parseError) {
          throw new Error(responseText || 'Error al crear la cita');
        }
      }

      const data = JSON.parse(responseText);
      
      if (data.success) {
        setShowNuevaCitaModal(false);
        setNuevaCitaData({
          paciente_nombre: '',
          paciente_apellido: '',
          paciente_telefono: '',
          paciente_email: '',
          fecha: formatDateForAPI(selectedDate),
          hora: '',
          tipo_consulta: 'presencial',
          duracion: 50,
          notas: '',
          becario_id: ''
        });
        
        // Mostrar mensaje de éxito
        alert('✅ Cita creada exitosamente');
        
        // Recargar las citas
        if (view === 'day') {
          fetchCitas();
        } else {
          fetchCitasSemana();
        }
      } else {
        setError(data.message || 'Error al crear la cita');
      }
      
    } catch (error) {
      console.error('Error al crear cita:', error);
      setError(error.message || 'Error al crear la cita');
    }
  };

  const weekDays = view === 'week' ? 
    eachDayOfInterval({ 
      start: startOfWeek(selectedDate, { weekStartsOn: 1 }), 
      end: endOfWeek(selectedDate, { weekStartsOn: 1 }) 
    }) : [];

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
          <div className="filter-select">
            <select 
              value={filterBecario} 
              onChange={(e) => setFilterBecario(e.target.value)}
              className="form-select"
            >
              <option value="">Todos los becarios</option>
              {becarios.map(becario => (
                <option key={becario.id} value={becario.id}>
                  {becario.nombre} {becario.apellido}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-secondary" onClick={fetchCitas}>
            <FiRefreshCw /> Actualizar
          </button>
          <button className="btn-primary" onClick={() => setShowNuevaCitaModal(true)}>
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
          <button 
            className="btn-text"
            onClick={view === 'day' ? goToPreviousDay : goToPreviousWeek}
          >
            <FiChevronLeft /> {view === 'day' ? 'Ayer' : 'Sem. anterior'}
          </button>
          
          <div className="current-date">
            <h3>
              {view === 'day' 
                ? formatDateSpanish(selectedDate)
                : `Semana del ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'd MMM')} al ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'd MMM, yyyy')}`
              }
            </h3>
          </div>
          
          <button 
            className="btn-text"
            onClick={view === 'day' ? goToNextDay : goToNextWeek}
          >
            {view === 'day' ? 'Mañana' : 'Próx. semana'} <FiChevronRight />
          </button>
        </div>

        <div className="quick-actions">
          <button className="btn-secondary" onClick={goToToday}>
            Hoy
          </button>
        </div>
      </div>

      {view === 'day' ? (
        <div className="calendar-day-view">
          <div className="time-column">
            {generateHours().map((hour) => (
              <div key={hour} className="time-slot">
                <span className="time-label">{hour}</span>
              </div>
            ))}
          </div>

          <div className="events-column">
            {generateHours().map((hour) => {
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
                        cita.estado === 'completada' ? 'event-completed' :
                        cita.estado === 'programada' ? 'event-pending' :
                        'event-cancelled'
                      }`}
                      style={{ height: `${(cita.duracion / 30) * 50}px` }}
                      onClick={() => showCitaDetails(cita)}
                    >
                      <div className="event-header">
                        <div className="event-time">
                          <FiClock /> {cita.hora}
                        </div>
                        <div className="event-actions">
                          <button className="btn-text" onClick={(e) => {
                            e.stopPropagation();
                            showCitaDetails(cita);
                          }}>
                            <FiEdit2 />
                          </button>
                        </div>
                      </div>
                      <div className="event-content">
                        <div className="event-patient">
                          <FiUser /> {cita.paciente_nombre || 'Sin nombre'}
                        </div>
                        <div className="event-type">{cita.tipo_consulta}</div>
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
      ) : (
        <div className="calendar-week-view">
          <div className="week-header">
            <div className="time-header"></div>
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="day-header">
                <div className={`day-name ${isToday(day) ? 'today' : ''}`}>
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
                  const dayCitas = citas.filter(cita => {
                    const citaDate = new Date(cita.fecha);
                    return citaDate.toDateString() === day.toDateString() &&
                           cita.hora.startsWith(hour.split(':')[0]);
                  });
                  
                  return (
                    <div key={hour} className="hour-cell">
                      {dayCitas.map(cita => (
                        <div 
                          key={cita.id}
                          className={`week-event ${
                            cita.estado === 'confirmada' ? 'event-confirmed' :
                            'event-pending'
                          }`}
                          onClick={() => showCitaDetails(cita)}
                          title={`${cita.hora} - ${cita.paciente_nombre}`}
                        >
                          <div className="week-event-time">{cita.hora}</div>
                          <div className="week-event-patient">{cita.paciente_nombre}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="day-citas-list">
        <h3>
          Citas para {formatDateSpanish(selectedDate)} ({citasDelDia.length})
        </h3>
        
        {citasDelDia.length > 0 ? (
          <div className="citas-cards">
            {citasDelDia.map((cita) => (
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
                        <FiPhone /> {cita.paciente_telefono}
                      </div>
                    )}
                    
                    {cita.psicologo_nombre && (
                      <div className="cita-psicologo">
                        👨‍⚕️ {cita.psicologo_nombre}
                      </div>
                    )}
                    
                    {cita.becario_nombre && (
                      <div className="cita-becario">
                        👨‍🎓 {cita.becario_nombre}
                      </div>
                    )}
                  </div>
                  
                  {cita.notas && (
                    <div className="cita-notas">
                      <strong>Notas:</strong> {cita.notas}
                    </div>
                  )}
                </div>
                
                <div className="cita-card-footer">
                  <button 
                    className="btn-text"
                    onClick={() => showCitaDetails(cita)}
                  >
                    Detalles
                  </button>
                  
                  {cita.estado === 'programada' && (
                    <button 
                      className="btn-text text-success"
                      onClick={() => handleConfirmCita(cita.id)}
                    >
                      Confirmar
                    </button>
                  )}
                  
                  {(cita.estado === 'programada' || cita.estado === 'confirmada') && (
                    <button 
                      className="btn-text text-danger"
                      onClick={() => handleCancelCita(cita.id)}
                    >
                      Cancelar
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
            <button className="btn-text" onClick={() => setShowNuevaCitaModal(true)}>Agendar nueva cita</button>
          </div>
        )}
      </div>

      {showModal && selectedCita && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Detalles de la Cita</h2>
              <button className="btn-text" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="detail-row">
                <strong>Paciente:</strong>
                <span>{selectedCita.paciente_nombre}</span>
              </div>
              
              <div className="detail-row">
                <strong>Fecha y hora:</strong>
                <span>{selectedCita.fecha} {selectedCita.hora}</span>
              </div>
              
              <div className="detail-row">
                <strong>Duración:</strong>
                <span>{selectedCita.duracion || 50} minutos</span>
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
              
              {selectedCita.psicologo_nombre && (
                <div className="detail-row">
                  <strong>Psicólogo:</strong>
                  <span>{selectedCita.psicologo_nombre}</span>
                </div>
              )}
              
              {selectedCita.becario_nombre && (
                <div className="detail-row">
                  <strong>Becario:</strong>
                  <span>{selectedCita.becario_nombre}</span>
                </div>
              )}
              
              {selectedCita.paciente_telefono && (
                <div className="detail-row">
                  <strong>Teléfono:</strong>
                  <span>{selectedCita.paciente_telefono}</span>
                </div>
              )}
              
              {selectedCita.notas && (
                <div className="detail-row notes">
                  <strong>Notas:</strong>
                  <p>{selectedCita.notas}</p>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Cerrar
              </button>
              <button className="btn-primary">
                <FiEdit2 /> Editar Cita
              </button>
            </div>
          </div>
        </div>
      )}

      {showNuevaCitaModal && (
      <div className="modal-overlay">
        <div className="modal-container">
          <div className="modal-header">
            <h2 className="modal-title">Agendar Nueva Cita</h2>
            <button 
              className="modal-close"
              onClick={() => {
                setShowNuevaCitaModal(false);
                setError('');
              }}
            >
              ×
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <form onSubmit={handleNuevaCitaSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <input 
                  type="text" 
                  name="paciente_nombre" 
                  placeholder="Nombre del paciente"
                  value={nuevaCitaData.paciente_nombre}
                  onChange={handleNuevaCitaChange}
                  className="input-field"
                  required
                />
              </div>
              
              <div className="form-group">
                <input 
                  type="text" 
                  name="paciente_apellido" 
                  placeholder="Apellido del paciente"
                  value={nuevaCitaData.paciente_apellido}
                  onChange={handleNuevaCitaChange}
                  className="input-field"
                  required
                />
              </div>
              
              <div className="form-group">
                <input 
                  type="tel" 
                  name="paciente_telefono" 
                  placeholder="Teléfono"
                  value={nuevaCitaData.paciente_telefono}
                  onChange={handleNuevaCitaChange}
                  className="input-field"
                />
              </div>
              
              <div className="form-group">
                <input 
                  type="email" 
                  name="paciente_email" 
                  placeholder="Email"
                  value={nuevaCitaData.paciente_email}
                  onChange={handleNuevaCitaChange}
                  className="input-field"
                />
              </div>
              
              <div className="form-group">
                <input 
                  type="date" 
                  name="fecha" 
                  value={nuevaCitaData.fecha || formatDateForAPI(selectedDate)}
                  onChange={handleNuevaCitaChange}
                  className="input-field"
                  required
                />
              </div>
              
              <div className="form-group">
                <select
                  name="hora"
                  value={nuevaCitaData.hora}
                  onChange={handleNuevaCitaChange}
                  className="select-field"
                  required
                >
                  <option value="">Seleccione hora</option>
                  {generateHours().map(hour => (
                    <option key={hour} value={hour}>{hour}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <select
                  name="tipo_consulta"
                  value={nuevaCitaData.tipo_consulta}
                  onChange={handleNuevaCitaChange}
                  className="select-field"
                >
                  <option value="presencial">Presencial</option>
                  <option value="virtual">Virtual</option>
                </select>
              </div>
              
              <div className="form-group">
                <select
                  name="duracion"
                  value={nuevaCitaData.duracion}
                  onChange={handleNuevaCitaChange}
                  className="select-field"
                >
                  <option value="30">30 minutos</option>
                  <option value="50">50 minutos</option>
                  <option value="60">60 minutos</option>
                  <option value="90">90 minutos</option>
                </select>
              </div>
              
              <div className="form-group">
                <select
                  name="becario_id"
                  value={nuevaCitaData.becario_id}
                  onChange={handleNuevaCitaChange}
                  className="select-field"
                >
                  <option value="">Sin becario asignado</option>
                  {becarios.map(becario => (
                    <option key={becario.id} value={becario.id}>
                      {becario.nombre} {becario.apellido}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <textarea 
                  name="notas" 
                  placeholder="Notas adicionales"
                  value={nuevaCitaData.notas}
                  onChange={handleNuevaCitaChange}
                  className="textarea-field"
                  rows="3"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                type="submit"
                className="btn-primary"
              >
                <FiPlus /> Agendar Cita
              </button>
              <button 
                type="button"
                onClick={() => {
                  setShowNuevaCitaModal(false);
                  setError('');
                }}
                className="btn-danger"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </div>
  );
};

export default CitasPage;