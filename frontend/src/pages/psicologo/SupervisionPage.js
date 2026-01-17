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
  const [showPacienteObservaciones, setShowPacienteObservaciones] = useState(false);
  const [observacionesPaciente, setObservacionesPaciente] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [citasBecarios, setCitasBecarios] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Obtener becarios asignados al psicólogo actual
      const becariosRes = await fetch('http://localhost:3000/api/asignaciones/mis-becarios', {
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }
      });
      
      if (becariosRes.ok) {
        const becariosData = await becariosRes.json();
        const becariosAsignados = becariosData.data || [];
        setBecarios(becariosAsignados);

        // Obtener observaciones recientes para los becarios asignados
        const observacionesPromises = becariosAsignados.map(async (becario) => {
          try {
            const obsRes = await fetch(`http://localhost:3000/api/observaciones/becario/${becario.id}`, {
              headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }
            });
            if (obsRes.ok) {
              const obsData = await obsRes.json();
              return obsData.map(obs => ({
                ...obs,
                becario_nombre: becario.nombre + ' ' + (becario.apellido || ''),
                paciente_nombre: obs.paciente_nombre || 'Paciente'
              }));
            }
            return [];
          } catch (err) {
            console.warn(`Error obteniendo observaciones para becario ${becario.id}:`, err);
            return [];
          }
        });

        const observacionesArrays = await Promise.all(observacionesPromises);
        const todasObservaciones = observacionesArrays.flat();
        setObservaciones(todasObservaciones);

        // Obtener citas de becarios
        const citasPromises = becariosAsignados.map(async (becario) => {
          try {
            const citasRes = await fetch(`http://localhost:3000/api/citas/becario/${becario.id}`, {
              headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }
            });
            if (citasRes.ok) {
              const citasData = await citasRes.json();
              return (citasData.data || citasData).map(cita => ({
                ...cita,
                becario_nombre: becario.nombre + ' ' + (becario.apellido || '')
              }));
            }
            return [];
          } catch (err) {
            console.warn('Error obteniendo citas de becario', becario.id, err);
            return [];
          }
        });

        const citasArrays = await Promise.all(citasPromises);
        const todasCitas = citasArrays.flat();
        setCitasBecarios(todasCitas);
      }
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      notifications.error('Error al cargar datos de supervisión');
    } finally {
      setLoading(false);
    }
  };

  const enviarFeedback = async (becarioId) => {
    if (!feedback.trim()) {
      notifications.error('Por favor, escribe algún feedback');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      // Enviar feedback al backend
      const response = await fetch(`http://localhost:3000/api/observaciones/feedback/${becarioId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          feedback: feedback,
          tipo: 'supervision'
        })
      });

      if (response.ok) {
        // Enviar notificación al becario
        await fetch('http://localhost:3000/api/notificaciones', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({
            usuario_id: becarioId,
            titulo: 'Nuevo feedback de supervisión',
            mensaje: `Has recibido feedback de tu supervisor: "${feedback.substring(0, 100)}${feedback.length > 100 ? '...' : ''}"`,
            tipo: 'feedback_supervision'
          })
        });

        notifications.success(`Feedback enviado a ${becarios.find(b => b.id === becarioId)?.nombre}`);
        setFeedback('');
        setShowFeedback(false);
        fetchData(); // Recargar datos
      } else {
        notifications.error('Error al enviar feedback');
      }
    } catch (error) {
      console.error('Error enviando feedback:', error);
      notifications.error('Error al enviar feedback');
    }
  };

  const getBecarioObservaciones = (becarioId) => {
    return observaciones.filter(obs => 
      obs.becario_nombre === becarios.find(b => b.id === becarioId)?.nombre
    );
  };

  const verObservacionesPaciente = async (pacienteId, pacienteNombre) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/observaciones/paciente/${pacienteId}`, {
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }
      });

      if (response.ok) {
        const data = await response.json();
        setObservacionesPaciente(data);
        setSelectedPaciente({ id: pacienteId, nombre: pacienteNombre });
        setShowPacienteObservaciones(true);
      } else {
        notifications.error('Error al obtener observaciones del paciente');
      }
    } catch (error) {
      console.error('Error obteniendo observaciones del paciente:', error);
      notifications.error('Error al obtener observaciones del paciente');
    }
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
            const observacionesPendientes = becarioObservaciones.filter(o => o.tipo_observacion !== 'retroalimentacion').length;
            
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
                  <button 
                    className="btn-text"
                    onClick={() => {
                      // Para simplificar, mostrar observaciones del becario en general
                      // En una implementación completa, se necesitaría seleccionar un paciente específico
                      notifications.info('Funcionalidad de ver observaciones próximamente');
                    }}
                  >
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
                    obs.tipo_observacion === 'retroalimentacion' ? 'badge-success' : 'badge-warning'
                  }`}>
                    {obs.tipo_observacion === 'retroalimentacion' ? 'Feedback' : 'Pendiente'}
                  </div>
                </div>
                
                <div className="accordion-content">
                  <div className="grid-2 gap-20">
                    <div>
                      <h4>Observaciones</h4>
                      <p>{obs.contenido || obs.fortalezas || 'Sin observaciones detalladas'}</p>
                      
                      <h4 className="mt-10">Áreas de mejora</h4>
                      <p>{obs.areas_mejora || 'Sin áreas específicas'}</p>
                    </div>
                    
                    <div>
                      <h4>Feedback del supervisor</h4>
                      {obs.recomendaciones || obs.feedback ? (
                        <p>{obs.recomendaciones || obs.feedback}</p>
                      ) : (
                        <p className="text-danger">Sin feedback aún</p>
                      )}
                      
                      <button 
                        className="btn-text mt-10"
                        onClick={() => verObservacionesPaciente(obs.paciente_id, obs.paciente_nombre)}
                      >
                        <FiFileText /> Ver todas las observaciones del paciente
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Citas de Becarios */}
        <div className="mt-30">
          <h3>Citas Programadas por Becarios</h3>
          
          <div className="citas-list mt-10">
            {citasBecarios.length > 0 ? citasBecarios.map((cita) => (
              <div key={cita.id} className="cita-card">
                <div className="cita-header">
                  <div className="cita-date">{new Date(cita.fecha).toLocaleDateString()}</div>
                  <div className="cita-time">{cita.hora}</div>
                  <div className={`badge ${cita.estado === 'confirmada' ? 'badge-success' : cita.estado === 'completada' ? 'badge-primary' : 'badge-warning'}`}>
                    {cita.estado}
                  </div>
                </div>
                <div className="cita-body">
                  <div className="cita-patient">{cita.paciente_nombre}</div>
                  <div className="cita-becario">Becario: {cita.becario_nombre}</div>
                  <div className="cita-type">{cita.tipo_consulta}</div>
                  {cita.notas && <div className="cita-notes">{cita.notas}</div>}
                </div>
              </div>
            )) : (
              <p>No hay citas programadas por becarios.</p>
            )}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid-2 mt-30 gap-20">
          <div className="card">
            <h4>Resumen de Supervisión</h4>
            <div className="mt-10">
              <p>Total becarios: {becarios.length}</p>
              <p>Observaciones totales: {observaciones.length}</p>
              <p>Observaciones pendientes: {observaciones.filter(o => o.tipo_observacion !== 'retroalimentacion').length}</p>
              <p>Sesiones supervisadas: {becarios.reduce((sum, b) => sum + (b.sesiones_supervisadas || 0), 0)}</p>
            </div>
          </div>
          
          <div className="card">
            <h4>Acciones</h4>
            <div className="mt-10 flex-col gap-10">
              <button className="btn-primary w-100">
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

      {/* Modal para Observaciones del Paciente */}
      {showPacienteObservaciones && selectedPaciente && (
        <div className="modal-overlay">
          <div className="modal-container modal-large">
            <div className="modal-header">
              <h3>Observaciones de {selectedPaciente.nombre}</h3>
              <button className="modal-close" onClick={() => setShowPacienteObservaciones(false)}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="observaciones-list">
                {observacionesPaciente.length > 0 ? (
                  observacionesPaciente.map((obs) => (
                    <div key={obs.id} className="observacion-card">
                      <div className="observacion-header">
                        <div className="flex-row align-center gap-10">
                          <FiCalendar />
                          <span>{new Date(obs.fecha).toLocaleDateString()}</span>
                        </div>
                        <div className="flex-row align-center gap-10">
                          <FiUser />
                          <span>Becario: {obs.becario_nombre}</span>
                        </div>
                        <div className={`badge ${obs.tipo_observacion === 'retroalimentacion' ? 'badge-success' : 'badge-warning'}`}>
                          {obs.tipo_observacion === 'retroalimentacion' ? 'Feedback' : 'Observación'}
                        </div>
                      </div>
                      
                      <div className="observacion-content">
                        <div className="grid-2 gap-20">
                          <div>
                            <h5>Observaciones</h5>
                            <p>{obs.contenido || obs.fortalezas || 'Sin observaciones detalladas'}</p>
                            
                            <h5 className="mt-10">Áreas de mejora</h5>
                            <p>{obs.areas_mejora || 'Sin áreas específicas'}</p>
                          </div>
                          
                          <div>
                            <h5>Feedback del supervisor</h5>
                            {obs.recomendaciones || obs.feedback ? (
                              <p>{obs.recomendaciones || obs.feedback}</p>
                            ) : (
                              <p className="text-danger">Sin feedback aún</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">
                    <p>No hay observaciones registradas para este paciente</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowPacienteObservaciones(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PsicologoSupervision;