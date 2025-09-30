import express from "express";
import { getPrestadoresFora } from "../controllers/PrestadoresFora.js"; // controlador

const prestadoresForaRouter = express.Router(); // <-- nombre distinto

// Rutas
prestadoresForaRouter.get("/lista", getPrestadoresFora);
// prestadoresForaRouter.get("/:id", getPrestadorForaById); // si agregas buscar por ID

export default prestadoresForaRouter;
