import { Routes, Route, Navigate } from "react-router-dom";
import Diseno from "./Componentes/Diseno";
import InicioSesion from "./Componentes/InicioSesion";
import Tablero from "./Views/Tablero";
import Pacientes from "./Views/Pacientes";
import GestionPersonal from "./Views/GestionPersonal";
import Calendario from "./Views/Calendario";
import ListaEspera from "./Views/ListaEspera";
import Grafico from "./Componentes/Grafico";
import "./index.css";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/inicio-sesion" element={<InicioSesion />} />
      <Route element={<Diseno />}>
        <Route path="/" element={<Tablero />} />
        <Route path="/grafico" element={<Grafico />} />{" "}
        {/* Opción: ruta separada */}
        <Route path="/pacientes" element={<Pacientes />} />
        <Route path="/personal" element={<GestionPersonal />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/lista-espera" element={<ListaEspera />} />
      </Route>
      <Route path="*" element={<Navigate to="/inicio-sesion" replace />} />
    </Routes>
  );
};

export default App;
