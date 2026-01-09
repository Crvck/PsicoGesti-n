import React, { useState, useEffect } from 'react';
import { FiSearch, FiUserPlus, FiEdit2, FiTrash2, FiFilter, FiUser, FiCalendar, FiPhone, FiMail, FiFileText, FiXCircle, FiCheckCircle } from 'react-icons/fi';
import './coordinador.css';
import notifications from '../../utils/notifications';
import confirmations from '../../utils/confirmations';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

const CoordinadorPacientes = () => {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [includeInactivos, setIncludeInactivos] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('nuevo');
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    fecha_nacimiento: '',
    genero: '',
    telefono: '',
    email: '',
    direccion: '',
    es_estudiante: false,
    matricula: '',
    institucion_educativa: '',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
    motivo_consulta: '',
    antecedentes: '',
    activo: true,
    estado: 'activo'
  });

  useEffect(() => {
    fetchPacientes();
  }, []);

  const fetchPacientes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/pacientes', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (!res.ok) {
        console.error('Error fetching pacientes:', res.status);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setPacientes(data);
    } catch (error) {
      console.error('Error al obtener pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPacientes = pacientes.filter(paciente => {
    const matchesSearch = 
      `${paciente.nombre} ${paciente.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (paciente.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (paciente.motivo_consulta || paciente.notas || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = !filterEstado || paciente.estado === filterEstado;
    const matchesActivo = includeInactivos ? true : paciente.activo;
    
    return matchesSearch && matchesEstado && matchesActivo;
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (modalType === 'nuevo') {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3000/api/pacientes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify(formData)
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          notifications.error(err.message || 'Error creando paciente');
          return;
        }

        const created = await res.json();
        setPacientes(prev => [...prev, created]);
        // Emitir evento para notificar a otras vistas (ej. Asignaciones) que un paciente fue creado
        window.dispatchEvent(new CustomEvent('pacienteCreado', { detail: created }));
        notifications.success('Paciente creado exitosamente');
      } catch (error) {
        console.error('Error creando paciente:', error);
        notifications.error('Error creando paciente');
      }
    } else {
      // Editar paciente: enviar al backend
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3000/api/pacientes/${formData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify(formData)
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          notifications.error(err.message || 'Error actualizando paciente');
          return;
        }

        const updated = await res.json();
        setPacientes(prev => prev.map(p => p.id === updated.id ? updated : p));
        notifications.success('Paciente actualizado exitosamente');
      } catch (error) {
        console.error('Error actualizando paciente:', error);
        notifications.error('Error actualizando paciente');
      }
    }
    
    setShowModal(false);
    resetForm();
  };

  const editarPaciente = (paciente) => {
    setFormData({ ...paciente });
    setModalType('editar');
    setShowModal(true);
  };

  const toggleActivoPaciente = async (id) => {
    try {
      const paciente = pacientes.find(p => p.id === id);
      if (!paciente) return;
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/pacientes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ activo: !paciente.activo })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notifications.error(err.message || 'Error cambiando estado');
        return;
      }

      const updated = await res.json();
      setPacientes(prev => prev.map(p => p.id === id ? updated : p));
    } catch (error) {
      console.error('Error toggling paciente activo:', error);
      notifications.error('Error cambiando estado del paciente');
    }
  };

  const deletePaciente = async (id) => {
    const confirmado = await confirmations.danger('¿Seguro que desea eliminar (inactivar) este paciente?');
    if (!confirmado) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/pacientes/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notifications.error(err.message || 'Error eliminando paciente');
        return;
      }

      setPacientes(prev => prev.filter(p => p.id !== id));
      notifications.success('Paciente eliminado (inactivado) correctamente');
    } catch (error) {
      console.error('Error eliminando paciente:', error);
      notifications.error('Error eliminando paciente');
    }
  };

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case 'activo':
        return { text: 'Activo', color: 'success' };
      case 'alta_terapeutica':
        return { text: 'Alta Terapéutica', color: 'primary' };
      case 'abandono':
        return { text: 'Abandono', color: 'danger' };
      case 'traslado':
        return { text: 'Traslado', color: 'warning' };
      default:
        return { text: estado, color: 'info' };
    }
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'N/A';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      fecha_nacimiento: '',
      genero: '',
      telefono: '',
      email: '',
      direccion: '',
      es_estudiante: false,
      matricula: '',
      institucion_educativa: '',
      contacto_emergencia_nombre: '',
      contacto_emergencia_telefono: '',
      motivo_consulta: '',
      antecedentes: '',
      activo: true,
      estado: 'activo'
    });
  };

  const exportarListadoPacientes = async () => {
    try {
      console.log('exportarListadoPacientes called, pacientes filtrados:', filteredPacientes.length);
      notifications.info('Iniciando exportación...');
      const titulo = filterEstado ? `Listado de ${getEstadoLabel(filterEstado).text}` : 'Listado de todos los pacientes';
      const fecha = new Date().toLocaleString();
      const rows = [];

      // Header
      rows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Nombre', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Apellido', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Email', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Teléfono', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Edad', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Motivo', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Psicólogo', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Becario', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Sesiones', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Estado', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Activo', bold: true })] })] }),
        ]
      }));

      filteredPacientes.forEach(p => {
        rows.push(new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(p.nombre || '')] }),
            new TableCell({ children: [new Paragraph(p.apellido || '')] }),
            new TableCell({ children: [new Paragraph(p.email || '')] }),
            new TableCell({ children: [new Paragraph(p.telefono || '')] }),
            new TableCell({ children: [new Paragraph(calcularEdad(p.fecha_nacimiento) || '')] }),
            new TableCell({ children: [new Paragraph(p.motivo_consulta || '')] }),
            new TableCell({ children: [new Paragraph(p.psicologo_asignado || '')] }),
            new TableCell({ children: [new Paragraph(p.becario_asignado || '')] }),
            new TableCell({ children: [new Paragraph(String(p.sesiones_completadas || 0))] }),
            new TableCell({ children: [new Paragraph(getEstadoLabel(p.estado).text || '')] }),
            new TableCell({ children: [new Paragraph(p.activo ? 'Sí' : 'No')] }),
          ]
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
      console.error('Error exportando listado de pacientes (coordinador):', err);
      notifications.error('Error exportando listado');
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
    <div className="configuracion-page">
      <div className="page-header">
        <div>
          <h1>Gestión de Pacientes</h1>
          <p>Administración de pacientes del sistema</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => {
            resetForm();
            setModalType('nuevo');
            setShowModal(true);
          }}
        >
          <FiUserPlus /> Nuevo Paciente
        </button>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="filters-container mb-20">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar paciente por nombre, email o motivo de consulta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-buttons">
          <select 
            value={filterEstado} 
            onChange={(e) => setFilterEstado(e.target.value)}
            className="select-field"
            style={{ width: '200px' }}
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="alta_terapeutica">Altas Terapéuticas</option>
            <option value="abandono">Abandonos</option>
            <option value="traslado">Traslados</option>
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
            onClick={() => { setFilterEstado(''); setSearchTerm(''); setIncludeInactivos(true); fetchPacientes(); }}
            title="Mostrar todos"
          >
            Mostrar todos
          </button>

          <button
            className="btn-secondary ml-10"
            onClick={() => fetchPacientes()}
            title="Refrescar"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Tabla de Pacientes */}
      <div className="table-container" style={{ maxHeight: '480px', overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Contacto</th>
              <th>Edad</th>
              <th>Motivo</th>
              <th>Asignaciones</th>
              <th>Sesiones</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPacientes.map((paciente) => {
              const estadoInfo = getEstadoLabel(paciente.estado);
              const edad = calcularEdad(paciente.fecha_nacimiento);
              
              return (
                <tr key={paciente.id}>
                  <td>
                    <div className="flex-row align-center gap-10">
                      <div className="avatar">
                        {paciente.nombre[0]}{paciente.apellido[0]}
                      </div>
                      <div>
                        <div className="font-bold">{paciente.nombre} {paciente.apellido}</div>
                        <div className="text-small">
                          {paciente.es_estudiante ? 'Estudiante' : 'No estudiante'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>{paciente.email}</div>
                    <div className="text-small">{paciente.telefono}</div>
                  </td>
                  <td>{edad} años</td>
                  <td>
                    <div className="diagnostico-tag">
                      {paciente.motivo_consulta}
                    </div>
                  </td>
                  <td>
                    <div className="text-small">{paciente.psicologo_asignado}</div>
                    <div className="text-small">
                      {paciente.becario_asignado || 'Sin asignar'}
                    </div>
                  </td>
                  <td>
                    <div className="font-bold">{paciente.sesiones_completadas}</div>
                    <div className="text-small">sesiones</div>
                  </td>
                  <td>
                    <span className={`badge badge-${estadoInfo.color}`}>
                      {estadoInfo.text}
                    </span>
                  </td>
                  <td>
                    <div className="flex-row gap-5">
                      <button 
                        className="btn-text"
                        onClick={() => editarPaciente(paciente)}
                        title="Editar"
                      >
                        <FiEdit2 />
                      </button>

                      <button 
                        className={`btn-text ${paciente.activo ? 'text-danger' : 'text-success'}`}
                        onClick={() => toggleActivoPaciente(paciente.id)}
                        title={paciente.activo ? 'Desactivar' : 'Activar'}
                      >
                        {paciente.activo ? <FiXCircle /> : <FiCheckCircle />}
                      </button>

                      <button
                        className="btn-text text-danger"
                        onClick={() => deletePaciente(paciente.id)}
                        title="Eliminar"
                      >
                        <FiTrash2 />
                      </button>

                      <button 
                        className="btn-text"
                        title="Ver expediente"
                      >
                        <FiFileText />
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
          <h4>Resumen de Pacientes</h4>
          <div className="mt-10">
            <p>Total: {pacientes.length}</p>
            <p>Activos: {pacientes.filter(p => p.activo).length}</p>
            <p>Estudiantes: {pacientes.filter(p => p.es_estudiante).length}</p>
            <p>Con becario: {pacientes.filter(p => p.becario_asignado).length}</p>
          </div>
        </div>
        
        <div className="card">
          <h4>Estadísticas</h4>
          <div className="mt-10">
            <p>Sesiones totales: {pacientes.reduce((sum, p) => sum + (p.sesiones_completadas || 0), 0)}</p>
            <p>Promedio por paciente: {
              Math.round(pacientes.reduce((sum, p) => sum + (p.sesiones_completadas || 0), 0) / Math.max(pacientes.length, 1))
            }</p>
            <p>Altas este mes: {pacientes.filter(p => p.estado === 'alta_terapeutica').length}</p>
          </div>
        </div>
        
        <div className="card">
          <h4>Acciones</h4>
          <div className="mt-10 flex-col gap-10">
            
            <button type="button" className="btn-secondary w-100" onClick={exportarListadoPacientes}>
              Exportar Listado
            </button>
            <button className="btn-warning w-100">
              Revisar Altas
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Paciente */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container modal-large">
            <div className="modal-header">
              <h3>{modalType === 'nuevo' ? 'Nuevo Paciente' : 'Editar Paciente'}</h3>
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
                  <label>Fecha de nacimiento</label>
                  <input
                    type="date"
                    name="fecha_nacimiento"
                    value={formData.fecha_nacimiento}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>
                
                <div className="form-group">
                  <label>Género</label>
                  <select
                    name="genero"
                    value={formData.genero}
                    onChange={handleInputChange}
                    className="select-field"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                    <option value="prefiero_no_decir">Prefiero no decir</option>
                  </select>
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
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>
                
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Dirección</label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>
                
                <div className="form-group">
                  <label className="flex-row align-center gap-10">
                    <input
                      type="checkbox"
                      name="es_estudiante"
                      checked={formData.es_estudiante}
                      onChange={handleInputChange}
                    />
                    <span>Es estudiante</span>
                  </label>
                </div>
                
                {formData.es_estudiante && (
                  <>
                    <div className="form-group">
                      <label>Matrícula</label>
                      <input
                        type="text"
                        name="matricula"
                        value={formData.matricula}
                        onChange={handleInputChange}
                        className="input-field"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Institución educativa</label>
                      <input
                        type="text"
                        name="institucion_educativa"
                        value={formData.institucion_educativa}
                        onChange={handleInputChange}
                        className="input-field"
                      />
                    </div>
                  </>
                )}
                
                <div className="form-group">
                  <label>Contacto de emergencia</label>
                  <input
                    type="text"
                    name="contacto_emergencia_nombre"
                    value={formData.contacto_emergencia_nombre}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Nombre"
                  />
                </div>
                
                <div className="form-group">
                  <label>Teléfono emergencia</label>
                  <input
                    type="tel"
                    name="contacto_emergencia_telefono"
                    value={formData.contacto_emergencia_telefono}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Teléfono"
                  />
                </div>
                
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Motivo de consulta</label>
                  <textarea
                    name="motivo_consulta"
                    value={formData.motivo_consulta}
                    onChange={handleInputChange}
                    className="textarea-field"
                    rows="3"
                    required
                  />
                </div>
                
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Antecedentes</label>
                  <textarea
                    name="antecedentes"
                    value={formData.antecedentes}
                    onChange={handleInputChange}
                    className="textarea-field"
                    rows="3"
                  />
                </div>
                
                <div className="form-group">
                  <label>Estado</label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleInputChange}
                    className="select-field"
                  >
                    <option value="activo">Activo</option>
                    <option value="alta_terapeutica">Alta Terapéutica</option>
                    <option value="abandono">Abandono</option>
                    <option value="traslado">Traslado</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="flex-row align-center gap-10">
                    <input
                      type="checkbox"
                      name="activo"
                      checked={formData.activo}
                      onChange={handleInputChange}
                    />
                    <span>Paciente activo</span>
                  </label>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="submit" className="btn-primary">
                  {modalType === 'nuevo' ? 'Crear Paciente' : 'Guardar Cambios'}
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

export default CoordinadorPacientes;