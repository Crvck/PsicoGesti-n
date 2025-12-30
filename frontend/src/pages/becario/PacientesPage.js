import React, { useState, useEffect } from 'react';
import { FiSearch, FiUser, FiCalendar, FiPhone, FiMail, FiFileText } from 'react-icons/fi';
import notifications from '../../utils/notifications';
import confirmations from '../../utils/confirmations';

const BecarioPacientes = () => {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [showDetalles, setShowDetalles] = useState(false);

  useEffect(() => {
    fetchPacientes();
  }, []);

  const fetchPacientes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/pacientes/activos', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (!res.ok) {
        console.error('Error fetching pacientes activos:', res.status);
        return;
      }

      const json = await res.json();
      const data = Array.isArray(json) ? json : (json.data || []);

      const mapped = data.map(p => ({
        id: p.id,
        nombre: p.nombre_completo || `${p.nombre || ''} ${p.apellido || ''}`.trim(),
        edad: p.edad,
        telefono: p.telefono,
        email: p.email,
        motivo_consulta: p.motivo_consulta || p.motivo || '',
        ultima_sesion: p.ultima_sesion || null,
        proxima_cita: p.proxima_cita || null,
        sesiones_completadas: p.sesiones_completadas || 0,
        psicologo: p.psicologo_nombre || null,
        becario: p.becario_nombre || null,
        estado: p.estado,
        activo: p.activo !== undefined ? p.activo : true
      }));

      setPacientes(mapped);
    } catch (error) {
      console.error('Error al obtener pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPacientes = pacientes.filter(paciente =>
    paciente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paciente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paciente.motivo_consulta.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showPacienteDetalles = (paciente) => {
    setSelectedPaciente(paciente);
    setShowDetalles(true);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Cargando pacientes...</div>
      </div>
    );
  }

  return (
    <div className="pacientes-page">
      <div className="page-header">
        <div>
          <h1>Mis Pacientes</h1>
          <p>Pacientes asignados a tu supervisión</p>
        </div>
      </div>

      {/* Search */}
      <div className="search-box" style={{ marginBottom: '20px' }}>
        <FiSearch />
        <input
          type="text"
          className="search-input"
          placeholder="Buscar paciente por nombre, email o motivo de consulta..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Patients Grid */}
      <div className="grid-3">
        {filteredPacientes.map((paciente) => (
          <div key={paciente.id} className="card">
            <div className="flex-row align-center gap-10 mb-10">
              <div className="avatar">
                {paciente.nombre.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3>{paciente.nombre}</h3>
                <p className="text-small">{paciente.edad} años</p>
              </div>
            </div>

            <div className="flex-col gap-5 mb-10">
              <div className="flex-row align-center gap-5">
                <FiPhone size={14} />
                <span>{paciente.telefono}</span>
              </div>
              <div className="flex-row align-center gap-5">
                <FiMail size={14} />
                <span>{paciente.email}</span>
              </div>
              <div className="flex-row align-center gap-5">
                <FiCalendar size={14} />
                <span>Última: {new Date(paciente.ultima_sesion).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="mb-10">
              <p><strong>Motivo:</strong> {paciente.motivo_consulta}</p>
              <p><strong>Psicólogo:</strong> {paciente.psicologo}</p>
              <p><strong>Sesiones:</strong> {paciente.sesiones_completadas} completadas</p>
            </div>

            <div className="flex-row gap-10">
              <button 
                className="btn-secondary flex-1"
                onClick={() => showPacienteDetalles(paciente)}
              >
                <FiFileText /> Detalles
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Detalles */}
      {showDetalles && selectedPaciente && (
        <div className="modal-overlay">
          <div className="modal-container modal-large">
            <div className="modal-header">
              <h3>Detalles del Paciente</h3>
              <button className="modal-close" onClick={() => setShowDetalles(false)}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="grid-2 gap-20">
                <div>
                  <h4>Información Personal</h4>
                  <div className="detail-row">
                    <strong>Nombre:</strong> {selectedPaciente.nombre}
                  </div>
                  <div className="detail-row">
                    <strong>Edad:</strong> {selectedPaciente.edad} años
                  </div>
                  <div className="detail-row">
                    <strong>Teléfono:</strong> {selectedPaciente.telefono}
                  </div>
                  <div className="detail-row">
                    <strong>Email:</strong> {selectedPaciente.email}
                  </div>
                </div>
                
                <div>
                  <h4>Información Clínica</h4>
                  <div className="detail-row">
                    <strong>Motivo de consulta:</strong> {selectedPaciente.motivo_consulta}
                  </div>
                  <div className="detail-row">
                    <strong>Psicólogo asignado:</strong> {selectedPaciente.psicologo}
                  </div>
                  <div className="detail-row">
                    <strong>Sesiones completadas:</strong> {selectedPaciente.sesiones_completadas}
                  </div>
                  <div className="detail-row">
                    <strong>Próxima cita:</strong> {new Date(selectedPaciente.proxima_cita).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="mt-20">
                <h4>Historial de Citas Recientes</h4>
                <div className="table-container mt-10">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Estado</th>
                        <th>Tipo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{new Date(selectedPaciente.ultima_sesion).toLocaleDateString()}</td>
                        <td>10:00 AM</td>
                        <td><span className="badge badge-success">Completada</span></td>
                        <td>Presencial</td>
                      </tr>
                      <tr>
                        <td>2024-01-03</td>
                        <td>11:00 AM</td>
                        <td><span className="badge badge-success">Completada</span></td>
                        <td>Virtual</td>
                      </tr>
                      <tr>
                        <td>2023-12-27</td>
                        <td>09:00 AM</td>
                        <td><span className="badge badge-success">Completada</span></td>
                        <td>Presencial</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDetalles(false)}>
                Cerrar
              </button>
              <button className="btn-primary">
                Agendar Cita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BecarioPacientes;