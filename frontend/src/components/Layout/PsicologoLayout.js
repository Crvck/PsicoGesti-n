import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiMenu, FiX, FiHome, FiUsers, FiCalendar, FiFileText,
  FiBarChart2, FiUserCheck, FiLogOut, FiClock
} from 'react-icons/fi';

const PsicologoLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/psicologo/dashboard', icon: <FiHome />, label: 'Panel Principal', permiso: 'ver_panel_psicologo' },
    { path: '/psicologo/pacientes', icon: <FiUsers />, label: 'Mis Pacientes', permiso: 'ver_mis_pacientes' },
    { path: '/psicologo/citas', icon: <FiCalendar />, label: 'Mis Citas', permiso: 'gestionar_mis_citas' },
    { path: '/psicologo/expedientes', icon: <FiFileText />, label: 'Expedientes', permiso: 'ver_expedientes' },
    { path: '/psicologo/sesiones', icon: <FiBarChart2 />, label: 'Registro Sesiones', permiso: 'registrar_sesiones' },
    { path: '/psicologo/supervision', icon: <FiUserCheck />, label: 'Supervisión', permiso: 'supervisar_becarios' },
  ];

  return (
    <div className="main-container">
      <header className="top-header">
        <div className="flex-row align-center">
          <button 
            className="control-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
          <h2 className="app-name">PsicoGestión - Psicólogo</h2>
        </div>
        
        <div className="flex-row align-center gap-20">
          <div className="user-info">
            <span className="user-email">{user?.email}</span>
            <span className="user-rol">Psicólogo</span>
            {user?.especialidad && (
              <span className="user-especialidad">• {user.especialidad}</span>
            )}
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
          
          {sidebarOpen && (
            <div className="sidebar-info">
              <div className="sidebar-info-item">
                <FiClock />
                <span>Citas hoy: Cargando...</span>
              </div>
              <div className="sidebar-info-item">
                <FiUsers />
                <span>Pacientes activos: Cargando...</span>
              </div>
            </div>
          )}
        </aside>

        <main className="main-content">
          <div className="content-area">
            <Outlet />
          </div>
        </main>
      </div>

      <footer className="status-bar">
        <div className="status-info">
          <span>Sesión: {user?.email}</span>
          <span>Rol: Psicólogo • Especialidad: {user?.especialidad || 'No especificada'}</span>
          <span>Última actualización: {new Date().toLocaleTimeString()}</span>
        </div>
      </footer>
    </div>
  );
};

export default PsicologoLayout;