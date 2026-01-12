import React, { useState, useEffect } from 'react';
import { FiSearch, FiUser, FiCalendar, FiPhone, FiMail, FiFileText, FiFilter } from 'react-icons/fi';
import notifications from '../../utils/notifications';
import confirmations from '../../utils/confirmations';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

const PsicologoPacientes = () => {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [showDetalles, setShowDetalles] = useState(false);
  const [filterEstado, setFilterEstado] = useState('');

  // Estados para agendar cita
  const [showAgendarModal, setShowAgendarModal] = useState(false);
  const [becarios, setBecarios] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({
    fecha: new Date().toISOString().slice(0,10),
    hora: '10:00',
    tipo_consulta: 'presencial',
    duracion: 50,
    becario_id: null,
    notas: ''
  });

  // Estados para expediente y sesiones reales
  const [expediente, setExpediente] = useState(null);
  const [sesionesPaciente, setSesionesPaciente] = useState([]);
  const [showRegistrarSesionModal, setShowRegistrarSesionModal] = useState(false);
  const [registroSesionForm, setRegistroSesionForm] = useState({
    fecha: new Date().toISOString().slice(0,10),
    hora_inicio: '10:00',
    hora_fin: '10:50',
    desarrollo: '',
    conclusion: '',
    tareas_asignadas: '',
    siguiente_cita: '',
    privado: false
  });

  const fetchExpediente = async (pacienteId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/expedientes/paciente/${pacienteId}/completo`, {
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }
      });

      let json = null;
      try {
        json = await res.json();
      } catch (e) {
        console.warn('No JSON body in expediente response', e);
      }

      if (!res.ok) {
        console.error('Error fetching expediente:', res.status, json);
        notifications.error((json && (json.message || json.error)) || 'Error al obtener expediente');
        setExpediente(null);
        setSesionesPaciente([]);
        return;
      }

      const data = json?.data || {};
      setExpediente(data.expediente || {});
      setSesionesPaciente(data.sesiones || []);
    } catch (err) {
      console.error('Error al obtener expediente completo:', err);
      notifications.error('Error al obtener expediente');
      setExpediente(null);
      setSesionesPaciente([]);
    }
  };

  useEffect(() => {
    fetchPacientes();
    fetchBecarios();

    // Escuchar creación de citas para refrescar si es necesario
    const onCitaCreada = (e) => {
      try {
        console.log('Evento citaCreada recibido (psicologo):', e.detail);
        fetchPacientes();
      } catch(e) { console.warn(e); }
    };

    const onCitaActualizada = (e) => {
      try {
        console.log('Evento citaActualizada recibido (psicologo):', e.detail);
        fetchPacientes();
      } catch (e) { console.warn(e); }
    };

    window.addEventListener('citaCreada', onCitaCreada);
    window.addEventListener('citaActualizada', onCitaActualizada);
    return () => {
      window.removeEventListener('citaCreada', onCitaCreada);
      window.removeEventListener('citaActualizada', onCitaActualizada);
    };
  }, []);

  const fetchBecarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/users/becarios', {
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      const normalized = (data || []).map(b => ({ ...b, nombre_completo: b.nombre + (b.apellido ? ` ${b.apellido}` : '') }));
      setBecarios(normalized);
    } catch (err) {
      console.warn('No se pudieron obtener becarios:', err);
    }
  };

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
      // El endpoint puede devolver { success: true, data: [...] } o directamente un array
      const data = Array.isArray(json) ? json : (json.data || []);

      const mapped = data.map(p => ({
        id: p.id,
        nombre: p.nombre_completo || `${p.nombre || ''} ${p.apellido || ''}`.trim(),
        apellido: p.apellido,
        edad: p.edad,
        telefono: p.telefono,
        email: p.email,
        motivo_consulta: p.motivo_consulta || p.motivo || '',
        diagnostico: p.diagnostico_presuntivo || p.diagnostico || '',
        ultima_sesion: p.ultima_sesion || null,
        proxima_cita: p.proxima_cita || null,
        sesiones_completadas: p.sesiones_completadas || 0,
        estado: p.estado,
        becario: p.becario_nombre || p.becario || null,
        activo: p.activo !== undefined ? p.activo : true
      }));

      setPacientes(mapped);
    } catch (error) {
      console.error('Error al obtener pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPacientes = pacientes.filter(paciente => {
    const matchesSearch = 
      paciente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paciente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paciente.diagnostico.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = !filterEstado || paciente.estado === filterEstado;
    
    return matchesSearch && matchesEstado;
  });

  const showPacienteDetalles = (paciente) => {
    setSelectedPaciente(paciente);
    setShowDetalles(true);
    // Cargar expediente y sesiones reales
    fetchExpediente(paciente.id);
  };

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case 'activo':
        return { text: 'Activo', color: 'success' };
      case 'alta_terapeutica':
        return { text: 'Alta Terapéutica', color: 'primary' };
      case 'abandono':
        return { text: 'Abandono', color: 'danger' };
      default:
        return { text: estado, color: 'warning' };
    }
  };

  const exportarListadoPacientes = async () => {
    try {
      const titulo = filterEstado ? `Listado de ${getEstadoLabel(filterEstado).text}` : 'Listado de todos los pacientes';
      const fecha = new Date().toLocaleString();
      const rows = [];

      rows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Nombre', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Email', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Teléfono', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Edad', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Diagnóstico', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Sesiones', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Última Sesión', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Becario', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Estado', bold: true })] })] }),
        ],
      }));

      filteredPacientes.forEach(p => {
        rows.push(new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(p.nombre || '')] }),
            new TableCell({ children: [new Paragraph(p.email || '')] }),
            new TableCell({ children: [new Paragraph(p.telefono || '')] }),
            new TableCell({ children: [new Paragraph(p.edad ? String(p.edad) : '')] }),
            new TableCell({ children: [new Paragraph(p.diagnostico || p.motivo_consulta || '')] }),
            new TableCell({ children: [new Paragraph(String(p.sesiones_completadas || 0))] }),
            new TableCell({ children: [new Paragraph(p.ultima_sesion ? new Date(p.ultima_sesion).toLocaleDateString() : '')] }),
            new TableCell({ children: [new Paragraph(p.becario || '')] }),
            new TableCell({ children: [new Paragraph(getEstadoLabel(p.estado).text)] }),
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
      console.error('Error exportando listado de pacientes:', err);
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
    <div className="pacientes-page">
      <div className="page-header">
        <div>
          <h1>Mis Pacientes</h1>
          <p>Gestión de pacientes en tratamiento</p>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="filters-container mb-20">
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
          </select>
        </div>
      </div>

      {/* Tabla de Pacientes */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Contacto</th>
              <th>Diagnóstico</th>
              <th>Sesiones</th>
              <th>Última Sesión</th>
              <th>Becario</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPacientes.map((paciente) => {
              const estadoInfo = getEstadoLabel(paciente.estado);
              
              return (
                <tr key={paciente.id}>
                  <td>
                    <div className="flex-row align-center gap-10">
                      <div className="avatar">
                        {paciente.nombre.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-bold">{paciente.nombre}</div>
                        <div className="text-small">{paciente.edad} años</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>{paciente.email}</div>
                    <div className="text-small">{paciente.telefono}</div>
                  </td>
                  <td>
                    <div className="diagnostico-tag">
                      <div className="font-bold">{paciente.diagnostico || paciente.motivo_consulta || 'Sin diagnóstico'}</div>
                      {paciente.motivo_consulta && paciente.diagnostico && (
                        <div className="text-small">Motivo: {paciente.motivo_consulta}</div>
                      )}
                      {!paciente.diagnostico && paciente.motivo_consulta && (
                        <div className="text-small">{paciente.motivo_consulta}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="font-bold">{paciente.sesiones_completadas}</div>
                    <div className="text-small">sesiones</div>
                  </td>
                  <td>
                    {paciente.ultima_sesion ? new Date(paciente.ultima_sesion).toLocaleDateString() : 'N/A'}
                  </td>
                  <td>
                    {paciente.becario || 'Sin asignar'}
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
                        onClick={() => showPacienteDetalles(paciente)}
                        title="Ver detalles"
                      >
                        <FiFileText />
                      </button>
                      <button 
                        className="btn-text"
                        title="Agendar cita"
                        onClick={() => {
                          setSelectedPaciente(paciente);
                          // rellenar fecha/hora por defecto
                          setScheduleForm(prev => ({ ...prev, fecha: new Date().toISOString().slice(0,10), hora: '10:00', notas: '' }));
                          setShowAgendarModal(true);
                        }}
                      >
                        <FiCalendar />
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
            <p>Activos: {pacientes.filter(p => p.estado === 'activo').length}</p>
            <p>Con becario: {pacientes.filter(p => p.becario).length}</p>
          </div>
        </div>
        
        <div className="card">
          <h4>Sesiones Totales</h4>
          <div className="mt-10">
            <p className="stat-value">{pacientes.reduce((sum, p) => sum + p.sesiones_completadas, 0)}</p>
            <p className="text-small">sesiones realizadas</p>
          </div>
        </div>
        
        <div className="card">
          <h4>Acciones</h4>
          <div className="mt-10 flex-col gap-10">
            {/* <button className="btn-primary w-100">
              Agendar Cita Grupal
            </button> */}
            <button className="btn-secondary w-100">
              Generar Reporte
            </button>
            <button className="btn-primary w-100" onClick={exportarListadoPacientes}>
              Exportar Listado
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Detalles */}
      {showDetalles && selectedPaciente && (
        <div className="modal-overlay">
          <div className="modal-container modal-large">
            <div className="modal-header">
              <h3>Expediente de {selectedPaciente.nombre}</h3>
              <button className="modal-close" onClick={() => setShowDetalles(false)}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="grid-2 gap-20">
                <div>
                  <h4>Datos Personales</h4>
                  <div className="detail-row">
                    <strong>Nombre:</strong> {selectedPaciente.nombre}
                  </div>
                  <div className="detail-row">
                    <strong>Edad:</strong> {selectedPaciente.edad} años
                  </div>
                  <div className="detail-row">
                    <strong>Contacto:</strong> {selectedPaciente.telefono} • {selectedPaciente.email}
                  </div>
                  <div className="detail-row">
                    <strong>Motivo de consulta:</strong> {selectedPaciente.motivo_consulta}
                  </div>
                </div>
                
                <div>
                  <h4>Información Clínica</h4>
                  <div className="detail-row">
                    <strong>Diagnóstico:</strong> {selectedPaciente.diagnostico}
                  </div>
                  <div className="detail-row">
                    <strong>Estado:</strong> 
                    <span className={`badge badge-${getEstadoLabel(selectedPaciente.estado).color} ml-10`}>
                      {getEstadoLabel(selectedPaciente.estado).text}
                    </span>
                  </div>
                  <div className="detail-row">
                    <strong>Sesiones completadas:</strong> {selectedPaciente.sesiones_completadas}
                  </div>
                  <div className="detail-row">
                    <strong>Becario asignado:</strong> {selectedPaciente.becario || 'No asignado'}
                  </div>
                </div>
              </div>
              
              <div className="mt-20">
                <h4>Historial de Sesiones</h4>
                <div className="table-container mt-10">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Duración</th>
                        <th>Observaciones</th>
                        <th>Psicólogo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sesionesPaciente.length > 0 ? (
                        sesionesPaciente.map(s => (
                          <tr key={s.id}>
                            <td>{s.fecha ? new Date(s.fecha).toLocaleDateString() : ''}</td>
                            <td>{s.tipo_consulta || (s.Cita && s.Cita.tipo_consulta) || 'N/A'}</td>
                            <td>{s.hora_inicio && s.hora_fin ? `${s.hora_inicio} - ${s.hora_fin}` : (s.hora_inicio || '')}</td>
                            <td>{s.desarrollo || s.conclusion || ''}</td>
                            <td>{(s.psicologo_nombre || (s.Psicologo && `${s.Psicologo.nombre} ${s.Psicologo.apellido}`) || '')}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5">No hay sesiones registradas</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDetalles(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agendar Cita */}
      {showAgendarModal && selectedPaciente && (
        <div className="modal-overlay">
          <div className="modal-container modal-medium">
            <div className="modal-header">
              <h3>Agendar cita para {selectedPaciente.nombre}</h3>
              <button className="modal-close" onClick={() => setShowAgendarModal(false)}>×</button>
            </div>

            <div className="modal-content">
              <div className="form-grid">
                <div className="form-group">
                  <label>Fecha</label>
                  <input type="date" className="input-field" value={scheduleForm.fecha} onChange={(e) => setScheduleForm({...scheduleForm, fecha: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>Hora</label>
                  <input type="time" className="input-field" value={scheduleForm.hora} onChange={(e) => setScheduleForm({...scheduleForm, hora: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>Tipo</label>
                  <select className="select-field" value={scheduleForm.tipo_consulta} onChange={(e) => setScheduleForm({...scheduleForm, tipo_consulta: e.target.value})}>
                    <option value="presencial">Presencial</option>
                    <option value="virtual">Virtual</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Duración (min)</label>
                  <input type="number" className="input-field" value={scheduleForm.duracion} onChange={(e) => setScheduleForm({...scheduleForm, duracion: Number(e.target.value)})} />
                </div>

                <div className="form-group">
                  <label>Becario (opcional)</label>
                  <select className="select-field" value={scheduleForm.becario_id || ''} onChange={(e) => setScheduleForm({...scheduleForm, becario_id: e.target.value ? Number(e.target.value) : null})}>
                    <option value="">Sin becario</option>
                    {becarios.map(b => (
                      <option key={b.id} value={b.id}>{b.nombre_completo}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Notas</label>
                  <textarea rows="3" className="textarea-field" value={scheduleForm.notas} onChange={(e) => setScheduleForm({...scheduleForm, notas: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-primary" onClick={async () => {
                try {
                  notifications.info('Creando cita...');
                  const token = localStorage.getItem('token');
                  const body = {
                    paciente: { nombre: selectedPaciente.nombre, apellido: selectedPaciente.apellido, email: selectedPaciente.email || null, telefono: selectedPaciente.telefono || null },
                    fecha: scheduleForm.fecha,
                    hora: scheduleForm.hora,
                    tipo_consulta: scheduleForm.tipo_consulta,
                    duracion: scheduleForm.duracion,
                    notas: scheduleForm.notas,
                    becario_id: scheduleForm.becario_id || null
                  };

                  // Debug: registrar body que vamos a enviar
                  console.log('🚀 Enviando request POST /api/citas/nueva con body:', body);

                  const res = await fetch('http://localhost:3000/api/citas/nueva', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
                    body: JSON.stringify(body)
                  });

                  let json;
                  try {
                    json = await res.json();
                  } catch (err) {
                    console.error('Error parseando JSON de respuesta al crear cita:', err);
                    notifications.error('Error procesando respuesta del servidor');
                    return;
                  }

                  // Debug: ver respuesta del servidor
                  console.log('📥 Respuesta POST /api/citas/nueva:', res.status, json);

                  if (!res.ok) {
                    notifications.error(json.message || 'Error creando cita');
                    return;
                  }

                  notifications.success('Cita creada exitosamente');
                  setShowAgendarModal(false);

                  // Emitir evento para que calendario y otras vistas sincronicen
                  try { window.dispatchEvent(new CustomEvent('citaCreada', { detail: { cita: json.data } })); } catch(e) { console.warn(e); }

                } catch (err) {
                  console.error('Error creando cita:', err);
                  notifications.error('Error creando cita');
                }
              }}>
                Guardar cita
              </button>

              <button className="btn-danger" onClick={() => setShowAgendarModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar Sesión - afuera del modal detalles */}
      {showRegistrarSesionModal && selectedPaciente && (
        <div className="modal-overlay">
          <div className="modal-container modal-medium">
            <div className="modal-header">
              <h3>Registrar sesión para {selectedPaciente.nombre}</h3>
              <button className="modal-close" onClick={() => setShowRegistrarSesionModal(false)}>×</button>
            </div>

            <div className="modal-content">
              <div className="form-grid">
                <div className="form-group">
                  <label>Fecha</label>
                  <input type="date" className="input-field" value={registroSesionForm.fecha} onChange={(e) => setRegistroSesionForm({...registroSesionForm, fecha: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>Hora inicio</label>
                  <input type="time" className="input-field" value={registroSesionForm.hora_inicio} onChange={(e) => setRegistroSesionForm({...registroSesionForm, hora_inicio: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>Hora fin</label>
                  <input type="time" className="input-field" value={registroSesionForm.hora_fin} onChange={(e) => setRegistroSesionForm({...registroSesionForm, hora_fin: e.target.value})} />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Desarrollo</label>
                  <textarea rows="4" className="textarea-field" value={registroSesionForm.desarrollo} onChange={(e) => setRegistroSesionForm({...registroSesionForm, desarrollo: e.target.value})} />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Conclusión</label>
                  <textarea rows="3" className="textarea-field" value={registroSesionForm.conclusion} onChange={(e) => setRegistroSesionForm({...registroSesionForm, conclusion: e.target.value})} />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Tareas asignadas</label>
                  <textarea rows="3" className="textarea-field" value={registroSesionForm.tareas_asignadas} onChange={(e) => setRegistroSesionForm({...registroSesionForm, tareas_asignadas: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>Próxima sesión</label>
                  <input type="date" className="input-field" value={registroSesionForm.siguiente_cita || ''} onChange={(e) => setRegistroSesionForm({...registroSesionForm, siguiente_cita: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>Privado</label>
                  <div>
                    <input type="checkbox" checked={registroSesionForm.privado} onChange={(e) => setRegistroSesionForm({...registroSesionForm, privado: e.target.checked})} /> Privado
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-primary" onClick={async () => {
                try {
                  notifications.info('Registrando sesión...');
                  const token = localStorage.getItem('token');

                  // 1) Crear una cita temporal (si no existe) y marcarla completada
                  const citaBody = {
                    paciente: { nombre: selectedPaciente.nombre, apellido: selectedPaciente.apellido, email: selectedPaciente.email || null, telefono: selectedPaciente.telefono || null },
                    fecha: registroSesionForm.fecha,
                    hora: registroSesionForm.hora_inicio,
                    tipo_consulta: 'presencial',
                    duracion: 50,
                    notas: 'Sesión registrada desde expediente'
                  };

                  const resCita = await fetch('http://localhost:3000/api/citas/nueva', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
                    body: JSON.stringify(citaBody)
                  });

                  let jsonCita = null;
                  try { jsonCita = await resCita.json(); } catch(e) { console.warn('No JSON in create-cita response', e); }
                  if (!resCita.ok) {
                    console.error('Error creando cita temporal:', resCita.status, jsonCita);
                    notifications.error((jsonCita && (jsonCita.message || jsonCita.error)) || 'Error creando cita temporal');
                    return;
                  }

                  if (!jsonCita || !jsonCita.success) {
                    console.error('Create-cita response missing success flag:', jsonCita);
                    notifications.error(jsonCita && (jsonCita.message || 'Error creando cita temporal') || 'Error creando cita temporal');
                    return;
                  }

                  const citaCreada = jsonCita.data;

                  // Marcar cita como completada
                  const resPut = await fetch(`http://localhost:3000/api/citas/cita/${citaCreada.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
                    body: JSON.stringify({ estado: 'completada' })
                  });

                  let jsonPut = null;
                  try { jsonPut = await resPut.json(); } catch(e) { console.warn('No JSON in put-cita response', e); }
                  console.log('PUT /api/citas/cita/:id ->', resPut.status, jsonPut);
                  if (!resPut.ok) {
                    console.error('Error marcando cita como completada:', resPut.status, jsonPut);
                    notifications.error((jsonPut && (jsonPut.message || jsonPut.error)) || 'Error marcando cita como completada');
                    return;
                  }

                  if (!jsonPut || !jsonPut.success) {
                    console.error('Put-cita response missing success flag:', jsonPut);
                    notifications.error(jsonPut && (jsonPut.message || 'Error marcando cita como completada') || 'Error marcando cita como completada');
                    return;
                  }

                  // 2) Registrar sesión usando la cita creada
                  const sesionBody = {
                    cita_id: citaCreada.id,
                    desarrollo: registroSesionForm.desarrollo,
                    conclusion: registroSesionForm.conclusion,
                    tareas_asignadas: registroSesionForm.tareas_asignadas,
                    emocion_predominante: registroSesionForm.emocion_predominante || '',
                    // Enviar valores compatibles con el enum del backend
                    riesgo_suicida: 'ninguno',
                    // Enviar null si no hay escalas
                    escalas_aplicadas: registroSesionForm.escalas_aplicadas && registroSesionForm.escalas_aplicadas.length ? registroSesionForm.escalas_aplicadas : null,
                    siguiente_cita: registroSesionForm.siguiente_cita || null,
                    privado: registroSesionForm.privado || false
                  };

                  console.log('🚀 Enviando POST /api/sesiones con body:', sesionBody);

                  const resSesion = await fetch('http://localhost:3000/api/sesiones', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
                    body: JSON.stringify(sesionBody)
                  });

                  let jsonSesion = null;
                  try { jsonSesion = await resSesion.json(); } catch(e) { console.warn('No JSON in sesiones response', e); }
                  console.log('POST /api/sesiones ->', resSesion.status, jsonSesion);

                  if (!resSesion.ok) {
                    console.error('Error registrando sesión:', resSesion.status, jsonSesion);
                    notifications.error((jsonSesion && (jsonSesion.message || jsonSesion.error)) || 'Error registrando sesión');
                    return;
                  }

                  if (!jsonSesion || !jsonSesion.success) {
                    console.error('Sesion response missing success flag:', jsonSesion);
                    notifications.error(jsonSesion && (jsonSesion.message || 'Error registrando sesión') || 'Error registrando sesión');
                    return;
                  }

                  notifications.success('Sesión registrada exitosamente');
                  setShowRegistrarSesionModal(false);

                  // Refrescar expediente y sesiones
                  fetchExpediente(selectedPaciente.id);

                  // Emitir evento para sincronizar con la vista de Sesiones
                  try { window.dispatchEvent(new CustomEvent('sesionRegistrada', { detail: { sesion: jsonSesion.data } })); } catch(e) { console.warn(e); }

                } catch (err) {
                  console.error('Error registrando sesión:', err);
                  notifications.error('Error registrando sesión');
                }
              }}>
                Guardar sesión
              </button>

              <button className="btn-danger" onClick={() => setShowRegistrarSesionModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PsicologoPacientes;