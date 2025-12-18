// frontend/src/pages/coordinador/AgendaPage.js
import React, { useState, useEffect } from 'react';
import { 
  FiCalendar, FiClock, FiUsers, FiFilter, 
  FiChevronLeft, FiChevronRight, FiRefreshCw,
  FiUser, FiEye, FiEyeOff, FiMail,
  FiPhone, FiVideo, FiMapPin, FiEdit2,
  FiDownload, FiBarChart2, FiCheckCircle, FiXCircle, FiAlertCircle,
  FiSearch, FiUserCheck, FiSettings, FiArchive
} from 'react-icons/fi';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import ApiService from '../../services/api';
import './coordinador.css';
import notifications from '../../utils/notifications';
import confirmations from '../../utils/confirmations';

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
  const [estadisticas, setEstadisticas] = useState(null);
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [showModalDisponibilidad, setShowModalDisponibilidad] = useState(false);
  const [pacientes, setPacientes] = useState([]);
  const [searchPaciente, setSearchPaciente] = useState('');
  const [filteredPacientes, setFilteredPacientes] = useState([]);
  
  const [filtrosAvanzados, setFiltrosAvanzados] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    paciente_id: '',
    tipo_consulta: ''
  });

  // Colores fijos para psicólogos
  const coloresPsicologos = ['#29ce9b', '#1F85BA', '#ffa631', '#37B69C', '#fa3144'];

  useEffect(() => {
    fetchPsicologos();
    fetchPacientes();
  }, []);

  useEffect(() => {
    fetchAgenda();
  }, [selectedDate, view, filterPsicologo, filterEstado, filtrosAvanzados]);

  const fetchPacientes = async () => {
    try {
      const response = await ApiService.get('/pacientes?activo=true&limit=100');
      if (response.success) {
        setPacientes(response.data);
      }
    } catch (error) {
      console.error('Error cargando pacientes:', error);
    }
  };

  const fetchPsicologos = async () => {
    try {
      const response = await ApiService.get('/users?rol=psicologo');
      if (response.success) {
        const psicologosData = response.data.map((psicologo, index) => ({
          id: psicologo.id,
          nombre: `${psicologo.nombre} ${psicologo.apellido}`,
          color: coloresPsicologos[index % coloresPsicologos.length],
          especialidad: psicologo.especialidad || 'Psicología General',
          email: psicologo.email
        }));
        setPsicologos(psicologosData);
      }
    } catch (error) {
      console.error('Error cargando psicólogos:', error);
    }
  };

  const fetchAgenda = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      
      // Si estamos en vista semanal, usar el rango de la semana
      if (view === 'week') {
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
        params.append('fecha_inicio', format(start, 'yyyy-MM-dd'));
        params.append('fecha_fin', format(end, 'yyyy-MM-dd'));
      } else {
        // Vista diaria
        params.append('fecha_inicio', format(selectedDate, 'yyyy-MM-dd'));
        params.append('fecha_fin', format(selectedDate, 'yyyy-MM-dd'));
      }
      
      // Aplicar filtros
      if (filterPsicologo) {
        params.append('psicologo_id', filterPsicologo);
      }
      
      if (filterEstado) {
        params.append('estado', filterEstado);
      }
      
      // Filtros avanzados
      if (filtrosAvanzados.paciente_id) {
        params.append('paciente_id', filtrosAvanzados.paciente_id);
      }
      
      if (filtrosAvanzados.tipo_consulta) {
        params.append('tipo_consulta', filtrosAvanzados.tipo_consulta);
      }
      
      // Llamar al endpoint de agenda global
      const response = await ApiService.get(`/agenda/global?${params.toString()}`);
      
      if (response.success) {
        // Transformar los datos para que coincidan con la estructura esperada
        const citasTransformadas = response.data.citas.map(cita => {
          const psicologo = psicologos.find(p => p.id === cita.psicologo_id) || {
            nombre: cita.Psicologo ? `${cita.Psicologo.nombre} ${cita.Psicologo.apellido}` : 'No asignado',
            color: coloresPsicologos[cita.psicologo_id % coloresPsicologos.length]
          };
          
          return {
            id: cita.id,
            fecha: cita.fecha,
            hora: cita.hora || '00:00',
            duracion: cita.duracion || 50,
            paciente_nombre: cita.Paciente ? 
              `${cita.Paciente.nombre} ${cita.Paciente.apellido}` : 'Paciente',
            paciente_id: cita.paciente_id,
            psicologo_id: cita.psicologo_id,
            psicologo_nombre: psicologo.nombre,
            psicologo_color: psicologo.color,
            tipo_consulta: cita.tipo_consulta,
            estado: cita.estado,
            becario_nombre: cita.Becario ? 
              `${cita.Becario.nombre} ${cita.Becario.apellido}` : null,
            becario_id: cita.becario_id,
            notas: cita.notas,
            telefono: cita.Paciente?.telefono,
            email: cita.Paciente?.email
          };
        });
        
        setCitas(citasTransformadas);
        setEstadisticas(response.data.estadisticas);
      }
      
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

  // Función para buscar pacientes
  const buscarPaciente = (searchTerm) => {
    setSearchPaciente(searchTerm);
    if (searchTerm.length > 1) {
      const filtered = pacientes.filter(paciente =>
        `${paciente.nombre} ${paciente.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paciente.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPacientes(filtered.slice(0, 5));
    } else {
      setFilteredPacientes([]);
    }
  };

  const seleccionarPaciente = (paciente) => {
    setSearchPaciente(`${paciente.nombre} ${paciente.apellido}`);
    setFiltrosAvanzados(prev => ({
      ...prev,
      paciente_id: paciente.id
    }));
    setFilteredPacientes([]);
  };

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

  const handleFiltroAvanzado = (key, value) => {
    setFiltrosAvanzados(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFiltros = () => {
    setFilterPsicologo('');
    setFilterEstado('');
    setSearchPaciente('');
    setFiltrosAvanzados({
      fecha_inicio: '',
      fecha_fin: '',
      paciente_id: '',
      tipo_consulta: ''
    });
  };

  const exportarAgenda = async () => {
      try {
          setLoading(true);
          
          const fechaInicio = filtrosAvanzados.fecha_inicio || format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
          const fechaFin = filtrosAvanzados.fecha_fin || format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
          
          // Crear datos para exportar
          const datosExportacion = {
              fecha_inicio: fechaInicio,
              fecha_fin: fechaFin,
              psicologo_id: filterPsicologo || null,
              tipo_consulta: filtrosAvanzados.tipo_consulta || null
          };

          const token = localStorage.getItem('token');
          
          const response = await fetch('http://localhost:3000/api/reportes/exportar-agenda-csv', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(datosExportacion)
          });

          if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Error ${response.status}: ${errorText}`);
          }

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          
          let filename = `agenda_${fechaInicio}_a_${fechaFin}.csv`;
          const contentDisposition = response.headers.get('content-disposition');
          if (contentDisposition) {
              const match = contentDisposition.match(/filename="(.+?)"/);
              if (match) {
                  filename = match[1];
              }
          }
          
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          notifications.success(' Agenda exportada exitosamente como CSV');
          
      } catch (error) {
          console.error('Error exportando agenda:', error);
          notifications.error(' Error al exportar agenda: ' + error.message);
      } finally {
          setLoading(false);
      }
  };

  const exportarDisponibilidad = async () => {
      try {
          const fecha = format(new Date(), 'yyyy-MM-dd');
          const response = await ApiService.post('/reportes/exportar-disponibilidad-csv', { fecha });
          
          const blob = new Blob([response], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          
          link.setAttribute('href', url);
          link.setAttribute('download', `disponibilidad_${fecha}.csv`);
          document.body.appendChild(link);
          link.click();
          
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          notifications.success(' Disponibilidad exportada exitosamente');
          
      } catch (error) {
          console.error('Error exportando disponibilidad:', error);
          notifications.error(' Error al exportar disponibilidad');
      }
  };

  const verHoy = () => {
      const hoy = format(new Date(), 'yyyy-MM-dd');
      setFiltrosAvanzados({
          fecha_inicio: hoy,
          fecha_fin: hoy,
          paciente_id: '',
          tipo_consulta: ''
      });
      setSelectedDate(new Date());
  };

  const revisarConflictos = async () => {
      try {
          setLoading(true);
          
          const fechaInicio = filtrosAvanzados.fecha_inicio || format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
          const fechaFin = filtrosAvanzados.fecha_fin || format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
          
          const response = await ApiService.post('/reportes/reporte-conflictos', {
              fecha_inicio: fechaInicio,
              fecha_fin: fechaFin
          });
          
          if (response.success && response.data.conflictos.length > 0) {
              notifications.warning(`Se encontraron ${response.data.conflictos.length} conflictos de horario`);
          } else {
              notifications.success(' No se encontraron conflictos de horario');
          }
          
      } catch (error) {
          console.error('Error revisando conflictos:', error);
          notifications.error(' Error al revisar conflictos');
      } finally {
          setLoading(false);
      }
  };

  const fetchDisponibilidad = async () => {
    try {
        const fecha = format(new Date(), 'yyyy-MM-dd');
        const response = await ApiService.get(`/agenda/disponibilidad-profesionales?fecha=${fecha}`);
        
        if (response.success) {
            setDisponibilidad(response.data.disponibilidad);
        } else {
            setDisponibilidad([]);
        }
    } catch (error) {
        console.error('Error cargando disponibilidad:', error);
        setDisponibilidad([]);
    }
  };

  // Llama a fetchDisponibilidad en useEffect
  useEffect(() => {
    const loadData = async () => {
        await fetchPsicologos();
        await fetchPacientes();
        await fetchAgenda();
        await fetchDisponibilidad();
    };
    loadData();
  }, [selectedDate, view, filterPsicologo, filterEstado, filtrosAvanzados]);

  const weekDays = view === 'week' ? 
    eachDayOfInterval({ 
      start: startOfWeek(selectedDate, { weekStartsOn: 1 }), 
      end: endOfWeek(selectedDate, { weekStartsOn: 1 }) 
    }) : [selectedDate];

  if (loading && citas.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Cargando agenda global...</div>
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
        <div className="flex-row gap-10">
          <button className="btn-secondary" onClick={fetchAgenda}>
            <FiRefreshCw /> Actualizar
          </button>
          <button className="btn-primary" onClick={exportarAgenda}>
            <FiDownload /> Exportar Agenda
          </button>
        </div>
      </div>

      {/* Estadísticas rápidas - MEJORADO */}
      {estadisticas && (
        <div className="grid-2 mb-20" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="card card-primary-coord">
            <div className="flex-row align-center gap-15 mb-15">
              <div className="avatar" style={{ background: 'var(--blu)' }}>
                <FiBarChart2 size={24} />
              </div>
              <div>
                <h4>Resumen General</h4>
                <p className="text-small">Estadísticas del período</p>
              </div>
            </div>
            
            <div className="grid-2 gap-10">
              <div className="stat-box">
                <div className="stat-icon" style={{ color: 'var(--grnb)' }}>
                  <FiCalendar />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{estadisticas.total_citas || filteredCitas.length}</div>
                  <div className="stat-label">Total Citas</div>
                </div>
              </div>
              
              <div className="stat-box">
                <div className="stat-icon" style={{ color: 'var(--blu)' }}>
                  <FiCheckCircle />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{estadisticas.confirmadas || filteredCitas.filter(c => c.estado === 'confirmada').length}</div>
                  <div className="stat-label">Confirmadas</div>
                </div>
              </div>
              
              <div className="stat-box">
                <div className="stat-icon" style={{ color: 'var(--yy)' }}>
                  <FiUsers />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{estadisticas.psicologos_involucrados || psicologos.length}</div>
                  <div className="stat-label">Psicólogos</div>
                </div>
              </div>
              
              <div className="stat-box">
                <div className="stat-icon" style={{ color: 'var(--grnd)' }}>
                  <FiUser />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{estadisticas.pacientes_atendidos || new Set(filteredCitas.map(c => c.paciente_id)).size}</div>
                  <div className="stat-label">Pacientes</div>
                </div>
              </div>
            </div>
            
            <div className="mt-15 pt-15 border-top">
              <div className="flex-row justify-between">
                <span className="text-small">Programadas:</span>
                <span className="badge badge-warning">{estadisticas.programadas || filteredCitas.filter(c => c.estado === 'programada').length}</span>
              </div>
              <div className="flex-row justify-between mt-5">
                <span className="text-small">Completadas:</span>
                <span className="badge badge-success">{estadisticas.completadas || filteredCitas.filter(c => c.estado === 'completada').length}</span>
              </div>
            </div>
          </div>
          

          <div className="card card-secondary-coord">
            <div className="flex-row align-center gap-15 mb-15">
              <div className="avatar" style={{ background: 'var(--grnb)' }}>
                <FiUserCheck size={24} />
              </div>
              <div>
                <h4>Disponibilidad Hoy</h4>
                <p className="text-small">{format(new Date(), 'dd/MM/yyyy')}</p>
              </div>
            </div>
            
            <div className="flex-col gap-10 mt-10">
              {disponibilidad && disponibilidad.length > 0 ? (
                <>
                  {disponibilidad.slice(0, 3).map(profesional => {
                    const porcentaje = profesional.porcentaje_ocupacion || 
                      Math.round((profesional.citas_programadas / profesional.max_citas_dia) * 100);
                    
                    return (
                      <div key={profesional.id} className="flex-col gap-5">
                        <div className="flex-row justify-between align-center">
                          <span className="text-small font-bold">
                            {profesional.profesional.split(' ')[1] || profesional.profesional}
                          </span>
                          <span className={`badge ${
                            profesional.estado === 'disponible' ? 'badge-success' :
                            profesional.estado === 'limitado' ? 'badge-warning' :
                            'badge-danger'
                          }`}>
                            {profesional.citas_programadas}/{profesional.max_citas_dia}
                          </span>
                        </div>
                        <div className="progress-container">
                          <div 
                            className="progress-bar" 
                            style={{ 
                              width: `${porcentaje}%`,
                              background: porcentaje > 80 ? 'var(--rr)' : 
                                        porcentaje > 60 ? 'var(--yy)' : 'var(--grnb)'
                            }}
                          ></div>
                        </div>
                        {profesional.cupos_disponibles > 0 && (
                          <div className="text-small text-success flex-row align-center gap-5">
                            <FiCheckCircle size={12} />
                            {profesional.cupos_disponibles} cupo(s) disponible(s)
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {disponibilidad.length > 3 && (
                    <div className="text-center mt-10">
                      <button 
                        className="btn-text btn-text-modal"
                        onClick={() => setShowModalDisponibilidad(true)}
                        style={{ 
                          fontSize: '12px',
                          padding: '6px 12px'
                        }}
                      >
                        Ver todos ({disponibilidad.length} profesionales)
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-10">
                  <div className="loading-spinner"></div>
                  <div className="text-small mt-10">Cargando disponibilidad...</div>
                </div>
              )}
            </div>
          </div>
          
          
        </div>
      )}

      <div className="calendar-controls">
        <div className="view-selector">
          <button 
            className={`btn-header ${view === 'day' ? 'active' : ''}`}
            onClick={() => setView('day')}
          >
            <FiCalendar /> Día
          </button>
          <button 
            className={`btn-header ${view === 'week' ? 'active' : ''}`}
            onClick={() => setView('week')}
          >
            <FiCalendar /> Semana
          </button>
        </div>

        <div className="date-navigation">
          <button className="btn-header" onClick={goToPrevious}>
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
              <FiClock className="mr-5" />
              Total citas: {filteredCitas.length}
            </div>
          </div>
          
          <button className="btn-header" onClick={goToNext}>
            {view === 'day' ? 'Mañana' : 'Próx. semana'} <FiChevronRight />
          </button>
        </div>

        <div className="quick-actions">
          <button className="btn-primary" onClick={goToToday}>
            Hoy
          </button>

        </div>
      </div>

      {/* Filtros - MEJORADO con alineación consistente */}
      <div className="filters-container mb-20">

        
        <div className="grid-3 gap-20 mt-15">
          <div className="form-group">
            <label className="form-label">
              <FiUser /> Psicólogo
            </label>
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
            <label className="form-label">
              <FiCheckCircle /> Estado
            </label>
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
            <label className="form-label">
              <FiVideo /> Tipo de Consulta
            </label>
            <select 
              value={filtrosAvanzados.tipo_consulta}
              onChange={(e) => handleFiltroAvanzado('tipo_consulta', e.target.value)}
              className="select-field"
            >
              <option value="">Todos los tipos</option>
              <option value="presencial">Presencial</option>
              <option value="virtual">Virtual</option>
            </select>
          </div>
        </div>
        
        {/* Filtros avanzados - MEJORADO */}
        <div className="grid-3 gap-20 mt-20">
          <div className="form-group">
            <label className="form-label">
              <FiCalendar /> Fecha Inicio
            </label>
            <input
              type="date"
              value={filtrosAvanzados.fecha_inicio}
              onChange={(e) => handleFiltroAvanzado('fecha_inicio', e.target.value)}
              className="input-field"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">
              <FiCalendar /> Fecha Fin
            </label>
            <input
              type="date"
              value={filtrosAvanzados.fecha_fin}
              onChange={(e) => handleFiltroAvanzado('fecha_fin', e.target.value)}
              className="input-field"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">
              <FiSearch /> Buscar Paciente
            </label>
            <div className="search-box-wrapper">
              <input
                type="text"
                value={searchPaciente}
                onChange={(e) => buscarPaciente(e.target.value)}
                className="input-field"
                placeholder="Nombre o apellido del paciente"
              />
              {filteredPacientes.length > 0 && (
                <div className="search-results">
                  {filteredPacientes.map(paciente => (
                    <div 
                      key={paciente.id}
                      className="search-result-item"
                      onClick={() => seleccionarPaciente(paciente)}
                    >
                      <div className="search-result-name">
                        {paciente.nombre} {paciente.apellido}
                      </div>
                      {paciente.email && (
                        <div className="search-result-email">{paciente.email}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calendario Semanal/Dia */}
      <div className="calendar-week-view" style={{ minHeight: '600px' }}>
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
              <div className="text-small">
                {filteredCitas.filter(c => c.fecha === format(day, 'yyyy-MM-dd')).length} citas
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
                          opacity: 0.85,
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
                        <div className="week-event-type">
                          {cita.tipo_consulta === 'virtual' ? <FiVideo /> : <FiMapPin />}
                        </div>
                      </div>
                    ))}
                    {citasHora.length > 1 && !mostrarTodas && (
                      <div 
                        className="week-event-more"
                        onClick={() => setMostrarTodas(true)}
                      >
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
      <div className="grid-3 mt-30">
        {psicologos.slice(0, 3).map(psicologo => {
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
                <div className="flex-1">
                  <h4>{psicologo.nombre}</h4>
                  <p className="text-small">{psicologo.especialidad}</p>
                  <p className="text-small">
                    <FiMail /> {psicologo.email}
                  </p>
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
      </div>

      {/* Modal de Detalles de Cita */}
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
              
              {selectedCita.telefono && (
                <div className="detail-row">
                  <strong>Teléfono:</strong>
                  <span><FiPhone /> {selectedCita.telefono}</span>
                </div>
              )}
              
              <div className="detail-row">
                <strong>Fecha y hora:</strong>
                <span>{selectedCita.fecha} {selectedCita.hora}</span>
              </div>
              
              <div className="detail-row">
                <strong>Psicólogo:</strong>
                <div className="flex-row align-center gap-5">
                  <div 
                    className="avatar-small" 
                    style={{ background: selectedCita.psicologo_color }}
                  >
                    {selectedCita.psicologo_nombre.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span>{selectedCita.psicologo_nombre}</span>
                </div>
              </div>
              
              <div className="detail-row">
                <strong>Tipo:</strong>
                <span className="flex-row align-center gap-5">
                  {selectedCita.tipo_consulta === 'virtual' ? <FiVideo /> : <FiMapPin />}
                  {selectedCita.tipo_consulta === 'presencial' ? 'Presencial' : 'Virtual'}
                </span>
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
              
              {selectedCita.notas && (
                <div className="detail-row notes">
                  <strong>Notas:</strong>
                  <p>{selectedCita.notas}</p>
                </div>
              )}
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

      {/* Modal de Disponibilidad Completa - MÁS ANCHO */}
      {showModalDisponibilidad && (
        <div className="modal-overlay">
          <div className="modal-container modal-extra-large">
            <div className="modal-header">
              <div className="flex-row align-center gap-15">
                <div className="avatar" style={{ background: 'var(--grnb)' }}>
                  <FiUserCheck size={24} />
                </div>
                <div>
                  <h3>Disponibilidad Completa</h3>
                  <p className="text-small">{format(new Date(), 'EEEE dd/MM/yyyy', { locale: es })}</p>
                </div>
              </div>
              <button 
                className="modal-close" 
                onClick={() => setShowModalDisponibilidad(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              {/* Estadísticas rápidas */}
              {disponibilidad && disponibilidad.length > 0 && (
                <div className="modal-stats-grid">
                  <div className="stat-item">
                    <div className="stat-value">{disponibilidad.length}</div>
                    <div className="stat-label">Profesionales</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value text-success">
                      {disponibilidad.filter(p => p.estado === 'disponible').length}
                    </div>
                    <div className="stat-label">Disponibles</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value text-warning">
                      {disponibilidad.filter(p => p.estado === 'limitado').length}
                    </div>
                    <div className="stat-label">Limitados</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value text-danger">
                      {disponibilidad.filter(p => p.estado === 'completo').length}
                    </div>
                    <div className="stat-label">Completos</div>
                  </div>
                </div>
              )}
              
              <div className="scrollable" style={{ maxHeight: '60vh' }}>
                {disponibilidad && disponibilidad.length > 0 ? (
                  <div className="table-container">
                    <table className="data-table wide-table">
                      <thead>
                        <tr>
                          <th style={{ width: '25%' }}>Profesional</th>
                          <th style={{ width: '10%' }}>Rol</th>
                          <th style={{ width: '20%' }}>Especialidad</th>
                          <th style={{ width: '15%' }}>Horario</th>
                          <th style={{ width: '15%' }}>Citas / Cupos</th>
                          <th style={{ width: '15%' }}>Disponibilidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {disponibilidad.map(profesional => {
                          const porcentaje = profesional.porcentaje_ocupacion || 
                            Math.round((profesional.citas_programadas / profesional.max_citas_dia) * 100);
                          
                          return (
                            <tr key={profesional.id}>
                              <td>
                                <div className="flex-row align-center gap-10">
                                  <div className="avatar-small">
                                    {profesional.profesional.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <div>
                                    <div className="font-bold">{profesional.profesional}</div>
                                    <div className="text-small">{profesional.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className={`badge ${
                                  profesional.rol === 'psicologo' ? 'badge-info' : 'badge-warning'
                                }`}>
                                  {profesional.rol}
                                </span>
                              </td>
                              <td>
                                <div className="text-small">{profesional.especialidad}</div>
                              </td>
                              <td>
                                <div className="text-small">
                                  {profesional.hora_inicio} - {profesional.hora_fin}
                                </div>
                              </td>
                              <td>
                                <div className="flex-col gap-5">
                                  <div className="flex-row justify-between">
                                    <span className="text-small">Citas:</span>
                                    <span className="font-bold">{profesional.citas_programadas}/{profesional.max_citas_dia}</span>
                                  </div>
                                  <div className="flex-row justify-between">
                                    <span className="text-small">Cupos:</span>
                                    <span className={`font-bold ${
                                      profesional.cupos_disponibles > 0 ? 'text-success' : 'text-danger'
                                    }`}>
                                      {profesional.cupos_disponibles}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="flex-col gap-5">
                                  <div className="progress-container">
                                    <div 
                                      className="progress-bar" 
                                      style={{ 
                                        width: `${porcentaje}%`,
                                        background: porcentaje > 80 ? 'var(--rr)' : 
                                                  porcentaje > 60 ? 'var(--yy)' : 'var(--grnb)'
                                      }}
                                    ></div>
                                  </div>
                                  <div className="flex-row justify-between">
                                    <span className="text-small">{porcentaje}% ocupado</span>
                                    <span className={`badge ${
                                      profesional.estado === 'disponible' ? 'badge-success' :
                                      profesional.estado === 'limitado' ? 'badge-warning' :
                                      'badge-danger'
                                    }`}>
                                      {profesional.estado}
                                    </span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center p-20">
                    <div className="loading-spinner"></div>
                    <div className="text-small mt-10">Cargando disponibilidad...</div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowModalDisponibilidad(false)}
              >Cerrar
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinadorAgenda;