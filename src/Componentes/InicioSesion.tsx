import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import logoo from "../assets/img/logo.png";

const InicioSesion = () => {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const { login, checkAuth } = useAuth(); // Incluye checkAuth
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Formulario enviado con:", { correo, contrasena });
    try {
      console.log("Intentando login con:", { correo, contrasena });
      await login(correo, contrasena);
      console.log("Login exitoso, redirigiendo a /tablero");
      navigate("/tablero");
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Correo o contraseña incorrectos.");
      }
    }
  };

  return (
    <div className="space-y-6 p-6 flex items-center justify-center h-screen w-screen bg-gray-900">
      <div className="w-full max-w-sm sm:max-w-md p-8 bg-gray-800 text-white rounded-xl shadow-2xl">
        <div className="flex justify-center mb-6">
          <img src={logoo} alt="Logo" className="w-40" />
        </div>
        <h2 className="text-center text-lg sm:text-xl font-semibold mb-6 text-gray-200">
          Inicia sesión con tu usuario y contraseña
        </h2>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="Correo Electrónico"
            className="w-full p-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            placeholder="Contraseña"
            className="w-full p-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
          >
            Iniciar Sesión
          </button>
        </form>
        <div className="flex justify-between text-sm mt-4">
          <a href="#" className="text-blue-400 hover:underline">
            Recuperar contraseña
          </a>
          <a href="#" className="text-blue-400 hover:underline">
            Registrarse
          </a>
        </div>
        <div className="flex items-center my-6">
          <hr className="flex-grow border-gray-600" />
          <span className="mx-4 text-gray-500 text-sm">o continua con</span>
          <hr className="flex-grow border-gray-600" />
        </div>
        <button className="flex items-center justify-center w-full p-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors border border-gray-600">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo-google-01.png"
            alt="Google logo"
            className="w-6 h-6 mr-2"
          />
          Acceder con Google
        </button>
        <div className="text-center text-xs mt-6">
          <a href="#" className="text-blue-400 hover:underline">
            Términos y condiciones
          </a>
        </div>
      </div>
    </div>
  );
};

export default InicioSesion;
