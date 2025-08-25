const User = require('../models/User'); // Modelo de usuario
const bcrypt = require('bcryptjs'); // Para encriptar contraseñas
const jwt = require('jsonwebtoken'); // Para generar tokens

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey"; // 🔑 cambia esto en producción

/**
 * Obtiene la lista de usuarios con campos seleccionados.
 */
async function getAllUsers(req, res) {
  try {
    const users = await User.find({}, 'username email photoURL role createdAt updatedAt').lean();
    return res.status(200).json({ users });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
}

/**
 * Obtiene un usuario por ID con campos seleccionados.
 */
async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id, 'username email photoURL role createdAt updatedAt').lean();

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return res.status(500).json({ error: 'Error obteniendo usuario' });
  }
}

/**
 * Registro de usuario nuevo
 */
async function registerUser(req, res) {
  try {
    const { username, email, password } = req.body;

    // Validación básica
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    await newUser.save();

    return res.status(201).json({ message: "Usuario registrado correctamente" });
  } catch (error) {
    console.error("Error registrando usuario:", error);
    return res.status(500).json({ error: "Error registrando usuario" });
  }
}

/**
 * Login de usuario
 */
async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    // Validar input
    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }

    // Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Credenciales inválidas" });
    }

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Credenciales inválidas" });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login exitoso",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ error: "Error en login" });
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  registerUser,
  loginUser
};
