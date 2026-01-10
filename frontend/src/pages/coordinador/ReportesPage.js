import React, { useState, useEffect } from 'react';
import { 
  FiBarChart2, FiDownload, FiCalendar, FiUsers, 
  FiTrendingUp, FiFilter, FiRefreshCw, FiEye
} from 'react-icons/fi';
import './coordinador.css';
import notifications from '../../utils/notifications';
import confirmations from '../../utils/confirmations';
import ApiService from '../../services/api';

// docx + file-saver for Word generation
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

const CoordinadorReportes = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipoReporte, setTipoReporte] = useState('mensual');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [estadisticas, setEstadisticas] = useState({});
  const [reporteGenerado, setReporteGenerado] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewReport, setPreviewReport] = useState(null);

  useEffect(() => {
    fetchReportes();
    generarEstadisticas();
  }, []);

  const fetchReportes = async () => {
    try {
      setLoading(true);
      const resp = await ApiService.get('/reportes');
      const data = resp.data || resp; // depending on APIService handler
      // Map files returned by backend to report objects
      const list = (data || []).map((r, idx) => ({
        id: r.nombre || `${Date.now()}_${idx}`,
        nombre: r.nombre || r.archivo_url?.split('/').pop() || `Reporte ${idx+1}`,
        tipo: r.tipo || 'importado',
        fecha: r.fecha || new Date().toISOString(),
        generado_por: r.generado_por || 'Sistema',
        descargas: r.descargas || 0,
        archivo_url: r.archivo_url
      }));
      setReportes(list);
      setLoading(false);
    } catch (error) {
      console.error('Error cargando reportes:', error);
      setLoading(false);
    }
  };

  const generarEstadisticas = async () => {
    try {
      const resp = await ApiService.getEstadisticas();
      const data = resp.data || resp;

      // Mapear campos para la UI (usar valores por defecto cuando falten)
      setEstadisticas({
        pacientesActivos: data.pacientes?.pacientes_activos || data.pacientes?.total_pacientes || 0,
        pacientesNuevosMes: data.pacientes?.altas_totales || 0,
        citasCompletadas: data.citas?.completadas || 0,
        promedioSesiones: data.citas?.duracion_promedio || 0,
        tasaRetencion: data.citas?.tasa_completitud || 0,
        // Si el backend no provee 'satisfaccion', dejar null para mostrar '-' en UI
        satisfaccionPacientes: data.pacientes?.satisfaccionPromedio || data.satisfaccionPromedio || null
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      // Mantener valores previos o limpiar
      setEstadisticas({});
    }
  };

  // Helper: convertir Blob a base64
  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const generarReporte = async () => {
    setLoading(true);
    try {
      let nuevoReporte = null;
      const fecha = new Date().toISOString().split('T')[0];

      if (tipoReporte === 'conflictos') {
        // Llamar al backend para obtener conflictos
        const resp = await ApiService.post('/reportes/reporte-conflictos', { fecha_inicio: fechaInicio || null, fecha_fin: fechaFin || null });
        const conflictos = resp.data?.conflictos || resp.conflictos || [];

        // Generar documento Word con la tabla de conflictos
        const rows = [
          new TableRow({ children: [
            new TableCell({ children: [new Paragraph('Fecha')] }),
            new TableCell({ children: [new Paragraph('Hora Inicio')] }),
            new TableCell({ children: [new Paragraph('Psicólogo 1')] }),
            new TableCell({ children: [new Paragraph('Paciente 1')] }),
            new TableCell({ children: [new Paragraph('Psicólogo 2')] }),
            new TableCell({ children: [new Paragraph('Paciente 2')] })
          ] })
        ];

        conflictos.forEach(c => {
          rows.push(new TableRow({ children: [
            new TableCell({ children: [new Paragraph(c.fecha || '')] }),
            new TableCell({ children: [new Paragraph(c.hora_inicio1 || '')] }),
            new TableCell({ children: [new Paragraph((c.psicologo1_nombre || '') + ' ' + (c.psicologo1_apellido || ''))] }),
            new TableCell({ children: [new Paragraph((c.paciente1_nombre || '') + ' ' + (c.paciente1_apellido || ''))] }),
            new TableCell({ children: [new Paragraph((c.psicologo2_nombre || '') + ' ' + (c.psicologo2_apellido || ''))] }),
            new TableCell({ children: [new Paragraph((c.paciente2_nombre || '') + ' ' + (c.paciente2_apellido || ''))] })
          ] }));
        });

        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({ text: `Reporte: Conflictos de Citas`, heading: HeadingLevel.HEADING_1 }),
              new Paragraph({ text: `Periodo: ${fechaInicio || 'Inicio'} - ${fechaFin || 'Fin'}` }),
              new Paragraph({ text: `Generado: ${fecha}` }),
              new Table({ rows })
            ]
          }]
        });

        const blob = await Packer.toBlob(doc);
        const docUrl = URL.createObjectURL(blob);

        // Crear preview HTML simple
        const previewRows = conflictos.map(c => `
          <tr>
            <td>${c.fecha || ''}</td>
            <td>${c.hora_inicio1 || ''}</td>
            <td>${(c.psicologo1_nombre || '') + ' ' + (c.psicologo1_apellido || '')}</td>
            <td>${(c.paciente1_nombre || '') + ' ' + (c.paciente1_apellido || '')}</td>
            <td>${(c.psicologo2_nombre || '') + ' ' + (c.psicologo2_apellido || '')}</td>
            <td>${(c.paciente2_nombre || '') + ' ' + (c.paciente2_apellido || '')}</td>
          </tr>
        `).join('\n');

        const previewHtmlLocal = `
          <h3>Conflictos de Citas</h3>
          <p>Periodo: ${fechaInicio || 'Inicio'} - ${fechaFin || 'Fin'}</p>
          <table style="width:100%; border-collapse: collapse;">
            <thead><tr><th>Fecha</th><th>Hora Inicio</th><th>Psicólogo 1</th><th>Paciente 1</th><th>Psicólogo 2</th><th>Paciente 2</th></tr></thead>
            <tbody>
              ${previewRows}
            </tbody>
          </table>
        `;

        // Convertir a base64 y guardar en backend
        const archivo_base64 = await blobToBase64(blob);
        try {
          const saveResp = await ApiService.post('/reportes/generar', {
            nombre: `Conflictos ${fecha}`,
            tipo: tipoReporte,
            fecha,
            generado_por: 'Coordinador',
            archivo_base64,
            archivo_ext: 'docx'
          });

          const archivo_url = saveResp.data?.archivo_url || saveResp.archivo_url;

          nuevoReporte = {
            id: Date.now(),
            nombre: `Conflictos ${fecha}`,
            tipo: tipoReporte,
            fecha,
            generado_por: 'Coordinador',
            descargas: 0,
            docBlob: blob,
            docUrl,
            archivo_url,
            previewHtml: previewHtmlLocal
          };

          // Actualizar lista y mostrar preview
          setReportes([nuevoReporte, ...reportes]);
          setReporteGenerado(nuevoReporte);
          setPreviewHtml(previewHtmlLocal);
          setPreviewVisible(true);

          notifications.success('Reporte de conflictos generado y guardado en servidor');
        } catch (err) {
          // Falla en guardado: seguir con reporte local
          nuevoReporte = {
            id: Date.now(),
            nombre: `Conflictos ${fecha}`,
            tipo: tipoReporte,
            fecha,
            generado_por: 'Coordinador',
            descargas: 0,
            docBlob: blob,
            docUrl,
            previewHtml: previewHtmlLocal
          };

          setReportes([nuevoReporte, ...reportes]);
          setReporteGenerado(nuevoReporte);
          setPreviewHtml(previewHtmlLocal);
          setPreviewVisible(true);
          console.warn('No se pudo guardar el reporte en servidor, se mantiene local:', err);
          notifications.warning('Reporte generado localmente, no fue guardado en servidor');
        }
      } else {
        // Generar un Word básico con estadísticas y un resumen
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({ text: `Reporte: ${tipoReporte}`, heading: HeadingLevel.HEADING_1 }),
              new Paragraph({ text: `Periodo: ${fechaInicio || 'Inicio'} - ${fechaFin || 'Fin'}` }),
              new Paragraph({ text: `Generado: ${fecha}` }),
              new Paragraph({ text: ` ` }),
              new Paragraph({ text: `Resumen:` , heading: HeadingLevel.HEADING_2}),
              new Paragraph({ text: `Pacientes activos: ${estadisticas.pacientesActivos || 0}` }),
              new Paragraph({ text: `Pacientes nuevos mes: ${estadisticas.pacientesNuevosMes || 0}` }),
              new Paragraph({ text: `Citas completadas: ${estadisticas.citasCompletadas || 0}` })
            ]
          }]
        });

        const blob = await Packer.toBlob(doc);
        const docUrl = URL.createObjectURL(blob);

        const previewHtmlLocal = `
          <h3>Reporte: ${tipoReporte}</h3>
          <p>Periodo: ${fechaInicio || 'Inicio'} - ${fechaFin || 'Fin'}</p>
          <ul>
            <li>Pacientes activos: ${estadisticas.pacientesActivos || 0}</li>
            <li>Pacientes nuevos mes: ${estadisticas.pacientesNuevosMes || 0}</li>
            <li>Citas completadas: ${estadisticas.citasCompletadas || 0}</li>
          </ul>
        `;

        // Intentar guardar en backend
        const archivo_base64 = await blobToBase64(blob);
        try {
          const saveResp = await ApiService.post('/reportes/generar', {
            nombre: `Reporte ${tipoReporte} ${fecha}`,
            tipo: tipoReporte,
            fecha,
            generado_por: 'Coordinador',
            archivo_base64,
            archivo_ext: 'docx'
          });

          const archivo_url = saveResp.data?.archivo_url || saveResp.archivo_url;

          nuevoReporte = {
            id: Date.now(),
            nombre: `Reporte ${tipoReporte} ${fecha}`,
            tipo: tipoReporte,
            fecha,
            generado_por: 'Coordinador',
            descargas: 0,
            docBlob: blob,
            docUrl,
            archivo_url,
            previewHtml: previewHtmlLocal
          };

          setReportes([nuevoReporte, ...reportes]);
          setReporteGenerado(nuevoReporte);
          setPreviewHtml(previewHtmlLocal);
          setPreviewVisible(true);
          notifications.success('Reporte generado y guardado en servidor');
        } catch (err) {
          // fallback local
          nuevoReporte = {
            id: Date.now(),
            nombre: `Reporte ${tipoReporte} ${fecha}`,
            tipo: tipoReporte,
            fecha,
            generado_por: 'Coordinador',
            descargas: 0,
            docBlob: blob,
            docUrl,
            previewHtml: previewHtmlLocal
          };
          setReportes([nuevoReporte, ...reportes]);
          setReporteGenerado(nuevoReporte);
          setPreviewHtml(previewHtmlLocal);
          setPreviewVisible(true);
          console.warn('No se pudo guardar el reporte en servidor, se mantiene local:', err);
          notifications.warning('Reporte generado localmente, no fue guardado en servidor');
        }
      }
    } catch (error) {
      console.error('Error generando reporte:', error);
      notifications.error('Error generando reporte');
    } finally {
      setLoading(false);
    }
  };

  const descargarReporte = (reporteId) => {
    const reporte = reportes.find(r => r.id === reporteId);
    if (!reporte) return;

    try {
      if (reporte.docBlob) {
        saveAs(reporte.docBlob, `${reporte.nombre}.docx`);
      } else if (reporte.archivo_url) {
        // Si el backend devolvió una URL
        window.open(reporte.archivo_url, '_blank');
      } else {
        notifications.error('No hay archivo disponible para descargar');
        return;
      }

      // Actualizar contador de descargas en estado
      setReportes(prev => prev.map(r => r.id === reporteId ? { ...r, descargas: (r.descargas || 0) + 1 } : r));
      notifications.success(`Descarga iniciada: ${reporte.nombre}`);
    } catch (error) {
      console.error('Error descargando reporte:', error);
      notifications.error('Error al descargar el reporte');
    }
  };

  const abrirVistaPrevia = (reporteId) => {
    const reporte = reportes.find(r => r.id === reporteId);
    if (!reporte) return;
    setPreviewHtml(reporte.previewHtml || '<p>No hay vista previa disponible</p>');
    setPreviewReport(reporte);
    setPreviewVisible(true);
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
            <label>Formato (solo Word)</label>
            <select className="select-field" value="docx" disabled>
              <option value="docx">Word (.docx)</option>
            </select>
          </div>
          
          {/* <div className="form-group" style={{ gridColumn: 'span 2' }}>
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
          </div> */}
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
                        onClick={() => abrirVistaPrevia(reporte.id)}
                        title="Vista previa"
                      >
                        <FiEye />
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
              onClick={() => abrirVistaPrevia(reporteGenerado.id)}
            >
              <FiEye /> Vista previa
            </button>
          </div>
        </div>
      )}

      {/* Vista Previa Modal */}
      {previewVisible && (
        <div className="modal-overlay">
              <div className="modal-container modal-large">
            <div className="modal-header">
              <h3>Vista previa: {previewReport ? previewReport.nombre : 'Reporte'}</h3>
              <button className="btn-text" onClick={() => setPreviewVisible(false)}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => {
                if (previewReport && previewReport.docBlob) saveAs(previewReport.docBlob, `${previewReport.nombre}.docx`);
                else if (previewReport && previewReport.archivo_url) window.open(previewReport.archivo_url, '_blank');
              }}>
                <FiDownload /> Descargar
              </button>
              <button className="btn-secondary" onClick={() => setPreviewVisible(false)}>Cerrar</button>
            </div>
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