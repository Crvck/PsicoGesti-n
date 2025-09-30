import express from "express";
import { getPsicologos } from "../controllers/PsicologosController.js"; // controlador

export const PsicologosRouter = express.Router(); // <-- nombre distinto
PsicologosRouter.get("/lista", getPsicologos);
export default PsicologosRouter;
