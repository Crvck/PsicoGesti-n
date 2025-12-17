import React, { useState, useEffect } from 'react';
import { 
  FiTrendingUp, FiCheckCircle, FiXCircle, FiFilter,
  FiSearch, FiCalendar, FiUser, FiFileText, FiDownload
} from 'react-icons/fi';
import './coordinador.css';
import notifications from '../../utils/notifications';
import confirmations from '../../utils/confirmations';

const CoordinadorAltas = () => {
  const [altas, setAltas] = useState([]);
  const [candidatosAlta, setCandidatosAlta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroMes, setFiltroMes] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [estadisticas, setEstadisticas] = useState({});

  useEffect(() => {
    fetchAltas();
    generarEstadisticas();
  }, []);

  const fetchAltas = async () => {
    try {
      setLoading(true);
      
      // Simulación de datos
      setTimeout(() => {
        setAltas([
          {
            id: 1,
            paciente_nombre: 'Ana Rodríguez',
            edad: 32,
            motivo_consulta: 'Depresión',
            fecha_ingreso: '2023-06-10',
            fecha_alta: '2024-01-05',
            tipo_alta: 'terapeutica',
            sesiones_totales: 20,
            psicologo: 'Lic. Luis Fernández',
            becario: 'Juan Pérez',
            evaluacion_final: 'Excelente progreso, alta recomendada',
            satisfaccion: 5
          },
          {
            id: 2,
            paciente_nombre: 'Carlos Martínez',
            edad: 28,
            motivo_consulta: 'Ansiedad generalizada',
            fecha_ingreso: '2023-08-15',
            fecha_alta: '2023-12-20',
            tipo_alta: 'terapeutica',
            sesiones_totales: 15,
            psicologo: 'Lic. Luis Fernández',
            becario: 'Sofía Ramírez',
            evaluacion_final: 'Buen manejo de técnicas de relajación',
            satisfaccion: 4
          },
          {
            id: 3,
            paciente_nombre: 'María González',
            edad: 45,
            motivo_consulta: 'Duelo complicado',
            fecha_ingreso: '2023-09-01',
            fecha_alta: '2024-01-15',
            tipo_alta: 'abandono',
            sesiones_totales: 8,
            psicologo: 'Lic. Laura Gutiérrez',
            becario: null,
            evaluacion_final: 'Paciente dejó de asistir sin aviso',
            satisfaccion: 3
          },
          {
            id: 4,
            paciente_nombre: 'Roberto Sánchez',
            edad: 22,
            motivo_consulta: 'Problemas de adaptación',
            fecha_ingreso: '2023-11-05',
            fecha_alta: '2024-01-10',
            tipo_alta: 'traslado',
            sesiones_totales: 5,
            psicologo: 'Lic. Luis Fernández',
            becario: 'Pedro Hernández',
            evaluacion_final: 'Trasladado a otro especialista',
            satisfaccion: 4
          }
        ]);

        setCandidatosAlta([
          {
            id: 1,
            paciente_nombre: 'Carlos Gómez',
            edad: 25,
            motivo_consulta: 'Ansiedad académica',
            fecha_ingreso: '2023-10-15',
            sesiones_completadas: 8,
            progreso: 85,
            psicologo: 'Lic. Luis Fernández',
            becario: 'Juan Pérez',
            recomendacion: 'Posible alta en 2-3 sesiones más'
          },
          {
            id: 2,
            paciente_nombre: 'Mariana López',
            edad: 28,
            motivo_consulta: 'Estrés laboral',
            fecha_ingreso: '2023-09-20',
            sesiones_completadas: 12,
            progreso: 90,
            psicologo: 'Lic. Luis Fernández',
            becario: 'Sofía Ramírez',
            recomendacion: 'Evaluar alta en próxima sesión'
          }
        ]);

        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error cargando altas:', error);
      setLoading(false);
    }
  };

  const generarEstadisticas = () => {
    const altasTerapeuticas = altas.filter(a => a.tipo_alta === 'terapeutica').length;
    const abandonos = altas.filter(a => a.tipo_alta === 'abandono').length;
    const traslados = altas.filter(a => a.tipo_alta === 'traslado').length;
    const satisfaccionPromedio = altas.length > 0 
      ? altas.reduce((sum, a) => sum + (a.satisfaccion || 0), 0) / altas.length 
      : 0;
    const sesionesPromedio = altas.length > 0
      ? altas.reduce((sum, a) => sum + a.sesiones_totales, 0) / altas.length
      : 0;

    setEstadisticas({
      altasTerapeuticas,
      abandonos,
      traslados,
      satisfaccionPromedio: satisfaccionPromedio.toFixed(1),
      sesionesPromedio: sesionesPromedio.toFixed(1),
      tasaExito: altasTerapeuticas > 0 ? Math.round((altasTerapeuticas / (altasTerapeuticas + abandonos)) * 100) : 0
    });
  };

  const filteredAltas = altas.filter(alta => {
    const matchesEstado = !filtroEstado || alta.tipo_alta === filtroEstado;
    const matchesMes = !filtroMes || new Date(alta.fecha_alta).getMonth() === parseInt(filtroMes);
    return matchesEstado && matchesMes;
  });

  const procesarAlta = async (pacienteId, decision) => {
    try {
      if (decision === 'aprobar') {
        // Para aprobar - usar warning (amarillo) o info (azul)
        const confirmado = await confirmations.warning('¿Estás seguro de aprobar el alta terapéutica de este paciente?');
        
        if (confirmado) {
          notifications.success('Alta aprobada exitosamente');
          setCandidatosAlta(candidatosAlta.filter(p => p.id !== pacienteId));
        }
      } else {
        // Para rechazar - usar danger (rojo)
        const confirmado = await confirmations.danger('¿Estás seguro de rechazar el alta de este paciente?');
        
        if (confirmado) {
          notifications.error('Alta rechazada. Se notificará al psicólogo.');
        }
      }
    } catch (error) {
      console.error('Error en el proceso de alta:', error);
      notifications.error('Ocurrió un error al procesar la solicitud');
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
      default:
        return { text: tipo, color: 'info', icon: '📋' };
    }
  };

  const exportarReporteAltas = () => {
    notifications.success('Generando reporte de altas...');
    // En una implementación real, aquí se generaría el archivo de exportación
  };

  if (loading) {
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
        <button className="btn-secondary" onClick={exportarReporteAltas}>
          <FiDownload /> Exportar Reporte
        </button>
      </div>

      {/* Estadísticas de Altas */}
      <div className="grid-4 mb-30">
        <div className="card">
          <h4>Altas Terapéuticas</h4>
          <div className="stat-value">{estadisticas.altasTerapeuticas || 0}</div>
          <div className="text-small">éxito terapéutico</div>
        </div>
        
        <div className="card">
          <h4>Tasa de Éxito</h4>
          <div className="stat-value">{estadisticas.tasaExito || 0}%</div>
          <div className="text-small">de tratamientos exitosos</div>
        </div>
        
        <div className="card">
          <h4>Sesión Promedio</h4>
          <div className="stat-value">{estadisticas.sesionesPromedio || 0}</div>
          <div className="text-small">sesiones por paciente</div>
        </div>
        
        <div className="card">
          <h4>Satisfacción</h4>
          <div className="stat-value">{estadisticas.satisfaccionPromedio || 0}/5</div>
          <div className="text-small">puntuación promedio</div>
        </div>
      </div>

      {/* Candidatos a Alta */}
      <div className="dashboard-section mb-30">
        <div className="section-header">
          <h3>Candidatos a Alta ({candidatosAlta.length})</h3>
          <button className="btn-text">Ver todos</button>
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
                    <span>Sesión {paciente.sesiones_completadas}</span>
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
                    <FiCheckCircle /> Aprobar Alta
                  </button>
                  <button 
                    className="btn-danger flex-1"
                    onClick={() => procesarAlta(paciente.id, 'rechazar')}
                  >
                    <FiXCircle /> Rechazar
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
          <h3>Historial de Altas</h3>
          <div className="flex-row gap-10">
            <select 
              value={filtroEstado} 
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="select-field"
              style={{ width: '150px' }}
            >
              <option value="">Todos los tipos</option>
              <option value="terapeutica">Altas Terapéuticas</option>
              <option value="abandono">Abandonos</option>
              <option value="traslado">Traslados</option>
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
          </div>
        </div>
        
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Tipo de Alta</th>
                <th>Fechas</th>
                <th>Sesiones</th>
                <th>Equipo</th>
                <th>Satisfacción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAltas.map((alta) => {
                const tipoInfo = getTipoAltaLabel(alta.tipo_alta);
                
                return (
                  <tr key={alta.id}>
                    <td>
                      <div className="flex-row align-center gap-10">
                        <div className="avatar-small">
                          {alta.paciente_nombre.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-bold">{alta.paciente_nombre}</div>
                          <div className="text-small">{alta.motivo_consulta}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${tipoInfo.color}`}>
                        {tipoInfo.icon} {tipoInfo.text}
                      </span>
                    </td>
                    <td>
                      <div>Ingreso: {new Date(alta.fecha_ingreso).toLocaleDateString()}</div>
                      <div className="text-small">Alta: {new Date(alta.fecha_alta).toLocaleDateString()}</div>
                    </td>
                    <td>
                      <div className="font-bold">{alta.sesiones_totales}</div>
                      <div className="text-small">sesiones</div>
                    </td>
                    <td>
                      <div className="text-small">{alta.psicologo}</div>
                      <div className="text-small">{alta.becario || 'Sin becario'}</div>
                    </td>
                    <td>
                      <div className="flex-row align-center gap-5">
                        {'★'.repeat(alta.satisfaccion)}
                        {'☆'.repeat(5 - alta.satisfaccion)}
                        <span className="ml-5">({alta.satisfaccion}/5)</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex-row gap-5">
                        <button 
                          className="btn-text"
                          onClick={() => {
                            setSelectedPaciente(alta);
                            setShowModal(true);
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
      </div>

      {/* Análisis de Tendencias */}
      <div className="grid-2 mt-30">
        <div className="card">
          <h4>Tendencias de Altas por Mes</h4>
          <div className="activity-chart" style={{ height: '200px' }}>
            <div className="chart-bars">
              {[65, 80, 45, 90, 75, 60, 85, 70, 95, 50, 65, 80].map((height, index) => (
                <div key={index} className="chart-bar">
                  <div 
                    className="bar-fill"
                    style={{ height: `${height}%` }}
                  ></div>
                  <div className="bar-label">
                    {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][index]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="card">
          <h4>Distribución por Tipo de Alta</h4>
          <div className="flex-col gap-15 mt-20">
            <div className="flex-row align-center justify-between">
              <div className="flex-row align-center gap-10">
                <div className="badge badge-success">Alta Terapéutica</div>
                <div className="text-small">{estadisticas.altasTerapeuticas} pacientes</div>
              </div>
              <div className="font-bold">
                {altas.length > 0 ? Math.round((estadisticas.altasTerapeuticas / altas.length) * 100) : 0}%
              </div>
            </div>
            
            <div className="flex-row align-center justify-between">
              <div className="flex-row align-center gap-10">
                <div className="badge badge-danger">Abandonos</div>
                <div className="text-small">{estadisticas.abandonos} pacientes</div>
              </div>
              <div className="font-bold">
                {altas.length > 0 ? Math.round((estadisticas.abandonos / altas.length) * 100) : 0}%
              </div>
            </div>
            
            <div className="flex-row align-center justify-between">
              <div className="flex-row align-center gap-10">
                <div className="badge badge-warning">Traslados</div>
                <div className="text-small">{estadisticas.traslados} pacientes</div>
              </div>
              <div className="font-bold">
                {altas.length > 0 ? Math.round((estadisticas.traslados / altas.length) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalles de Alta */}
      {showModal && selectedPaciente && (
        <div className="modal-overlay">
          <div className="modal-container modal-large">
            <div className="modal-header">
              <h3>Detalles de Alta</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="grid-2 gap-20">
                <div>
                  <h4>Información del Paciente</h4>
                  <div className="detail-row">
                    <strong>Nombre:</strong> {selectedPaciente.paciente_nombre}
                  </div>
                  <div className="detail-row">
                    <strong>Edad:</strong> {selectedPaciente.edad} años
                  </div>
                  <div className="detail-row">
                    <strong>Motivo de consulta:</strong> {selectedPaciente.motivo_consulta}
                  </div>
                  <div className="detail-row">
                    <strong>Fechas:</strong> 
                    <div>
                      Ingreso: {new Date(selectedPaciente.fecha_ingreso).toLocaleDateString()}<br/>
                      Alta: {new Date(selectedPaciente.fecha_alta).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4>Información del Tratamiento</h4>
                  <div className="detail-row">
                    <strong>Sesiones totales:</strong> {selectedPaciente.sesiones_totales}
                  </div>
                  <div className="detail-row">
                    <strong>Tipo de alta:</strong>
                    <span className={`badge ${
                      selectedPaciente.tipo_alta === 'terapeutica' ? 'badge-success' :
                      selectedPaciente.tipo_alta === 'abandono' ? 'badge-danger' :
                      'badge-warning'
                    }`}>
                      {getTipoAltaLabel(selectedPaciente.tipo_alta).text}
                    </span>
                  </div>
                  <div className="detail-row">
                    <strong>Psicólogo:</strong> {selectedPaciente.psicologo}
                  </div>
                  <div className="detail-row">
                    <strong>Becario:</strong> {selectedPaciente.becario || 'No asignado'}
                  </div>
                </div>
              </div>
              
              <div className="mt-20">
                <h4>Evaluación Final</h4>
                <div className="card p-15 mt-10">
                  {selectedPaciente.evaluacion_final}
                </div>
              </div>
              
              <div className="mt-20">
                <h4>Satisfacción del Paciente</h4>
                <div className="flex-row align-center gap-10 mt-10">
                  <div className="flex-row">
                    {'★'.repeat(selectedPaciente.satisfaccion)}
                    {'☆'.repeat(5 - selectedPaciente.satisfaccion)}
                  </div>
                  <span className="font-bold">({selectedPaciente.satisfaccion}/5)</span>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Cerrar
              </button>
              <button className="btn-primary">
                <FiDownload /> Descargar Informe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinadorAltas;