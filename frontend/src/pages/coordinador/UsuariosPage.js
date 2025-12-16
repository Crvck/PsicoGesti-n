import React, { useState, useEffect } from 'react';
import { FiSearch, FiUserPlus, FiEdit2, FiTrash2, FiFilter, FiUser, FiMail, FiPhone, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import './coordinador.css';

const CoordinadorUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('nuevo');
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    rol: 'becario',
    especialidad: '',
    fundacion_id: '',
    activo: true
  });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      // Simulación de datos
      setTimeout(() => {
        setUsuarios([
          {
            id: 1,
            nombre: 'Ana',
            apellido: 'Martínez',
            email: 'coordinador@psicogestion.com',
            telefono: '555-1111',
            rol: 'coordinador',
            especialidad: 'Coordinación Clínica',
            activo: true,
            fecha_registro: '2023-01-15'
          },
          {
            id: 2,
            nombre: 'Luis',
            apellido: 'Fernández',
            email: 'psicologo1@psicogestion.com',
            telefono: '555-2222',
            rol: 'psicologo',
            especialidad: 'Terapia Cognitivo-Conductual',
            activo: true,
            fecha_registro: '2023-02-20'
          },
          {
            id: 3,
            nombre: 'Laura',
            apellido: 'Gutiérrez',
            email: 'psicologo2@psicogestion.com',
            telefono: '555-5555',
            rol: 'psicologo',
            especialidad: 'Terapia Familiar',
            activo: true,
            fecha_registro: '2023-03-10'
          },
          {
            id: 4,
            nombre: 'Juan',
            apellido: 'Pérez',
            email: 'becario1@psicogestion.com',
            telefono: '555-3333',
            rol: 'becario',
            especialidad: 'Practicante de Psicología',
            activo: true,
            fecha_registro: '2023-09-01'
          },
          {
            id: 5,
            nombre: 'Sofía',
            apellido: 'Ramírez',
            email: 'becario2@psicogestion.com',
            telefono: '555-4444',
            rol: 'becario',
            especialidad: 'Practicante de Psicología',
            activo: false,
            fecha_registro: '2023-10-15'
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      setLoading(false);
    }
  };

  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = 
      `${usuario.nombre} ${usuario.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRol = !filterRol || usuario.rol === filterRol;
    
    return matchesSearch && matchesRol;
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (modalType === 'nuevo') {
      const nuevoUsuario = {
        id: usuarios.length + 1,
        ...formData,
        fecha_registro: new Date().toISOString().split('T')[0]
      };
      setUsuarios([...usuarios, nuevoUsuario]);
      alert('Usuario creado exitosamente');
    } else {
      // Editar usuario
      setUsuarios(usuarios.map(u => 
        u.id === formData.id ? { ...u, ...formData } : u
      ));
      alert('Usuario actualizado exitosamente');
    }
    
    setShowModal(false);
    resetForm();
  };

  const editarUsuario = (usuario) => {
    setFormData(usuario);
    setModalType('editar');
    setShowModal(true);
  };

  const toggleEstadoUsuario = (id) => {
    setUsuarios(usuarios.map(u => 
      u.id === id ? { ...u, activo: !u.activo } : u
    ));
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      rol: 'becario',
      especialidad: '',
      fundacion_id: '',
      activo: true
    });
  };

  const getRolLabel = (rol) => {
    switch (rol) {
      case 'coordinador':
        return { text: 'Coordinador', color: 'danger' };
      case 'psicologo':
        return { text: 'Psicólogo', color: 'primary' };
      case 'becario':
        return { text: 'Becario', color: 'warning' };
      default:
        return { text: rol, color: 'info' };
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div className="configuracion-page">
      <div className="page-header">
        <div>
          <h1>Gestión de Usuarios</h1>
          <p>Administración de coordinadores, psicólogos y becarios</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => {
            resetForm();
            setModalType('nuevo');
            setShowModal(true);
          }}
        >
          <FiUserPlus /> Nuevo Usuario
        </button>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="filters-container mb-20">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar usuario por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-buttons">
          <select 
            value={filterRol} 
            onChange={(e) => setFilterRol(e.target.value)}
            className="select-field"
            style={{ width: '200px' }}
          >
            <option value="">Todos los roles</option>
            <option value="coordinador">Coordinadores</option>
            <option value="psicologo">Psicólogos</option>
            <option value="becario">Becarios</option>
          </select>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Contacto</th>
              <th>Rol</th>
              <th>Especialidad</th>
              <th>Fecha Registro</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsuarios.map((usuario) => {
              const rolInfo = getRolLabel(usuario.rol);
              
              return (
                <tr key={usuario.id}>
                  <td>
                    <div className="flex-row align-center gap-10">
                      <div className="avatar">
                        {usuario.nombre[0]}{usuario.apellido[0]}
                      </div>
                      <div>
                        <div className="font-bold">{usuario.nombre} {usuario.apellido}</div>
                        <div className="text-small">ID: {usuario.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>{usuario.email}</div>
                    <div className="text-small">{usuario.telefono}</div>
                  </td>
                  <td>
                    <span className={`badge badge-${rolInfo.color}`}>
                      {rolInfo.text}
                    </span>
                  </td>
                  <td>{usuario.especialidad}</td>
                  <td>
                    {new Date(usuario.fecha_registro).toLocaleDateString()}
                  </td>
                  <td>
                    {usuario.activo ? (
                      <span className="badge badge-success">Activo</span>
                    ) : (
                      <span className="badge badge-danger">Inactivo</span>
                    )}
                  </td>
                  <td>
                    <div className="flex-row gap-5">
                      <button 
                        className="btn-text"
                        onClick={() => editarUsuario(usuario)}
                        title="Editar"
                      >
                        <FiEdit2 />
                      </button>
                      <button 
                        className={`btn-text ${usuario.activo ? 'text-danger' : 'text-success'}`}
                        onClick={() => toggleEstadoUsuario(usuario.id)}
                        title={usuario.activo ? 'Desactivar' : 'Activar'}
                      >
                        {usuario.activo ? <FiXCircle /> : <FiCheckCircle />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Resumen */}
      <div className="grid-3 mt-20">
        <div className="card">
          <h4>Resumen de Usuarios</h4>
          <div className="mt-10">
            <p>Total: {usuarios.length}</p>
            <p>Activos: {usuarios.filter(u => u.activo).length}</p>
            <p>Becarios: {usuarios.filter(u => u.rol === 'becario').length}</p>
            <p>Psicólogos: {usuarios.filter(u => u.rol === 'psicologo').length}</p>
          </div>
        </div>
        
        <div className="card">
          <h4>Distribución por Rol</h4>
          <div className="mt-10">
            {Object.entries(
              usuarios.reduce((acc, user) => {
                acc[user.rol] = (acc[user.rol] || 0) + 1;
                return acc;
              }, {})
            ).map(([rol, count]) => (
              <div key={rol} className="flex-row justify-between mb-5">
                <span>{getRolLabel(rol).text}:</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="card">
          <h4>Acciones</h4>
          <div className="mt-10 flex-col gap-10">
            <button className="btn-primary w-100">
              Exportar Listado
            </button>
            <button className="btn-secondary w-100">
              Enviar Recordatorios
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Usuario */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>{modalType === 'nuevo' ? 'Nuevo Usuario' : 'Editar Usuario'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Apellido</label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>
                
                <div className="form-group">
                  <label>Rol</label>
                  <select
                    name="rol"
                    value={formData.rol}
                    onChange={handleInputChange}
                    className="select-field"
                    required
                  >
                    <option value="becario">Becario</option>
                    <option value="psicologo">Psicólogo</option>
                    <option value="coordinador">Coordinador</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Especialidad</label>
                  <input
                    type="text"
                    name="especialidad"
                    value={formData.especialidad}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Ej: Terapia Cognitivo-Conductual"
                  />
                </div>
                
                {formData.rol === 'psicologo' && (
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Contraseña Temporal</label>
                    <input
                      type="text"
                      value="P@ssw0rd123"
                      className="input-field"
                      readOnly
                    />
                    <p className="text-small mt-5">El usuario deberá cambiar la contraseña en su primer inicio</p>
                  </div>
                )}
                
                <div className="form-group">
                  <label className="flex-row align-center gap-10">
                    <input
                      type="checkbox"
                      name="activo"
                      checked={formData.activo}
                      onChange={handleInputChange}
                    />
                    <span>Usuario activo</span>
                  </label>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="submit" className="btn-primary">
                  {modalType === 'nuevo' ? 'Crear Usuario' : 'Guardar Cambios'}
                </button>
                <button 
                  type="button" 
                  className="btn-danger"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinadorUsuarios;