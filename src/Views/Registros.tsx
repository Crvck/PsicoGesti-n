import React, { useState } from "react";

type Rol = "Administrador" | "Becario" | "Psicólogo" | "Paciente";

const Registros: React.FC = () => {
  const [rol, setRol] = useState<Rol>("Paciente");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [confirmPassword, setConfirmPassword] = useState("");


  const API_URL = import.meta.env.VITE_API_URL;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar confirmación de contraseña para roles especiales
    if (
      ["Administrador", "Becario", "Psicólogo"].includes(rol) &&
      formData.contrasena !== confirmPassword
    ) {
      alert("La contraseña y su confirmación no coinciden");
      return;
    }

    try {
      
      const response = await fetch(`${API_URL}/Registrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rol, ...formData }),
      });

      if (!response.ok) throw new Error("Error al registrar el usuario");

      const data = await response.json();
      console.log("Usuario registrado:", data);
      alert("Usuario registrado correctamente");
      setFormData({});
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Error al registrar:", err);
      alert(`Error: ${err.message}`);
    }
  };

  const renderCampos = () => {
    switch (rol) {
      case "Administrador":
        return (
          <>
            <input
              type="text"
              name="area"
              placeholder="Área"
              onChange={handleChange}
              value={formData.area || ""}
              className="p-3 rounded-xl border w-full bg-[#2E3645] text-white placeholder-gray-400"
              required
            />
            <input
              type="password"
              name="contrasena"
              placeholder="Contraseña"
              onChange={handleChange}
              value={formData.contrasena || ""}
              className="p-3 rounded-xl border w-full bg-[#2E3645] text-white placeholder-gray-400"
              required
            />
            <input
              type="password"
              placeholder="Confirmar contraseña"
              onChange={(e) => setConfirmPassword(e.target.value)}
              value={confirmPassword}
              className="p-3 rounded-xl border w-full bg-[#2E3645] text-white placeholder-gray-400"
              required
            />
          </>
        );
      case "Becario":
        return (
          <>
            <input
              type="text"
              name="matricula"
              placeholder="Matrícula"
              onChange={handleChange}
              value={formData.matricula || ""}
              className="p-3 rounded-xl border w-full bg-[#2E3645] text-white placeholder-gray-400"
              required
            />
            <input
              type="text"
              name="carrera"
              placeholder="Carrera"
              onChange={handleChange}
              value={formData.carrera || ""}
              className="p-3 rounded-xl border w-full bg-[#2E3645] text-white placeholder-gray-400"
              required
            />
            <input
              type="password"
              name="contrasena"
              placeholder="Contraseña"
              onChange={handleChange}
              value={formData.contrasena || ""}
              className="p-3 rounded-xl border w-full bg-[#2E3645] text-white placeholder-gray-400"
              required
            />
            <input
              type="password"
              placeholder="Confirmar contraseña"
              onChange={(e) => setConfirmPassword(e.target.value)}
              value={confirmPassword}
              className="p-3 rounded-xl border w-full bg-[#2E3645] text-white placeholder-gray-400"
              required
            />
          </>
        );
      case "Psicólogo":
        return (
          <>
            <input
              type="text"
              name="especialidad"
              placeholder="Especialidad"
              onChange={handleChange}
              value={formData.especialidad || ""}
              className="p-3 rounded-xl border w-full bg-[#2E3645] text-white placeholder-gray-400"
              required
            />
            <input
              type="text"
              name="cedula"
              placeholder="Cédula Profesional"
              onChange={handleChange}
              value={formData.cedula || ""}
              className="p-3 rounded-xl border w-full bg-[#2E3645] text-white placeholder-gray-400"
              required
            />
            <input
              type="password"
              name="contrasena"
              placeholder="Contraseña"
              onChange={handleChange}
              value={formData.contrasena || ""}
              className="p-3 rounded-xl border w-full bg-[#2E3645] text-white placeholder-gray-400"
              required
            />
            <input
              type="password"
              placeholder="Confirmar contraseña"
              onChange={(e) => setConfirmPassword(e.target.value)}
              value={confirmPassword}
              className="p-3 rounded-xl border w-full bg-[#2E3645] text-white placeholder-gray-400"
              required
            />
          </>
        );
      case "Paciente":
        return (
          <>
            <input
              type="text"
              name="motivo"
              placeholder="Motivo de consulta"
              onChange={handleChange}
              value={formData.motivo || ""}
              className="p-3 rounded-xl border w-full bg-[#2E3645] text-white placeholder-gray-400"
              required
            />
            <input
              type="text"
              name="carrera"
              placeholder="Carrera"
              onChange={handleChange}
              value={formData.carrera || ""}
              className="p-3 rounded-xl border w-full bg-[#2E3645] text-white placeholder-gray-400"
              required
            />
          </>
        );
    }
  };

  return (
<div className="flex justify-left ml-20"> 
  <div className="w-full max-w-md p-8 rounded-3xl shadow-lg" style={{ backgroundColor: "#222A35" }}>
      <h2 className="text-2xl font-bold text-center text-white mb-6">
        Registro de Usuario
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 text-white">
        {/* Switch de roles */}
        <div className="flex justify-between items-center bg-[#1b2330] p-2 rounded-xl">
          {(["Administrador", "Becario", "Psicólogo", "Paciente"] as Rol[]).map(
            (r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRol(r)}
                className={`px-3 py-1 rounded-lg text-sm transition ${
                  rol === r ? "bg-white text-black font-semibold" : "text-white"
                }`}
              >
                {r}
              </button>
            )
          )}
        </div>

        {/* Campos comunes */}
        <input
          type="text"
          name="nombre"
          placeholder="Nombre"
          onChange={handleChange}
          value={formData.nombre || ""}
          className="p-3 rounded-xl border w-full bg-[#2E3645] text-white placeholder-gray-400"
          required
        />
        <input
          type="email"
          name="correo"
          placeholder="Correo"
          onChange={handleChange}
          value={formData.correo || ""}
          className="p-3 rounded-xl border w-full bg-[#2E3645] text-white placeholder-gray-400"
          required
        />
        <input
          type="text"
          name="telefono"
          placeholder="Teléfono"
          onChange={handleChange}
          value={formData.telefono || ""}
          className="p-3 rounded-xl border w-full bg-[#2E3645] text-white placeholder-gray-400"
          required
        />

        {/* Campos dinámicos */}
        {renderCampos()}

        <button
          type="submit"
          className="w-full py-3 mt-4 rounded-xl font-semibold shadow-md"
          style={{ backgroundColor: "white", color: "#222A35" }}
        >
          Registrar
        </button>
      </form>
    </div>
     </div>
  );
};

export default Registros;
