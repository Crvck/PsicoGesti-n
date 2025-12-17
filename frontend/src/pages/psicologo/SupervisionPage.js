import React, { useState, useEffect } from 'react';
import { FiUser, FiFileText, FiCalendar, FiMessageSquare, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import notifications from '../../utils/notifications';
import confirmations from '../../utils/confirmations';

const PsicologoSupervision = () => {
  const [becarios, setBecarios] = useState([]);
  const [observaciones, setObservaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBecario, setSelectedBecario] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Simulación de datos
      setTimeout(() => {
        setBecarios([
          {
            id: 1,
            nombre: 'Juan Pérez',
            email: 'becario1@psicogestion.com',
            fecha_inicio: '2023-09-01',
            pacientes_asignados: 3,
            sesiones_supervisadas: 15,
            observaciones_pendientes: 2,
            ultima_supervision: '2024-01-08'
          },
          {
            id: 2,
            nombre: 'Sofía Ramírez',
            email: 'becario2@psicogestion.com',
            fecha_inicio: '2023-10-15',
            pacientes_asignados: 2,
            sesiones_supervisadas: 8,
            observaciones_pendientes: 1,
            ultima_supervision: '2024-01-05'
          }
        ]);
        
        setObservaciones([
          {
            id: 1,
            becario_nombre: 'Juan Pérez',
            paciente_nombre: 'Carlos Gómez',
            fecha: '2024-01-10',
            contenido: 'El becario mostró buena empatía y habilidades de escucha activa.',
            areas_mejora: 'Necesita trabajar en el manejo de silencios incómodos.',
            feedback: 'Excelente manejo de la exposición gradual.',
            estado: 'revisada'
          },
          {
            id: 2,
            becario_nombre: 'Sofía Ramírez',
            paciente_nombre: 'Mariana López',
            fecha: '2024-01-09',
            contenido: 'Buen trabajo en el establecimiento de límites laborales.',
            areas_mejora: 'Podría profundizar más en el análisis de pensamientos automáticos.',
            feedback: '',
            estado: 'pendiente'
          }
        ]);
        
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setLoading(false);
    }
  };

  const enviarFeedback = (becarioId) => {
    if (!feedback.trim()) {
      notifications.success('Por favor, escribe algún feedback');
      return;
    }
    
    // Aquí se enviaría al backend
    notifications.success(`Feedback enviado a ${becarios.find(b => b.id === becarioId)?.nombre}`);
    setFeedback('');
    setShowFeedback(false);
  };

  const getBecarioObservaciones = (becarioId) => {
    return observaciones.filter(obs => 
      obs.becario_nombre === becarios.find(b => b.id === becarioId)?.nombre
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Cargando supervisión...</div>
      </div>
    );
  }

  return (
    <div className="configuracion-page">
      <div className="page-header">
        <div>
          <h1>Supervisión de Becarios</h1>
          <p>Gestión y seguimiento de becarios en formación</p>
        </div>
      </div>

      {/* Lista de Becarios */}
      <div className="config-content">
        <h3>Becarios en Supervisión</h3>
        
        <div className="grid-2 gap-20 mt-20">
          {becarios.map((becario) => {
            const becarioObservaciones = getBecarioObservaciones(becario.id);
            const observacionesPendientes = becarioObservaciones.filter(o => o.estado === 'pendiente').length;
            
            return (
              <div key={becario.id} className="card">
                <div className="flex-row align-center justify-between mb-10">
                  <div className="flex-row align-center gap-10">
                    <div className="avatar">
                      {becario.nombre.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3>{becario.nombre}</h3>
                      <p className="text-small">{becario.email}</p>
                    </div>
                  </div>
                  {observacionesPendientes > 0 && (
                    <span className="badge badge-warning">
                      {observacionesPendientes} pendientes
                    </span>
                  )}
                </div>

                <div className="mb-10">
                  <div className="grid-2 gap-10">
                    <div>
                      <p><strong>Pacientes:</strong> {becario.pacientes_asignados}</p>
                      <p><strong>Sesiones:</strong> {becario.sesiones_supervisadas}</p>
                    </div>
                    <div>
                      <p><strong>Inicio:</strong> {new Date(becario.fecha_inicio).toLocaleDateString()}</p>
                      <p><strong>Última supervisión:</strong> {new Date(becario.ultima_supervision).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-row gap-10">
                  <button 
                    className="btn-primary flex-1"
                    onClick={() => {
                      setSelectedBecario(becario);
                      setShowFeedback(true);
                    }}
                  >
                    <FiMessageSquare /> Dar Feedback
                  </button>
                  <button className="btn-text">
                    <FiFileText /> Ver Observaciones
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Observaciones de Becarios */}
        <div className="mt-30">
          <h3>Observaciones Recientes</h3>
          
          <div className="observaciones-list mt-10">
            {observaciones.map((obs) => (
              <div key={obs.id} className="accordion">
                <div className="accordion-header">
                  <div className="flex-row align-center gap-10">
                    <FiCalendar />
                    <span>{new Date(obs.fecha).toLocaleDateString()}</span>
                  </div>
                  <div className="flex-row align-center gap-10">
                    <FiUser />
                    <span>{obs.becario_nombre} → {obs.paciente_nombre}</span>
                  </div>
                  <div className={`badge ${
                    obs.estado === 'revisada' ? 'badge-success' : 'badge-warning'
                  }`}>
                    {obs.estado === 'revisada' ? 'Revisada' : 'Pendiente'}
                  </div>
                </div>
                
                <div className="accordion-content">
                  <div className="grid-2 gap-20">
                    <div>
                      <h4>Observaciones</h4>
                      <p>{obs.contenido}</p>
                      
                      <h4 className="mt-10">Áreas de mejora</h4>
                      <p>{obs.areas_mejora}</p>
                    </div>
                    
                    <div>
                      <h4>Feedback del supervisor</h4>
                      {obs.feedback ? (
                        <p>{obs.feedback}</p>
                      ) : (
                        <p className="text-danger">Sin feedback aún</p>
                      )}
                      
                      <button 
                        className="btn-text mt-10"
                        onClick={() => {
                          setSelectedBecario(becarios.find(b => b.nombre === obs.becario_nombre));
                          setShowFeedback(true);
                        }}
                      >
                        <FiMessageSquare /> {obs.feedback ? 'Editar Feedback' : 'Agregar Feedback'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid-3 mt-30 gap-20">
          <div className="card">
            <h4>Resumen de Supervisión</h4>
            <div className="mt-10">
              <p>Total becarios: {becarios.length}</p>
              <p>Observaciones pendientes: {observaciones.filter(o => o.estado === 'pendiente').length}</p>
              <p>Sesiones supervisadas: {becarios.reduce((sum, b) => sum + b.sesiones_supervisadas, 0)}</p>
            </div>
          </div>
          
          <div className="card">
            <h4>Próximas Supervisiones</h4>
            <div className="mt-10">
              <p>Juan Pérez: 2024-01-15</p>
              <p>Sofía Ramírez: 2024-01-12</p>
              <p className="text-small mt-10">Agenda programada</p>
            </div>
          </div>
          
          <div className="card">
            <h4>Acciones</h4>
            <div className="mt-10 flex-col gap-10">
              <button className="btn-primary w-100">
                Programar Supervisión
              </button>
              <button className="btn-secondary w-100">
                Generar Informe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Feedback */}
      {showFeedback && selectedBecario && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Feedback para {selectedBecario.nombre}</h3>
              <button className="modal-close" onClick={() => setShowFeedback(false)}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label>Escribe tu feedback</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="textarea-field"
                  rows="6"
                  placeholder="Comparte tus observaciones, sugerencias y áreas de mejora..."
                />
              </div>
              
              <div className="mt-10">
                <p className="text-small">
                  <FiAlertCircle /> El feedback debe ser constructivo y específico.
                </p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowFeedback(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary"
                onClick={() => enviarFeedback(selectedBecario.id)}
              >
                <FiCheckCircle /> Enviar Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PsicologoSupervision;