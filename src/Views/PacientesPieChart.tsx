import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Altas de pacientes", value: 120 },
  { name: "Bajas de pacientes", value: 45 },
];

const COLORS = ["#00C49F", "#FF8042"];

const PacientesPieChart: React.FC = () => {
  return (
    //  CONTENEDOR GENERAL DEL GRÁFICO:
    // Se eliminan 'max-w-md' y 'mx-auto' para que ocupe el espacio disponible
    <div className=" rounded-2xl shadow-md p-6 w-full h-full">
      {/* 🟩 TÍTULO: centrar texto y separar con margen inferior */}
      <h2 className="text-xl font-semibold text-center text-cesunAzul-900 mb-4">
        Altas y Bajas de Pacientes (últimos 30 días)
      </h2>

      {/*  COMPONENTE RESPONSIVE:
          Usamos ResponsiveContainer para que el gráfico se adapte automáticamente al tamaño del div padre.
          Asegúrate de que el contenedor padre tenga una altura definida si usas esto.
      */}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%" // Posición horizontal del centro del pastel (50% es centrado)
            cy="50%" // Posición vertical del centro del pastel (50% es centrado)
            labelLine={false}
            label={
              ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` //  Etiquetas del gráfico
            }
            outerRadius={100} // Tamaño del gráfico. Puedes reducirlo o aumentarlo
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          {/* 🟦 TOOLTIP: aparece al pasar el mouse */}
          <Tooltip />
          {/* 🟧 LEYENDA: puedes cambiar la posición vertical o moverla a la derecha con `align="right"` */}
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PacientesPieChart;
