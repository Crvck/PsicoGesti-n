import { useState } from "react";

const InicioSesion: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-cesunAzul-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-cesunAzul-900 mb-6">
          Iniciar Sesión
        </h2>
        <div className="mb-4">
          <label className="block text-cesunAzul-900">Usuario</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border border-cesunAzul-500 rounded"
          />
        </div>
        <div className="mb-6">
          <label className="block text-cesunAzul-900">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-cesunAzul-500 rounded"
          />
        </div>
        <button className="w-full bg-cesunAzul-700 text-white py-2 rounded hover:bg-cesunAzul-900">
          Iniciar Sesión
        </button>
      </div>
    </div>
  );
};

export default InicioSesion;
