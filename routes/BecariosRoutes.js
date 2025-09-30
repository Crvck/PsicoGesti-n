import express from "express";
import { getBecarios } from "../controllers/BecariosController.js";

const BecariosRoutes = express.Router();

// ✅ Usa la instancia correcta
BecariosRoutes.get("/lista", getBecarios);
// BecariosRoutes.get("/:id", getBecarioById);

export default BecariosRoutes;
