import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FiUser, 
  FiLock, 
  FiBell, 
  FiCalendar, 
  FiSave,
  FiUpload,
  FiDownload
} from 'react-icons/fi';

const ConfiguracionPage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('perfil');
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    especialidad: '',
    horarioInicio: '09:00',
    horarioFin: '18:00',
    duracionCita: 45,
    notificacionesEmail: true,
    notificacionesSMS: false
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        email: user.email || '',
        telefono: user.telefono || '',
        especialidad: user.especialidad || 'Psicología Clínica',
        horarioInicio: user.horarioInicio || '09:00',
        horarioFin: user.horarioFin || '18:00',
        duracionCita: user.duracionCita || 45,
        notificacionesEmail: user.notificacionesEmail || true,
        notificacionesSMS: user.notificacionesSMS || false
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Simular guardado
      setTimeout(() => {
        updateUser(formData);
        setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
        setSaving(false);
        
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      }, 1000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar los cambios' });
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }
    
    setSaving(true);
    
    try {
      // Simular cambio de contraseña
      setTimeout(() => {
        setMessage({ type: 'success', text: 'Contraseña cambiada correctamente' });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setSaving(false);
        
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      }, 1000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al cambiar la contraseña' });
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'perfil', label: 'Perfil', icon: <FiUser /> },
    { id: 'seguridad', label: 'Seguridad', icon: <FiLock /> },
    { id: 'notificaciones', label: 'Notificaciones', icon: <FiBell /> },
    { id: 'horarios', label: 'Horarios', icon: <FiCalendar /> }
  ];

  return (
    <div className="configuracion-page">
      <div className="page-header">
        <h1>Configuración</h1>
        <p>Configuración del sistema y perfil de usuario</p>
      </div>

      {message.text && (
        <div className={`alert-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="configuracion-container">
        {/* Tabs */}
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

        {/* Contenido de las tabs */}
        <div className="config-content">
          {/* Perfil */}
          {activeTab === 'perfil' && (
            <div className="tab-content">
              <h3>Información del Perfil</h3>
              <form onSubmit={handleSaveProfile}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nombre completo</label>
                    <input
                      type="text"
                      name="nombre"
                      className="input-field"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Correo electrónico</label>
                    <input
                      type="email"
                      name="email"
                      className="input-field"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="tu@email.com"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input
                      type="tel"
                      name="telefono"
                      className="input-field"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      placeholder="Número de teléfono"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Especialidad</label>
                    <select
                      name="especialidad"
                      className="select-field"
                      value={formData.especialidad}
                      onChange={handleInputChange}
                    >
                      <option value="Psicología Clínica">Psicología Clínica</option>
                      <option value="Psicología Educativa">Psicología Educativa</option>
                      <option value="Psicología Organizacional">Psicología Organizacional</option>
                      <option value="Neuropsicología">Neuropsicología</option>
                      <option value="Psicoterapia">Psicoterapia</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={saving}
                  >
                    <FiSave /> {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Seguridad */}
          {activeTab === 'seguridad' && (
            <div className="tab-content">
              <h3>Cambiar Contraseña</h3>
              <form onSubmit={handleChangePassword}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Contraseña actual</label>
                    <input
                      type="password"
                      name="currentPassword"
                      className="input-field"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Ingresa tu contraseña actual"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Nueva contraseña</label>
                    <input
                      type="password"
                      name="newPassword"
                      className="input-field"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Confirmar nueva contraseña</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      className="input-field"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Repite la nueva contraseña"
                    />
                  </div>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={saving}
                  >
                    <FiSave /> {saving ? 'Cambiando...' : 'Cambiar Contraseña'}
                  </button>
                </div>
              </form>
              
              <div className="security-info">
                <h4>Recomendaciones de seguridad:</h4>
                <ul>
                  <li>Usa una contraseña con al menos 8 caracteres</li>
                  <li>Incluye mayúsculas, minúsculas, números y símbolos</li>
                  <li>No uses la misma contraseña en múltiples sitios</li>
                  <li>Cambia tu contraseña regularmente</li>
                </ul>
              </div>
            </div>
          )}

          {/* Notificaciones */}
          {activeTab === 'notificaciones' && (
            <div className="tab-content">
              <h3>Preferencias de Notificaciones</h3>
              <div className="notifications-list">
                <div className="notification-item">
                  <div>
                    <h4>Notificaciones por Email</h4>
                    <p>Recibe notificaciones por correo electrónico</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      name="notificacionesEmail"
                      checked={formData.notificacionesEmail}
                      onChange={handleInputChange}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                
                <div className="notification-item">
                  <div>
                    <h4>Notificaciones por SMS</h4>
                    <p>Recibe notificaciones por mensaje de texto</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      name="notificacionesSMS"
                      checked={formData.notificacionesSMS}
                      onChange={handleInputChange}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                
                <div className="notification-item">
                  <div>
                    <h4>Recordatorios de citas</h4>
                    <p>Recuerda a los pacientes 24 horas antes de su cita</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      defaultChecked
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                
                <div className="notification-item">
                  <div>
                    <h4>Reportes semanales</h4>
                    <p>Recibe un resumen semanal por email</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      defaultChecked
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Horarios */}
          {activeTab === 'horarios' && (
            <div className="tab-content">
              <h3>Configuración de Horarios</h3>
              <form>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Horario de inicio</label>
                    <input
                      type="time"
                      name="horarioInicio"
                      className="input-field"
                      value={formData.horarioInicio}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Horario de fin</label>
                    <input
                      type="time"
                      name="horarioFin"
                      className="input-field"
                      value={formData.horarioFin}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Duración de citas (minutos)</label>
                    <select
                      name="duracionCita"
                      className="select-field"
                      value={formData.duracionCita}
                      onChange={handleInputChange}
                    >
                      <option value="30">30 minutos</option>
                      <option value="45">45 minutos</option>
                      <option value="60">60 minutos</option>
                      <option value="90">90 minutos</option>
                    </select>
                  </div>
                </div>
                
                <div className="horario-disponibilidad">
                  <h4>Días de atención</h4>
                  <div className="dias-grid">
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((dia) => (
                      <div key={dia} className="dia-item">
                        <label className="switch">
                          <input
                            type="checkbox"
                            defaultChecked={dia !== 'Domingo'}
                          />
                          <span className="slider"></span>
                        </label>
                        <span>{dia}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    <FiSave /> Guardar Horarios
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Opciones avanzadas */}
      <div className="advanced-settings">
        <h3>Opciones Avanzadas</h3>
        <div className="advanced-actions">
          <button className="btn-warning">
            <FiDownload /> Exportar Datos
          </button>
          <button className="btn-secondary">
            <FiUpload /> Importar Datos
          </button>
          <button className="btn-danger">
            Limpiar Cache
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionPage;