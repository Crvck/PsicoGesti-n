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
import ConfiguracionService from '../../services/configuracionService';
import './coordinador.css';
import notifications from '../../utils/notifications';
import confirmations from '../../utils/confirmations';

const CoordinadorAgenda = () => {
  const [citas, setCitas] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('week');
  const [loading, setLoading] = useState(true);
  const [filterTerapeuta, setFilterTerapeuta] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [terapeutas, setTerapeutas] = useState([]);
  const [showDetalles, setShowDetalles] = useState(false);
  const [selectedCita, setSelectedCita] = useState(null);
  const [mostrarTodas, setMostrarTodas] = useState(true);
  const [estadisticas, setEstadisticas] = useState(null);
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [disponibilidadLoading, setDisponibilidadLoading] = useState(false);
  const [showModalDisponibilidad, setShowModalDisponibilidad] = useState(false);
  const [pacientes, setPacientes] = useState([]);
  const [searchPaciente, setSearchPaciente] = useState('');
  const [filteredPacientes, setFilteredPacientes] = useState([]);
  const [configCitas, setConfigCitas] = useState({ horarioInicio: '09:00', horarioFin: '20:00' });
  const [coterapeutas, setCoterapeutas] = useState([]);
  const [showAsignarCitaModal, setShowAsignarCitaModal] = useState(false);
  const [pacienteCitaQuery, setPacienteCitaQuery] = useState('');
  const [terapeutaCitaQuery, setTerapeutaCitaQuery] = useState('');
  const [coterapeutaCitaQuery, setCoterapeutaCitaQuery] = useState('');
  const [showPacienteCitaList, setShowPacienteCitaList] = useState(false);
  const [showTerapeutaCitaList, setShowTerapeutaCitaList] = useState(false);
  const [showCoterapeutaCitaList, setShowCoterapeutaCitaList] = useState(false);
  const [nuevaCitaForm, setNuevaCitaForm] = useState({
    titulo: '',
    paciente_id: '',
    terapeuta_id: '',
    coterapeuta_id: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    hora: '09:00',
    tipo_consulta: 'presencial',
    duracion: 50,
    total_sesiones: 1,
    notas: '',
    color: '#1F85BA'
  });
  const [citaColorOverrides, setCitaColorOverrides] = useState(() => {
    try {
      const stored = localStorage.getItem('agendaCitaColors');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.warn('No se pudo leer agendaCitaColors:', e);
      return {};
    }
  });
  
  const [filtrosAvanzados, setFiltrosAvanzados] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    paciente_id: '',
    tipo_consulta: ''
  });
  const [busquedaTerapeuta, setBusquedaTerapeuta] = useState('');

  // Colores fijos para terapeutas y citas
  const coloresTerapeutas = ['#29ce9b', '#1F85BA', '#ffa631', '#37B69C', '#fa3144'];
  const coloresCitas = ['#1F85BA', '#29ce9b', '#ffa631', '#fa3144', '#7c4dff', '#00bcd4', '#8bc34a', '#ff7043'];

  useEffect(() => {
    fetchTerapeutas();
    fetchPacientes();
    fetchCoterapeutas();
    fetchConfigCitas();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('agendaCitaColors', JSON.stringify(citaColorOverrides));
    } catch (e) {
      console.warn('No se pudo guardar agendaCitaColors:', e);
    }
  }, [citaColorOverrides]);

  useEffect(() => {
    fetchAgenda();
  }, [selectedDate, view, filterTerapeuta, filterEstado, filtrosAvanzados]);

  // Escuchar cuando se crea una cita desde otras vistas para refrescar la agenda
  useEffect(() => {
    const onCitaCreada = (e) => {
      try {
        console.log('Evento citaCreada recibido (Agenda):', e.detail);
        fetchAgenda();
      } catch (err) { console.warn(err); }
    };

    const onCitaActualizada = (e) => {
      try {
        console.log('Evento citaActualizada recibido (Agenda):', e.detail);
        fetchAgenda();
      } catch (err) { console.warn(err); }
    };

    window.addEventListener('citaCreada', onCitaCreada);
    window.addEventListener('citaActualizada', onCitaActualizada);
    return () => {
      window.removeEventListener('citaCreada', onCitaCreada);
      window.removeEventListener('citaActualizada', onCitaActualizada);
    };
  }, [selectedDate, view, filterTerapeuta, filterEstado, filtrosAvanzados]);

  const fetchPacientes = async () => {
    try {
      const response = await ApiService.get('/pacientes?activo=true&limit=100');
      const data = response?.data || response || [];
      setPacientes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando pacientes:', error);
    }
  };

  const fetchCoterapeutas = async () => {
    try {
      const response = await ApiService.get('/users?rol=coterapeuta&activo=true');
      const data = response?.data || response || [];
      setCoterapeutas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando coterapeutas:', error);
      setCoterapeutas([]);
    }
  };

  const fetchConfigCitas = async () => {
    try {
      const response = await ConfiguracionService.obtenerPorCategoria('citas');
      const data = response?.data || response || {};
      setConfigCitas({
        horarioInicio: data.horarioInicio || '09:00',
        horarioFin: data.horarioFin || '20:00'
      });
    } catch (error) {
      console.error('Error cargando configuración de citas:', error);
    }
  };

  const fetchTerapeutas = async () => {
    try {
      const response = await ApiService.get('/users?rol=terapeuta&activo=true');
      console.log('Respuesta de terapeutas:', response);
      let data = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response.success && Array.isArray(response.data)) {
        data = response.data;
      } else if (Array.isArray(response.data)) {
        data = response.data;
      }
      // Filtrar solo terapeutas (excluyendo coterapeutas)
      const terapeutas = data.filter(user => user.rol === 'terapeuta');
      console.log('Terapeutas filtrados:', terapeutas);
      const terapeutasData = terapeutas.map((terapeuta, index) => ({
        id: terapeuta.id,
        nombre: `${terapeuta.nombre} ${terapeuta.apellido}`,
        color: coloresTerapeutas[index % coloresTerapeutas.length],
        especialidad: terapeuta.especialidad || 'Terapia General',
        email: terapeuta.email
      }));
      console.log('Terapeutas procesados:', terapeutasData);
      setTerapeutas(terapeutasData);
    } catch (error) {
      console.error('Error cargando terapeutas:', error);
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
      if (filterTerapeuta) {
        params.append('terapeuta_id', filterTerapeuta);
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
        const citasTransformadas = response.data.citas.map((cita, index) => {
          const terapeutaId = cita.terapeuta_id ?? cita.psicologo_id;
          const coterapeutaId = cita.coterapeuta_id ?? cita.becario_id;
          const terapeutaNombre = cita.Terapeuta
            ? `${cita.Terapeuta.nombre} ${cita.Terapeuta.apellido}`
            : (cita.Psicologo ? `${cita.Psicologo.nombre} ${cita.Psicologo.apellido}` : 'No asignado');
          const terapeuta = terapeutas.find(t => t.id === terapeutaId) || {
            nombre: terapeutaNombre,
            color: coloresTerapeutas[index % coloresTerapeutas.length]
          };
          const titulo = cita.titulo || cita.titulo_evento || cita.titulo_cita || cita.title || '';
          const paletteColor = coloresTerapeutas[index % coloresTerapeutas.length];
          const baseColor = cita.color || cita.color_cita || cita.color_evento || cita.color_hex || terapeuta.color || paletteColor;
          const overrideColor = citaColorOverrides[cita.id];
          const citaColor = overrideColor || baseColor;
          const fechaNormalizada = typeof cita.fecha === 'string'
            ? cita.fecha.split('T')[0]
            : format(new Date(cita.fecha), 'yyyy-MM-dd');
          const horaNormalizada = typeof cita.hora === 'string'
            ? cita.hora.slice(0, 5)
            : cita.hora;
          return {
            id: cita.id,
            titulo,
            fecha: fechaNormalizada,
            hora: horaNormalizada || '00:00',
            duracion: cita.duracion || 50,
            paciente_nombre: cita.Paciente ? 
              `${cita.Paciente.nombre} ${cita.Paciente.apellido}` : 'Paciente',
            paciente_id: cita.paciente_id,
            terapeuta_id: terapeutaId,
            terapeuta_nombre: terapeuta.nombre,
            terapeuta_color: terapeuta.color,
            cita_color: citaColor,
            tipo_consulta: cita.tipo_consulta,
            estado: cita.estado,
            coterapeuta_nombre: cita.Coterapeuta
              ? `${cita.Coterapeuta.nombre} ${cita.Coterapeuta.apellido}`
              : (cita.Becario ? `${cita.Becario.nombre} ${cita.Becario.apellido}` : null),
            coterapeuta_id: coterapeutaId,
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
    // Convertir a número para comparación correcta
    const matchesTerapeuta = !filterTerapeuta || Number(cita.terapeuta_id) === Number(filterTerapeuta);
    const matchesEstado = !filterEstado || cita.estado === filterEstado;
    const matchesTipoConsulta = !filtrosAvanzados.tipo_consulta || cita.tipo_consulta === filtrosAvanzados.tipo_consulta;
    let matchesFechas = true;
    if (filtrosAvanzados.fecha_inicio && filtrosAvanzados.fecha_fin) {
      matchesFechas = cita.fecha >= filtrosAvanzados.fecha_inicio && cita.fecha <= filtrosAvanzados.fecha_fin;
    } else if (filtrosAvanzados.fecha_inicio) {
      matchesFechas = cita.fecha >= filtrosAvanzados.fecha_inicio;
    } else if (filtrosAvanzados.fecha_fin) {
      matchesFechas = cita.fecha <= filtrosAvanzados.fecha_fin;
    }
    const matchesPaciente = !filtrosAvanzados.paciente_id || Number(cita.paciente_id) === Number(filtrosAvanzados.paciente_id);
    return matchesTerapeuta && matchesEstado && matchesTipoConsulta && matchesFechas && matchesPaciente;
  });
  
  const activeFiltersCount = [
    filterTerapeuta ? 1 : 0,
    filterEstado ? 1 : 0,
    filtrosAvanzados.tipo_consulta ? 1 : 0,
    (filtrosAvanzados.fecha_inicio || filtrosAvanzados.fecha_fin) ? 1 : 0,
    filtrosAvanzados.paciente_id ? 1 : 0
  ].reduce((a, b) => a + b, 0);

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

  const actualizarColorCita = (citaId, color) => {
    setCitaColorOverrides(prev => ({ ...prev, [citaId]: color }));
    setCitas(prev => prev.map(c => c.id === citaId ? { ...c, cita_color: color } : c));
    setSelectedCita(prev => prev && prev.id === citaId ? { ...prev, cita_color: color } : prev);
  };

  const crearCitaDesdeAgenda = async () => {
    if (!nuevaCitaForm.paciente_id || !nuevaCitaForm.terapeuta_id) {
      notifications.error('Selecciona paciente y terapeuta');
      return;
    }

    // Validar si ya existe una cita para el terapeuta en la misma fecha y hora
    const citasExistentes = getCitasPorDiaYHora(nuevaCitaForm.fecha, nuevaCitaForm.hora);
    const citaConflicto = citasExistentes.find(cita => 
      Number(cita.terapeuta_id) === Number(nuevaCitaForm.terapeuta_id) &&
      ['programada', 'confirmada'].includes(cita.estado)
    );

    if (citaConflicto) {
      notifications.error('El terapeuta ya tiene una cita asignada en este horario. Por favor, selecciona otro horario o verifica que la cita existente esté cancelada.');
      return;
    }

    try {
      setLoading(true); // Mostrar indicador de carga
      const pacienteSeleccionado = pacientes.find(p => Number(p.id) === Number(nuevaCitaForm.paciente_id));
      const body = {
        titulo: nuevaCitaForm.titulo,
        paciente_id: Number(nuevaCitaForm.paciente_id),
        paciente: pacienteSeleccionado ? {
          nombre: pacienteSeleccionado.nombre,
          apellido: pacienteSeleccionado.apellido,
          email: pacienteSeleccionado.email || null,
          telefono: pacienteSeleccionado.telefono || null
        } : undefined,
        terapeuta_id: Number(nuevaCitaForm.terapeuta_id),
        coterapeuta_id: nuevaCitaForm.coterapeuta_id ? Number(nuevaCitaForm.coterapeuta_id) : null,
        fecha: nuevaCitaForm.fecha,
        hora: nuevaCitaForm.hora,
        tipo_consulta: nuevaCitaForm.tipo_consulta,
        duracion: Number(nuevaCitaForm.duracion),
        total_sesiones: Number(nuevaCitaForm.total_sesiones || 1),
        notas: nuevaCitaForm.notas,
        color: nuevaCitaForm.color
      };

      const response = await ApiService.post('/citas/nueva', body);
      const ok = response?.success ?? true;

      if (!ok) {
        notifications.error(response?.message || 'No se pudo crear la cita');
        return;
      }

      notifications.success('Cita registrada correctamente');
      setShowAsignarCitaModal(false);
      setPacienteCitaQuery('');
      setTerapeutaCitaQuery('');
      setCoterapeutaCitaQuery('');
      setNuevaCitaForm(prev => ({
        ...prev,
        titulo: '',
        paciente_id: '',
        terapeuta_id: '',
        coterapeuta_id: '',
        hora: '09:00',
        tipo_consulta: 'presencial',
        duracion: 50,
        total_sesiones: 1,
        notas: '',
        color: '#1F85BA'
      }));

      await fetchAgenda();
    } catch (error) {
      console.error('Error creando cita:', error);
      const rawMessage = error?.message || '';
      if (rawMessage.includes('Ya existe una cita programada')) {
        notifications.error('Ya hay cita programada con el terapeuta en este horario');
      } else {
        notifications.error(rawMessage || 'Error creando la cita');
      }
    } finally {
      setLoading(false); // Ocultar indicador de carga
    }
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
    const startHour = parseInt((configCitas.horarioInicio || '09:00').split(':')[0], 10);
    const endHour = parseInt((configCitas.horarioFin || '20:00').split(':')[0], 10);
    const safeStart = Number.isNaN(startHour) ? 9 : startHour;
    const safeEnd = Number.isNaN(endHour) ? 20 : endHour;

    for (let i = safeStart; i <= safeEnd; i++) {
      hours.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return hours;
  };

  const getCitasPorDiaYHora = (fecha, hora) => {
    try {
      const fechaStr = format(new Date(fecha), 'yyyy-MM-dd');
      const horaStr = String(hora || '').substring(0, 5);
      
      return citas.filter(cita => {
        const citaHora = String(cita.hora || '').substring(0, 5);
        return cita.fecha === fechaStr && citaHora === horaStr;
      });
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
    setFilterTerapeuta('');
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
              terapeuta_id: filterTerapeuta || null,
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
      setDisponibilidadLoading(true);
        const fecha = format(new Date(), 'yyyy-MM-dd');
        const response = await ApiService.get(`/agenda/disponibilidad-profesionales?fecha=${fecha}`);
      const data = response?.data || response || {};
      const disponibilidadData = data.disponibilidad || data.data?.disponibilidad || data.data || data || [];
      setDisponibilidad(Array.isArray(disponibilidadData) ? disponibilidadData : []);
    } catch (error) {
        console.error('Error cargando disponibilidad:', error);
        setDisponibilidad([]);
    } finally {
      setDisponibilidadLoading(false);
    }
  };

  // Llama a fetchDisponibilidad en useEffect
  useEffect(() => {
    const loadData = async () => {
        await fetchTerapeutas();
        await fetchPacientes();
        await fetchAgenda();
        await fetchDisponibilidad();
    };
    loadData();
  }, [selectedDate, view, filterTerapeuta, filterEstado, filtrosAvanzados]);

  const [showDayModal, setShowDayModal] = useState(false);
  const [dayModalDate, setDayModalDate] = useState(null);
  const [dayModalCitas, setDayModalCitas] = useState([]);

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
          <button className="btn-primary" onClick={() => {
            setNuevaCitaForm(prev => ({ ...prev, fecha: format(selectedDate, 'yyyy-MM-dd') }));
            setShowAsignarCitaModal(true);
          }}>
            <FiEdit2 /> Asignar cita
          </button>
          <button className="btn-secondary" onClick={fetchAgenda}>
            <FiRefreshCw /> Actualizar
          </button>
          {/* <button className="btn-primary" onClick={exportarAgenda}>
            <FiDownload /> Exportar Agenda
          </button> */}
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
                  <div className="stat-value">{estadisticas.terapeutas_involucrados || terapeutas.length}</div>
                  <div className="stat-label">Terapeutas</div>
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

            <div className="flex-row justify-between align-center mb-10">
              <span className="text-small" style={{ color: 'var(--gray)' }}>Vista rápida de cupos</span>
              <button className="btn-text" onClick={() => {
                setNuevaCitaForm(prev => ({ ...prev, fecha: format(selectedDate, 'yyyy-MM-dd') }));
                setShowAsignarCitaModal(true);
              }}>
                <FiEdit2 /> Asignar cita
              </button>
            </div>
            
            <div className="flex-col gap-10 mt-10">
              {disponibilidadLoading ? (
                <div className="text-center p-10">
                  <div className="loading-spinner"></div>
                  <div className="text-small mt-10">Cargando disponibilidad...</div>
                </div>
              ) : disponibilidad && disponibilidad.length > 0 ? (
                <>
                  {disponibilidad.filter(p => p.tiene_disponibilidad_semana).slice(0, 3).map(profesional => {
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
                  {disponibilidad.filter(p => p.tiene_disponibilidad_semana).length > 3 && (
                    <div className="text-center mt-10">
                      <button 
                        className="btn-text btn-text-modal"
                        onClick={() => setShowModalDisponibilidad(true)}
                        style={{ 
                          fontSize: '12px',
                          padding: '6px 12px'
                        }}
                      >
                        Ver todos ({disponibilidad.filter(p => p.tiene_disponibilidad_semana).length} profesionales)
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-10">
                  <div className="text-small mt-10">Sin disponibilidad para mostrar</div>
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
              {activeFiltersCount > 0 ? (
                <>
                  Filtradas: <span style={{ fontWeight: 'bold', color: 'var(--blu)' }}>{filteredCitas.length}</span> / <span style={{ color: 'var(--gray)' }}>{citas.length}</span>
                </>
              ) : (
                <>Total: <span style={{ fontWeight: 'bold' }}>{filteredCitas.length}</span></>
              )}
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
        {/* Indicador de filtros activos */}
        {activeFiltersCount > 0 && (
          <div className="flex-row justify-between align-center mb-15" style={{ padding: '12px 15px', background: 'rgba(31, 133, 186, 0.1)', borderRadius: '6px', border: '1px solid var(--blu)' }}>
            <div className="flex-row align-center gap-10">
              <span className="badge badge-primary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} activo{activeFiltersCount !== 1 ? 's' : ''}
              </span>
              <span className="text-small" style={{ color: 'var(--gray)' }}>
                Mostrando {filteredCitas.length} de {citas.length} cita{citas.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button 
              className="btn-text" 
              onClick={resetFiltros}
              style={{ fontSize: '12px', color: 'var(--rr)', cursor: 'pointer' }}
            >
              ✕ Limpiar
            </button>
          </div>
        )}
        
        <div className="grid-3 gap-20 mt-15">
          <div className="form-group">
            <label className="form-label">
              <FiUser /> Terapeuta
            </label>
            <select 
              value={filterTerapeuta} 
              onChange={(e) => setFilterTerapeuta(e.target.value)}
              className="select-field"
            >
              <option value="">Todos los terapeutas ({terapeutas.length})</option>
              {terapeutas && terapeutas.length > 0 ? (
                terapeutas.map(terapeuta => (
                  <option key={terapeuta.id} value={terapeuta.id}>
                    {terapeuta.nombre}
                  </option>
                ))
              ) : (
                <option disabled>Cargando terapeutas...</option>
              )}
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
          
          {/* <div className="form-group">
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
          </div> */}
        </div>
      </div>

      {/* Calendario Semanal/Dia */}
      <div className="calendar-week-view" style={{ minHeight: '600px' }}>
        <div className="week-header">
          <div className="time-header"></div>
          {weekDays.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const citasCount = filteredCitas.filter(c => c.fecha === dayStr).length;
              return (
                <div
                  key={day.toISOString()}
                  className={`day-header ${citasCount > 0 ? 'has-citas' : ''}`}
                  style={{ backgroundColor: citasCount > 0 ? '#44535a' : 'transparent', cursor: citasCount > 0 ? 'pointer' : 'default' }}
                  onClick={() => {
                    if (citasCount > 0) {
                      setDayModalDate(dayStr);
                      setDayModalCitas(filteredCitas.filter(c => c.fecha === dayStr));
                      setShowDayModal(true);
                    }
                  }}
                >
                  <div className="day-name">
                    {format(day, 'EEE', { locale: es })}
                  </div>
                  <div className="day-number">
                    {format(day, 'd')}
                  </div>
                  <div className="text-small">
                    {citasCount} citas
                  </div>
                </div>
              );
            })}
        </div>
        
        <div className="week-body">
          <div className="time-column">
            {generateHours().map(hour => (
              <div key={hour} className="time-slot">{hour}</div>
            ))}
          </div>
          
          {weekDays.map((day) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            return (
              <div key={day.toISOString()} className="day-column">
                {generateHours().map(hour => {
                  const citasHora = getCitasPorDiaYHora(day, hour);
                  const maxVisible = 6;
                  const citasVisibles = citasHora.slice(0, maxVisible);
                  
                  return (
                    <div 
                      key={hour} 
                      className="hour-cell"
                      style={{
                        height: '60px'
                      }}
                    >
                      {citasVisibles.map((cita, index) => (
                        <div 
                          key={cita.id}
                          className="week-event"
                          style={{ 
                            backgroundColor: cita.cita_color || cita.terapeuta_color,
                            opacity: 0.95,
                            width: `${100 / citasVisibles.length}%`,
                            left: `${index * (100 / citasVisibles.length)}%`,
                            height: '100%',
                            top: '0',
                            position: 'absolute',
                            zIndex: 10 + index
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            showCitaDetalles(cita);
                          }}
                          title={`${cita.hora} - ${cita.paciente_nombre}\n${cita.terapeuta_nombre}\nTipo: ${cita.tipo_consulta}\nEstado: ${cita.estado}`}
                        >
                          <div className="week-event-time">{cita.hora.slice(0, 5)}</div>
                          <div className="week-event-patient">
                            {(cita.titulo || cita.paciente_nombre).length > 15
                              ? (cita.titulo || cita.paciente_nombre).slice(0, 15) + '...'
                              : (cita.titulo || cita.paciente_nombre)
                            }
                          </div>
                          <div className="week-event-type">
                            {cita.tipo_consulta === 'virtual' ? <FiVideo size={10} /> : <FiMapPin size={10} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Asignar Cita */}
      {showAsignarCitaModal && (
        <div className="modal-overlay">
          <div className="modal-container modal-medium">
            <div className="modal-header">
              <h3>Asignar cita</h3>
              <button className="modal-close" onClick={() => setShowAsignarCitaModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Título del evento</label>
                  <input
                    type="text"
                    className="input-field"
                    value={nuevaCitaForm.titulo}
                    onChange={(e) => setNuevaCitaForm({ ...nuevaCitaForm, titulo: e.target.value })}
                    placeholder="Ej. Sesión inicial"
                  />
                </div>

                <div className="form-group" style={{ position: 'relative' }}>
                  <label>Paciente</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Buscar paciente..."
                    value={pacienteCitaQuery}
                    onChange={(e) => { setPacienteCitaQuery(e.target.value); setShowPacienteCitaList(true); }}
                    onFocus={() => setShowPacienteCitaList(true)}
                    onBlur={() => setTimeout(() => setShowPacienteCitaList(false), 120)}
                  />
                  {showPacienteCitaList && (
                    <div className="autocomplete-panel">
                      {pacientes.filter(p => (
                        (p.nombre_completo || `${p.nombre || ''} ${p.apellido || ''}`.trim()).toLowerCase().includes(pacienteCitaQuery.toLowerCase()) ||
                        (p.email || '').toLowerCase().includes(pacienteCitaQuery.toLowerCase())
                      )).slice(0, 50).map(p => (
                        <div
                          key={p.id}
                          className="autocomplete-option"
                          onClick={() => {
                            const nombre = p.nombre_completo || `${p.nombre || ''} ${p.apellido || ''}`.trim();
                            setNuevaCitaForm({ ...nuevaCitaForm, paciente_id: p.id });
                            setPacienteCitaQuery(nombre);
                            setShowPacienteCitaList(false);
                          }}
                        >
                          <div className="autocomplete-title">{p.nombre_completo || `${p.nombre || ''} ${p.apellido || ''}`.trim()}</div>
                          {p.email && <div className="text-small autocomplete-subtitle">{p.email}</div>}
                        </div>
                      ))}
                      {pacientes.filter(p => (
                        (p.nombre_completo || `${p.nombre || ''} ${p.apellido || ''}`.trim()).toLowerCase().includes(pacienteCitaQuery.toLowerCase()) ||
                        (p.email || '').toLowerCase().includes(pacienteCitaQuery.toLowerCase())
                      )).length === 0 && (
                        <div className="text-small autocomplete-empty">No se encontraron pacientes</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ position: 'relative' }}>
                  <label>Terapeuta</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Buscar terapeuta..."
                    value={terapeutaCitaQuery}
                    onChange={(e) => { setTerapeutaCitaQuery(e.target.value); setShowTerapeutaCitaList(true); }}
                    onFocus={() => setShowTerapeutaCitaList(true)}
                    onBlur={() => setTimeout(() => setShowTerapeutaCitaList(false), 120)}
                  />
                  {showTerapeutaCitaList && (
                    <div className="autocomplete-panel">
                      {terapeutas.filter(t => (
                        (t.nombre || '').toLowerCase().includes(terapeutaCitaQuery.toLowerCase()) ||
                        (t.email || '').toLowerCase().includes(terapeutaCitaQuery.toLowerCase())
                      )).slice(0, 50).map(t => (
                        <div
                          key={t.id}
                          className="autocomplete-option"
                          onClick={() => {
                            setNuevaCitaForm({ ...nuevaCitaForm, terapeuta_id: t.id });
                            setTerapeutaCitaQuery(t.nombre || '');
                            setShowTerapeutaCitaList(false);
                          }}
                        >
                          <div className="autocomplete-title">{t.nombre}</div>
                          {t.email && <div className="text-small autocomplete-subtitle">{t.email}</div>}
                        </div>
                      ))}
                      {terapeutas.filter(t => (
                        (t.nombre || '').toLowerCase().includes(terapeutaCitaQuery.toLowerCase()) ||
                        (t.email || '').toLowerCase().includes(terapeutaCitaQuery.toLowerCase())
                      )).length === 0 && (
                        <div className="text-small autocomplete-empty">No se encontraron terapeutas</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ position: 'relative' }}>
                  <label>Coterapeuta (opcional)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Buscar coterapeuta..."
                    value={coterapeutaCitaQuery}
                    onChange={(e) => { setCoterapeutaCitaQuery(e.target.value); setShowCoterapeutaCitaList(true); }}
                    onFocus={() => setShowCoterapeutaCitaList(true)}
                    onBlur={() => setTimeout(() => setShowCoterapeutaCitaList(false), 120)}
                  />
                  {showCoterapeutaCitaList && (
                    <div className="autocomplete-panel">
                      {coterapeutas.filter(c => (
                        `${c.nombre || ''} ${c.apellido || ''}`.toLowerCase().includes(coterapeutaCitaQuery.toLowerCase()) ||
                        (c.email || '').toLowerCase().includes(coterapeutaCitaQuery.toLowerCase())
                      )).slice(0, 50).map(c => (
                        <div
                          key={c.id}
                          className="autocomplete-option"
                          onClick={() => {
                            setNuevaCitaForm({ ...nuevaCitaForm, coterapeuta_id: c.id });
                            setCoterapeutaCitaQuery(`${c.nombre || ''} ${c.apellido || ''}`.trim());
                            setShowCoterapeutaCitaList(false);
                          }}
                        >
                          <div className="autocomplete-title">{`${c.nombre || ''} ${c.apellido || ''}`.trim()}</div>
                          {c.email && <div className="text-small autocomplete-subtitle">{c.email}</div>}
                        </div>
                      ))}
                      {coterapeutas.filter(c => (
                        `${c.nombre || ''} ${c.apellido || ''}`.toLowerCase().includes(coterapeutaCitaQuery.toLowerCase()) ||
                        (c.email || '').toLowerCase().includes(coterapeutaCitaQuery.toLowerCase())
                      )).length === 0 && (
                        <div className="text-small autocomplete-empty">No se encontraron coterapeutas</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Fecha</label>
                  <input
                    type="date"
                    className="input-field"
                    value={nuevaCitaForm.fecha}
                    onChange={(e) => setNuevaCitaForm({ ...nuevaCitaForm, fecha: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Hora</label>
                  <input
                    type="time"
                    className="input-field"
                    value={nuevaCitaForm.hora}
                    onChange={(e) => setNuevaCitaForm({ ...nuevaCitaForm, hora: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Tipo</label>
                  <select
                    className="select-field"
                    value={nuevaCitaForm.tipo_consulta}
                    onChange={(e) => setNuevaCitaForm({ ...nuevaCitaForm, tipo_consulta: e.target.value })}
                  >
                    <option value="presencial">Presencial</option>
                    <option value="virtual">Virtual</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Duración (min)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={nuevaCitaForm.duracion}
                    onChange={(e) => setNuevaCitaForm({ ...nuevaCitaForm, duracion: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Total de sesiones</label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    value={nuevaCitaForm.total_sesiones}
                    onChange={(e) => setNuevaCitaForm({ ...nuevaCitaForm, total_sesiones: Math.max(1, Number(e.target.value || 1)) })}
                  />
                  <div className="text-small">Se repetirán semanalmente si es mayor a 1.</div>
                </div>

                <div className="form-group">
                  <label>Color</label>
                  <div className="color-palette">
                    {coloresCitas.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`color-swatch ${nuevaCitaForm.color === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNuevaCitaForm({ ...nuevaCitaForm, color })}
                        title={color}
                        aria-label={`Color ${color}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Notas</label>
                  <textarea
                    rows="3"
                    className="textarea-field"
                    value={nuevaCitaForm.notas}
                    onChange={(e) => setNuevaCitaForm({ ...nuevaCitaForm, notas: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAsignarCitaModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={crearCitaDesdeAgenda}>Guardar cita</button>
            </div>
          </div>
        </div>
      )}

      {/* Resumen por Terapeuta */}
      <div className="flex-row align-center gap-10 mb-15 mt-30" style={{ justifyContent: 'space-between' }}>
        <input
          type="text"
          placeholder="Buscar terapeuta o coterapeuta..."
          value={busquedaTerapeuta}
          onChange={(e) => setBusquedaTerapeuta(e.target.value)}
          className="input-field"
          style={{ maxWidth: '350px' }}
        />
        <h3 style={{ margin: 0, textAlign: 'right' }}>Terapeutas y Coterapeutas</h3>
      </div>
      <div className="grid-3 gap-20">
        {terapeutas.filter(terapeuta => {
          if (!busquedaTerapeuta.trim()) return true;
          const searchTerm = busquedaTerapeuta.toLowerCase();
          return (
            (terapeuta.nombre || '').toLowerCase().includes(searchTerm) ||
            (terapeuta.email || '').toLowerCase().includes(searchTerm) ||
            (terapeuta.especialidad || '').toLowerCase().includes(searchTerm)
          );
        }).slice(0, 3).map(terapeuta => {
          const citasTerapeuta = filteredCitas.filter(c => c.terapeuta_id === terapeuta.id);
          const citasHoy = citasTerapeuta.filter(c => c.fecha === format(new Date(), 'yyyy-MM-dd')).length;
          return (
            <div key={terapeuta.id} className="card">
              <div className="flex-row align-center gap-10 mb-10">
                <div 
                  className="avatar" 
                  style={{ background: terapeuta.color }}
                >
                  {terapeuta.nombre.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <h4>{terapeuta.nombre}</h4>
                  <p className="text-small">{terapeuta.especialidad}</p>
                  <p className="text-small">
                    <FiMail /> {terapeuta.email}
                  </p>
                </div>
              </div>
              <div className="grid-2 gap-10">
                <div>
                  <div className="text-small">Citas totales</div>
                  <div className="font-bold">{citasTerapeuta.length}</div>
                </div>
                <div>
                  <div className="text-small">Citas hoy</div>
                  <div className="font-bold">{citasHoy}</div>
                </div>
                <div>
                  <div className="text-small">Confirmadas</div>
                  <div className="font-bold">{citasTerapeuta.filter(c => c.estado === 'confirmada').length}</div>
                </div>
                <div>
                  <div className="text-small">Con coterapeuta</div>
                  <div className="font-bold">{citasTerapeuta.filter(c => c.coterapeuta_nombre).length}</div>
                </div>
              </div>
              <div className="mt-10">
                <button className="btn-text" onClick={() => { setFilterTerapeuta(terapeuta.id); }}>
                  Ver en calendario
                </button>
              </div>
            </div>
          );
        })}
        {coterapeutas.filter(coterapeuta => {
          if (!busquedaTerapeuta.trim()) return true;
          const searchTerm = busquedaTerapeuta.toLowerCase();
          return (
            (coterapeuta.nombre || '').toLowerCase().includes(searchTerm) ||
            (coterapeuta.email || '').toLowerCase().includes(searchTerm)
          );
        }).slice(0, 3).map(coterapeuta => {
          const citasCoterapeuta = filteredCitas.filter(c => c.coterapeuta_id === coterapeuta.id);
          const citasHoy = citasCoterapeuta.filter(c => c.fecha === format(new Date(), 'yyyy-MM-dd')).length;
          return (
            <div key={`ct-${coterapeuta.id}`} className="card" style={{ borderLeft: '4px solid #ffa631' }}>
              <div className="flex-row align-center gap-10 mb-10">
                <div 
                  className="avatar" 
                  style={{ background: '#ffa631' }}
                >
                  {coterapeuta.nombre.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <h4>{coterapeuta.nombre}</h4>
                  <p className="text-small" style={{ color: '#ffa631', fontWeight: 'bold' }}>Coterapeuta</p>
                  <p className="text-small">
                    <FiMail /> {coterapeuta.email}
                  </p>
                </div>
              </div>
              <div className="grid-2 gap-10">
                <div>
                  <div className="text-small">Citas como CT</div>
                  <div className="font-bold">{citasCoterapeuta.length}</div>
                </div>
                <div>
                  <div className="text-small">Citas hoy</div>
                  <div className="font-bold">{citasHoy}</div>
                </div>
                <div>
                  <div className="text-small">Confirmadas</div>
                  <div className="font-bold">{citasCoterapeuta.filter(c => c.estado === 'confirmada').length}</div>
                </div>
                <div>
                  <div className="text-small">Completadas</div>
                  <div className="font-bold">{citasCoterapeuta.filter(c => c.estado === 'completada').length}</div>
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
            
            <div className="modal-content" style={{padding:"20px"}}>
              {selectedCita.titulo && (
                <div className="detail-row">
                  <strong>Título:</strong>
                  <span>{selectedCita.titulo}</span>
                </div>
              )}
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
                <strong>Terapeuta:</strong>
                <div className="flex-row align-center gap-5">
                  <div 
                    className="avatar-small" 
                    style={{ background: selectedCita.cita_color || selectedCita.terapeuta_color }}
                  >
                    {selectedCita.terapeuta_nombre.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span>{selectedCita.terapeuta_nombre}</span>
                </div>
              </div>

              <div className="detail-row">
                <strong>Color de cita:</strong>
                <div className="flex-row align-center gap-10">
                  <div className="color-palette">
                    {coloresCitas.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`color-swatch ${((selectedCita.cita_color || selectedCita.terapeuta_color) === color) ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => actualizarColorCita(selectedCita.id, color)}
                        title={color}
                        aria-label={`Color ${color}`}
                      />
                    ))}
                  </div>
                  <span className="text-small">Personaliza el color del evento</span>
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
              
              {selectedCita.coterapeuta_nombre && (
                <div className="detail-row">
                  <strong>Coterapeuta asignado:</strong>
                  <span>{selectedCita.coterapeuta_nombre}</span>
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
              {/* <button className="btn-primary">
                Ver Expediente
              </button> */}
            </div>
          </div>
        </div>
      )}

      {/* Modal: citas del día */}
      {showDayModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Citas del día {dayModalDate}</h3>
              <button className="modal-close" onClick={() => setShowDayModal(false)}>×</button>
            </div>
            <div className="modal-content">
              {dayModalCitas.length > 0 ? (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Hora</th>
                        <th>Paciente</th>
                        <th>Terapeuta</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayModalCitas.map(cita => (
                        <tr key={cita.id}>
                          <td>{cita.hora}</td>
                          <td>{cita.paciente_nombre}</td>
                          <td>{cita.terapeuta_nombre}</td>
                          <td><span className={`badge ${cita.estado === 'confirmada' ? 'badge-success' : cita.estado === 'completada' ? 'badge-primary' : cita.estado === 'programada' ? 'badge-warning' : 'badge-danger'}`}>{cita.estado}</span></td>
                          <td>
                            <button className="btn-text" onClick={() => { setShowDayModal(false); showCitaDetalles(cita); }}>
                              Ver
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center">No hay citas en este día</div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDayModal(false)}>Cerrar</button>
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
                      {disponibilidad.filter(p => p.tiene_disponibilidad_semana ?? (p.estado === 'disponible')).length}
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
                        {disponibilidad.filter(p => p.tiene_disponibilidad_semana).map(profesional => {
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
                                  profesional.rol === 'terapeuta' ? 'badge-info' : 'badge-warning'
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