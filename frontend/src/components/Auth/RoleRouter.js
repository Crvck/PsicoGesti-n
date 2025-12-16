import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BecarioLayout from '../Layout/BecarioLayout';
import PsicologoLayout from '../Layout/PsicologoLayout';
import CoordinadorLayout from '../Layout/CoordinadorLayout';

const RoleRouter = ({ children }) => {
  const { user, loading } = useAuth();

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

  // Determinar layout basado en el rol del usuario
  switch (user.rol) {
    case 'becario':
      return <BecarioLayout>{children}</BecarioLayout>;
    case 'psicologo':
      return <PsicologoLayout>{children}</PsicologoLayout>;
    case 'coordinador':
      return <CoordinadorLayout>{children}</CoordinadorLayout>;
    default:
      // Si el rol no está definido, redirigir a login
      return <Navigate to="/login" />;
  }
};

export default RoleRouter;