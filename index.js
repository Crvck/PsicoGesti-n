import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import cors from "cors";
import { pool } from "./config/db.js"; // ⚡ Importamos pool de MySQL

// Routes
import authRoutes from "./routes/auth.js";
import pacienteRoutes from "./routes/pacienteRoutes.js";
import RegistroUsuRoutes from "./routes/RegistroUsuRoutes.js";
import BecariosRoutes from "./routes/BecariosRoutes.js";
import PrestadoresForaRoutes from "./routes/PrestadoresForaRoutes.js";
import PsicologosRoutes from "./routes/PsicologosRoutes.js";
const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token =
    req.cookies.token || req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

// Routes rutas para los diferentes endpoints
app.use("/auth", authRoutes);
app.use("/paciente", pacienteRoutes);
app.use("/Registrar", RegistroUsuRoutes);
app.use("/becarios", BecariosRoutes);
app.use("/foranios", PrestadoresForaRoutes);
app.use("/psicologos", PsicologosRoutes);

app.get("/", (req, res) => {
  res.send("API consultorio funcionando con MySQL 🚀");
});

const PORT = process.env.PORT || 3020;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API URL for Postman: http://localhost:${PORT}`);
});

// Cerrar pool de MySQL al terminar la aplicación
process.on("SIGINT", async () => {
  try {
    if (pool) {
      await pool.end();
      console.log("Database connection pool closed.");
    }
    process.exit(0);
  } catch (err) {
    console.error("Error closing database connection pool:", err);
    process.exit(1);
  }
});
