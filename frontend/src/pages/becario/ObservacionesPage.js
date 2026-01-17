import React, { useState, useEffect } from 'react';
import { FiFileText, FiPlus, FiEdit2, FiTrash2, FiCalendar, FiUser, FiSave, FiClock } from 'react-icons/fi';
import notifications from '../../utils/notifications';
import confirmations from '../../utils/confirmations';

const BecarioObservaciones = () => {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    paciente_id: '',
    fecha: new Date().toISOString().split('T')[0],
    hora_inicio: '10:00',
    hora_fin: '11:00',
    motivo_consulta: '',
    contenido_sesion: '',
    observaciones: '',
    dificultades: '',
    logros: '',
    preguntas_supervisor: '',
    tareas_asignadas: '',
    proxima_sesion: ''
  });
  const [pacientes, setPacientes] = useState([]);
  const [selectedSesion, setSelectedSesion] = useState(null);
  const [showSesionModal, setShowSesionModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Obtener pacientes activos
      const resPacientes = await fetch('http://localhost:3000/api/pacientes/activos', {
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (!resPacientes.ok) {
        console.error('Error fetching pacientes');
        setPacientes([]);
      } else {
        const json = await resPacientes.json();
        const data = Array.isArray(json) ? json : (json.data || []);
        const normalized = data.map(p => ({
          id: p.id,
          nombre: p.nombre || '',
          apellido: p.apellido || '',
          nombre_completo: p.nombre_completo || `${p.nombre || ''} ${p.apellido || ''}`.trim()
        }));
        setPacientes(normalized);
      }

      // Obtener sesiones recientes (para becarios, quizás asignadas)
      const resSesiones = await fetch('http://localhost:3000/api/sesiones/recientes?limit=50', {
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (!resSesiones.ok) {
        console.error('Error fetching sesiones');
        setSesiones([]);
      } else {
        const json = await resSesiones.json();
        const data = Array.isArray(json) ? json : (json.data || []);
        const normalized = data.map(s => ({
          id: s.id,
          paciente_nombre: s.paciente_nombre ? `${s.paciente_nombre} ${s.paciente_apellido || ''}`.trim() : 'Paciente',
          fecha: s.fecha,
          hora_inicio: s.hora_inicio || s.hora_cita || '',
          hora_fin: s.hora_fin || '',
          motivo_consulta: s.tipo_consulta || '',
          contenido_sesion: s.desarrollo || s.conclusion || '',
          observaciones: s.observaciones || '',
          dificultades: s.dificultades || '',
          logros: s.logros || '',
          preguntas_supervisor: s.preguntas_supervisor || '',
          tareas_asignadas: s.tareas_asignadas || '',
          proxima_sesion: s.siguiente_cita || null
        }));
        setSesiones(normalized);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      notifications.info('Registrando sesión...');
      const token = localStorage.getItem('token');
      const paciente = pacientes.find(p => p.id == formData.paciente_id);

      let firstName = paciente?.nombre || '';
      let lastName = paciente?.apellido || '';
      if ((!firstName || !lastName) && paciente?.nombre_completo) {
        const parts = paciente.nombre_completo.split(' ').filter(Boolean);
        firstName = parts.shift() || '';
        lastName = parts.join(' ') || '';
      }

      if (!firstName || !lastName || !formData.fecha || !formData.hora_inicio) {
        notifications.error('Faltan campos requeridos: paciente, fecha y hora');
        return;
      }

      // Crear cita
      const citaBody = {
        paciente: { nombre: firstName, apellido: lastName, email: null, telefono: null },
        fecha: formData.fecha,
        hora: formData.hora_inicio,
        tipo_consulta: 'presencial',
        duracion: 50,
        notas: 'Sesión registrada por becario'
      };

      const resCita = await fetch('http://localhost:3000/api/citas/nueva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify(citaBody)
      });

      const jsonCita = await resCita.json().catch(() => ({}));
      if (!resCita.ok || !jsonCita.success) {
        notifications.error(jsonCita.message || 'Error creando cita');
        return;
      }

      const citaCreada = jsonCita.data;

      // Marcar completada
      await fetch(`http://localhost:3000/api/citas/cita/${citaCreada.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ estado: 'completada' })
      });

      // Registrar sesión con observaciones
      const sesionBody = {
        cita_id: citaCreada.id,
        desarrollo: formData.contenido_sesion,
        conclusion: formData.observaciones,
        tareas_asignadas: formData.tareas_asignadas,
        emocion_predominante: '',
        riesgo_suicida: 'ninguno',
        escalas_aplicadas: null,
        siguiente_cita: formData.proxima_sesion || null,
        privado: false,
        dificultades: formData.dificultades,
        logros: formData.logros,
        preguntas_supervisor: formData.preguntas_supervisor
      };

      const resSesion = await fetch('http://localhost:3000/api/sesiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify(sesionBody)
      });

      const jsonSesion = await resSesion.json().catch(() => ({}));
      if (!resSesion.ok || !jsonSesion.success) {
        notifications.error(jsonSesion.message || 'Error registrando sesión');
        return;
      }

      const nueva = jsonSesion.data;
      nueva.paciente_nombre = paciente.nombre_completo;
      nueva.dificultades = formData.dificultades;
      nueva.logros = formData.logros;
      nueva.preguntas_supervisor = formData.preguntas_supervisor;

      setSesiones([nueva, ...sesiones]);
      setShowForm(false);
      resetForm();
      notifications.success('Sesión registrada exitosamente');

    } catch (err) {
      console.error('Error registrando sesión:', err);
      notifications.error('Error registrando sesión');
    }
  };

  const resetForm = () => {
    setFormData({
      paciente_id: '',
      fecha: new Date().toISOString().split('T')[0],
      hora_inicio: '10:00',
      hora_fin: '11:00',
      motivo_consulta: '',
      contenido_sesion: '',
      observaciones: '',
      dificultades: '',
      logros: '',
      preguntas_supervisor: '',
      tareas_asignadas: '',
      proxima_sesion: ''
    });
  };

  const openSesionModal = (sesion) => {
    setSelectedSesion(sesion);
    setShowSesionModal(true);
  };

  const closeSesionModal = () => {
    setSelectedSesion(null);
    setShowSesionModal(false);
  };

  const handleDelete = async (id) => {
    const confirmado = await confirmations.danger('¿Estás seguro de eliminar esta sesión?');
    
    if (confirmado) {
      setSesiones(sesiones.filter(s => s.id !== id));
      // Aquí podrías llamar a la API para eliminar
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Cargando observaciones...</div>
      </div>
    );
  }

  return (
    <div className="configuracion-page">
      <div className="page-header">
        <div>
          <h1>Sesiones y Observaciones</h1>
          <p>Registro de sesiones terapéuticas y observaciones para supervisión</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          <FiPlus /> Nueva Sesión
        </button>
      </div>

      {/* Formulario de Nueva Sesión */}
      {showForm && (
        <div className="card mb-20">
          <div className="modal-header">
            <h3>Registrar Nueva Sesión</h3>
            <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Paciente</label>
                <select
                  name="paciente_id"
                  value={formData.paciente_id}
                  onChange={handleInputChange}
                  className="select-field"
                  required
                >
                  <option value="">Seleccionar paciente</option>
                  {pacientes.map(paciente => (
                    <option key={paciente.id} value={paciente.id}>
                      {paciente.nombre_completo || `${paciente.nombre} ${paciente.apellido}`.trim()}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Fecha de sesión</label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Hora inicio</label>
                <input
                  type="time"
                  name="hora_inicio"
                  value={formData.hora_inicio}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Hora fin</label>
                <input
                  type="time"
                  name="hora_fin"
                  value={formData.hora_fin}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>
              
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Motivo de consulta</label>
                <input
                  type="text"
                  name="motivo_consulta"
                  value={formData.motivo_consulta}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                  placeholder="Motivo principal de la sesión"
                />
              </div>
              
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Contenido de la sesión</label>
                <textarea
                  name="contenido_sesion"
                  value={formData.contenido_sesion}
                  onChange={handleInputChange}
                  className="textarea-field"
                  rows="4"
                  required
                  placeholder="Descripción detallada de lo trabajado en la sesión..."
                />
              </div>
              
              <div className="form-group">
                <label>Observaciones generales</label>
                <textarea
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleInputChange}
                  className="textarea-field"
                  rows="3"
                  placeholder="Observaciones relevantes..."
                />
              </div>
              
              <div className="form-group">
                <label>Dificultades encontradas</label>
                <textarea
                  name="dificultades"
                  value={formData.dificultades}
                  onChange={handleInputChange}
                  className="textarea-field"
                  rows="3"
                  placeholder="Dificultades o resistencias observadas..."
                />
              </div>
              
              <div className="form-group">
                <label>Logros del paciente</label>
                <textarea
                  name="logros"
                  value={formData.logros}
                  onChange={handleInputChange}
                  className="textarea-field"
                  rows="3"
                  placeholder="Avances y logros observados..."
                />
              </div>
              
              <div className="form-group">
                <label>Preguntas para el supervisor</label>
                <textarea
                  name="preguntas_supervisor"
                  value={formData.preguntas_supervisor}
                  onChange={handleInputChange}
                  className="textarea-field"
                  rows="3"
                  placeholder="Dudas o preguntas para la supervisión..."
                />
              </div>
              
              <div className="form-group">
                <label>Tareas asignadas</label>
                <textarea
                  name="tareas_asignadas"
                  value={formData.tareas_asignadas}
                  onChange={handleInputChange}
                  className="textarea-field"
                  rows="3"
                  placeholder="Tareas o ejercicios para el paciente..."
                />
              </div>
              
              <div className="form-group">
                <label>Próxima sesión</label>
                <input
                  type="date"
                  name="proxima_sesion"
                  value={formData.proxima_sesion}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                <FiSave /> Guardar Sesión
              </button>
              <button 
                type="button" 
                className="btn-danger"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Sesiones */}
      <div className="config-content">
        <h3>Sesiones Registradas</h3>
        
        {sesiones.length > 0 ? (
          <div className="sesiones-list">
            {sesiones.map((sesion) => (
              <div key={sesion.id} className="session-row" onClick={() => openSesionModal(sesion)}>
                <div className="flex-row align-center gap-10">
                  <FiCalendar />
                  <span>{new Date(sesion.fecha).toLocaleDateString()}</span>
                </div>
                <div className="flex-row align-center gap-10">
                  <FiUser />
                  <span>{sesion.paciente_nombre}</span>
                </div>
                <div className="flex-row align-center gap-10">
                  <FiClock />
                  <span>{sesion.hora_inicio} - {sesion.hora_fin}</span>
                </div>
                <div className="flex-row gap-5">
                  <button className="btn-text text-danger" onClick={(e) => { e.stopPropagation(); handleDelete(sesion.id); }}>
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-citas">
            <div className="no-citas-icon">📋</div>
            <div>No hay sesiones registradas</div>
            <p className="text-small mt-10">
              Registra las sesiones terapéuticas con observaciones para supervisión.
            </p>
            <button 
              className="btn-text mt-10"
              onClick={() => setShowForm(true)}
            >
              <FiPlus /> Registrar tu primera sesión
            </button>
          </div>
        )}
      </div>

      {showSesionModal && selectedSesion && (
        <div className="modal-overlay" onClick={closeSesionModal}>
          <div className="modal-container modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Detalles de la Sesión</h3>
              <button className="modal-close" onClick={closeSesionModal}>×</button>
            </div>

            <div className="modal-content">
              <div className="grid-2 gap-20">
                <div>
                  <h4>Información</h4>
                  <div className="detail-row"><strong>Paciente:</strong> {selectedSesion.paciente_nombre}</div>
                  <div className="detail-row"><strong>Fecha:</strong> {selectedSesion.fecha ? new Date(selectedSesion.fecha).toLocaleDateString() : '—'}</div>
                  <div className="detail-row"><strong>Hora:</strong> {selectedSesion.hora_inicio || ''}{selectedSesion.hora_fin ? ` - ${selectedSesion.hora_fin}` : ''}</div>
                  <div className="detail-row"><strong>Motivo:</strong> {selectedSesion.motivo_consulta || '—'}</div>
                </div>

                <div>
                  <h4>Próxima sesión</h4>
                  <p>{selectedSesion.proxima_sesion ? new Date(selectedSesion.proxima_sesion).toLocaleDateString() : '—'}</p>
                </div>
              </div>

              <div className="mt-10">
                <h4>Contenido de la sesión</h4>
                <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{selectedSesion.contenido_sesion || '—'}</p>

                <h4 className="mt-10">Observaciones</h4>
                <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{selectedSesion.observaciones || '—'}</p>

                <h4 className="mt-10">Dificultades</h4>
                <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{selectedSesion.dificultades || '—'}</p>

                <h4 className="mt-10">Logros</h4>
                <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{selectedSesion.logros || '—'}</p>

                <h4 className="mt-10">Preguntas para supervisor</h4>
                <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{selectedSesion.preguntas_supervisor || '—'}</p>

                <h4 className="mt-10">Tareas asignadas</h4>
                <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{selectedSesion.tareas_asignadas || '—'}</p>
              </div>
            </div>

            <div className="modal-footer" style={{ textAlign: 'right', marginTop: 12 }}>
              <button className="btn-secondary" onClick={closeSesionModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BecarioObservaciones;