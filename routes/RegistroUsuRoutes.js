import express from "express";
import { registerUser, loginUser } from "../controllers/RegistroUsaController.js";

const router = express.Router();

router.post("/register", registerUser); // ✅ Ahora es una función
router.post("/login", loginUser);

export default router;
