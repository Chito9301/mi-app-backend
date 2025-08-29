// Carga variables de entorno
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import cloudinary from 'cloudinary';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from './models/User.js';
import Media from './models/Media.js';

// =======================
// Configuración CORS
// =======================
const allowedOrigins = [
  'http://localhost:3000',
  'https://mi-app-frontend-six.vercel.app' // 👈 dominio real del frontend
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // permitir postman, curl, etc.
    if (allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error(`CORS: El origen ${origin} no está permitido.`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};

// =======================
// Crear servidor Express
// =======================
const app = express();
app.use(cors(corsOptions));
app.use(express.json());

// =======================
// Middleware autenticación JWT
// =======================
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
}

// =======================
// Dashboard / test server
// =======================
app.get('/', async (req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'Conectada ✅' : 'Desconectada ❌';
    const cloudStatus = cloudinary.v2.config().cloud_name ? 'Conectado ✅' : 'Desconectado ❌';
    const userCount = await User.countDocuments();
    const mediaCount = await Media.countDocuments();

    res.send(`
      <h1>Dashboard Backend</h1>
      <p>MongoDB: ${mongoStatus}</p>
      <p>Cloudinary: ${cloudStatus}</p>
      <p>Frontend URL: ${process.env.NEXT_PUBLIC_API_URL}</p>
      <p>Usuarios: ${userCount}</p>
      <p>Medias: ${mediaCount}</p>
    `);
  } catch (err) {
    res.status(500).send('Error cargando dashboard');
  }
});

// =======================
// Conexión MongoDB
// =======================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch((err) => console.error('❌ Error MongoDB:', err));

// =======================
// Configurar Cloudinary
// =======================
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =======================
// Configurar multer
// =======================
const storage = multer.memoryStorage();
const upload = multer({ storage });

// =======================
// Rutas Auth
// =======================

// Registro
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Todos los campos son requeridos' });

    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists) return res.status(400).json({ error: 'Usuario o email ya existe' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Todos los campos son requeridos' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// Rutas Media
// =======================
app.post('/api/media', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { title, description, hashtags, type } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const username = req.user.username;

    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder: `${username || 'anonymous'}/${type || 'media'}`,
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
        resource_type: 'auto',
        context: { title, description, hashtags }
      },
      async (error, result) => {
        if (error) return res.status(500).json({ error: error.message });

        const media = new Media({
          title,
          description,
          hashtags: hashtags ? hashtags.split(',').map(h => h.trim()) : [],
          type,
          username,
          mediaUrl: result.secure_url,
          publicId: result.public_id,
          createdBy: req.user.id,
          createdAt: new Date(),
          views: 0,
          likes: 0,
          comments: 0
        });

        await media.save();
        res.json(media);
      }
    );

    uploadStream.end(file.buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// Iniciar servidor
// =======================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Backend corriendo en puerto ${PORT}`));
