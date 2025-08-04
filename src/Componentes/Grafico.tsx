import React from "react";

const PacientesPieChart: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 w-full max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-center text-cesunAzul-900 mb-4">
        Altas y Bajas de Pacientes (últimos 30 días)
      </h2>
      <div className="w-full h-64 bg-gray-200 rounded-full flex items-center justify-center">
        <span className="text-gray-500">Gráfico de Pastel (Placeholder)</span>
      </div>
    </div>
  );
};

const Pacientes: React.FC = () => {
  return (
    <div>
      <h2 className="text-3xl font-bold text-cesunAzul-900">Pacientes</h2>
      <div className="mt-6">
        <PacientesPieChart />
      </div>
      <table className="w-full mt-4 bg-white rounded-lg shadow-md">
        <thead>
          <tr className="bg-cesunAzul-700 text-white">
            <th className="p-4">ID</th>
            <th className="p-4">Nombre</th>
            <th className="p-4">Correo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-4">1</td>
            <td className="p-4">Ejemplo</td>
            <td className="p-4">ejemplo@correo.com</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Pacientes;
