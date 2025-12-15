import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMenu, FiX, FiHome, FiUsers, FiCalendar, FiSettings, FiLogOut } from 'react-icons/fi';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { path: '/pacientes', icon: <FiUsers />, label: 'Pacientes' },
    { path: '/citas', icon: <FiCalendar />, label: 'Citas' },
    { path: '/configuracion', icon: <FiSettings />, label: 'Configuración' },
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
            {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
          <h2 className="app-name">PsicoGestión</h2>
        </div>
        
        <div className="flex-row align-center gap-20">
          <div className="user-info">
            <span className="user-email">{user?.email}</span>
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
          <span>Sesión activa: {user?.email}</span>
          <span>Última conexión: {new Date().toLocaleTimeString()}</span>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;