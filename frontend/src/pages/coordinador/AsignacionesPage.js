import React, { useState, useEffect } from 'react';
import { 
  FiUsers, FiUserPlus, FiCheckCircle, FiXCircle, 
  FiRefreshCw, FiSearch, FiFilter, FiEdit2
} from 'react-icons/fi';
import './coordinador.css';
import notifications from '../../utils/notifications';
import confirmations from '../../utils/confirmations';

const CoordinadorAsignaciones = () => {
  const [becarios, setBecarios] = useState([]);
  const [psicologos, setPsicologos] = useState([]);
  const [pacientesSinAsignar, setPacientesSinAsignar] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBecario, setSelectedBecario] = useState(null);
  const [selectedPaciente, setSelectedPaciente] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Simulación de datos
      setTimeout(() => {
        setBecarios([
          { id: 1, nombre: 'Juan Pérez', especialidad: 'Practicante', pacientes_asignados: 3, capacidad: 5, activo: true },
          { id: 2, nombre: 'Sofía Ramírez', especialidad: 'Practicante', pacientes_asignados: 2, capacidad: 4, activo: true },
          { id: 3, nombre: 'Pedro Hernández', especialidad: 'Practicante', pacientes_asignados: 1, capacidad: 3, activo: true },
          { id: 4, nombre: 'Nuevo Becario', especialidad: 'Practicante', pacientes_asignados: 0, capacidad: 3, activo: false }
        ]);

        setPsicologos([
          { id: 1, nombre: 'Lic. Luis Fernández', especialidad: 'TCC', pacientes_total: 12 },
          { id: 2, nombre: 'Lic. Laura Gutiérrez', especialidad: 'Terapia Familiar', pacientes_total: 8 }
        ]);

        setPacientesSinAsignar([
          { id: 1, nombre: 'Ana Rodríguez', motivo: 'Depresión', fecha_ingreso: '2024-01-05' },
          { id: 2, nombre: 'Carlos Martínez', motivo: 'Ansiedad social', fecha_ingreso: '2024-01-08' },
          { id: 3, nombre: 'María González', motivo: 'Estrés postraumático', fecha_ingreso: '2024-01-10' }
        ]);

        setAsignaciones([
          { id: 1, paciente: 'Carlos Gómez', becario: 'Juan Pérez', psicologo: 'Lic. Luis Fernández', fecha_asignacion: '2023-10-15', estado: 'activa' },
          { id: 2, paciente: 'Mariana López', becario: 'Sofía Ramírez', psicologo: 'Lic. Luis Fernández', fecha_asignacion: '2023-11-20', estado: 'activa' },
          { id: 3, paciente: 'Roberto Sánchez', becario: 'Pedro Hernández', psicologo: 'Lic. Luis Fernández', fecha_asignacion: '2023-12-05', estado: 'activa' },
          { id: 4, paciente: 'Antonio Silva', becario: 'Juan Pérez', psicologo: 'Lic. Laura Gutiérrez', fecha_asignacion: '2024-01-03', estado: 'finalizada' }
        ]);

        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error cargando asignaciones:', error);
      setLoading(false);
    }
  };

  const handleAsignarPaciente = (pacienteId, becarioId) => {
    // Lógica para asignar paciente
    notifications.success(`Paciente asignado exitosamente al becario`);
    setShowModal(false);
  };

  const handleReasignar = (asignacionId, nuevoBecarioId) => {
    // Lógica para reasignar
    notifications.success(`Paciente reasignado exitosamente`);
  };

  const handleFinalizarAsignacion = async (asignacionId) => {
    try {
      const confirmado = await confirmations.warning('¿Estás seguro de finalizar esta asignación?');
      
      if (confirmado) {
        notifications.success('Asignación finalizada exitosamente');
      }
    } catch (error) {
      console.error('Error al finalizar asignación:', error);
      notifications.error('No se pudo finalizar la asignación');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Cargando asignaciones...</div>
      </div>
    );
  }

  return (
    <div className="configuracion-page">
      <div className="page-header">
        <div>
          <h1>Gestión de Asignaciones</h1>
          <p>Asignación de pacientes a becarios y psicólogos</p>
        </div>
        <button className="btn-secondary" onClick={fetchData}>
          <FiRefreshCw /> Actualizar
        </button>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid-3 mb-30">
        <div className="card">
          <h4>Becarios Activos</h4>
          <div className="stat-value">{becarios.filter(b => b.activo).length}</div>
          <div className="text-small">de {becarios.length} total</div>
        </div>
        
        <div className="card">
          <h4>Pacientes Sin Asignar</h4>
          <div className="stat-value">{pacientesSinAsignar.length}</div>
          <div className="text-small">esperando asignación</div>
        </div>
        
        <div className="card">
          <h4>Asignaciones Activas</h4>
          <div className="stat-value">{asignaciones.filter(a => a.estado === 'activa').length}</div>
          <div className="text-small">en curso</div>
        </div>
      </div>

      {/* Becarios Disponibles */}
      <div className="dashboard-section mb-20">
        <div className="section-header">
          <h3>Becarios Disponibles</h3>
          <button 
            className="btn-primary"
            onClick={() => setShowModal(true)}
          >
            <FiUserPlus /> Asignar Paciente
          </button>
        </div>
        
        <div className="grid-4">
          {becarios.map((becario) => (
            <div key={becario.id} className="card">
              <div className="flex-row align-center justify-between mb-10">
                <div className="flex-row align-center gap-10">
                  <div className="avatar">
                    {becario.nombre.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4>{becario.nombre}</h4>
                    <p className="text-small">{becario.especialidad}</p>
                  </div>
                </div>
                {becario.activo ? (
                  <span className="badge badge-success">Activo</span>
                ) : (
                  <span className="badge badge-danger">Inactivo</span>
                )}
              </div>
              
              <div className="card-progress">
                <div className="card-progress-label">
                  <span>Capacidad</span>
                  <span>{becario.pacientes_asignados}/{becario.capacidad}</span>
                </div>
                <div className="progress-container">
                  <div 
                    className="progress-bar"
                    style={{ width: `${(becario.pacientes_asignados / becario.capacidad) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {becario.activo && (
                <button 
                  className="btn-text w-100 mt-10"
                  onClick={() => {
                    setSelectedBecario(becario);
                    setShowModal(true);
                  }}
                >
                  Asignar paciente
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pacientes Sin Asignar */}
      <div className="dashboard-section mb-20">
        <div className="section-header">
          <h3>Pacientes Sin Asignar ({pacientesSinAsignar.length})</h3>
          <button className="btn-text">Ver todos</button>
        </div>
        
        {pacientesSinAsignar.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Motivo</th>
                  <th>Fecha Ingreso</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pacientesSinAsignar.map((paciente) => (
                  <tr key={paciente.id}>
                    <td>
                      <div className="flex-row align-center gap-10">
                        <div className="avatar-small">
                          {paciente.nombre.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span>{paciente.nombre}</span>
                      </div>
                    </td>
                    <td>
                      <span className="diagnostico-tag">{paciente.motivo}</span>
                    </td>
                    <td>{new Date(paciente.fecha_ingreso).toLocaleDateString()}</td>
                    <td>
                      <div className="flex-row gap-5">
                        <button 
                          className="btn-text"
                          onClick={() => {
                            setSelectedPaciente(paciente);
                            setShowModal(true);
                          }}
                        >
                          Asignar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-citas">
            <div className="no-citas-icon">✅</div>
            <div>Todos los pacientes están asignados</div>
          </div>
        )}
      </div>

      {/* Asignaciones Activas */}
      <div className="dashboard-section">
        <div className="section-header">
          <h3>Asignaciones Activas</h3>
          <div className="flex-row gap-10">
            <select className="select-field" style={{ width: '150px' }}>
              <option value="">Todas las asignaciones</option>
              <option value="activa">Activas</option>
              <option value="finalizada">Finalizadas</option>
            </select>
          </div>
        </div>
        
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Becario</th>
                <th>Psicólogo Supervisor</th>
                <th>Fecha Asignación</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {asignaciones.map((asignacion) => (
                <tr key={asignacion.id}>
                  <td>{asignacion.paciente}</td>
                  <td>
                    <div className="flex-row align-center gap-10">
                      <div className="avatar-small">
                        {asignacion.becario.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span>{asignacion.becario}</span>
                    </div>
                  </td>
                  <td>{asignacion.psicologo}</td>
                  <td>{new Date(asignacion.fecha_asignacion).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${asignacion.estado === 'activa' ? 'badge-success' : 'badge-primary'}`}>
                      {asignacion.estado}
                    </span>
                  </td>
                  <td>
                    <div className="flex-row gap-5">
                      <button 
                        className="btn-text"
                        onClick={() => handleReasignar(asignacion.id, 1)}
                      >
                        <FiEdit2 /> Reasignar
                      </button>
                      {asignacion.estado === 'activa' && (
                        <button 
                          className="btn-text text-danger"
                          onClick={() => handleFinalizarAsignacion(asignacion.id)}
                        >
                          <FiXCircle /> Finalizar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Asignación */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Asignar Paciente</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="form-grid">
                <div className="form-group">
                  <label>Seleccionar Paciente</label>
                  <select className="select-field">
                    <option value="">Seleccionar paciente...</option>
                    {pacientesSinAsignar.map(paciente => (
                      <option key={paciente.id} value={paciente.id}>
                        {paciente.nombre} - {paciente.motivo}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Seleccionar Becario</label>
                  <select className="select-field">
                    <option value="">Seleccionar becario...</option>
                    {becarios.filter(b => b.activo).map(becario => (
                      <option key={becario.id} value={becario.id}>
                        {becario.nombre} ({becario.pacientes_asignados}/{becario.capacidad})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Psicólogo Supervisor</label>
                  <select className="select-field">
                    <option value="">Seleccionar psicólogo...</option>
                    {psicologos.map(psicologo => (
                      <option key={psicologo.id} value={psicologo.id}>
                        {psicologo.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Notas de Asignación</label>
                  <textarea 
                    className="textarea-field" 
                    placeholder="Observaciones especiales para esta asignación..."
                    rows="3"
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-primary">
                <FiCheckCircle /> Confirmar Asignación
              </button>
              <button className="btn-danger" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinadorAsignaciones;