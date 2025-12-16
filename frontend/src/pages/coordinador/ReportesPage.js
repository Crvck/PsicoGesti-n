import React, { useState, useEffect } from 'react';
import { 
  FiBarChart2, FiDownload, FiCalendar, FiUsers, 
  FiTrendingUp, FiFilter, FiRefreshCw, FiPrinter
} from 'react-icons/fi';
import './coordinador.css';

const CoordinadorReportes = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipoReporte, setTipoReporte] = useState('mensual');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [estadisticas, setEstadisticas] = useState({});
  const [reporteGenerado, setReporteGenerado] = useState(null);

  useEffect(() => {
    fetchReportes();
    generarEstadisticas();
  }, []);

  const fetchReportes = async () => {
    try {
      setLoading(true);
      
      // Simulación de datos
      setTimeout(() => {
        setReportes([
          { id: 1, nombre: 'Reporte Mensual Enero 2024', tipo: 'mensual', fecha: '2024-01-31', generado_por: 'Sistema', descargas: 12 },
          { id: 2, nombre: 'Reporte de Altas Diciembre 2023', tipo: 'especial', fecha: '2023-12-31', generado_por: 'Coordinador', descargas: 8 },
          { id: 3, nombre: 'Reporte de Actividad Becarios', tipo: 'becarios', fecha: '2024-01-15', generado_por: 'Sistema', descargas: 15 },
          { id: 4, nombre: 'Reporte Financiero 2023', tipo: 'financiero', fecha: '2024-01-10', generado_por: 'Coordinador', descargas: 5 },
          { id: 5, nombre: 'Reporte de Eficiencia Terapéutica', tipo: 'clinico', fecha: '2024-01-20', generado_por: 'Sistema', descargas: 7 }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error cargando reportes:', error);
      setLoading(false);
    }
  };

  const generarEstadisticas = () => {
    // Simulación de estadísticas
    setEstadisticas({
      pacientesActivos: 25,
      pacientesNuevosMes: 8,
      citasCompletadas: 120,
      promedioSesiones: 8.5,
      tasaRetencion: 85,
      satisfaccionPacientes: 4.2
    });
  };

  const generarReporte = () => {
    // Simulación de generación de reporte
    setLoading(true);
    setTimeout(() => {
      const nuevoReporte = {
        id: reportes.length + 1,
        nombre: `Reporte ${tipoReporte} ${new Date().toLocaleDateString()}`,
        tipo: tipoReporte,
        fecha: new Date().toISOString().split('T')[0],
        generado_por: 'Coordinador',
        descargas: 0,
        contenido: {
          resumen: `Reporte generado el ${new Date().toLocaleDateString()}`,
          estadisticas: estadisticas,
          datos: 'Aquí irían los datos del reporte generado...'
        }
      };
      
      setReportes([nuevoReporte, ...reportes]);
      setReporteGenerado(nuevoReporte);
      setLoading(false);
      alert('Reporte generado exitosamente');
    }, 1500);
  };

  const descargarReporte = (reporteId) => {
    const reporte = reportes.find(r => r.id === reporteId);
    if (reporte) {
      alert(`Descargando reporte: ${reporte.nombre}`);
      // En una implementación real, aquí se generaría y descargaría el archivo
    }
  };

  const imprimirReporte = (reporteId) => {
    const reporte = reportes.find(r => r.id === reporteId);
    if (reporte) {
      alert(`Imprimiendo reporte: ${reporte.nombre}`);
      // En una implementación real, aquí se abriría el diálogo de impresión
    }
  };

  const getColorByTipo = (tipo) => {
    switch (tipo) {
      case 'mensual': return 'var(--grnb)';
      case 'especial': return 'var(--blu)';
      case 'becarios': return 'var(--yy)';
      case 'financiero': return 'var(--grnd)';
      case 'clinico': return 'var(--rr)';
      default: return 'var(--gray)';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Cargando reportes...</div>
      </div>
    );
  }

  return (
    <div className="configuracion-page">
      <div className="page-header">
        <div>
          <h1>Reportes y Estadísticas</h1>
          <p>Generación y gestión de reportes del sistema</p>
        </div>
        <button className="btn-secondary" onClick={fetchReportes}>
          <FiRefreshCw /> Actualizar
        </button>
      </div>

      {/* Panel de Generación de Reportes */}
      <div className="card mb-30">
        <div className="section-header">
          <h3>
            <FiBarChart2 /> Generar Nuevo Reporte
          </h3>
          <button className="btn-primary" onClick={generarReporte}>
            <FiBarChart2 /> Generar Reporte
          </button>
        </div>
        
        <div className="form-grid">
          <div className="form-group">
            <label>Tipo de Reporte</label>
            <select 
              value={tipoReporte} 
              onChange={(e) => setTipoReporte(e.target.value)}
              className="select-field"
            >
              <option value="mensual">Reporte Mensual</option>
              <option value="trimestral">Reporte Trimestral</option>
              <option value="anual">Reporte Anual</option>
              <option value="becarios">Reporte de Becarios</option>
              <option value="clinico">Reporte Clínico</option>
              <option value="financiero">Reporte Financiero</option>
              <option value="especial">Reporte Especial</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Fecha Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="input-field"
            />
          </div>
          
          <div className="form-group">
            <label>Fecha Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="input-field"
            />
          </div>
          
          <div className="form-group">
            <label>Formato</label>
            <select className="select-field">
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="html">HTML</option>
            </select>
          </div>
          
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>Parámetros Adicionales</label>
            <div className="grid-2 gap-10">
              <label className="flex-row align-center gap-10">
                <input type="checkbox" defaultChecked />
                <span>Incluir gráficos</span>
              </label>
              <label className="flex-row align-center gap-10">
                <input type="checkbox" defaultChecked />
                <span>Incluir datos detallados</span>
              </label>
              <label className="flex-row align-center gap-10">
                <input type="checkbox" />
                <span>Incluir datos financieros</span>
              </label>
              <label className="flex-row align-center gap-10">
                <input type="checkbox" defaultChecked />
                <span>Incluir comparativas</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid-3 mb-30">
        <div className="card">
          <div className="flex-row align-center gap-10 mb-10">
            <FiUsers size={24} style={{ color: 'var(--grnb)' }} />
            <div>
              <h4>Pacientes Activos</h4>
              <div className="stat-value">{estadisticas.pacientesActivos || 0}</div>
            </div>
          </div>
          <div className="text-small">+{estadisticas.pacientesNuevosMes || 0} este mes</div>
        </div>
        
        <div className="card">
          <div className="flex-row align-center gap-10 mb-10">
            <FiCalendar size={24} style={{ color: 'var(--blu)' }} />
            <div>
              <h4>Citas Completadas</h4>
              <div className="stat-value">{estadisticas.citasCompletadas || 0}</div>
            </div>
          </div>
          <div className="text-small">este mes</div>
        </div>
        
        <div className="card">
          <div className="flex-row align-center gap-10 mb-10">
            <FiTrendingUp size={24} style={{ color: 'var(--yy)' }} />
            <div>
              <h4>Tasa de Retención</h4>
              <div className="stat-value">{estadisticas.tasaRetencion || 0}%</div>
            </div>
          </div>
          <div className="text-small">de pacientes continúan tratamiento</div>
        </div>
      </div>

      {/* Reportes Generados */}
      <div className="dashboard-section">
        <div className="section-header">
          <h3>Reportes Generados</h3>
          <div className="flex-row gap-10">
            <select className="select-field" style={{ width: '150px' }}>
              <option value="">Todos los tipos</option>
              <option value="mensual">Mensuales</option>
              <option value="especial">Especiales</option>
              <option value="becarios">Becarios</option>
              <option value="financiero">Financieros</option>
            </select>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Buscar reporte..."
              style={{ width: '200px' }}
            />
          </div>
        </div>
        
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre del Reporte</th>
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Generado por</th>
                <th>Descargas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reportes.map((reporte) => (
                <tr key={reporte.id}>
                  <td>
                    <div className="flex-row align-center gap-10">
                      <FiBarChart2 style={{ color: getColorByTipo(reporte.tipo) }} />
                      <span>{reporte.nombre}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ 
                      background: getColorByTipo(reporte.tipo) + '20',
                      color: getColorByTipo(reporte.tipo),
                      borderColor: getColorByTipo(reporte.tipo)
                    }}>
                      {reporte.tipo}
                    </span>
                  </td>
                  <td>{new Date(reporte.fecha).toLocaleDateString()}</td>
                  <td>{reporte.generado_por}</td>
                  <td>{reporte.descargas}</td>
                  <td>
                    <div className="flex-row gap-5">
                      <button 
                        className="btn-text"
                        onClick={() => descargarReporte(reporte.id)}
                        title="Descargar"
                      >
                        <FiDownload />
                      </button>
                      <button 
                        className="btn-text"
                        onClick={() => imprimirReporte(reporte.id)}
                        title="Imprimir"
                      >
                        <FiPrinter />
                      </button>
                      <button className="btn-text">
                        Ver Vista Previa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reporte Recién Generado */}
      {reporteGenerado && (
        <div className="card mt-20" style={{ borderLeft: `4px solid ${getColorByTipo(reporteGenerado.tipo)}` }}>
          <div className="section-header">
            <h3>📋 Reporte Generado Recientemente</h3>
            <button className="btn-text" onClick={() => setReporteGenerado(null)}>×</button>
          </div>
          
          <div className="grid-2 gap-20">
            <div>
              <strong>Nombre:</strong> {reporteGenerado.nombre}
            </div>
            <div>
              <strong>Tipo:</strong> {reporteGenerado.tipo}
            </div>
            <div>
              <strong>Fecha generación:</strong> {new Date(reporteGenerado.fecha).toLocaleString()}
            </div>
            <div>
              <strong>Generado por:</strong> {reporteGenerado.generado_por}
            </div>
          </div>
          
          <div className="flex-row gap-10 mt-15">
            <button 
              className="btn-primary"
              onClick={() => descargarReporte(reporteGenerado.id)}
            >
              <FiDownload /> Descargar Reporte
            </button>
            <button 
              className="btn-secondary"
              onClick={() => imprimirReporte(reporteGenerado.id)}
            >
              <FiPrinter /> Imprimir
            </button>
          </div>
        </div>
      )}

      {/* Tipos de Reportes Disponibles */}
      <div className="grid-4 mt-30">
        <div className="card">
          <h4>📊 Reportes Mensuales</h4>
          <p className="text-small mt-10">Resumen completo de actividad mensual del consultorio</p>
          <ul className="text-small mt-10">
            <li>Estadísticas de pacientes</li>
            <li>Citas realizadas</li>
            <li>Ingresos generados</li>
            <li>Indicadores clave</li>
          </ul>
        </div>
        
        <div className="card">
          <h4>👨‍⚕️ Reportes Clínicos</h4>
          <p className="text-small mt-10">Análisis de efectividad terapéutica y progreso</p>
          <ul className="text-small mt-10">
            <li>Evolución de pacientes</li>
            <li>Tasas de éxito</li>
            <li>Tiempos promedio de tratamiento</li>
            <li>Satisfacción del paciente</li>
          </ul>
        </div>
        
        <div className="card">
          <h4>👨‍🎓 Reportes de Becarios</h4>
          <p className="text-small mt-10">Seguimiento y evaluación de becarios</p>
          <ul className="text-small mt-10">
            <li>Carga de trabajo</li>
            <li>Evaluación de supervisiones</li>
            <li>Desempeño clínico</li>
            <li>Áreas de mejora</li>
          </ul>
        </div>
        
        <div className="card">
          <h4>💰 Reportes Financieros</h4>
          <p className="text-small mt-10">Análisis económico y de rentabilidad</p>
          <ul className="text-small mt-10">
            <li>Ingresos vs gastos</li>
            <li>Proyecciones financieras</li>
            <li>Análisis de rentabilidad</li>
            <li>Reportes fiscales</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CoordinadorReportes;