import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Auth/Login';
import RoleRouter from './components/Auth/RoleRouter';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Importa los modales
import ConfirmModal from './components/Common/ConfirmModal';
import NotificationModal from './components/Common/NotificationModal';

// Páginas para Becarios
import BecarioDashboard from './pages/becario/DashboardPage';
import BecarioCitas from './pages/becario/CitasPage';
import BecarioPacientes from './pages/becario/PacientesPage';
import BecarioNotificaciones from './pages/becario/NotificacionesPage';
import BecarioObservaciones from './pages/becario/ObservacionesPage';

// Páginas para Psicólogos
import PsicologoDashboard from './pages/psicologo/DashboardPage';
import PsicologoPacientes from './pages/psicologo/PacientesPage';
import PsicologoCitas from './pages/psicologo/CitasPage';
import PsicologoExpedientes from './pages/psicologo/ExpedientesPage';
import PsicologoSesiones from './pages/psicologo/SesionesPage';
import PsicologoSupervision from './pages/psicologo/SupervisionPage';

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
          <Route path="/login" element={<Login />} />
          
          {/* Rutas de Becario */}
          <Route path="/" element={<RoleRouter />}>
            <Route index element={<BecarioDashboard />} />
            
            {/* Becario */}
            <Route path="becario/dashboard" element={<BecarioDashboard />} />
            <Route path="becario/citas" element={<BecarioCitas />} />
            <Route path="becario/pacientes" element={<BecarioPacientes />} />
            <Route path="becario/notificaciones" element={<BecarioNotificaciones />} />
            <Route path="becario/observaciones" element={<BecarioObservaciones />} />
            
            {/* Psicólogo */}
            <Route path="psicologo/dashboard" element={<PsicologoDashboard />} />
            <Route path="psicologo/pacientes" element={<PsicologoPacientes />} />
            <Route path="psicologo/citas" element={<PsicologoCitas />} />
            <Route path="psicologo/expedientes" element={<PsicologoExpedientes />} />
            <Route path="psicologo/sesiones" element={<PsicologoSesiones />} />
            <Route path="psicologo/supervision" element={<PsicologoSupervision />} />
            
            {/* Coordinador */}
            <Route path="coordinador/dashboard" element={<CoordinadorDashboard />} />
            <Route path="coordinador/usuarios" element={<CoordinadorUsuarios />} />
            <Route path="coordinador/pacientes" element={<CoordinadorPacientes />} />
            <Route path="coordinador/asignaciones" element={<CoordinadorAsignaciones />} />
            <Route path="coordinador/agenda" element={<CoordinadorAgenda />} />
            <Route path="coordinador/reportes" element={<CoordinadorReportes />} />
            <Route path="coordinador/altas" element={<CoordinadorAltas />} />
            <Route path="coordinador/configuracion" element={<CoordinadorConfiguracion />} />
          </Route>
          
          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;