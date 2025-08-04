import { NavLink } from "react-router-dom";

const BarraLateral: React.FC = () => {
  const navItems = [
    { path: "/", label: "Inicio" },
    { path: "/pacientes", label: "Pacientes" },
    { path: "/personal", label: "Gestión del Personal" },
    { path: "/calendario", label: "Calendario" },
    { path: "/lista-espera", label: "Lista de Espera" },
  ];

  return (
    <div className="h-screen bg-[#4EA6F5] p-4">
      <aside className="w-64">
        <h1 className="text-2xl font-bold mb-6 text-white">
          Consultorio Médico
        </h1>
        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block py-2 px-4 mb-2 rounded-lg text-white transition duration-300 ${
                  isActive
                    ? "bg-[#3E86C5]"
                    : "hover:scale-105 hover:bg-[#3E86C5]"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </div>
  );
};

export default BarraLateral;
