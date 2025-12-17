import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BecarioLayout from '../Layout/BecarioLayout';
import PsicologoLayout from '../Layout/PsicologoLayout';
import CoordinadorLayout from '../Layout/CoordinadorLayout';

const RoleRouter = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="global-loader">
        <div className="global-loader-content">
          <div className="global-loader-spinner"></div>
          <div className="global-loader-text">Verificando rol...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Verificar si la ruta actual corresponde al rol del usuario
  const path = location.pathname;
  
  if (user.rol === 'becario' && !path.startsWith('/becario')) {
    return <Navigate to="/becario/dashboard" replace />;
  }
  
  if (user.rol === 'psicologo' && !path.startsWith('/psicologo')) {
    return <Navigate to="/psicologo/dashboard" replace />;
  }
  
  if (user.rol === 'coordinador' && !path.startsWith('/coordinador')) {
    return <Navigate to="/coordinador/dashboard" replace />;
  }

  // Determinar layout basado en el rol del usuario
  switch (user.rol) {
    case 'becario':
      return <BecarioLayout>{children}</BecarioLayout>;
    case 'psicologo':
      return <PsicologoLayout>{children}</PsicologoLayout>;
    case 'coordinador':
      return <CoordinadorLayout>{children}</CoordinadorLayout>;
    default:
      return <Navigate to="/login" />;
  }
};

export default RoleRouter;