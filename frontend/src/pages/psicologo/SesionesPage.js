import React, { useState, useEffect } from 'react';
import { FiCalendar, FiUser, FiFileText, FiPlus, FiEdit2, FiSave } from 'react-icons/fi';

const PsicologoSesiones = () => {
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
    tareas_asignadas: '',
    proxima_sesion: ''
  });
  const [pacientes, setPacientes] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Simulación de datos
      setTimeout(() => {
        setPacientes([
          { id: 1, nombre: 'Carlos Gómez' },
          { id: 2, nombre: 'Mariana López' },
          { id: 3, nombre: 'Roberto Sánchez' }
        ]);
        
        setSesiones([
          {
            id: 1,
            paciente_nombre: 'Carlos Gómez',
            fecha: '2024-01-10',
            hora_inicio: '10:00',
            hora_fin: '11:00',
            motivo_consulta: 'Ansiedad académica',
            contenido_sesion: 'Exposición gradual a situaciones académicas estresantes',
            observaciones: 'Paciente mostró buena disposición y colaboración',
            tareas_asignadas: 'Practicar técnicas de relajación 10 min/día',
            proxima_sesion: '2024-01-17'
          },
          {
            id: 2,
            paciente_nombre: 'Mariana López',
            fecha: '2024-01-09',
            hora_inicio: '11:30',
            hora_fin: '12:15',
            motivo_consulta: 'Estrés laboral',
            contenido_sesion: 'Trabajo en establecimiento de límites laborales',
            observaciones: 'Paciente reporta mejor manejo de situaciones laborales',
            tareas_asignadas: 'Registrar situaciones estresantes en el trabajo',
            proxima_sesion: '2024-01-16'
          }
        ]);
        
        setLoading(false);
      }, 1000);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const nuevaSesion = {
      id: sesiones.length + 1,
      paciente_nombre: pacientes.find(p => p.id == formData.paciente_id)?.nombre || 'Paciente',
      ...formData
    };
    
    setSesiones([nuevaSesion, ...sesiones]);
    setShowForm(false);
    resetForm();
    
    alert('Sesión registrada exitosamente');
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
      tareas_asignadas: '',
      proxima_sesion: ''
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Cargando sesiones...</div>
      </div>
    );
  }

  return (
    <div className="configuracion-page">
      <div className="page-header">
        <div>
          <h1>Registro de Sesiones</h1>
          <p>Registro detallado de sesiones terapéuticas</p>
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
                      {paciente.nombre}
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
                <label>Observaciones</label>
                <textarea
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleInputChange}
                  className="textarea-field"
                  rows="3"
                  placeholder="Observaciones relevantes del paciente..."
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
                  placeholder="Fecha de próxima sesión"
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

      {/* Lista de Sesiones Registradas */}
      <div className="config-content">
        <h3>Sesiones Registradas</h3>
        
        {sesiones.length > 0 ? (
          <div className="sesiones-list">
            {sesiones.map((sesion) => (
              <div key={sesion.id} className="accordion">
                <div className="accordion-header">
                  <div className="flex-row align-center gap-10">
                    <FiCalendar />
                    <span>{new Date(sesion.fecha).toLocaleDateString()}</span>
                  </div>
                  <div className="flex-row align-center gap-10">
                    <FiUser />
                    <span>{sesion.paciente_nombre}</span>
                  </div>
                  <div className="flex-row align-center gap-10">
                    <span>{sesion.hora_inicio} - {sesion.hora_fin}</span>
                  </div>
                </div>
                
                <div className="accordion-content">
                  <div className="grid-2 gap-20">
                    <div>
                      <h4>Motivo de consulta</h4>
                      <p>{sesion.motivo_consulta}</p>
                      
                      <h4 className="mt-10">Contenido de la sesión</h4>
                      <p>{sesion.contenido_sesion}</p>
                    </div>
                    
                    <div>
                      <h4>Observaciones</h4>
                      <p>{sesion.observaciones}</p>
                      
                      <h4 className="mt-10">Tareas asignadas</h4>
                      <p>{sesion.tareas_asignadas}</p>
                      
                      {sesion.proxima_sesion && (
                        <>
                          <h4 className="mt-10">Próxima sesión</h4>
                          <p>{new Date(sesion.proxima_sesion).toLocaleDateString()}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-citas">
            <div className="no-citas-icon">📋</div>
            <div>No hay sesiones registradas</div>
            <p className="text-small mt-10">
              Registra las sesiones terapéuticas para mantener un historial completo.
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
    </div>
  );
};

export default PsicologoSesiones;