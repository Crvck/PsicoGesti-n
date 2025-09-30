import express from "express";
import { login } from "../controllers/authController.js";

const router = express.Router();

// Ruta POST para login (se usará en /auth)
router.post("/", login);

export default router;
