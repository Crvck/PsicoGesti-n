import React, { useState, useEffect } from 'react';
import { FiSearch, FiFileText, FiCalendar, FiUser, FiPhone, FiMail, FiDownload } from 'react-icons/fi';
import notifications from '../../utils/notifications';
import confirmations from '../../utils/confirmations';

const PsicologoExpedientes = () => {
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [showDetalles, setShowDetalles] = useState(false);

  useEffect(() => {
    fetchExpedientes();
  }, []);

  const fetchExpedientes = async () => {
    try {
      // Simulación de datos
      setTimeout(() => {
        setExpedientes([
          {
            id: 1,
            paciente_nombre: 'Carlos Gómez',
            edad: 25,
            fecha_ingreso: '2023-10-15',
            diagnostico: 'Trastorno de ansiedad generalizada',
            motivo_consulta: 'Ansiedad académica',
            antecedentes: 'No significativos',
            tratamiento_actual: 'Terapia cognitivo-conductual',
            medicacion: 'No',
            ultima_evaluacion: '2024-01-10',
            proxima_cita: '2024-01-17',
            sesiones_totales: 8,
            evolucion: 'Mejoría progresiva en manejo de ansiedad'
          },
          {
            id: 2,
            paciente_nombre: 'Mariana López',
            edad: 28,
            fecha_ingreso: '2023-09-20',
            diagnostico: 'Síndrome de burnout',
            motivo_consulta: 'Estrés laboral',
            antecedentes: 'Antecedentes familiares de ansiedad',
            tratamiento_actual: 'Terapia de aceptación y compromiso',
            medicacion: 'No',
            ultima_evaluacion: '2024-01-09',
            proxima_cita: '2024-01-16',
            sesiones_totales: 12,
            evolucion: 'Mejor manejo de límites laborales'
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error al obtener expedientes:', error);
      setLoading(false);
    }
  };

  const filteredExpedientes = expedientes.filter(expediente =>
    expediente.paciente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expediente.diagnostico.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showExpedienteDetalles = (expediente) => {
    setSelectedExpediente(expediente);
    setShowDetalles(true);
  };

  const exportarExpediente = (expediente) => {
    // Simulación de exportación
    notifications.success(`Exportando expediente de ${expediente.paciente_nombre}...`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Cargando expedientes...</div>
      </div>
    );
  }

  return (
    <div className="configuracion-page">
      <div className="page-header">
        <div>
          <h1>Expedientes Clínicos</h1>
          <p>Historial clínico completo de pacientes</p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="search-box mb-20">
        <FiSearch />
        <input
          type="text"
          className="search-input"
          placeholder="Buscar expediente por nombre o diagnóstico..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Lista de Expedientes */}
      <div className="grid-2 gap-20">
        {filteredExpedientes.map((expediente) => (
          <div key={expediente.id} className="card">
            <div className="flex-row align-center justify-between mb-10">
              <div className="flex-row align-center gap-10">
                <div className="avatar">
                  {expediente.paciente_nombre.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3>{expediente.paciente_nombre}</h3>
                  <p className="text-small">{expediente.edad} años</p>
                </div>
              </div>
              <button 
                className="btn-text"
                onClick={() => exportarExpediente(expediente)}
                title="Exportar expediente"
              >
                <FiDownload />
              </button>
            </div>

            <div className="mb-10">
              <p><strong>Diagnóstico:</strong> {expediente.diagnostico}</p>
              <p><strong>Tratamiento:</strong> {expediente.tratamiento_actual}</p>
              <p><strong>Sesiones totales:</strong> {expediente.sesiones_totales}</p>
            </div>

            <div className="flex-row gap-10">
              <button 
                className="btn-primary flex-1"
                onClick={() => showExpedienteDetalles(expediente)}
              >
                <FiFileText /> Ver Expediente
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Detalles del Expediente */}
      {showDetalles && selectedExpediente && (
        <div className="modal-overlay">
          <div className="modal-container modal-large">
            <div className="modal-header">
              <h3>Expediente Clínico de {selectedExpediente.paciente_nombre}</h3>
              <button className="modal-close" onClick={() => setShowDetalles(false)}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="grid-2 gap-20">
                <div>
                  <h4>Datos Generales</h4>
                  <div className="detail-row">
                    <strong>Paciente:</strong> {selectedExpediente.paciente_nombre}
                  </div>
                  <div className="detail-row">
                    <strong>Edad:</strong> {selectedExpediente.edad} años
                  </div>
                  <div className="detail-row">
                    <strong>Fecha de ingreso:</strong> {new Date(selectedExpediente.fecha_ingreso).toLocaleDateString()}
                  </div>
                  <div className="detail-row">
                    <strong>Motivo de consulta:</strong> {selectedExpediente.motivo_consulta}
                  </div>
                </div>
                
                <div>
                  <h4>Información Clínica</h4>
                  <div className="detail-row">
                    <strong>Diagnóstico:</strong> {selectedExpediente.diagnostico}
                  </div>
                  <div className="detail-row">
                    <strong>Antecedentes:</strong> {selectedExpediente.antecedentes}
                  </div>
                  <div className="detail-row">
                    <strong>Tratamiento actual:</strong> {selectedExpediente.tratamiento_actual}
                  </div>
                  <div className="detail-row">
                    <strong>Medicación:</strong> {selectedExpediente.medicacion}
                  </div>
                </div>
              </div>
              
              <div className="mt-20">
                <h4>Evolución y Seguimiento</h4>
                <div className="detail-row">
                  <strong>Evolución clínica:</strong> {selectedExpediente.evolucion}
                </div>
                <div className="detail-row">
                  <strong>Sesiones totales:</strong> {selectedExpediente.sesiones_totales}
                </div>
                <div className="detail-row">
                  <strong>Última evaluación:</strong> {new Date(selectedExpediente.ultima_evaluacion).toLocaleDateString()}
                </div>
                <div className="detail-row">
                  <strong>Próxima cita:</strong> {selectedExpediente.proxima_cita ? new Date(selectedExpediente.proxima_cita).toLocaleDateString() : 'No programada'}
                </div>
              </div>
              
              <div className="mt-20">
                <h4>Historial de Sesiones</h4>
                <div className="timeline mt-10">
                  <div className="timeline-item">
                    <div className="timeline-content">
                      <strong>2024-01-10 - Sesión 8</strong>
                      <p>Continuación trabajo en exposición gradual. Paciente reporta menor ansiedad anticipatoria.</p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-content">
                      <strong>2024-01-03 - Sesión 7</strong>
                      <p>Introducción de técnicas de exposición. Paciente colaborador y motivado.</p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-content">
                      <strong>2023-12-27 - Sesión 6</strong>
                      <p>Revisión de tareas. Buen progreso en identificación de pensamientos automáticos.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDetalles(false)}>
                Cerrar
              </button>
              <button className="btn-primary" onClick={() => exportarExpediente(selectedExpediente)}>
                <FiDownload /> Exportar Expediente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PsicologoExpedientes;