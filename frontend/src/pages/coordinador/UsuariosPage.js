import React, { useState, useEffect } from 'react';
import { FiSearch, FiUserPlus, FiEdit2, FiTrash2, FiFilter, FiUser, FiMail, FiPhone, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import './coordinador.css';
import notifications from '../../utils/notifications';
import confirmations from '../../utils/confirmations';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, WidthType } from 'docx';
import { saveAs } from 'file-saver';

const CoordinadorUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState('');
  const [includeInactivos, setIncludeInactivos] = useState(true); // mostrar inactivos por defecto
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('nuevo');
  const [showRecordatorioModal, setShowRecordatorioModal] = useState(false);
  const [showEstadisticasModal, setShowEstadisticasModal] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [estadisticasUsuario, setEstadisticasUsuario] = useState(null);
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(false);
  const [recordatorioConfig, setRecordatorioConfig] = useState({
    recordatorio_citas_activo: true,
    recordatorio_citas_frecuencia_dias: 7,
    recordatorio_citas_rango_dias: 7,
    recordatorio_citas_hora: '09:00'
  });
  const [recordatorioLoading, setRecordatorioLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    rol: 'coterapeuta',
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
      console.log('Usuarios recibidos:', data);
      setUsuarios(data);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecordatorioConfig = async () => {
    try {
      setRecordatorioLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/recordatorios/configuracion', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      const json = await res.json();
      if (!res.ok) {
        notifications.error(json.message || 'Error al cargar configuración');
        return;
      }

      setRecordatorioConfig({
        recordatorio_citas_activo: json.data.recordatorio_citas_activo ?? true,
        recordatorio_citas_frecuencia_dias: json.data.recordatorio_citas_frecuencia_dias ?? 7,
        recordatorio_citas_rango_dias: json.data.recordatorio_citas_rango_dias ?? 7,
        recordatorio_citas_hora: json.data.recordatorio_citas_hora ?? '09:00'
      });
    } catch (error) {
      console.error('Error cargando configuración de recordatorios:', error);
      notifications.error('Error al cargar configuración');
    } finally {
      setRecordatorioLoading(false);
    }
  };

  const fetchEstadisticasUsuario = async (userId) => {
    try {
      setLoadingEstadisticas(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/users/${userId}/estadisticas`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notifications.error(err.message || 'Error al obtener estadísticas');
        return;
      }

      const data = await res.json();
      setEstadisticasUsuario(data.data);
      setShowEstadisticasModal(true);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      notifications.error('Error al obtener estadísticas');
    } finally {
      setLoadingEstadisticas(false);
    }
  };

  const handleClickUsuario = (usuario) => {
    setUsuarioSeleccionado(usuario);
    fetchEstadisticasUsuario(usuario.id);
  };

  const handleGuardarRecordatorioConfig = async () => {
    try {
      setRecordatorioLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/recordatorios/configuracion', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(recordatorioConfig)
      });

      const json = await res.json();
      if (!res.ok) {
        notifications.error(json.message || 'Error al guardar configuración');
        return;
      }

      setRecordatorioConfig({
        recordatorio_citas_activo: json.data.recordatorio_citas_activo,
        recordatorio_citas_frecuencia_dias: json.data.recordatorio_citas_frecuencia_dias,
        recordatorio_citas_rango_dias: json.data.recordatorio_citas_rango_dias,
        recordatorio_citas_hora: json.data.recordatorio_citas_hora
      });

      notifications.success('Configuración guardada');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      notifications.error('Error al guardar configuración');
    } finally {
      setRecordatorioLoading(false);
    }
  };

  const handleEnviarRecordatorios = async () => {
    try {
      setRecordatorioLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/recordatorios/enviar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      const json = await res.json();
      if (!res.ok) {
        notifications.error(json.message || 'Error al enviar recordatorios');
        return;
      }

      notifications.success('Recordatorios enviados');
    } catch (error) {
      console.error('Error enviando recordatorios:', error);
      notifications.error('Error al enviar recordatorios');
    } finally {
      setRecordatorioLoading(false);
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

      const payload = await res.json().catch(() => ({}));
      const updatedUser = payload.usuario;
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, activo: false } : u));
      if (updatedUser) {
        setUsuarios(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      }
      notifications.success('Usuario inactivado correctamente');
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
      rol: 'coterapeuta',
      especialidad: '',
      fundacion_id: '',
      activo: true,
      password: 'P@ssw0rd123'
    });
  };

  const exportarListado = async () => {
    try {
      
      const titulo = filterRol ? `Listado de ${getRolLabel(filterRol).text}` : 'Listado de todos los usuarios';
      const fecha = new Date().toLocaleString();
      const rows = [];

      // Header
      rows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Nombre', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Email', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Teléfono', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Rol', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Especialidad', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Fecha Registro', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Estado', bold: true })] })] }),
        ],
      }));

      filteredUsuarios.forEach(u => {
        rows.push(new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(`${u.nombre} ${u.apellido}`)] }),
            new TableCell({ children: [new Paragraph(u.email || '')] }),
            new TableCell({ children: [new Paragraph(u.telefono || '')] }),
            new TableCell({ children: [new Paragraph(getRolLabel(u.rol).text)] }),
            new TableCell({ children: [new Paragraph(u.especialidad || '')] }),
            new TableCell({ children: [new Paragraph(u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString() : '')] }),
            new TableCell({ children: [new Paragraph(u.activo ? 'Activo' : 'Inactivo')] }),
          ],
        }));
      });

      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({ text: titulo, heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ text: `Generado: ${fecha}`, spacing: { after: 200 } }),
            new Table({ rows })
          ]
        }]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${titulo.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.docx`);
      notifications.success('Descarga iniciada');
    } catch (err) {
      console.error('Error exportando listado:', err);
      notifications.error('Error exportando listado');
    }
  };

  const getRolLabel = (rol) => {
    switch (rol) {
      case 'coordinador':
        return { text: 'Coordinador', color: 'primary' };
      case 'terapeuta':
        return { text: 'Terapeuta', color: 'success' };
      case 'coterapeuta':
        return { text: 'Coterapeuta', color: 'warning' };
      case 'psicopedagogico':
        return { text: 'Psicopedagógico', color: 'secondary' };
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
          <p>Administración de coordinadores, terapeutas y coterapeutas</p>
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
            <option value="psicopedagogico">Psicopedagógicos</option>
            <option value="terapeuta">Terapeutas</option>
            <option value="coterapeuta">Coterapeutas</option>
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
      <div className="table-container" style={{ maxHeight: '480px', overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Contacto</th>
              <th>Rol</th>
              <th>Especialidad</th>
              <th>Fecha Registro</th>
              <th>Horas Liberadas</th>
              <th>Horas Objetivo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsuarios.map((usuario) => {
              const rolInfo = getRolLabel(usuario.rol);
              
              return (
                <tr 
                  key={usuario.id}
                  onClick={() => handleClickUsuario(usuario)}
                  style={{ cursor: 'pointer' }}
                  className="hoverable-row"
                >
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
                    <span className={`badge badge-${usuario.activo ? rolInfo.color : 'danger'}`}>
                      {rolInfo.text}
                    </span>
                  </td>
                  <td>{usuario.especialidad}</td>
                  <td>
                    {new Date(usuario.fecha_registro).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="font-bold" style={{ color: 'var(--grnb)' }}>
                      {usuario.horas_liberadas !== undefined ? `${usuario.horas_liberadas}h` : '-'}
                    </div>
                  </td>
                  <td>
                    <div className="font-bold" style={{ color: 'var(--blu)' }}>
                      {usuario.horas_objetivo !== undefined ? `${usuario.horas_objetivo}h` : '-'}
                    </div>
                  </td>
                  <td>
                    {usuario.activo ? (
                      <span className="badge badge-success">Activo</span>
                    ) : (
                      <span className="badge badge-danger">Inactivo</span>
                    )}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
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
            <p>Psicopedagógicos: {usuarios.filter(u => u.rol === 'psicopedagogico').length}</p>
            <p>Coterapeutas: {usuarios.filter(u => u.rol === 'coterapeuta').length}</p>
            <p>Terapeutas: {usuarios.filter(u => u.rol === 'terapeuta').length}</p>
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
            <button className="btn-primary w-100" onClick={exportarListado}>
              Exportar Listado
            </button>
            <button
              className="btn-secondary w-100"
              onClick={() => {
                setShowRecordatorioModal(true);
                fetchRecordatorioConfig();
              }}
            >
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
                    value={formData.nombre || ''}
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
                    value={formData.apellido || ''}
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
                    value={formData.email || ''}
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
                    value={formData.telefono || ''}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>
                
                <div className="form-group">
                  <label>Rol</label>
                  <select
                    name="rol"
                    value={formData.rol || ''}
                    onChange={handleInputChange}
                    className="select-field"
                    required
                  >
                    <option value="coterapeuta">Coterapeuta</option>
                    <option value="terapeuta">Terapeuta</option>
                    <option value="psicopedagogico">Psicopedagógico</option>
                    <option value="coordinador">Coordinador</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Especialidad</label>
                  <input
                    type="text"
                    name="especialidad"
                    value={formData.especialidad || ''}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Ej: Terapia Cognitivo-Conductual"
                  />
                </div>
                
                {formData.rol === 'terapeuta' && (
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

      {/* Modal Recordatorios */}
      {showRecordatorioModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Recordatorios de Citas</h3>
              <button className="modal-close" onClick={() => setShowRecordatorioModal(false)}>×</button>
            </div>

            <div className="modal-content">
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="flex-row align-center gap-10">
                    <input
                      type="checkbox"
                      checked={recordatorioConfig.recordatorio_citas_activo}
                      onChange={(e) => setRecordatorioConfig(prev => ({
                        ...prev,
                        recordatorio_citas_activo: e.target.checked
                      }))}
                    />
                    <span>Recordatorio automático activo</span>
                  </label>
                </div>

                <div className="form-group">
                  <label>Frecuencia (días)</label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    value={recordatorioConfig.recordatorio_citas_frecuencia_dias}
                    onChange={(e) => setRecordatorioConfig(prev => ({
                      ...prev,
                      recordatorio_citas_frecuencia_dias: Number(e.target.value)
                    }))}
                  />
                </div>

                <div className="form-group">
                  <label>Rango de citas (días)</label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    value={recordatorioConfig.recordatorio_citas_rango_dias}
                    onChange={(e) => setRecordatorioConfig(prev => ({
                      ...prev,
                      recordatorio_citas_rango_dias: Number(e.target.value)
                    }))}
                  />
                </div>

                <div className="form-group">
                  <label>Hora de envío</label>
                  <input
                    type="time"
                    className="input-field"
                    value={recordatorioConfig.recordatorio_citas_hora}
                    onChange={(e) => setRecordatorioConfig(prev => ({
                      ...prev,
                      recordatorio_citas_hora: e.target.value
                    }))}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleEnviarRecordatorios}
                disabled={recordatorioLoading}
              >
                Enviar ahora
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleGuardarRecordatorioConfig}
                disabled={recordatorioLoading}
              >
                Guardar configuración
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => setShowRecordatorioModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Estadísticas de Usuario */}
      {showEstadisticasModal && estadisticasUsuario && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>Estadísticas de {estadisticasUsuario.usuario.nombre} {estadisticasUsuario.usuario.apellido}</h3>
              <button className="modal-close" onClick={() => setShowEstadisticasModal(false)}>×</button>
            </div>

            <div className="modal-content">
              {/* Información del Usuario */}
              <div style={{ marginBottom: '20px', padding: '15px', background: 'var(--blud)', borderRadius: '8px' }}>
                <div className="flex-row justify-between align-center">
                  <div>
                    <div className="font-bold" style={{ fontSize: '18px' }}>
                      {estadisticasUsuario.usuario.nombre} {estadisticasUsuario.usuario.apellido}
                    </div>
                    <div className="text-small">{estadisticasUsuario.usuario.email}</div>
                  </div>
                  <div>
                    <span className={`badge badge-${getRolLabel(estadisticasUsuario.usuario.rol).color}`}>
                      {getRolLabel(estadisticasUsuario.usuario.rol).text}
                    </span>
                  </div>
                </div>
                {estadisticasUsuario.usuario.especialidad && (
                  <div className="text-small mt-5">
                    <strong>Especialidad:</strong> {estadisticasUsuario.usuario.especialidad}
                  </div>
                )}
              </div>

              {/* Estadísticas Generales */}
              <div className="grid-4 mb-20">
                <div className="card">
                  <h4>Total Citas</h4>
                  <div className="stat-value">{estadisticasUsuario.estadisticas.total_citas}</div>
                </div>
                <div className="card">
                  <h4>Completadas</h4>
                  <div className="stat-value" style={{ color: 'var(--grnb)' }}>
                    {estadisticasUsuario.estadisticas.citas_completadas}
                  </div>
                  <div className="text-small">{estadisticasUsuario.estadisticas.tasa_completitud}%</div>
                </div>
                <div className="card">
                  <h4>Canceladas</h4>
                  <div className="stat-value" style={{ color: 'var(--rr)' }}>
                    {estadisticasUsuario.estadisticas.citas_canceladas}
                  </div>
                  <div className="text-small">{estadisticasUsuario.estadisticas.tasa_cancelacion}%</div>
                </div>
                <div className="card">
                  <h4>Horas Liberadas</h4>
                  <div className="stat-value" style={{ color: 'var(--blu)' }}>
                    {estadisticasUsuario.estadisticas.horas_liberadas}h
                  </div>
                  <div className="text-small">
                    de {estadisticasUsuario.estadisticas.horas_objetivo}h objetivo
                  </div>
                </div>
              </div>

              {/* Motivos de Cancelación */}
              {estadisticasUsuario.motivos_cancelacion.length > 0 && (
                <div className="mb-20">
                  <h4 className="mb-10">Motivos de Cancelación</h4>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Motivo</th>
                          <th>Cantidad</th>
                          <th>Porcentaje</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estadisticasUsuario.motivos_cancelacion.map((item, idx) => {
                          const total = estadisticasUsuario.motivos_cancelacion.reduce((sum, m) => sum + m.cantidad, 0);
                          const porcentaje = ((item.cantidad / total) * 100).toFixed(1);
                          return (
                            <tr key={idx}>
                              <td>{item.motivo}</td>
                              <td>{item.cantidad}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ 
                                    width: '100px', 
                                    height: '8px', 
                                    background: '#e0e0e0', 
                                    borderRadius: '4px',
                                    overflow: 'hidden'
                                  }}>
                                    <div style={{ 
                                      width: `${porcentaje}%`, 
                                      height: '100%', 
                                      background: 'var(--rr)',
                                      transition: 'width 0.3s ease'
                                    }}></div>
                                  </div>
                                  <span>{porcentaje}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Pacientes Asignados */}
              <div className="mb-20">
                <h4 className="mb-10">
                  Pacientes Asignados Actualmente ({estadisticasUsuario.pacientes_asignados.length})
                </h4>
                {estadisticasUsuario.pacientes_asignados.length > 0 ? (
                  <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Género</th>
                          <th>Edad</th>
                          <th>Fecha Asignación</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estadisticasUsuario.pacientes_asignados.map((p) => (
                          <tr key={p.paciente_id}>
                            <td>{p.nombre} {p.apellido}</td>
                            <td>{p.genero}</td>
                            <td>{p.edad} años</td>
                            <td>{new Date(p.fecha_asignacion).toLocaleDateString()}</td>
                            <td>
                              <span className={`badge badge-${p.activo ? 'success' : 'danger'}`}>
                                {p.activo ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center">No tiene pacientes asignados actualmente</p>
                )}
              </div>

              {/* Historial de Pacientes */}
              <div className="mb-20">
                <h4 className="mb-10">
                  Historial de Pacientes ({estadisticasUsuario.historial_pacientes.length})
                </h4>
                {estadisticasUsuario.historial_pacientes.length > 0 ? (
                  <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Género</th>
                          <th>Edad</th>
                          <th>Fecha Asignación</th>
                          <th>Fecha Fin</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estadisticasUsuario.historial_pacientes.map((p) => (
                          <tr key={p.asignacion_id}>
                            <td>{p.nombre} {p.apellido}</td>
                            <td>{p.genero}</td>
                            <td>{p.edad} años</td>
                            <td>{new Date(p.fecha_asignacion).toLocaleDateString()}</td>
                            <td>{p.fecha_fin ? new Date(p.fecha_fin).toLocaleDateString() : '-'}</td>
                            <td>
                              <span className={`badge badge-${p.estado === 'activa' ? 'success' : 'secondary'}`}>
                                {p.estado}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center">No tiene historial de pacientes</p>
                )}
              </div>

              {/* Sesiones Completadas */}
              <div className="mb-20">
                <h4 className="mb-10">
                  Últimas Sesiones Completadas ({estadisticasUsuario.sesiones_completadas.length})
                </h4>
                {estadisticasUsuario.sesiones_completadas.length > 0 ? (
                  <div className="table-container" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Hora</th>
                          <th>Paciente</th>
                          <th>Tipo</th>
                          <th>Duración</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estadisticasUsuario.sesiones_completadas.map((s) => (
                          <tr key={s.cita_id}>
                            <td>{new Date(s.fecha).toLocaleDateString()}</td>
                            <td>{s.hora}</td>
                            <td>{s.paciente_nombre}</td>
                            <td>
                              <span className={`badge badge-${s.tipo_consulta === 'presencial' ? 'primary' : 'info'}`}>
                                {s.tipo_consulta}
                              </span>
                            </td>
                            <td>{s.duracion} min</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center">No tiene sesiones completadas</p>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowEstadisticasModal(false)}
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

export default CoordinadorUsuarios;