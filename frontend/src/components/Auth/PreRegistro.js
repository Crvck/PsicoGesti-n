import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import './Login.css';

// Iconos SVG
const Icons = {
  User: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Mail: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Phone: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  IdCard: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Building: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-4h8v4"/></svg>,
  Clock: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  ArrowLeft: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
};

const PreRegistro = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tipoRegistro, setTipoRegistro] = useState('interno'); 

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    matricula: '',
    institucionProcedencia: '',
    horasALiberar: '',
    motivo: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitch = (tipo) => {
    setTipoRegistro(tipo);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // --- VALIDACIONES ---
    if (tipoRegistro === 'interno' && !formData.matricula) {
      setError('La matrícula es obligatoria para estudiantes.');
      setLoading(false);
      return;
    }
    if (tipoRegistro === 'externo' && !formData.institucionProcedencia) {
      setError('La institución es obligatoria.');
      setLoading(false);
      return;
    }
    if (!formData.horasALiberar) {
      setError('Indique las horas a liberar.');
      setLoading(false);
      return;
    }

    const payload = {
      ...formData,
      esEstudiante: tipoRegistro === 'interno',
      matricula: tipoRegistro === 'interno' ? formData.matricula : null,
      institucionProcedencia: tipoRegistro === 'externo' ? formData.institucionProcedencia : 'CESUN'
    };

    try {
      const data = await ApiService.post('/preregistro', payload);
      if (data.success) {
        alert('Solicitud enviada. El coordinador revisará su perfil.');
        navigate('/login');
      } else {
        setError(data.message || 'Error al procesar la solicitud.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <video 
        autoPlay loop muted 
        className="background-video"
        onContextMenu={(e) => e.preventDefault()}
      >
        <source src="/images/banner.mp4" type="video/mp4" />
      </video>

      <div className="login-container">
        <div className="login-card preregistro-card glass-effect">
          <div className="login-header">
            <div className="logo-container">
              <img src="/images/logoCESUN2.png" alt="PsicoGestión" className="login-logo" />
            </div>
            <h2 className="login-title">Registro de Colaboradores</h2>
            <p className="login-subtitle">Prácticas Profesionales y Servicio Social</p>
          </div>

          <div className="switch-container">
            <div 
              className={`switch-bg ${tipoRegistro === 'externo' ? 'slide-right' : ''}`} 
            ></div>
            <button 
              type="button" 
              className={`switch-btn ${tipoRegistro === 'interno' ? 'active' : ''}`}
              onClick={() => handleSwitch('interno')}
            >
              Estudiante CESUN
            </button>
            <button 
              type="button" 
              className={`switch-btn ${tipoRegistro === 'externo' ? 'active' : ''}`}
              onClick={() => handleSwitch('externo')}
            >
              Foráneo / Fundación
            </button>
          </div>

          <form onSubmit={handleSubmit} className="preregistro-form">
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Nombre Completo</label>
                <div className="input-with-icon">
                  <span className="input-icon"><Icons.User /></span>
                  <input
                    type="text"
                    name="nombre"
                    className="input-field-pro"
                    placeholder="Ej. Juan Pérez"
                    required
                    value={formData.nombre}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <div className="input-with-icon">
                  <span className="input-icon"><Icons.Phone /></span>
                  <input
                    type="tel"
                    name="telefono"
                    className="input-field-pro"
                    placeholder="(000) 000-0000"
                    required
                    value={formData.telefono}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Correo Electrónico</label>
              <div className="input-with-icon">
                <span className="input-icon"><Icons.Mail /></span>
                <input
                  type="email"
                  name="email"
                  className="input-field-pro"
                  placeholder="correo@ejemplo.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-grid-2">
              {tipoRegistro === 'interno' ? (
                <div className="form-group fade-in-field">
                  <label className="form-label">Matrícula</label>
                  <div className="input-with-icon">
                    <span className="input-icon"><Icons.IdCard /></span>
                    <input
                      type="text"
                      name="matricula"
                      className="input-field-pro"
                      placeholder="000000"
                      value={formData.matricula}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              ) : (
                <div className="form-group fade-in-field">
                  <label className="form-label">Institución / Fundación</label>
                  <div className="input-with-icon">
                    <span className="input-icon"><Icons.Building /></span>
                    <input
                      type="text"
                      name="institucionProcedencia"
                      className="input-field-pro"
                      placeholder="Nombre de la escuela"
                      value={formData.institucionProcedencia}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Horas a Liberar</label>
                <div className="input-with-icon">
                  <span className="input-icon"><Icons.Clock /></span>
                  <input
                    type="number"
                    name="horasALiberar"
                    className="input-field-pro"
                    placeholder="Ej. 480"
                    required
                    min="1"
                    value={formData.horasALiberar}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Motivo de Solicitud</label>
              <textarea
                name="motivo"
                className="input-field-pro textarea-pro"
                placeholder="Describa brevemente..."
                rows="2"
                value={formData.motivo}
                onChange={handleChange}
              ></textarea>
            </div>

            {error && <div className="error-message-pro" style={{color: 'red', fontSize: '0.9rem', marginBottom: '10px'}}>{error}</div>}

            <div className="actions-container">
              {/* Botón regresar movido aquí para balancear el diseño */}
              <button 
                type="button"
                className="btn-text"
                onClick={() => navigate('/login')}
              >
                <Icons.ArrowLeft /> Regresar
              </button>

              <button type="submit" className="btn-submit-pro" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PreRegistro;