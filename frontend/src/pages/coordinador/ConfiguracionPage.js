import React, { useState, useEffect } from 'react';
import { 
  FiSettings, FiSave, FiUpload, FiDownload, 
  FiDatabase, FiBell, FiCalendar, FiUsers,
  FiShield, FiGlobe, FiMail, FiLock
} from 'react-icons/fi';
import './coordinador.css';

const CoordinadorConfiguracion = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [configuraciones, setConfiguraciones] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const tabs = [
    { id: 'general', label: 'General', icon: <FiSettings /> },
    { id: 'clinica', label: 'Clínica', icon: <FiUsers /> },
    { id: 'citas', label: 'Citas', icon: <FiCalendar /> },
    { id: 'notificaciones', label: 'Notificaciones', icon: <FiBell /> },
    { id: 'seguridad', label: 'Seguridad', icon: <FiShield /> },
    { id: 'avanzada', label: 'Avanzada', icon: <FiDatabase /> }
  ];

  useEffect(() => {
    fetchConfiguraciones();
  }, []);

  const fetchConfiguraciones = async () => {
    try {
      setLoading(true);
      
      // Simulación de datos
      setTimeout(() => {
        setConfiguraciones({
          general: {
            nombreConsultorio: 'PsicoGestión Consultorio',
            direccion: 'Av. Principal 123, Ciudad',
            telefono: '+123 456 7890',
            email: 'contacto@psicogestion.com',
            sitioWeb: 'https://psicogestion.com',
            moneda: 'USD',
            zonaHoraria: 'America/Mexico_City',
            idioma: 'es'
          },
          clinica: {
            duracionSesionDefault: 50,
            sesionesGratuitas: 3,
            edadMinima: 16,
            maxPacientesPsicologo: 15,
            maxPacientesBecario: 5,
            requiereSupervision: true,
            frecuenciaSupervision: 'semanal'
          },
          citas: {
            horarioInicio: '09:00',
            horarioFin: '20:00',
            intervaloCitas: 15,
            antelacionReserva: 30,
            recordatorio24h: true,
            recordatorio1h: true,
            margenCancelacion: 24,
            maxCitasDia: 8
          },
          notificaciones: {
            emailNuevaCita: true,
            emailCancelacion: true,
            emailRecordatorio: true,
            emailReportes: true,
            smsRecordatorio: false,
            notificacionesPush: true,
            emailCoordinador: 'coordinador@psicogestion.com'
          },
          seguridad: {
            requerirVerificacionEmail: true,
            intentosLogin: 3,
            bloqueoTemporal: 30,
            expiracionSesion: 60,
            requerir2FA: false,
            registroIP: true,
            politicasAceptadas: true
          },
          avanzada: {
            backupAutomatico: true,
            frecuenciaBackup: 'diario',
            retencionBackups: 30,
            logsDetallados: true,
            modoMantenimiento: false,
            versionAPI: '1.0.0',
            debugMode: false
          }
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error cargando configuraciones:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (categoria, campo, valor) => {
    setConfiguraciones(prev => ({
      ...prev,
      [categoria]: {
        ...prev[categoria],
        [campo]: valor
      }
    }));
  };

  const guardarConfiguracion = async (categoria) => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      // Simulación de guardado
      setTimeout(() => {
        setMessage({ 
          type: 'success', 
          text: `Configuración ${categoria} guardada exitosamente` 
        });
        setSaving(false);
        
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      }, 1000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar la configuración' });
      setSaving(false);
    }
  };

  const exportarConfiguracion = () => {
    const dataStr = JSON.stringify(configuraciones, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `configuracion-psicogestion-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    setMessage({ type: 'success', text: 'Configuración exportada exitosamente' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const importarConfiguracion = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result);
        setConfiguraciones(config);
        setMessage({ type: 'success', text: 'Configuración importada exitosamente' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        setMessage({ type: 'error', text: 'Error al importar la configuración' });
      }
    };
    reader.readAsText(file);
  };

  const restaurarValoresPredeterminados = (categoria) => {
    if (window.confirm('¿Estás seguro de restaurar los valores predeterminados?')) {
      // Aquí se restaurarían los valores predeterminados
      alert('Valores predeterminados restaurados');
    }
  };

  const toggleModoMantenimiento = () => {
    const nuevoValor = !configuraciones.avanzada?.modoMantenimiento;
    if (window.confirm(`¿${nuevoValor ? 'Activar' : 'Desactivar'} modo mantenimiento? Esto afectará a todos los usuarios.`)) {
      handleInputChange('avanzada', 'modoMantenimiento', nuevoValor);
      alert(`Modo mantenimiento ${nuevoValor ? 'activado' : 'desactivado'}`);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="configuracion-page">
      <div className="page-header">
        <div>
          <h1>Configuración del Sistema</h1>
          <p>Configuración avanzada del sistema de gestión</p>
        </div>
        <div className="flex-row gap-10">
          <button className="btn-secondary" onClick={exportarConfiguracion}>
            <FiDownload /> Exportar
          </button>
          <label className="btn-warning" style={{ cursor: 'pointer' }}>
            <FiUpload /> Importar
            <input
              type="file"
              accept=".json"
              onChange={importarConfiguracion}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {message.text && (
        <div className={`alert-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="configuracion-container">
        <div className="config-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`config-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="config-content">
          {/* Configuración General */}
          {activeTab === 'general' && (
            <div className="tab-content">
              <div className="section-header">
                <h3>
                  <FiSettings /> Configuración General
                </h3>
                <div className="flex-row gap-10">
                  <button 
                    className="btn-text"
                    onClick={() => restaurarValoresPredeterminados('general')}
                  >
                    Restaurar valores
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={() => guardarConfiguracion('general')}
                    disabled={saving}
                  >
                    <FiSave /> {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre del Consultorio</label>
                  <input
                    type="text"
                    value={configuraciones.general?.nombreConsultorio || ''}
                    onChange={(e) => handleInputChange('general', 'nombreConsultorio', e.target.value)}
                    className="input-field"
                    placeholder="Nombre del consultorio"
                  />
                </div>
                
                <div className="form-group">
                  <label>Dirección</label>
                  <input
                    type="text"
                    value={configuraciones.general?.direccion || ''}
                    onChange={(e) => handleInputChange('general', 'direccion', e.target.value)}
                    className="input-field"
                    placeholder="Dirección completa"
                  />
                </div>
                
                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    value={configuraciones.general?.telefono || ''}
                    onChange={(e) => handleInputChange('general', 'telefono', e.target.value)}
                    className="input-field"
                    placeholder="Número de teléfono"
                  />
                </div>
                
                <div className="form-group">
                  <label>Email de contacto</label>
                  <input
                    type="email"
                    value={configuraciones.general?.email || ''}
                    onChange={(e) => handleInputChange('general', 'email', e.target.value)}
                    className="input-field"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                
                <div className="form-group">
                  <label>Sitio web</label>
                  <input
                    type="url"
                    value={configuraciones.general?.sitioWeb || ''}
                    onChange={(e) => handleInputChange('general', 'sitioWeb', e.target.value)}
                    className="input-field"
                    placeholder="https://ejemplo.com"
                  />
                </div>
                
                <div className="form-group">
                  <label>Moneda</label>
                  <select
                    value={configuraciones.general?.moneda || 'USD'}
                    onChange={(e) => handleInputChange('general', 'moneda', e.target.value)}
                    className="select-field"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="MXN">MXN ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Zona horaria</label>
                  <select
                    value={configuraciones.general?.zonaHoraria || 'UTC'}
                    onChange={(e) => handleInputChange('general', 'zonaHoraria', e.target.value)}
                    className="select-field"
                  >
                    <option value="America/Mexico_City">Ciudad de México (UTC-6)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Nueva York (UTC-5)</option>
                    <option value="Europe/Madrid">Madrid (UTC+1)</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Idioma del sistema</label>
                  <select
                    value={configuraciones.general?.idioma || 'es'}
                    onChange={(e) => handleInputChange('general', 'idioma', e.target.value)}
                    className="select-field"
                  >
                    <option value="es">Español</option>
                    <option value="en">Inglés</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Configuración Clínica */}
          {activeTab === 'clinica' && (
            <div className="tab-content">
              <div className="section-header">
                <h3>
                  <FiUsers /> Configuración Clínica
                </h3>
                <div className="flex-row gap-10">
                  <button 
                    className="btn-text"
                    onClick={() => restaurarValoresPredeterminados('clinica')}
                  >
                    Restaurar valores
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={() => guardarConfiguracion('clinica')}
                    disabled={saving}
                  >
                    <FiSave /> {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Duración de sesión predeterminada (minutos)</label>
                  <input
                    type="number"
                    value={configuraciones.clinica?.duracionSesionDefault || 50}
                    onChange={(e) => handleInputChange('clinica', 'duracionSesionDefault', parseInt(e.target.value))}
                    className="input-field"
                    min="30"
                    max="120"
                    step="5"
                  />
                </div>
                
                <div className="form-group">
                  <label>Sesiones gratuitas iniciales</label>
                  <input
                    type="number"
                    value={configuraciones.clinica?.sesionesGratuitas || 3}
                    onChange={(e) => handleInputChange('clinica', 'sesionesGratuitas', parseInt(e.target.value))}
                    className="input-field"
                    min="0"
                    max="10"
                  />
                </div>
                
                <div className="form-group">
                  <label>Edad mínima para atención</label>
                  <input
                    type="number"
                    value={configuraciones.clinica?.edadMinima || 16}
                    onChange={(e) => handleInputChange('clinica', 'edadMinima', parseInt(e.target.value))}
                    className="input-field"
                    min="12"
                    max="100"
                  />
                </div>
                
                <div className="form-group">
                  <label>Máx. pacientes por psicólogo</label>
                  <input
                    type="number"
                    value={configuraciones.clinica?.maxPacientesPsicologo || 15}
                    onChange={(e) => handleInputChange('clinica', 'maxPacientesPsicologo', parseInt(e.target.value))}
                    className="input-field"
                    min="5"
                    max="30"
                  />
                </div>
                
                <div className="form-group">
                  <label>Máx. pacientes por becario</label>
                  <input
                    type="number"
                    value={configuraciones.clinica?.maxPacientesBecario || 5}
                    onChange={(e) => handleInputChange('clinica', 'maxPacientesBecario', parseInt(e.target.value))}
                    className="input-field"
                    min="1"
                    max="10"
                  />
                </div>
                
                <div className="form-group">
                  <label>Frecuencia de supervisión</label>
                  <select
                    value={configuraciones.clinica?.frecuenciaSupervision || 'semanal'}
                    onChange={(e) => handleInputChange('clinica', 'frecuenciaSupervision', e.target.value)}
                    className="select-field"
                  >
                    <option value="semanal">Semanal</option>
                    <option value="quincenal">Quincenal</option>
                    <option value="mensual">Mensual</option>
                  </select>
                </div>
                
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="flex-row align-center gap-10">
                    <input
                      type="checkbox"
                      checked={configuraciones.clinica?.requiereSupervision || true}
                      onChange={(e) => handleInputChange('clinica', 'requiereSupervision', e.target.checked)}
                    />
                    <span>Requerir supervisión para becarios</span>
                  </label>
                </div>
              </div>
              
              <div className="security-info mt-30">
                <h4>Notas importantes:</h4>
                <ul>
                  <li>Los cambios en la duración de sesiones afectarán a las citas futuras</li>
                  <li>Los límites de pacientes se aplicarán para nuevas asignaciones</li>
                  <li>La edad mínima debe cumplir con las regulaciones locales</li>
                </ul>
              </div>
            </div>
          )}

          {/* Configuración de Citas */}
          {activeTab === 'citas' && (
            <div className="tab-content">
              <div className="section-header">
                <h3>
                  <FiCalendar /> Configuración de Citas
                </h3>
                <div className="flex-row gap-10">
                  <button 
                    className="btn-text"
                    onClick={() => restaurarValoresPredeterminados('citas')}
                  >
                    Restaurar valores
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={() => guardarConfiguracion('citas')}
                    disabled={saving}
                  >
                    <FiSave /> {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Horario de inicio</label>
                  <input
                    type="time"
                    value={configuraciones.citas?.horarioInicio || '09:00'}
                    onChange={(e) => handleInputChange('citas', 'horarioInicio', e.target.value)}
                    className="input-field"
                  />
                </div>
                
                <div className="form-group">
                  <label>Horario de fin</label>
                  <input
                    type="time"
                    value={configuraciones.citas?.horarioFin || '20:00'}
                    onChange={(e) => handleInputChange('citas', 'horarioFin', e.target.value)}
                    className="input-field"
                  />
                </div>
                
                <div className="form-group">
                  <label>Intervalo entre citas (minutos)</label>
                  <select
                    value={configuraciones.citas?.intervaloCitas || 15}
                    onChange={(e) => handleInputChange('citas', 'intervaloCitas', parseInt(e.target.value))}
                    className="select-field"
                  >
                    <option value="15">15 minutos</option>
                    <option value="30">30 minutos</option>
                    <option value="45">45 minutos</option>
                    <option value="60">60 minutos</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Antelación para reserva (días)</label>
                  <input
                    type="number"
                    value={configuraciones.citas?.antelacionReserva || 30}
                    onChange={(e) => handleInputChange('citas', 'antelacionReserva', parseInt(e.target.value))}
                    className="input-field"
                    min="1"
                    max="90"
                  />
                </div>
                
                <div className="form-group">
                  <label>Máximo de citas por día</label>
                  <input
                    type="number"
                    value={configuraciones.citas?.maxCitasDia || 8}
                    onChange={(e) => handleInputChange('citas', 'maxCitasDia', parseInt(e.target.value))}
                    className="input-field"
                    min="1"
                    max="20"
                  />
                </div>
                
                <div className="form-group">
                  <label>Margen para cancelación (horas)</label>
                  <input
                    type="number"
                    value={configuraciones.citas?.margenCancelacion || 24}
                    onChange={(e) => handleInputChange('citas', 'margenCancelacion', parseInt(e.target.value))}
                    className="input-field"
                    min="1"
                    max="72"
                  />
                </div>
                
                <div className="form-group">
                  <label className="flex-row align-center gap-10">
                    <input
                      type="checkbox"
                      checked={configuraciones.citas?.recordatorio24h || true}
                      onChange={(e) => handleInputChange('citas', 'recordatorio24h', e.target.checked)}
                    />
                    <span>Recordatorio 24 horas antes</span>
                  </label>
                </div>
                
                <div className="form-group">
                  <label className="flex-row align-center gap-10">
                    <input
                      type="checkbox"
                      checked={configuraciones.citas?.recordatorio1h || true}
                      onChange={(e) => handleInputChange('citas', 'recordatorio1h', e.target.checked)}
                    />
                    <span>Recordatorio 1 hora antes</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Configuración de Notificaciones */}
          {activeTab === 'notificaciones' && (
            <div className="tab-content">
              <div className="section-header">
                <h3>
                  <FiBell /> Configuración de Notificaciones
                </h3>
                <div className="flex-row gap-10">
                  <button 
                    className="btn-text"
                    onClick={() => restaurarValoresPredeterminados('notificaciones')}
                  >
                    Restaurar valores
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={() => guardarConfiguracion('notificaciones')}
                    disabled={saving}
                  >
                    <FiSave /> {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
              
              <div className="notifications-list">
                <div className="notification-item">
                  <div>
                    <h4>Notificaciones por Email</h4>
                    <p>Enviar notificaciones por correo electrónico</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={configuraciones.notificaciones?.emailNuevaCita || true}
                      onChange={(e) => handleInputChange('notificaciones', 'emailNuevaCita', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                
                <div className="notification-item">
                  <div>
                    <h4>Email por cancelación</h4>
                    <p>Enviar email cuando se cancele una cita</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={configuraciones.notificaciones?.emailCancelacion || true}
                      onChange={(e) => handleInputChange('notificaciones', 'emailCancelacion', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                
                <div className="notification-item">
                  <div>
                    <h4>Email de recordatorio</h4>
                    <p>Enviar recordatorios automáticos de citas</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={configuraciones.notificaciones?.emailRecordatorio || true}
                      onChange={(e) => handleInputChange('notificaciones', 'emailRecordatorio', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                
                <div className="notification-item">
                  <div>
                    <h4>Email de reportes</h4>
                    <p>Enviar reportes automáticos por email</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={configuraciones.notificaciones?.emailReportes || true}
                      onChange={(e) => handleInputChange('notificaciones', 'emailReportes', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                
                <div className="notification-item">
                  <div>
                    <h4>SMS de recordatorio</h4>
                    <p>Enviar recordatorios por mensaje de texto</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={configuraciones.notificaciones?.smsRecordatorio || false}
                      onChange={(e) => handleInputChange('notificaciones', 'smsRecordatorio', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                
                <div className="notification-item">
                  <div>
                    <h4>Notificaciones push</h4>
                    <p>Enviar notificaciones en tiempo real</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={configuraciones.notificaciones?.notificacionesPush || true}
                      onChange={(e) => handleInputChange('notificaciones', 'notificacionesPush', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                
                <div className="form-group mt-20">
                  <label>Email del coordinador</label>
                  <input
                    type="email"
                    value={configuraciones.notificaciones?.emailCoordinador || ''}
                    onChange={(e) => handleInputChange('notificaciones', 'emailCoordinador', e.target.value)}
                    className="input-field"
                    placeholder="coordinador@ejemplo.com"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Configuración de Seguridad */}
          {activeTab === 'seguridad' && (
            <div className="tab-content">
              <div className="section-header">
                <h3>
                  <FiShield /> Configuración de Seguridad
                </h3>
                <div className="flex-row gap-10">
                  <button 
                    className="btn-text"
                    onClick={() => restaurarValoresPredeterminados('seguridad')}
                  >
                    Restaurar valores
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={() => guardarConfiguracion('seguridad')}
                    disabled={saving}
                  >
                    <FiSave /> {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Intentos de login fallidos</label>
                  <input
                    type="number"
                    value={configuraciones.seguridad?.intentosLogin || 3}
                    onChange={(e) => handleInputChange('seguridad', 'intentosLogin', parseInt(e.target.value))}
                    className="input-field"
                    min="1"
                    max="10"
                  />
                </div>
                
                <div className="form-group">
                  <label>Bloqueo temporal (minutos)</label>
                  <input
                    type="number"
                    value={configuraciones.seguridad?.bloqueoTemporal || 30}
                    onChange={(e) => handleInputChange('seguridad', 'bloqueoTemporal', parseInt(e.target.value))}
                    className="input-field"
                    min="5"
                    max="1440"
                  />
                </div>
                
                <div className="form-group">
                  <label>Expiración de sesión (minutos)</label>
                  <input
                    type="number"
                    value={configuraciones.seguridad?.expiracionSesion || 60}
                    onChange={(e) => handleInputChange('seguridad', 'expiracionSesion', parseInt(e.target.value))}
                    className="input-field"
                    min="15"
                    max="480"
                  />
                </div>
                
                <div className="form-group">
                  <label className="flex-row align-center gap-10">
                    <input
                      type="checkbox"
                      checked={configuraciones.seguridad?.requerirVerificacionEmail || true}
                      onChange={(e) => handleInputChange('seguridad', 'requerirVerificacionEmail', e.target.checked)}
                    />
                    <span>Requerir verificación de email</span>
                  </label>
                </div>
                
                <div className="form-group">
                  <label className="flex-row align-center gap-10">
                    <input
                      type="checkbox"
                      checked={configuraciones.seguridad?.requerir2FA || false}
                      onChange={(e) => handleInputChange('seguridad', 'requerir2FA', e.target.checked)}
                    />
                    <span>Requerir autenticación de dos factores</span>
                  </label>
                </div>
                
                <div className="form-group">
                  <label className="flex-row align-center gap-10">
                    <input
                      type="checkbox"
                      checked={configuraciones.seguridad?.registroIP || true}
                      onChange={(e) => handleInputChange('seguridad', 'registroIP', e.target.checked)}
                    />
                    <span>Registrar direcciones IP</span>
                  </label>
                </div>
                
                <div className="form-group">
                  <label className="flex-row align-center gap-10">
                    <input
                      type="checkbox"
                      checked={configuraciones.seguridad?.politicasAceptadas || true}
                      onChange={(e) => handleInputChange('seguridad', 'politicasAceptadas', e.target.checked)}
                    />
                    <span>Requerir aceptación de políticas</span>
                  </label>
                </div>
              </div>
              
              <div className="security-info mt-30">
                <h4>
                  <FiLock /> Recomendaciones de Seguridad
                </h4>
                <ul>
                  <li>Utilice autenticación de dos factores para mayor seguridad</li>
                  <li>Revise regularmente los logs de acceso</li>
                  <li>Actualice las contraseñas periódicamente</li>
                  <li>Limite el acceso según los roles de usuario</li>
                </ul>
              </div>
            </div>
          )}

          {/* Configuración Avanzada */}
          {activeTab === 'avanzada' && (
            <div className="tab-content">
              <div className="section-header">
                <h3>
                  <FiDatabase /> Configuración Avanzada
                </h3>
                <div className="flex-row gap-10">
                  <button 
                    className="btn-text text-danger"
                    onClick={toggleModoMantenimiento}
                  >
                    {configuraciones.avanzada?.modoMantenimiento ? 'Desactivar' : 'Activar'} Mantenimiento
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={() => guardarConfiguracion('avanzada')}
                    disabled={saving}
                  >
                    <FiSave /> {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Backup automático</label>
                  <select
                    value={configuraciones.avanzada?.backupAutomatico ? 'si' : 'no'}
                    onChange={(e) => handleInputChange('avanzada', 'backupAutomatico', e.target.value === 'si')}
                    className="select-field"
                  >
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Frecuencia de backup</label>
                  <select
                    value={configuraciones.avanzada?.frecuenciaBackup || 'diario'}
                    onChange={(e) => handleInputChange('avanzada', 'frecuenciaBackup', e.target.value)}
                    className="select-field"
                  >
                    <option value="diario">Diario</option>
                    <option value="semanal">Semanal</option>
                    <option value="mensual">Mensual</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Retención de backups (días)</label>
                  <input
                    type="number"
                    value={configuraciones.avanzada?.retencionBackups || 30}
                    onChange={(e) => handleInputChange('avanzada', 'retencionBackups', parseInt(e.target.value))}
                    className="input-field"
                    min="7"
                    max="365"
                  />
                </div>
                
                <div className="form-group">
                  <label>Versión de API</label>
                  <input
                    type="text"
                    value={configuraciones.avanzada?.versionAPI || '1.0.0'}
                    onChange={(e) => handleInputChange('avanzada', 'versionAPI', e.target.value)}
                    className="input-field"
                    readOnly
                  />
                </div>
                
                <div className="form-group">
                  <label className="flex-row align-center gap-10">
                    <input
                      type="checkbox"
                      checked={configuraciones.avanzada?.logsDetallados || true}
                      onChange={(e) => handleInputChange('avanzada', 'logsDetallados', e.target.checked)}
                    />
                    <span>Logs detallados</span>
                  </label>
                </div>
                
                <div className="form-group">
                  <label className="flex-row align-center gap-10">
                    <input
                      type="checkbox"
                      checked={configuraciones.avanzada?.debugMode || false}
                      onChange={(e) => handleInputChange('avanzada', 'debugMode', e.target.checked)}
                    />
                    <span>Modo debug</span>
                  </label>
                </div>
                
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="flex-row align-center gap-10">
                    <input
                      type="checkbox"
                      checked={configuraciones.avanzada?.modoMantenimiento || false}
                      onChange={() => {}}
                      disabled
                    />
                    <span style={{ color: configuraciones.avanzada?.modoMantenimiento ? 'var(--yy)' : 'inherit' }}>
                      Modo mantenimiento {configuraciones.avanzada?.modoMantenimiento ? 'ACTIVADO' : 'desactivado'}
                    </span>
                  </label>
                </div>
              </div>
              
              <div className="advanced-actions mt-30">
                <h4>Acciones Avanzadas</h4>
                <div className="grid-2 gap-15 mt-15">
                  <button className="btn-secondary">
                    <FiDatabase /> Limpiar cache
                  </button>
                  <button className="btn-warning">
                    <FiDownload /> Descargar logs
                  </button>
                  <button className="btn-danger">
                    Vaciar logs antiguos
                  </button>
                  <button className="btn-primary">
                    <FiGlobe /> Revisar updates
                  </button>
                </div>
              </div>
              
              <div className="security-info mt-30">
                <h4>⚠️ Advertencias</h4>
                <ul>
                  <li>El modo debug solo debe activarse para desarrollo</li>
                  <li>El modo mantenimiento desconectará a todos los usuarios</li>
                  <li>Los cambios en configuración avanzada pueden afectar el rendimiento</li>
                  <li>Realice backup antes de realizar cambios importantes</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Información del Sistema */}
      <div className="card mt-30">
        <div className="section-header">
          <h3>Información del Sistema</h3>
        </div>
        
        <div className="grid-4">
          <div>
            <div className="text-small">Versión</div>
            <div className="font-bold">1.0.0</div>
          </div>
          <div>
            <div className="text-small">Última actualización</div>
            <div className="font-bold">2024-01-10</div>
          </div>
          <div>
            <div className="text-small">Base de datos</div>
            <div className="font-bold">MySQL 8.0</div>
          </div>
          <div>
            <div className="text-small">Estado</div>
            <div className={`font-bold ${configuraciones.avanzada?.modoMantenimiento ? 'text-warning' : 'text-success'}`}>
              {configuraciones.avanzada?.modoMantenimiento ? 'MANTENIMIENTO' : 'OPERATIVO'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinadorConfiguracion;