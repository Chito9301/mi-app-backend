const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); // Ajusta ruta

// Rutas de usuarios
router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);

// 🚀 Rutas de autenticación
router.post('/auth/signup', userController.registerUser);
router.post('/auth/login', userController.loginUser);

module.exports = router;
