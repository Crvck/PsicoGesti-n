import React from "react";
import PacientesPieChart from "./PacientesPieChart";
import "../Styles/ContenedorTablero.css";

//import ContenedorTablero from "./style/ContenedorTablero";
const Tablero: React.FC = () => {
  return (
    <div className="space-y-6 p- ">
      <h2 className="text-3xl font-bold text-cesunAzul-900">Tablero</h2>

      {/* Aquí está tu nueva cuadrícula */}
      <div className=" grid grid-cols-3 grid-rows-5 gap-4 ">
        {/* Total de Pacientes - Fondo rojo semi-transparente */}
        {/* La sintaxis 'bg-[#993333]/50' aplica el color hexadecimal con un 50% de opacidad */}
        <div className="bg-[#993333]/50 row-span-2 col-start-3 row-start-1 contenedor-tablero">
          <h3 className="text-lg font-semibold text-cesunAzul-900">
            Total de Pacientes
          </h3>
          <p className="text-2xl text-cesunAzul-700">0</p>
        </div>

        {/* Citas Próximas - Fondo blanco semi-transparente */}
        <div className="bg-[#993333]/50 row-span-2 col-red-2 row-start-1 contenedor-tablero">
          <h3 className="text-lg font-semibold text-cesunAzul-900">
            Citas Próximas
          </h3>
          <p className="text-2xl text-cesunAzul-700">0</p>
        </div>

        {/* Conteo de Personal - Fondo blanco semi-transparente */}
        <div className="bg-[#993333]/50 row-span-2 col-start-1 row-start-1 contenedor-tablero">
          <h3 className="text-lg font-semibold text-cesunAzul-900">
            Conteo de Personal
          </h3>
          <p className="text-2xl text-cesunAzul-700">0</p>
        </div>

        {/* Bajas de Pacientes - Fondo blanco semi-transparente */}
        <div className="bg-[#993333]/50 row-span-3 row-start-3 contenedor-tablero">
          <h3 className="text-lg font-semibold text-cesunAzul-900">
            Bajas de Pacientes
          </h3>
          <p className="text-2xl text-cesunAzul-700">0</p>
        </div>

        {/* Div 15 - Fondo blanco semi-transparente */}
        <div className="bg-[#993333]/50 row-span-3 row-start-3 contenedor-tablero">
          <p>Contenido del div 15</p>
        </div>

        {/* Gráfico de pastel - Fondo blanco semi-transparente */}
        <div className="bg-[#993333]/50 row-span-3 row-start-3 contenedor-tablero">
          <PacientesPieChart />
        </div>
      </div>
    </div>
  );
};

export default Tablero;
