// routes/authRoutes.js
import express from "express";
import { registerUser, loginUser } from "../controllers/userController.js";

const router = express.Router();

// Registrar usuario
router.post("/register", registerUser);

// Iniciar sesión
router.post("/login", loginUser);

export default router;
