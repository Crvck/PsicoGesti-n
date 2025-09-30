import express from "express";
import { getpacientes, getpacientesById } from "../controllers/pacienteController.js";

const router = express.Router();

// Obtener todos los pacientes o filtrar por nombre
router.get("/", getpacientes);

// Obtener paciente por ID
router.get("/pacientes/:id", getpacientesById);

export default router;
