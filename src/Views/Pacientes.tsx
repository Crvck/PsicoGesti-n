import React, { useEffect, useState } from "react";

// La URL base viene del .env
const API_URL = import.meta.env.VITE_API_URL;

interface Paciente {
  id_paciente: number;
  nombre: string;
  edad: number;
  sexo: string;
  telefono: string;
  correo: string;
  motivo_consulta: string;
  carrera: string;
  es_estudiante: boolean;
  es_foraneo: boolean;
  observaciones: string;
  activo: boolean;
}

const Pacientes: React.FC = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [search, setSearch] = useState("");

  // Cargar pacientes activos al iniciar
  useEffect(() => {
    fetchPacientes("activo");
  }, []);

  const fetchPacientes = async (filtro?: string) => {
    try {
      let url = `${API_URL}/paciente`;
      if (filtro && filtro.trim() !== "") {
        if (filtro === "activo") {
          url += `?activo=true`;
        } else {
          url += `?nombre=${encodeURIComponent(filtro)}`;
        }
      }

      const res = await fetch(url);
      const data: Paciente[] = await res.json();
      setPacientes(data);
    } catch (err) {
      console.error("Error al obtener pacientes:", err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPacientes(search);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-white">Pacientes</h2>

      {/* Barra de búsqueda */}
      <form onSubmit={handleSearch} className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="Buscar por ID, nombre o número..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 p-2 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#222A35]"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-[#222A35] text-white shadow-md hover:bg-[#2f3a4a]"
        >
          Buscar
        </button>
      </form>

      {/* Tabla */}
      <table className="w-full mt-4 bg-[#222A35] rounded-2xl shadow-md text-white text-sm overflow-hidden">
        <thead>
          <tr className="bg-[#2f3a4a]">
            <th className="p-2 text-left">ID</th>
            <th className="p-2 text-left">Nombre</th>
            <th className="p-2 text-left">Edad</th>
            <th className="p-2 text-left">Sexo</th>
            <th className="p-2 text-left">Correo</th>
            <th className="p-2 text-left">Teléfono</th>
            <th className="p-2 text-left">Motivo Consulta</th>
            <th className="p-2 text-left">Carrera</th>
            <th className="p-2 text-left">Estudiante</th>
            <th className="p-2 text-left">Foráneo</th>
            <th className="p-2 text-left">Observaciones</th>
          </tr>
        </thead>
        <tbody>
          {pacientes.length > 0 ? (
            pacientes.map((paciente) => (
              <tr
                key={paciente.id_paciente}
                className="hover:bg-[#364151] transition"
              >
                <td className="p-2">{paciente.id_paciente}</td>
                <td className="p-2">{paciente.nombre}</td>
                <td className="p-2">{paciente.edad}</td>
                <td className="p-2">{paciente.sexo}</td>
                <td className="p-2">{paciente.correo}</td>
                <td className="p-2">{paciente.telefono}</td>
                <td className="p-2">{paciente.motivo_consulta}</td>
                <td className="p-2">{paciente.carrera}</td>
                <td className="p-2">{paciente.es_estudiante ? "Sí" : "No"}</td>
                <td className="p-2">{paciente.es_foraneo ? "Sí" : "No"}</td>
                <td className="p-2">{paciente.observaciones}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={11} className="p-4 text-center text-gray-400">
                No se encontraron pacientes
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Pacientes;
