import React, { useState, useEffect } from 'react';
import { FiSearch, FiUserPlus, FiEdit2, FiTrash2, FiFilter, FiUser, FiMail, FiPhone, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import './coordinador.css';
import notifications from '../../utils/notifications';
import confirmations from '../../utils/confirmations';

const CoordinadorUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState('');
  const [includeInactivos, setIncludeInactivos] = useState(true); // mostrar inactivos por defecto
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
    activo: true,
    password: 'P@ssw0rd123' // contraseña temporal por defecto
  });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/users', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (!res.ok) {
        // Si no es coordinador o token inválido, podemos mostrar un mensaje y seguir
        console.error('Error fetching users:', res.status);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setUsuarios(data);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = 
      `${usuario.nombre} ${usuario.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRol = !filterRol || usuario.rol === filterRol;
    const matchesActivo = includeInactivos ? true : usuario.activo;
    
    return matchesSearch && matchesRol && matchesActivo;
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Si cambia el rol y estamos creando un nuevo usuario, establecer contraseña temporal por defecto
    setFormData(prev => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };

      if (name === 'rol' && modalType === 'nuevo') {
        // Mantener la contraseña temporal por defecto
        next.password = 'P@ssw0rd123';
      }

      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (modalType === 'nuevo') {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3000/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify(formData)
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          notifications.error(err.message || 'Error creando usuario');
          return;
        }

        const created = await res.json();
        // Añadir a la lista local (asegura compatibilidad de campos)
        setUsuarios(prev => [...prev, created]);
        notifications.success('Usuario creado exitosamente');
      } catch (error) {
        console.error('Error creando usuario:', error);
        notifications.error('Error creando usuario');
      }
    } else {
      // Editar usuario: enviar al backend
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3000/api/users/${formData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify(formData)
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          notifications.error(err.message || 'Error actualizando usuario');
          return;
        }

        const updated = await res.json();
        setUsuarios(prev => prev.map(u => u.id === updated.id ? updated : u));
        notifications.success('Usuario actualizado exitosamente');
      } catch (error) {
        console.error('Error actualizando usuario:', error);
        notifications.error('Error actualizando usuario');
      }
    }
    
    setShowModal(false);
    resetForm();
  };

  const deleteUsuario = async (id) => {
    const confirmado = await confirmations.danger('¿Seguro que desea eliminar este usuario?');
    if (!confirmado) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notifications.error(err.message || 'Error eliminando usuario');
        return;
      }

      setUsuarios(prev => prev.filter(u => u.id !== id));
      notifications.success('Usuario eliminado correctamente');
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      notifications.error('Error eliminando usuario');
    }
  };

  const editarUsuario = (usuario) => {
    // Mapear fecha si es string
    const mapped = {
      ...usuario,
      password: 'P@ssw0rd123'
    };
    setFormData(mapped);
    setModalType('editar');
    setShowModal(true);
  };

  const toggleEstadoUsuario = async (id) => {
    try {
      const token = localStorage.getItem('token');
      // Encontrar usuario actual
      const usuario = usuarios.find(u => u.id === id);
      if (!usuario) return;

      const res = await fetch(`http://localhost:3000/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ activo: !usuario.activo })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notifications.error(err.message || 'Error al cambiar estado');
        return;
      }

      const updated = await res.json();
      setUsuarios(prev => prev.map(u => u.id === id ? updated : u));
    } catch (error) {
      console.error('Error toggling activo:', error);
      notifications.error('Error cambiando estado de usuario');
    }
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
      activo: true,
      password: 'P@ssw0rd123'
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

          <label className="ml-10 flex-row align-center">
            <input
              type="checkbox"
              checked={includeInactivos}
              onChange={(e) => setIncludeInactivos(e.target.checked)}
            />
            <span className="ml-5">Incluir inactivos</span>
          </label>

          <button
            className="btn-secondary ml-10"
            onClick={() => { setFilterRol(''); setSearchTerm(''); setIncludeInactivos(true); fetchUsuarios(); }}
            title="Mostrar todos"
          >
            Mostrar todos
          </button>

          <button
            className="btn-secondary ml-10"
            onClick={() => fetchUsuarios()}
            title="Refrescar"
          >
            Actualizar
          </button>
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
                      <button
                        className="btn-text text-danger"
                        onClick={() => deleteUsuario(usuario.id)}
                        title="Eliminar"
                      >
                        <FiTrash2 />
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
                      name="password"
                      value={formData.password}
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