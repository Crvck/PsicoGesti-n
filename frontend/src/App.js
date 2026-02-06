import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Auth/Login';
import PreRegistro from './components/Auth/PreRegistro'; // <--- Importación agregada
import RoleRouter from './components/Auth/RoleRouter';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Importa los modales
import ConfirmModal from './components/Common/ConfirmModal';
import NotificationModal from './components/Common/NotificationModal';

// Páginas para Becarios
// Páginas para Coterapeutas (antes Becario)
import CoterapeutaDashboard from './pages/caterapeuta/DashboardPage';
import CoterapeutaCitas from './pages/caterapeuta/CitasPage';
import CoterapeutaPacientes from './pages/caterapeuta/PacientesPage';
import CoterapeutaNotificaciones from './pages/caterapeuta/NotificacionesPage';
import CoterapeutaObservaciones from './pages/caterapeuta/ObservacionesPage';

// Páginas para Terapeutas (antes Psicólogo)
import TerapeutaDashboard from './pages/terapeuta/DashboardPage';
import TerapeutaPacientes from './pages/terapeuta/PacientesPage';
import TerapeutaCitas from './pages/terapeuta/CitasPage';
import TerapeutaExpedientes from './pages/terapeuta/ExpedientesPage';
import TerapeutaSesiones from './pages/terapeuta/SesionesPage';
import TerapeutaSupervision from './pages/terapeuta/SupervisionPage';
import TerapeutaConfiguracion from './pages/terapeuta/ConfiguracionPage';

// Páginas para Psicopedagógico
import PsicopedagogicoDashboard from './pages/psicopedagogico/DashboardPage';
import PsicopedagogicoPacientes from './pages/psicopedagogico/PacientesPage';

// Páginas para Coordinadores
import CoordinadorDashboard from './pages/coordinador/DashboardPage';
import CoordinadorUsuarios from './pages/coordinador/UsuariosPage';
import CoordinadorPacientes from './pages/coordinador/PacientesPage';
import CoordinadorAsignaciones from './pages/coordinador/AsignacionesPage';
import CoordinadorAgenda from './pages/coordinador/AgendaPage';
import CoordinadorReportes from './pages/coordinador/ReportesPage';
import CoordinadorAltas from './pages/coordinador/AltasPage';
import CoordinadorConfiguracion from './pages/coordinador/ConfiguracionPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        {/* Agrega los modales aquí */}
        <ConfirmModal />
        <NotificationModal />
        
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/preregistro" element={<PreRegistro />} /> {/* <--- Ruta agregada */}
          
          {/* Rutas Protegidas por Rol */}
          <Route path="/" element={<RoleRouter />}>
            <Route index element={<CoterapeutaDashboard />} />
            
            {/* Coterapeuta */}
            <Route path="coterapeuta/dashboard" element={<CoterapeutaDashboard />} />
            <Route path="coterapeuta/citas" element={<CoterapeutaCitas />} />
            <Route path="coterapeuta/pacientes" element={<CoterapeutaPacientes />} />
            <Route path="coterapeuta/notificaciones" element={<CoterapeutaNotificaciones />} />
            <Route path="coterapeuta/observaciones" element={<CoterapeutaObservaciones />} />

            {/* Terapeuta */}
            <Route path="terapeuta/dashboard" element={<TerapeutaDashboard />} />
            <Route path="terapeuta/pacientes" element={<TerapeutaPacientes />} />
            <Route path="terapeuta/citas" element={<TerapeutaCitas />} />
            <Route path="terapeuta/expedientes" element={<TerapeutaExpedientes />} />
            <Route path="terapeuta/sesiones" element={<TerapeutaSesiones />} />
            <Route path="terapeuta/supervision" element={<TerapeutaSupervision />} />
            <Route path="terapeuta/configuracion" element={<TerapeutaConfiguracion />} />
            
            {/* Coordinador */}
            <Route path="coordinador/dashboard" element={<CoordinadorDashboard />} />
            <Route path="coordinador/usuarios" element={<CoordinadorUsuarios />} />
            <Route path="coordinador/pacientes" element={<CoordinadorPacientes />} />
            <Route path="coordinador/asignaciones" element={<CoordinadorAsignaciones />} />
            <Route path="coordinador/agenda" element={<CoordinadorAgenda />} />
            <Route path="coordinador/reportes" element={<CoordinadorReportes />} />
            <Route path="coordinador/altas" element={<CoordinadorAltas />} />
            <Route path="coordinador/configuracion" element={<CoordinadorConfiguracion />} />

            {/* Psicopedagógico */}
            <Route path="psicopedagogico/dashboard" element={<PsicopedagogicoDashboard />} />
            <Route path="psicopedagogico/pacientes" element={<PsicopedagogicoPacientes />} />
          </Route>
          
          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;