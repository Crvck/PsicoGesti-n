import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!credentials.email || !credentials.password) {
      setError('Por favor ingrese email y contraseña');
      setLoading(false);
      return;
    }

    const result = await login(credentials.email, credentials.password);
    
    console.log('Resultado del login:', result);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">PsicoGestión</h1>
          <p className="login-subtitle">Consultorio Psicológico</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              className="input-field"
              placeholder="Correo electrónico"
              value={credentials.email}
              onChange={(e) => setCredentials({...credentials, email: e.target.value})}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              className="input-field"
              placeholder="Contraseña"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              onKeyDown={handleKeyDown}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-100"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>

          <div className="login-footer">
            <p className="instructions">
              <span>Enter: Acceder</span>
              <span>ESC: Salir</span>
            </p>
          </div>
        </form>

        <div className="app-info">
          <p>Versión 1.0.0</p>
          <p>Sistema de Gestión de Consultorio Psicológico</p>
        </div>
      </div>
    </div>
  );
};

export default Login;