import React, { useState, useEffect } from 'react';
import { FiFileText, FiPlus, FiEdit2, FiTrash2, FiCalendar, FiUser, FiSave } from 'react-icons/fi';
import notifications from '../../utils/notifications';
import confirmations from '../../utils/confirmations';


const BecarioObservaciones = () => {
  const [observaciones, setObservaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    paciente_id: '',
    fecha: new Date().toISOString().split('T')[0],
    observaciones: '',
    dificultades: '',
    logros: '',
    preguntas_supervisor: ''
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
        
        setObservaciones([
          {
            id: 1,
            paciente_nombre: 'Carlos Gómez',
            fecha: '2024-01-10',
            observaciones: 'El paciente mostró mejoría en su manejo de la ansiedad durante la sesión.',
            dificultades: 'Aún presenta resistencia para hablar sobre ciertos temas familiares.',
            logros: 'Logró identificar tres técnicas de relajación que le funcionan.',
            preguntas_supervisor: '¿Cómo abordar la resistencia a temas familiares?'
          },
          {
            id: 2,
            paciente_nombre: 'Mariana López',
            fecha: '2024-01-09',
            observaciones: 'La paciente trabajó en estrategias para manejar el estrés laboral.',
            dificultades: 'Dificultad para establecer límites en el trabajo.',
            logros: 'Identificó patrones de pensamiento que generan estrés.',
            preguntas_supervisor: '¿Sugerencias para ejercicios de asertividad?'
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
    
    // En un proyecto real, aquí enviaríamos al backend
    const nuevaObservacion = {
      id: observaciones.length + 1,
      paciente_nombre: pacientes.find(p => p.id == formData.paciente_id)?.nombre || 'Paciente',
      ...formData
    };
    
    setObservaciones([nuevaObservacion, ...observaciones]);
    setShowForm(false);
    setFormData({
      paciente_id: '',
      fecha: new Date().toISOString().split('T')[0],
      observaciones: '',
      dificultades: '',
      logros: '',
      preguntas_supervisor: ''
    });
    
    notifications.success('Observación registrada exitosamente');
  };

  const handleDelete = async (id) => {
    const confirmado = await confirmations.danger('¿Estás seguro de eliminar esta observación?');
    
    if (confirmado) {
      setObservaciones(observaciones.filter(o => o.id !== id));
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
          <h1>Observaciones de Sesiones</h1>
          <p>Registro de observaciones para supervisión</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          <FiPlus /> Nueva Observación
        </button>
      </div>

      {/* Formulario de Nueva Observación */}
      {showForm && (
        <div className="card mb-20">
          <div className="modal-header">
            <h3>Nueva Observación</h3>
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
              
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Observaciones generales</label>
                <textarea
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleInputChange}
                  className="textarea-field"
                  rows="4"
                  required
                  placeholder="Describe lo observado durante la sesión..."
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
              
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
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
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                <FiSave /> Guardar Observación
              </button>
              <button 
                type="button" 
                className="btn-danger"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Observaciones */}
      <div className="config-content">
        <h3>Observaciones Registradas</h3>
        
        {observaciones.length > 0 ? (
          <div className="observaciones-list">
            {observaciones.map((obs) => (
              <div key={obs.id} className="accordion">
                <div className="accordion-header">
                  <div className="flex-row align-center gap-10">
                    <FiCalendar />
                    <span>{new Date(obs.fecha).toLocaleDateString()}</span>
                  </div>
                  <div className="flex-row align-center gap-10">
                    <FiUser />
                    <span>{obs.paciente_nombre}</span>
                  </div>
                  <div className="flex-row gap-5">
                    <button className="btn-text">
                      <FiEdit2 />
                    </button>
                    <button 
                      className="btn-text text-danger"
                      onClick={() => handleDelete(obs.id)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
                
                <div className="accordion-content">
                  <div className="grid-2 gap-20">
                    <div>
                      <h4>Observaciones</h4>
                      <p>{obs.observaciones}</p>
                    </div>
                    
                    <div>
                      <h4>Logros</h4>
                      <p>{obs.logros}</p>
                    </div>
                    
                    <div>
                      <h4>Dificultades</h4>
                      <p>{obs.dificultades}</p>
                    </div>
                    
                    <div>
                      <h4>Preguntas para supervisor</h4>
                      <p>{obs.preguntas_supervisor}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-citas">
            <div className="no-citas-icon">📝</div>
            <div>No hay observaciones registradas</div>
            <p className="text-small mt-10">
              Las observaciones son importantes para tu supervisión y desarrollo profesional.
            </p>
            <button 
              className="btn-text mt-10"
              onClick={() => setShowForm(true)}
            >
              <FiPlus /> Registrar tu primera observación
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BecarioObservaciones;