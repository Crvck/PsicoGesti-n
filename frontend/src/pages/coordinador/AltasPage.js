import React, { useState, useEffect } from 'react';
import { 
  FiTrendingUp, FiCheckCircle, FiXCircle, FiFilter,
  FiSearch, FiCalendar, FiUser, FiFileText, FiDownload,
  FiUsers, FiActivity, FiBarChart2, FiClock
} from 'react-icons/fi';
import './coordinador.css';
import notifications from '../../utils/notifications';
import confirmations from '../../utils/confirmations';
import ApiService from '../../services/api';

const CoordinadorAltas = () => {
  const [altas, setAltas] = useState([]);
  const [candidatosAlta, setCandidatosAlta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroMes, setFiltroMes] = useState('');
  
  // Estados para el modal de dar de alta
  const [showModalAlta, setShowModalAlta] = useState(false);
  const [selectedPacienteAlta, setSelectedPacienteAlta] = useState(null);
  
  // Estados para el modal de ver detalles
  const [showModalDetalles, setShowModalDetalles] = useState(false);
  const [selectedAltaDetalles, setSelectedAltaDetalles] = useState(null);
  
  const [estadisticas, setEstadisticas] = useState({});
  const [formData, setFormData] = useState({
    paciente_id: '',
    tipo_alta: '',
    motivo_detallado: '',
    recomendaciones: '',
    evaluacion_final: '',
    seguimiento_recomendado: false,
    fecha_seguimiento: ''
  });

  useEffect(() => {
    fetchAltas();
    fetchEstadisticas();
    fetchCandidatosAlta();
  }, []);

  const fetchAltas = async () => {
    try {
      setLoading(true);
      const response = await ApiService.get('/altas');
      if (response.success) {
        setAltas(response.data);
      } else {
        notifications.error(response.message || 'Error al cargar las altas');
      }
    } catch (error) {
      console.error('Error cargando altas:', error);
      notifications.error('Error al cargar el historial de altas');
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidatosAlta = async () => {
    try {
      const response = await ApiService.get('/pacientes/candidatos-alta');
      if (response.success) {
        setCandidatosAlta(response.data.map(paciente => ({
          id: paciente.id,
          paciente_nombre: paciente.paciente_nombre,
          edad: paciente.edad || 'N/A',
          motivo_consulta: paciente.motivo_consulta || 'Sin información',
          fecha_ingreso: paciente.fecha_ingreso,
          sesiones_completadas: paciente.sesiones_completadas || 0,
          progreso: Math.min(100, paciente.progreso_estimado || 0),
          psicologo: paciente.psicologo_nombre || 'Sin asignar',
          becario: paciente.becario_nombre || 'No asignado',
          recomendacion: paciente.sesiones_completadas >= 10 
            ? 'Posible alta en 1-2 sesiones más' 
            : 'Evaluar en próxima revisión'
        })));
      }
    } catch (error) {
      console.error('Error cargando candidatos:', error);
      notifications.error('Error al cargar candidatos a alta');
    }
  };

  const fetchEstadisticas = async () => {
    try {
      const response = await ApiService.get('/altas/estadisticas');
      if (response.success) {
        setEstadisticas(response.data);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const procesarAlta = async (pacienteId, decision) => {
    try {
      if (decision === 'aprobar') {
        const paciente = candidatosAlta.find(p => p.id === pacienteId);
        if (paciente) {
          setFormData({
            paciente_id: paciente.id,
            tipo_alta: 'terapeutica',
            motivo_detallado: '',
            recomendaciones: '',
            evaluacion_final: '',
            seguimiento_recomendado: false,
            fecha_seguimiento: ''
          });
          setSelectedPacienteAlta(paciente);
          setShowModalAlta(true);
        }
      } else {
        const confirmado = await confirmations.danger(
          '¿Estás seguro de marcar este paciente como "No Aprobar"? ' +
          'El paciente no será mostrado como candidato a alta por 30 días.'
        );
        
        if (confirmado) {
          try {
            console.log(`📤 Enviando solicitud para marcar paciente ${pacienteId} como no aprobado...`);
            
            // Llamar al endpoint
            const response = await ApiService.post(`/pacientes/${pacienteId}/no-aprobar-alta`);
            
            if (response.success) {
              notifications.success(`✅ ${response.message}`);
              console.log('✅ Respuesta del backend:', response.data);
              
              // 1. Eliminar inmediatamente del estado local
              setCandidatosAlta(prev => prev.filter(p => p.id !== pacienteId));
              
              // 2. Recargar después de 2 segundos para confirmar
              setTimeout(async () => {
                console.log('🔄 Recargando lista de candidatos...');
                await fetchCandidatosAlta();
              }, 2000);
            } else {
              notifications.error(`❌ ${response.message || 'Error desconocido'}`);
            }
          } catch (error) {
            console.error('❌ Error al marcar como no aprobado:', error);
            notifications.error(`❌ Error: ${error.message || 'Error de conexión'}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error en el proceso de alta:', error);
      notifications.error('❌ Ocurrió un error al procesar la solicitud');
    }
  };

  const handleSubmitAlta = async (e) => {
    e.preventDefault();
    
    try {
      const confirmado = await confirmations.warning(
        '¿Estás seguro de dar de alta a este paciente? Esta acción no se puede deshacer.'
      );
      
      if (!confirmado) return;

      const response = await ApiService.post('/altas', formData);
      
      if (response.success) {
        notifications.success(response.message || 'Paciente dado de alta exitosamente');
        
        // Actualizar listas
        setAltas([response.data.alta, ...altas]);
        
        // Recargar la lista de candidatos (para que desaparezca de la lista)
        await fetchCandidatosAlta();
        
        // Recargar estadísticas
        await fetchEstadisticas();
        
        // Limpiar y cerrar modal
        setFormData({
          paciente_id: '',
          tipo_alta: '',
          motivo_detallado: '',
          recomendaciones: '',
          evaluacion_final: '',
          seguimiento_recomendado: false,
          fecha_seguimiento: ''
        });
        setShowModalAlta(false);
        setSelectedPacienteAlta(null);
      } else {
        notifications.error(response.message || 'Error al dar de alta');
      }
    } catch (error) {
      console.error('Error al dar de alta:', error);
      notifications.error('Error al procesar el alta del paciente');
    }
  };

  const handleFilterChange = async () => {
    try {
      setLoading(true);
      let url = '/altas?';
      const params = [];
      
      if (filtroEstado) params.push(`tipo_alta=${filtroEstado}`);
      if (filtroMes) {
        const year = new Date().getFullYear();
        params.push(`fecha_inicio=${year}-${parseInt(filtroMes) + 1}-01`);
        params.push(`fecha_fin=${year}-${parseInt(filtroMes) + 1}-31`);
      }
      
      if (params.length > 0) {
        url += params.join('&');
      }
      
      const response = await ApiService.get(url);
      if (response.success) {
        setAltas(response.data);
      }
    } catch (error) {
      console.error('Error aplicando filtros:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportarReporteAltas = async () => {
    try {
      notifications.info('Generando reporte de altas...');
      
      // Obtener fechas del filtro actual
      const params = new URLSearchParams();
      if (filtroMes) {
        const year = new Date().getFullYear();
        const month = parseInt(filtroMes) + 1;
        params.append('fecha_inicio', `${year}-${month.toString().padStart(2, '0')}-01`);
        params.append('fecha_fin', `${year}-${month.toString().padStart(2, '0')}-31`);
      }
      if (filtroEstado) {
        params.append('tipo_alta', filtroEstado);
      }
      
      const response = await ApiService.get(`/reportes/altas?formato=excel&${params.toString()}`);
      
      if (response.success && response.data.archivo_url) {
        notifications.success(`Reporte generado exitosamente (${response.data.total_registros} registros)`);
      } else {
        notifications.error('Error al generar el reporte');
      }
    } catch (error) {
      console.error('Error exportando reporte:', error);
      notifications.error('Error al generar el reporte de altas');
    }
  };

  const getTipoAltaLabel = (tipo) => {
    switch (tipo) {
        case 'terapeutica':
            return { text: 'Alta Terapéutica', color: 'success', icon: '✅' };
        case 'abandono':
            return { text: 'Abandono', color: 'danger', icon: '❌' };
        case 'traslado':
            return { text: 'Traslado', color: 'warning', icon: '🔄' };
        case 'graduacion':
            return { text: 'Graduación', color: 'primary', icon: '🎓' };
        case 'no_continua':
            return { text: 'No Continúa', color: 'info', icon: '⏸️' };
        case 'no_aprobado':
            return { text: 'No Aprobado', color: 'danger', icon: '🚫' };
        case 'otro':
            return { text: 'Otro', color: 'info', icon: '📋' };
        default:
            return { text: tipo, color: 'info', icon: '📋' };
    }
  };

  const calcularSatisfaccion = (paciente) => {
    if (paciente.tipo_alta === 'terapeutica') {
      return Math.min(5, Math.floor((paciente.sesiones_totales || 0) / 4) + 3);
    } else if (paciente.tipo_alta === 'abandono') {
      return 1;
    } else {
      return 3;
    }
  };

  if (loading && altas.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Cargando seguimiento de altas...</div>
      </div>
    );
  }

  return (
    <div className="configuracion-page">
      <div className="page-header">
        <div>
          <h1>Seguimiento de Altas</h1>
          <p>Gestión y seguimiento de altas terapéuticas</p>
        </div>
      </div>

      {/* Estadísticas de Altas */}
      <div className="grid-4 mb-30">
        <div className="card">
          <div className="stat-box">
            <div className="stat-icon">
              <FiUsers />
            </div>
            <div className="stat-content">
              <div className="stat-value">{estadisticas.totales?.total_altas || 0}</div>
              <div className="stat-label">Total de Altas</div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="stat-box">
            <div className="stat-icon">
              <FiCheckCircle />
            </div>
            <div className="stat-content">
              <div className="stat-value">
                {estadisticas.estadisticas?.find(e => e.tipo_alta === 'terapeutica')?.total || 0}
              </div>
              <div className="stat-label">Altas Terapéuticas</div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="stat-box">
            <div className="stat-icon">
              <FiClock />
            </div>
            <div className="stat-content">
              <div className="stat-value">
                {estadisticas.totales?.promedio_sesiones_global || 0}
              </div>
              <div className="stat-label">Sesiones Promedio</div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="stat-box">
            <div className="stat-icon">
              <FiTrendingUp />
            </div>
            <div className="stat-content">
              <div className="stat-value">{candidatosAlta.length}</div>
              <div className="stat-label">Candidatos a Alta</div>
            </div>
          </div>
        </div>
      </div>

      {/* Candidatos a Alta */}
      <div className="dashboard-section mb-30">
        <div className="section-header">
          <h3>Candidatos a Alta ({candidatosAlta.length})</h3>
        </div>
        
        {candidatosAlta.length > 0 ? (
          <div className="grid-2">
            {candidatosAlta.map((paciente) => (
              <div key={paciente.id} className="card">
                <div className="flex-row align-center justify-between mb-15">
                  <div className="flex-row align-center gap-10">
                    <div className="avatar">
                      {paciente.paciente_nombre.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4>{paciente.paciente_nombre}</h4>
                      <p className="text-small">{paciente.edad} años • {paciente.motivo_consulta}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{paciente.progreso}%</div>
                    <div className="text-small">progreso</div>
                  </div>
                </div>
                
                <div className="mb-15">
                  <div className="card-progress-label">
                    <span>{paciente.sesiones_completadas} sesiones</span>
                    <span>{paciente.progreso}%</span>
                  </div>
                  <div className="progress-container">
                    <div 
                      className="progress-bar"
                      style={{ width: `${paciente.progreso}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid-2 gap-10 mb-15">
                  <div>
                    <div className="text-small">Psicólogo</div>
                    <div className="font-bold">{paciente.psicologo}</div>
                  </div>
                  <div>
                    <div className="text-small">Becario</div>
                    <div className="font-bold">{paciente.becario || 'No asignado'}</div>
                  </div>
                </div>
                
                <div className="mb-15">
                  <div className="text-small">Recomendación</div>
                  <div className="font-bold text-success">{paciente.recomendacion}</div>
                </div>
                
                <div className="flex-row gap-10">
                  <button 
                    className="btn-primary flex-1"
                    onClick={() => procesarAlta(paciente.id, 'aprobar')}
                  >
                    <FiCheckCircle /> Procesar Alta
                  </button>
                  <button 
                    className="btn-danger flex-1"
                    onClick={() => procesarAlta(paciente.id, 'rechazar')}
                  >
                    <FiXCircle /> No Aprobar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-citas">
            <div className="no-citas-icon">✅</div>
            <div>No hay candidatos a alta pendientes</div>
            <p className="text-small mt-10">Los psicólogos propondrán pacientes para alta cuando estén listos</p>
          </div>
        )}
      </div>

      {/* Historial de Altas */}
      <div className="dashboard-section">
        <div className="section-header">
          <h3>Historial de Altas ({altas.length})</h3>
          <div className="flex-row gap-10">
            <select 
              value={filtroEstado} 
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="select-field"
              style={{ width: '180px' }}
            >
              <option value="">Todos los tipos</option>
              <option value="terapeutica">Altas Terapéuticas</option>
              <option value="abandono">Abandonos</option>
              <option value="traslado">Traslados</option>
              <option value="graduacion">Graduaciones</option>
              <option value="no_continua">No Continúa</option>
              <option value="no_aprobado">No Aprobado</option>
              <option value="otro">Otro</option>
            </select>
            
            <select 
              value={filtroMes} 
              onChange={(e) => setFiltroMes(e.target.value)}
              className="select-field"
              style={{ width: '150px' }}
            >
              <option value="">Todos los meses</option>
              <option value="0">Enero</option>
              <option value="1">Febrero</option>
              <option value="2">Marzo</option>
              <option value="3">Abril</option>
              <option value="4">Mayo</option>
              <option value="5">Junio</option>
              <option value="6">Julio</option>
              <option value="7">Agosto</option>
              <option value="8">Septiembre</option>
              <option value="9">Octubre</option>
              <option value="10">Noviembre</option>
              <option value="11">Diciembre</option>
            </select>
            
            <button 
              className="btn-secondary" 
              onClick={handleFilterChange}
              disabled={loading}
            >
              <FiFilter /> Aplicar
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-container" style={{ minHeight: '200px' }}>
            <div className="loading-spinner"></div>
            <div className="loading-text">Cargando altas...</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Tipo de Alta</th>
                  <th>Fecha Alta</th>
                  <th>Sesiones</th>
                  <th>Profesional</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {altas.map((alta) => {
                  const tipoInfo = getTipoAltaLabel(alta.tipo_alta);
                  const satisfaccion = calcularSatisfaccion(alta);
                  
                  return (
                    <tr key={alta.id}>
                      <td>
                        <div className="flex-row align-center gap-10">
                          <div className="avatar-small">
                            {(alta.paciente_nombre || '').split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-bold">
                              {alta.paciente_nombre || 'Nombre no disponible'} {alta.paciente_apellido || ''}
                            </div>
                            <div className="text-small">
                              {alta.motivo_detallado?.substring(0, 30) || 'Sin motivo específico'}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${tipoInfo.color}`}>
                          {tipoInfo.icon} {tipoInfo.text}
                        </span>
                      </td>
                      <td>
                        <div className="font-bold">
                          {new Date(alta.fecha_alta).toLocaleDateString()}
                        </div>
                        <div className="text-small">
                          Por: {alta.usuario_nombre} {alta.usuario_apellido}
                        </div>
                      </td>
                      <td>
                        <div className="font-bold">{alta.sesiones_totales || 0}</div>
                        <div className="text-small">sesiones</div>
                      </td>
                      <td>
                        <div className="text-small">Satisfacción:</div>
                        <div className="flex-row align-center gap-5">
                          {'★'.repeat(satisfaccion)}
                          {'☆'.repeat(5 - satisfaccion)}
                          <span className="ml-5">({satisfaccion}/5)</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex-row gap-5">
                          <button 
                            className="btn-text"
                            onClick={async () => {
                              try {
                                console.log(`📋 Solicitando detalles del alta ID: ${alta.id}`);
                                const response = await ApiService.get(`/altas/${alta.id}`);
                                console.log('📊 Respuesta de detalles:', response);
                                
                                if (response.success) {
                                  setSelectedAltaDetalles(response.data);
                                  setShowModalDetalles(true);
                                } else {
                                  notifications.error('No se pudieron cargar los detalles del alta');
                                }
                              } catch (error) {
                                console.error('❌ Error al cargar detalles:', error);
                                notifications.error('Error al cargar detalles: ' + error.message);
                              }
                            }}
                          >
                            <FiFileText /> Ver
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Alta */}
      {showModalAlta && (
        <div className="modal-overlay">
          <div className="modal-container modal-large">
            <div className="modal-header">
              <h3>Procesar Alta</h3>
              <button className="modal-close" onClick={() => {
                setShowModalAlta(false);
                setSelectedPacienteAlta(null);
              }}>×</button>
            </div>
            
            <form onSubmit={handleSubmitAlta}>
              <div className="modal-content">
                {selectedPacienteAlta && (
                  <div className="alert-message info mb-20">
                    <strong>Paciente:</strong> {selectedPacienteAlta.paciente_nombre}
                    <br />
                    <strong>Psicólogo asignado:</strong> {selectedPacienteAlta.psicologo}
                    <br />
                    <strong>Sesiones completadas:</strong> {selectedPacienteAlta.sesiones_completadas}
                  </div>
                )}
                
                <div className="grid-2 gap-20">
                  <div className="form-group">
                    <label>Tipo de Alta *</label>
                    <select
                      value={formData.tipo_alta}
                      onChange={(e) => setFormData({...formData, tipo_alta: e.target.value})}
                      className="select-field"
                      required
                    >
                      <option value="">Seleccionar tipo</option>
                      <option value="terapeutica">Alta Terapéutica</option>
                      <option value="abandono">Abandono</option>
                      <option value="traslado">Traslado</option>
                      <option value="graduacion">Graduación</option>
                      <option value="no_continua">No Continúa</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Evaluación Final</label>
                    <select
                      value={formData.evaluacion_final}
                      onChange={(e) => setFormData({...formData, evaluacion_final: e.target.value})}
                      className="select-field"
                    >
                      <option value="">Seleccionar evaluación</option>
                      <option value="excelente">Excelente</option>
                      <option value="buena">Buena</option>
                      <option value="regular">Regular</option>
                      <option value="mala">Mala</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group mt-15">
                  <label>Motivo Detallado *</label>
                  <textarea
                    value={formData.motivo_detallado}
                    onChange={(e) => setFormData({...formData, motivo_detallado: e.target.value})}
                    className="textarea-field"
                    rows="4"
                    placeholder="Describa el motivo del alta..."
                    required
                  />
                </div>
                
                <div className="form-group mt-15">
                  <label>Recomendaciones</label>
                  <textarea
                    value={formData.recomendaciones}
                    onChange={(e) => setFormData({...formData, recomendaciones: e.target.value})}
                    className="textarea-field"
                    rows="3"
                    placeholder="Recomendaciones para el paciente..."
                  />
                </div>
                
                <div className="grid-2 gap-20 mt-15">
                  <div className="form-group">
                    <label className="flex-row align-center gap-10">
                      <input
                        type="checkbox"
                        checked={formData.seguimiento_recomendado}
                        onChange={(e) => setFormData({...formData, seguimiento_recomendado: e.target.checked})}
                      />
                      Seguimiento Recomendado
                    </label>
                  </div>
                  
                  {formData.seguimiento_recomendado && (
                    <div className="form-group">
                      <label>Fecha de Seguimiento</label>
                      <input
                        type="date"
                        value={formData.fecha_seguimiento}
                        onChange={(e) => setFormData({...formData, fecha_seguimiento: e.target.value})}
                        className="input-field"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowModalAlta(false);  // ✅ CORREGIDO
                    setSelectedPacienteAlta(null);  // ✅ CORREGIDO
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={!formData.tipo_alta || !formData.motivo_detallado}
                >
                  <FiCheckCircle /> Confirmar Alta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal de Detalles de Alta */}
      {showModalDetalles && selectedAltaDetalles && (
        <div className="modal-overlay">
          <div className="modal-container modal-large">
            <div className="modal-header">
              <h3>
                {selectedAltaDetalles.tipo_alta === 'no_aprobado' 
                  ? 'Detalles de No Aprobación' 
                  : 'Detalles de Alta'}
              </h3>
              <button className="modal-close" onClick={() => {
                setShowModalDetalles(false);
                setSelectedAltaDetalles(null);
              }}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="grid-2 gap-20">
                <div>
                  <h4>Información del Paciente</h4>
                  <div className="detail-row">
                    <strong>Nombre:</strong> {selectedAltaDetalles.paciente_nombre} {selectedAltaDetalles.paciente_apellido}
                  </div>
                  <div className="detail-row">
                    <strong>Edad:</strong> {selectedAltaDetalles.edad || 'N/A'} años
                  </div>
                  <div className="detail-row">
                    <strong>Motivo de consulta:</strong> {selectedAltaDetalles.motivo_consulta || 'Sin información'}
                  </div>
                  <div className="detail-row">
                    <strong>Fecha:</strong> 
                    <div>
                      {selectedAltaDetalles.tipo_alta === 'no_aprobado' 
                        ? 'No aprobado: ' 
                        : 'Alta: '}
                      {new Date(selectedAltaDetalles.fecha_alta).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4>Información del Proceso</h4>
                  <div className="detail-row">
                    <strong>Tipo:</strong>
                    <span className={`badge badge-${getTipoAltaLabel(selectedAltaDetalles.tipo_alta).color}`}>
                      {getTipoAltaLabel(selectedAltaDetalles.tipo_alta).icon} 
                      {getTipoAltaLabel(selectedAltaDetalles.tipo_alta).text}
                    </span>
                  </div>
                  <div className="detail-row">
                    <strong>Profesional:</strong> {selectedAltaDetalles.usuario_nombre} {selectedAltaDetalles.usuario_apellido}
                  </div>
                  <div className="detail-row">
                    <strong>Sesiones completadas:</strong> {selectedAltaDetalles.sesiones_totales || 0}
                  </div>
                  {selectedAltaDetalles.psicologo_nombre && (
                    <div className="detail-row">
                      <strong>Psicólogo asignado:</strong> {selectedAltaDetalles.psicologo_nombre}
                    </div>
                  )}
                  {selectedAltaDetalles.evaluacion_final && (
                    <div className="detail-row">
                      <strong>Evaluación final:</strong> {selectedAltaDetalles.evaluacion_final}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-20">
                <h4>
                  {selectedAltaDetalles.tipo_alta === 'no_aprobado' 
                    ? 'Motivo de No Aprobación' 
                    : 'Motivo Detallado'}
                </h4>
                <div className="card p-15 mt-10">
                  {selectedAltaDetalles.motivo_detallado || 'Sin información disponible'}
                </div>
              </div>
              
              {selectedAltaDetalles.recomendaciones && (
                <div className="mt-20">
                  <h4>Recomendaciones</h4>
                  <div className="card p-15 mt-10">
                    {selectedAltaDetalles.recomendaciones}
                  </div>
                </div>
              )}
              
              {selectedAltaDetalles.tipo_alta === 'no_aprobado' && (
                <div className="mt-20 alert-message warning">
                  <strong>⚠️ Nota:</strong> Este paciente fue marcado como "No Aprobado" para alta terapéutica. 
                  Continuará en tratamiento y podrá ser evaluado nuevamente en el futuro.
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => {
                setShowModalDetalles(false);
                setSelectedAltaDetalles(null);
              }}>
                Cerrar
              </button>
              {selectedAltaDetalles.tipo_alta !== 'no_aprobado' && (
                <button className="btn-primary" onClick={() => {
                  notifications.info('Generando informe...');
                }}>
                  <FiDownload /> Descargar Informe
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinadorAltas;