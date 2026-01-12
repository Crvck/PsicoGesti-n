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
      setLoading(true);
      const token = localStorage.getItem('token');
      // Obtener pacientes activos y luego mapear a una vista de expedientes básicos
      const res = await fetch('http://localhost:3000/api/pacientes/activos', {
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (!res.ok) {
        console.error('Error fetching pacientes activos:', res.status);
        setExpedientes([]);
        setLoading(false);
        return;
      }
      const json = await res.json().catch(() => ([]));
      const data = Array.isArray(json) ? json : (json.data || []);
      // Normalizar para mostrar información básica en la lista
      const lista = data.map(p => ({
        id: p.id,
        paciente_nombre: p.nombre_completo || `${p.nombre || ''} ${p.apellido || ''}`.trim(),
        edad: p.edad || null
      }));
      setExpedientes(lista);
    } catch (error) {
      console.error('Error al obtener expedientes:', error);
      setExpedientes([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredExpedientes = expedientes.filter(expediente =>
    expediente.paciente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expediente.diagnostico.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [expedienteDetalle, setExpedienteDetalle] = useState(null);

  const showExpedienteDetalles = async (item) => {
    setSelectedExpediente(null);
    setShowDetalles(true);
    setExpedienteDetalle(null);
    try {
      const token = localStorage.getItem('token');
      // item.id is paciente id
      const res = await fetch(`http://localhost:3000/api/expedientes/paciente/${item.id}/completo`, {
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (!res.ok) {
        const jsonErr = await res.json().catch(() => ({}));
        notifications.error(jsonErr.message || 'No se pudo obtener expediente');
        setShowDetalles(false);
        return;
      }
      const json = await res.json();
      const pacienteData = json.data.paciente || {};
      const expedienteData = json.data.expediente || {};
      const estadisticas = json.data.estadisticas || {};
      const citasFuturas = Array.isArray(json.data.citas_futuras) ? json.data.citas_futuras : [];

      const paciente_nombre = pacienteData.nombre_completo || `${pacienteData.nombre || ''} ${pacienteData.apellido || ''}`.trim();
      const proximaCita = citasFuturas.length > 0 ? citasFuturas[0].fecha : null;

      setSelectedExpediente({
        ...pacienteData,
        ...expedienteData,
        paciente_nombre,
        sesiones_totales: estadisticas.total_sesiones || 0,
        ultima_evaluacion: estadisticas.ultima_sesion || expedienteData.ultima_evaluacion || null,
        proxima_cita: proximaCita,
        paciente: pacienteData
      });

      setExpedienteDetalle(json.data);
    } catch (err) {
      console.error('Error al cargar expediente:', err);
      notifications.error('Error al cargar expediente');
      setShowDetalles(false);
    }
  };

  const exportarExpediente = (expediente) => {
    notifications.success(`Exportando expediente de ${expediente.paciente_nombre || expediente.nombre || ''}...`);
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
                {expedienteDetalle && expedienteDetalle.sesiones && expedienteDetalle.sesiones.length > 0 ? (
                  <div className="timeline mt-10">
                    {expedienteDetalle.sesiones.map(s => (
                      <div className="timeline-item" key={s.id}>
                        <div className="timeline-content">
                          <strong>{s.fecha ? new Date(s.fecha).toLocaleDateString() : ''} - Sesión</strong>
                          <p>{s.desarrollo || s.conclusion || ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-small">No hay sesiones registradas en este expediente.</div>
                )}
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