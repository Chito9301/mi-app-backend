// routes/userRoutes.js
import express from "express";
import { getAllUsers, getUserById } from "../controllers/userController.js";

const router = express.Router();

// Obtener todos los usuarios
router.get("/", getAllUsers);

// Obtener usuario por ID
router.get("/:id", getUserById);

export default router;