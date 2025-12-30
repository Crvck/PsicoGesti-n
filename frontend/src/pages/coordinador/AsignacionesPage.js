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
  const [selectedPsicologo, setSelectedPsicologo] = useState(null);
  const [assignNotes, setAssignNotes] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');

      // Fetch becarios
      const resBec = await fetch('http://localhost:3000/api/users/becarios', {
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const becariosData = await resBec.json();
      setBecarios(becariosData || []);

      // Fetch all users and filter psicologos
      const resUsers = await fetch('http://localhost:3000/api/users', {
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const usersData = await resUsers.json();
      const psicologosList = (usersData || []).filter(u => u.rol === 'psicologo');
      setPsicologos(psicologosList);

      // Fetch pacientes sin asignar
      const resPacSin = await fetch('http://localhost:3000/api/pacientes/sin-asignar', {
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const pacSinJson = await resPacSin.json();
      const pacSinData = Array.isArray(pacSinJson) ? pacSinJson : (pacSinJson.data || []);
      setPacientesSinAsignar(pacSinData.map(p => ({ id: p.id, nombre: `${p.nombre} ${p.apellido}`, motivo: p.motivo_consulta || '', fecha_ingreso: p.fecha_ingreso })));

      // Fetch asignaciones activas
      const resAsig = await fetch('http://localhost:3000/api/asignaciones', {
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const asigJson = await resAsig.json();
      const asigData = Array.isArray(asigJson) ? asigJson : (asigJson.data || []);
      setAsignaciones(asigData.map(a => ({
        id: a.id,
        paciente: a.Paciente ? `${a.Paciente.nombre} ${a.Paciente.apellido}` : (a.paciente || ''),
        becario: a.Becario ? `${a.Becario.nombre} ${a.Becario.apellido}` : (a.becario || ''),
        psicologo: a.Psicologo ? `${a.Psicologo.nombre} ${a.Psicologo.apellido}` : (a.psicologo || ''),
        fecha_asignacion: a.fecha_inicio || a.created_at,
        estado: a.estado
      })));

      setLoading(false);
    } catch (error) {
      console.error('Error cargando asignaciones:', error);
      setLoading(false);
    }
  };

  const handleAsignarPaciente = async () => {
    if (!selectedPaciente || !selectedPsicologo) {
      notifications.error('Seleccione paciente y psicólogo');
      return;
    }

    try {
      setAssigning(true);
      const token = localStorage.getItem('token');
      const body = {
        paciente_id: selectedPaciente.id,
        psicologo_id: selectedPsicologo.id,
        becario_id: selectedBecario ? selectedBecario.id : null,
        notas: assignNotes
      };

      const res = await fetch('http://localhost:3000/api/asignaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify(body)
      });

      const json = await res.json();
      if (!res.ok) {
        notifications.error(json.message || 'Error creando asignación');
        setAssigning(false);
        return;
      }

      notifications.success('Asignación creada exitosamente');
      setShowModal(false);
      setSelectedPaciente(null);
      setSelectedBecario(null);
      setSelectedPsicologo(null);
      setAssignNotes('');

      // Refrescar datos
      await fetchData();
    } catch (error) {
      console.error('Error al asignar paciente:', error);
      notifications.error('Error al asignar paciente');
    } finally {
      setAssigning(false);
    }
  };

  const handleReasignar = (asignacionId, nuevoBecarioId) => {
    // Lógica para reasignar (por ahora simple placeholder)
    notifications.success(`Paciente reasignado exitosamente`);
  };

  const handleFinalizarAsignacion = async (asignacionId) => {
    try {
      const confirmado = await confirmations.warning('¿Estás seguro de finalizar esta asignación?');
      
      if (confirmado) {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3000/api/asignaciones/${asignacionId}/finalizar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }
        });

        const json = await res.json();
        if (!res.ok) {
          notifications.error(json.message || 'Error finalizando asignación');
          return;
        }

        notifications.success('Asignación finalizada exitosamente');
        await fetchData();
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
                  <select className="select-field" value={selectedPaciente?.id || ''} onChange={(e) => {
                    const id = Number(e.target.value);
                    const p = pacientesSinAsignar.find(x => x.id === id);
                    setSelectedPaciente(p || null);
                  }}>
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
                  <select className="select-field" value={selectedBecario?.id || ''} onChange={(e) => {
                    const id = Number(e.target.value);
                    const b = becarios.find(x => x.id === id);
                    setSelectedBecario(b || null);
                  }}>
                    <option value="">Seleccionar becario...</option>
                    {becarios.filter(b => b.activo).map(becario => (
                      <option key={becario.id} value={becario.id}>
                        {becario.nombre} {becario.pacientes_asignados ? `(${becario.pacientes_asignados}/${becario.capacidad || '-'})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Psicólogo Supervisor</label>
                  <select className="select-field" value={selectedPsicologo?.id || ''} onChange={(e) => {
                    const id = Number(e.target.value);
                    const p = psicologos.find(x => x.id === id);
                    setSelectedPsicologo(p || null);
                  }}>
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
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-primary" onClick={handleAsignarPaciente} disabled={assigning}>
                <FiCheckCircle /> {assigning ? 'Asignando...' : 'Confirmar Asignación'}
              </button>
              <button className="btn-danger" onClick={() => setShowModal(false)} disabled={assigning}>
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