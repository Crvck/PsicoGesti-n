import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiMenu, FiChevronLeft, FiHome, FiUsers, FiCalendar, FiBell,FiSun, FiMoon,
  FiFileText, FiLogOut, FiClock
} from 'react-icons/fi';

const BecarioLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const [notificaciones, setNotificaciones] = useState([]);

  useEffect(() => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        setDarkMode(true);
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        setDarkMode(false);
        document.documentElement.setAttribute('data-theme', 'light');
      }
    }, []);
  
    const toggleDarkMode = () => {
      const newDarkMode = !darkMode;
      setDarkMode(newDarkMode);
      
      if (newDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
      }
    };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fetchNotificaciones = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/notificaciones/mis-notificaciones', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotificaciones(data.data || []);
      }
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
    }
  };

  useEffect(() => {
    fetchNotificaciones();
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchNotificaciones, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { path: '/becario/dashboard', icon: <FiHome />, label: 'Inicio', permiso: 'ver_panel_becario' },
    { path: '/becario/citas', icon: <FiCalendar />, label: 'Mis Citas', permiso: 'gestionar_citas_asignadas' },
    { path: '/becario/pacientes', icon: <FiUsers />, label: 'Mis Pacientes', permiso: 'ver_pacientes_asignados' },
    { path: '/becario/notificaciones', icon: <FiBell />, label: 'Notificaciones', permiso: 'ver_notificaciones' },
    { path: '/becario/observaciones', icon: <FiFileText />, label: 'Observaciones', permiso: 'registrar_observaciones' },
  ];

  return (
    <div className="main-container">
      {/* Top Header */}
      <header className="top-header">
        <div className="flex-row align-center">
          <button 
            className="control-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <FiChevronLeft size={24} /> : <FiMenu size={24} />}
          </button>
          <img 
                src="/images/logoCESUN2wide.png" 
                alt="PsicoGestión" 
                className="dashboard-logo"
              />
          <h2 className="app-name">- Becario</h2>
        </div>
        
        <div className="flex-row align-center gap-20">
          <div className="notificaciones-dropdown">
            <button className="btn-header">
              <FiBell />
              {notificaciones.filter(n => !n.leida).length > 0 && (
                <span className="badge-notificacion">
                  {notificaciones.filter(n => !n.leida).length}
                </span>
              )}
            </button>
          </div>

          {/* Toggle Switch Dark Mode */}
          <div className="toggle-container">
            <input 
              type="checkbox" 
              id="dark-mode-toggle" 
              className="toggle-checkbox"
              checked={darkMode}
              onChange={toggleDarkMode}
            />
            <label 
              htmlFor="dark-mode-toggle" 
              className="toggle-label"
              title={darkMode ? "Modo oscuro activado" : "Modo claro activado"}
            >
              <div className="toggle-ball">
                {darkMode ? <FiMoon size={14} /> : <FiSun size={14} />}
              </div>
              <div className="toggle-icons">
                <FiSun className="sun-icon" size={14} />
                <FiMoon className="moon-icon" size={14} />
              </div>
            </label>
          </div>
          
          <div className="user-info">
            <span className="user-email">{user?.email}</span>
            <span className="user-rol">Becario</span>
          </div>
          
          <button 
            className="btn-header"
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            <FiLogOut />
            <span>Salir</span>
          </button>
        </div>
      </header>

      <div className="content-wrapper">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `sidebar-nav-item ${isActive ? 'active' : ''}`
                }
              >
                {item.icon}
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            ))}
          </nav>
          
          {/* Info del día */}
          {sidebarOpen && (
            <div className="sidebar-info">
              <div className="sidebar-info-item">
                <FiClock />
                <span>{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="sidebar-info-item">
                <FiUsers />
                <span>Pacientes asignados: Cargando...</span>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <div className="content-area">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Status Bar */}
      <footer className="status-bar">
        <div className="status-info">
          <span>Sesión: {user?.email}</span>
          <span>Rol: Becario</span>
          <span>Última conexión: {new Date().toLocaleTimeString()}</span>
        </div>
      </footer>
    </div>
  );
};

export default BecarioLayout;