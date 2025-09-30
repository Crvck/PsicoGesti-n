import React, { useEffect, useState } from "react";
import "../Styles/ContenedorTablero.css";

interface Psicologo {
  id_psicologo: number;
  nombre: string;
  telefono: string;
  especialidad: string;
}
interface Becario {
  id_becario: number;
  nombre: string;
  telefono: string;
  matricula: string;
  cuatrimestre: number;
  tipo_servicio: string;
  horas_objetivo: number;
  horas_realizadas: number;
  horas_faltantes: number;
}
interface Prestador {
  id_prestador: number;
  nombre: string;
  telefono: string;
  fundacion: string;
  horas_objetivo: number;
  horas_realizadas: number;
  horas_faltantes: number;
  total_solicitudes: number;
}
interface Cita {
  id_consulta: number;
  paciente: string;
  profesional: string;
  tipo: "psicologo" | "becario";
  hora: string;
  dia: string;
  estatus: string;
}
interface ProfesionalDisponible {
  id: number;
  nombre: string;
}

const Personal: React.FC = () => {
  const API_URL = import.meta.env.VITE_API_URL;

  const [psicologos, setPsicologos] = useState<Psicologo[]>([]);
  const [becarios, setBecarios] = useState<Becario[]>([]);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [fechaFiltro, setFechaFiltro] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [nuevoPaciente, setNuevoPaciente] = useState("");
  const [tipoProfesional, setTipoProfesional] = useState<
    "psicologo" | "becario" | ""
  >("");
  const [fechaHoraSeleccionada, setFechaHoraSeleccionada] = useState("");
  const [profesionalesDisponibles, setProfesionalesDisponibles] = useState<
    ProfesionalDisponible[]
  >([]);
  const [profesionalSeleccionado, setProfesionalSeleccionado] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/psicologos/lista`)
      .then((res) => res.json())
      .then((data) => setPsicologos(data))
      .catch((err) => console.error(err));
    fetch(`${API_URL}/becarios/lista`)
      .then((res) => res.json())
      .then((data) => setBecarios(data))
      .catch((err) => console.error(err));
    fetch(`${API_URL}/foranios/lista`)
      .then((res) => res.json())
      .then((data) => setPrestadores(data))
      .catch((err) => console.error(err));
    fetch(`${API_URL}/citas?dia=${fechaFiltro}`)
      .then((res) => res.json())
      .then((data) => setCitas(data))
      .catch((err) => console.error(err));
  }, [API_URL, fechaFiltro]);

  useEffect(() => {
    if (!tipoProfesional || !fechaHoraSeleccionada) return;
    const [fecha, hora] = fechaHoraSeleccionada.split("T");
    fetch(
      `${API_URL}/disponibles?tipo=${tipoProfesional}&dia=${fecha}&hora=${hora}`
    )
      .then((res) => res.json())
      .then((data) => setProfesionalesDisponibles(data))
      .catch((err) => console.error(err));
  }, [API_URL, tipoProfesional, fechaHoraSeleccionada]);

  const handleNuevaCita = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaHoraSeleccionada) return;
    const [fecha, hora] = fechaHoraSeleccionada.split("T");
    const nuevaCita = {
      paciente: nuevoPaciente,
      tipo: tipoProfesional,
      profesionalId: profesionalSeleccionado,
      dia: fecha,
      hora,
    };
    fetch(`${API_URL}/citas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevaCita),
    })
      .then((res) => res.json())
      .then(() => {
        setNuevoPaciente("");
        setTipoProfesional("");
        setFechaHoraSeleccionada("");
        setProfesionalSeleccionado("");
        setProfesionalesDisponibles([]);
        return fetch(`${API_URL}/citas?dia=${fechaFiltro}`);
      })
      .then((res) => res.json())
      .then((data) => setCitas(data))
      .catch((err) => console.error(err));
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-3xl font-bold text-cesunAzul-900 mb-4">
        Gestión de Personal
      </h2>

      {/* Grid principal */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
        {/* Psicólogos */}
        <div className="bg-[#993333]/50 rounded-2xl shadow-md p-4 contenedor-tablero h-96 overflow-y-auto">
          <h3 className="text-lg font-semibold text-cesunAzul-900 mb-2">
            Psicólogos Registrados
          </h3>
          <table className="w-full text-left text-cesunAzul-700">
            <thead>
              <tr className="border-b border-cesunAzul-200">
                <th className="p-2">Nombre</th>
                <th className="p-2">Especialidad</th>
                <th className="p-2">Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {psicologos.map((p) => (
                <tr key={p.id_psicologo} className="hover:bg-[#993333]/20">
                  <td className="p-2">{p.nombre}</td>
                  <td className="p-2">{p.especialidad}</td>
                  <td className="p-2">{p.telefono}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Formulario Nueva Cita */}
        <div className="bg-[#993333]/50 rounded-2xl shadow-md p-6 contenedor-tablero">
          <h3 className="text-xl font-semibold text-cesunAzul-900 mb-4">
            Registrar Nueva Cita
          </h3>
          <form onSubmit={handleNuevaCita} className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nombre del Paciente"
              value={nuevoPaciente}
              onChange={(e) => setNuevoPaciente(e.target.value)}
              className="p-2 rounded-lg border border-gray-300 focus:ring focus:ring-cesunAzul-700 col-span-2"
            />
            <select
              value={tipoProfesional}
              onChange={(e) =>
                setTipoProfesional(e.target.value as "psicologo" | "becario")
              }
              className="p-2 rounded-lg border border-gray-300 focus:ring focus:ring-cesunAzul-700"
            >
              <option value="">Seleccionar Tipo</option>
              <option value="psicologo">Psicólogo</option>
              <option value="becario">Becario</option>
            </select>
            <input
              type="datetime-local"
              value={fechaHoraSeleccionada}
              onChange={(e) => setFechaHoraSeleccionada(e.target.value)}
              className="p-2 rounded-lg border border-gray-300 focus:ring focus:ring-cesunAzul-700"
            />
            <select
              value={profesionalSeleccionado}
              onChange={(e) => setProfesionalSeleccionado(e.target.value)}
              disabled={!profesionalesDisponibles.length}
              className="p-2 rounded-lg border border-gray-300 focus:ring focus:ring-cesunAzul-700 col-span-2"
            >
              <option value="">Seleccionar Profesional Disponible</option>
              {profesionalesDisponibles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
            <div className="col-span-2 flex justify-end">
              <button
                type="submit"
                className="bg-cesunAzul-700 text-white px-6 py-2 rounded-lg hover:bg-cesunAzul-900"
              >
                Guardar Cita
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Grid segunda fila: Becarios y Prestadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
        {/* Becarios */}
        <div className="bg-[#993333]/50 rounded-2xl shadow-md p-4 contenedor-tablero h-96 overflow-y-auto">
          <h3 className="text-lg font-semibold text-cesunAzul-900 mb-2">
            Becarios Registrados
          </h3>
          <table className="w-full text-left text-cesunAzul-700 text-sm">
            <thead>
              <tr className="border-b border-cesunAzul-200">
                <th className="p-1">Nombre</th>
                <th className="p-1">Matrícula</th>
                <th className="p-1">Cuatrimestre</th>
                <th className="p-1">Teléfono</th>
                <th className="p-1">Horas Obj.</th>
                <th className="p-1">Horas Real.</th>
                <th className="p-1">Horas Falt.</th>
              </tr>
            </thead>
            <tbody>
              {becarios.map((b) => (
                <tr key={b.id_becario} className="hover:bg-[#993333]/20">
                  <td className="p-1 ">{b.nombre}</td>
                  <td className="p-1">{b.matricula}</td>
                  <td className="p-1 text-center">{b.cuatrimestre}</td>
                  <td className="p-1 ">{b.telefono}</td>
                  <td className="p-1">{b.horas_objetivo}</td>
                  <td className="p-1">{b.horas_realizadas}</td>
                  <td className="p-1">{b.horas_faltantes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-[#993333]/50 rounded-2xl shadow-md p-6 contenedor-tablero h-96 overflow-y-auto">
          <h3 className="text-lg font-semibold text-cesunAzul-900 mb-2">
            Prestadores Foráneos Registrados
          </h3>
          <table className="w-full text-left text-cesunAzul-700 text-xs">
            <thead>
              <tr className="border-b border-cesunAzul-200">
                <th className="p-1">Nombre</th>
                <th className="p-1">Teléfono</th>
                <th className="p-1">Fundación</th>
                <th className="p-1">Horas Obj.</th>
                <th className="p-1">Horas Real.</th>
                <th className="p-1">Horas Falt.</th>
                <th className="p-1">Solicitudes</th>
              </tr>
            </thead>
            <tbody>
              {prestadores.map((pr) => (
                <tr key={pr.id_prestador} className="hover:bg-[#993333]/20">
                  <td className="p-1">{pr.nombre}</td>
                  <td className="p-1">{pr.telefono}</td>
                  <td className="p-1">{pr.fundacion}</td>
                  <td className="p-1">{pr.horas_objetivo}</td>
                  <td className="p-1">{pr.horas_realizadas}</td>
                  <td className="p-1">{pr.horas_faltantes}</td>
                  <td className="p-1">{pr.total_solicitudes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Personal;
