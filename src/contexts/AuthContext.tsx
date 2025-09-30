import React, { createContext, useContext, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

interface User {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (correo: string, contrasena: string) => Promise<void>;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (correo: string, contrasena: string) => {
    try {
      const res = await axios.post(
        `${API_URL}/auth`,
        { correo, contrasena },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("Respuesta del servidor:", res.data);

      if (res.data.user) {
        setUser(res.data.user);
      } else {
        throw new Error("El servidor no devolvió un usuario válido");
      }
    } catch (err: any) {
      console.error("Error en login:", err);

      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      } else if (err.message) {
        throw new Error(err.message);
      } else {
        throw new Error("Error de conexión con el servidor");
      }
    }
  };

  const checkAuth = () => {
    console.log("Revisando autenticación...");
    // Aquí podrías verificar si hay un token en localStorage/cookies
    // y volver a setear el usuario con setUser(...)
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};
