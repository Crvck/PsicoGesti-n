import React, { useState, useEffect } from 'react';
import { FiSearch, FiUserPlus, FiEdit, FiTrash2, FiFilter } from 'react-icons/fi';

const PacientesPage = () => {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setPacientes([
        {
          id: 1,
          nombre: 'Juan Pérez',
          email: 'juan@email.com',
          telefono: '555-1234',
          edad: 35,
          diagnostico: 'Ansiedad generalizada',
          ultimaSesion: '2024-01-10',
          proximaCita: '2024-01-17',
          estado: 'activo'
        },
        {
          id: 2,
          nombre: 'María García',
          email: 'maria@email.com',
          telefono: '555-5678',
          edad: 28,
          diagnostico: 'Depresión moderada',
          ultimaSesion: '2024-01-09',
          proximaCita: '2024-01-16',
          estado: 'activo'
        },
        {
          id: 3,
          nombre: 'Carlos López',
          email: 'carlos@email.com',
          telefono: '555-9012',
          edad: 42,
          diagnostico: 'Trastorno de estrés postraumático',
          ultimaSesion: '2024-01-08',
          proximaCita: '2024-01-15',
          estado: 'inactivo'
        },
        {
          id: 4,
          nombre: 'Ana Martínez',
          email: 'ana@email.com',
          telefono: '555-3456',
          edad: 31,
          diagnostico: 'Fobia social',
          ultimaSesion: '2024-01-07',
          proximaCita: '2024-01-14',
          estado: 'activo'
        },
        {
          id: 5,
          nombre: 'Roberto Díaz',
          email: 'roberto@email.com',
          telefono: '555-7890',
          edad: 39,
          diagnostico: 'Trastorno obsesivo-compulsivo',
          ultimaSesion: '2024-01-06',
          proximaCita: '2024-01-13',
          estado: 'pendiente'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredPacientes = pacientes.filter(paciente =>
    paciente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paciente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paciente.diagnostico.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este paciente?')) {
      setPacientes(pacientes.filter(p => p.id !== id));
    }
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
          <h1>Pacientes</h1>
          <p>Gestión de pacientes del consultorio</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowModal(true)}
        >
          <FiUserPlus /> Nuevo Paciente
        </button>
      </div>

      {/* Search and Filters */}
      <div className="filters-container">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar paciente por nombre, email o diagnóstico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-buttons">
          <button className="btn-secondary">
            <FiFilter /> Filtrar
          </button>
          <select className="select-field" style={{ width: '200px' }}>
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
            <option value="pendiente">Pendientes</option>
          </select>
        </div>
      </div>

      {/* Patients Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Contacto</th>
              <th>Edad</th>
              <th>Diagnóstico</th>
              <th>Última Sesión</th>
              <th>Próxima Cita</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPacientes.map((paciente) => (
              <tr key={paciente.id}>
                <td>
                  <div className="flex-row align-center gap-10">
                    <div className="avatar">
                      {paciente.nombre.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-bold">{paciente.nombre}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div>{paciente.email}</div>
                  <div className="text-small">{paciente.telefono}</div>
                </td>
                <td>{paciente.edad} años</td>
                <td>
                  <div className="diagnostico-tag">
                    {paciente.diagnostico}
                  </div>
                </td>
                <td>
                  {new Date(paciente.ultimaSesion).toLocaleDateString()}
                </td>
                <td>
                  {new Date(paciente.proximaCita).toLocaleDateString()}
                </td>
                <td>
                  <span className={`badge ${
                    paciente.estado === 'activo' ? 'badge-success' :
                    paciente.estado === 'inactivo' ? 'badge-danger' :
                    'badge-warning'
                  }`}>
                    {paciente.estado}
                  </span>
                </td>
                <td>
                  <div className="flex-row gap-5">
                    <button 
                      className="btn-text"
                      title="Editar"
                    >
                      <FiEdit />
                    </button>
                    <button 
                      className="btn-text text-danger"
                      onClick={() => handleDelete(paciente.id)}
                      title="Eliminar"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button className="page-item">«</button>
        <button className="page-item active">1</button>
        <button className="page-item">2</button>
        <button className="page-item">3</button>
        <button className="page-item">»</button>
      </div>

      {/* Modal para nuevo paciente (placeholder) */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">Nuevo Paciente</h3>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <p>Formulario para nuevo paciente...</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-primary"
                onClick={() => setShowModal(false)}
              >
                Guardar
              </button>
              <button 
                className="btn-danger"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PacientesPage;