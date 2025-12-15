import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Auth/Login';
import MainLayout from './components/Layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import PacientesPage from './pages/PacientesPage';
import CitasPage from './pages/CitasPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import PrivateRoute from './components/Auth/PrivateRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="pacientes" element={<PacientesPage />} />
            <Route path="citas" element={<CitasPage />} />
            <Route path="configuracion" element={<ConfiguracionPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;