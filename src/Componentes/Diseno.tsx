import { Outlet } from "react-router-dom";
import BarraLateral from "./BarraLateral";

const Diseno: React.FC = () => {
  return (
    <div className="flex h-screen bg-cesunAzul-100">
      <BarraLateral />
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Diseno;
