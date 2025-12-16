import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiMenu, FiX, FiHome, FiUsers, FiCalendar, FiBarChart2,
  FiUserPlus, FiFileText, FiSettings, FiLogOut, FiClock,
  FiTrendingUp, FiUserCheck
} from 'react-icons/fi';

const CoordinadorLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/coordinador/dashboard', icon: <FiHome />, label: 'Panel Coordinación', permiso: 'ver_panel_coordinacion' },
    { path: '/coordinador/usuarios', icon: <FiUserPlus />, label: 'Gestión Usuarios', permiso: 'gestionar_usuarios' },
    { path: '/coordinador/pacientes', icon: <FiUsers />, label: 'Gestión Pacientes', permiso: 'gestionar_pacientes' },
    { path: '/coordinador/asignaciones', icon: <FiUserCheck />, label: 'Asignaciones', permiso: 'gestionar_asignaciones' },
    { path: '/coordinador/agenda', icon: <FiCalendar />, label: 'Agenda Global', permiso: 'ver_agenda_global' },
    { path: '/coordinador/reportes', icon: <FiBarChart2 />, label: 'Reportes', permiso: 'generar_reportes' },
    { path: '/coordinador/altas', icon: <FiTrendingUp />, label: 'Seguimiento Altas', permiso: 'gestionar_altas' },
    { path: '/coordinador/configuracion', icon: <FiSettings />, label: 'Configuración', permiso: 'ver_panel_coordinacion' },
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
          <h2 className="app-name">PsicoGestión - Coordinación</h2>
        </div>
        
        <div className="flex-row align-center gap-20">
          <div className="user-info">
            <span className="user-email">{user?.email}</span>
            <span className="user-rol">Coordinador</span>
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
                <span>Becarios activos: Cargando...</span>
              </div>
              <div className="sidebar-info-item">
                <FiBarChart2 />
                <span>Altas este mes: Cargando...</span>
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
          <span>Rol: Coordinador • Sistema completo</span>
          <span>Última actualización: {new Date().toLocaleTimeString()}</span>
        </div>
      </footer>
    </div>
  );
};

export default CoordinadorLayout;