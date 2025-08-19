import { Routes, Route, Navigate } from "react-router-dom";
import Diseno from "./Componentes/Diseno";
import InicioSesion from "./Componentes/InicioSesion";
import Tablero from "./Views/Tablero";
import Pacientes from "./Views/Pacientes";
import GestionPersonal from "./Views/GestionPersonal";
import Calendario from "./Views/Calendario";
import ListaEspera from "./Views/ListaEspera";
import Grafico from "./Componentes/Grafico";
import "./Styles/ContenedorTablero.css";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./Componentes/ProtectedRoute";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Ruta pública para el inicio de sesión */}
        <Route path="/login" element={<InicioSesion />} />
      
        {/* Rutas protegidas dentro de Diseno como layout */}
        <Route element={<Diseno />}>
          <Route
            path="/tablero"
            element={
              <ProtectedRoute>
                <Tablero />
              </ProtectedRoute>
            }
          />
          <Route
            path="/grafico"
            element={
              <ProtectedRoute>
                <Grafico />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pacientes"
            element={
              <ProtectedRoute>
                <Pacientes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/personal"
            element={
              <ProtectedRoute>
                <GestionPersonal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendario"
            element={
              <ProtectedRoute>
                <Calendario />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lista-espera"
            element={
              <ProtectedRoute>
                <ListaEspera />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Si no existe la ruta, redirige al login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
