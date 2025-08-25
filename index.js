// Archivo principal del servidor Express - index.js

// Carga variables de entorno desde archivo .env
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Importar modelos Mongoose
const Media = require('./models/Media');
const User = require('./models/User');

// =======================
// Configuración CORS
// =======================

// Lista de orígenes permitidos para solicitudes cross-origin
const allowedOrigins = [
  'http://localhost:3000',
  'https://challz-frontend.vercel.app',
];

// Opciones para CORS según origen
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) {
      // Permite peticiones sin origen (ej: Postman, curl)
      return callback(null, true);
    }
    if (allowedOrigins.indexOf(origin) !== -1) {
      // Origen permitido
      callback(null, true);
    } else {
      // Origen no permitido
      callback(new Error(`CORS: El origen ${origin} no está permitido.`));
    }
  },
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Crear instancia de Express
const app = express();

// Usar CORS con las opciones configuradas
app.use(cors(corsOptions));

// Middleware para parsear JSON en cuerpo de peticiones
app.use(express.json());

// =======================
// Middleware de autenticación con JWT
// =======================

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  // Extrae token del header: Authorization: Bearer <token>
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  jwt.verify(token, process.env.JWT_SECRET || 'secretkey', (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user; // Usuario autenticado disponible en req.user
    next();
  });
}

// =======================
// Rutas básicas
// =======================

// Ruta base para testar que el servidor está funcionando
app.get('/', (req, res) => {
  res.send('API backend funcionando correctamente.');
});

// =======================
// Conexión a MongoDB
// =======================

mongoose.connect(process.env.MONGODB_URI)  // Eliminadas opciones obsoletas

// Evento para manejar conexión a MongoDB
const db = mongoose.connection;
db.on('error', (error) => console.error('Error de conexión a MongoDB:', error));
db.once('open', () => console.log('Conectado a MongoDB correctamente'));

// =======================
// Rutas de autenticación de usuarios
// =======================

// Registro de usuario
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validar campos obligatorios
    if (!username || !email || !password)
      return res.status(400).json({ error: 'Todos los campos son requeridos' });

    // Verificar si usuario o email ya existen
    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists)
      return res.status(400).json({ error: 'Usuario o email ya existe' });

    // Hashear contraseña para seguridad
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario y guardar
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login de usuario
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos obligatorios
    if (!email || !password)
      return res.status(400).json({ error: 'Todos los campos son requeridos' });

    // Buscar usuario por email
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ error: 'Usuario no encontrado' });

    // Comparar contraseña ingresada con hashed
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(400).json({ error: 'Contraseña incorrecta' });

    // Generar token JWT con id y username, válido 7 días
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '7d' }
    );

    // Enviar token y datos básicos de usuario
    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// Configuración de Cloudinary y subida de archivos
// =======================

// Configurar Cloudinary con credenciales
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuración de multer para manejo de archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Endpoint para subir archivo a Cloudinary y guardar metadata en MongoDB
app.post(
  '/api/media',
  authMiddleware,
  upload.single('file'),
  async (req, res) => {
    try {
      const { title, description, hashtags, type } = req.body;
      const file = req.file;

      if (!file) return res.status(400).json({ error: 'No file uploaded' });

      const username = req.user.username;

      // Subir archivo a Cloudinary vía upload_stream
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `${username || 'anonymous'}/${type || 'media'}`,
          upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
          resource_type: 'auto',
          context: {
            title,
            description,
            hashtags,
          },
        },
        async (error, uploadResult) => {
          if (error) return res.status(500).json({ error: error.message });

          // Crear doc de media en MongoDB con datos importantes
          const media = new Media({
            title,
            description,
            hashtags: hashtags
              ? hashtags.split(',').map((h) => h.trim())
              : [],
            type,
            username,
            mediaUrl: uploadResult.secure_url,
            cloudinaryId: uploadResult.public_id,
            createdAt: new Date(),
            views: 0,
            likes: 0,
            comments: 0,
          });

          await media.save();

          res.json(media);
        }
      );

      // Iniciar subida del archivo
      uploadStream.end(file.buffer);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Ruta para registrar metadata después de que archivo esté subido a Cloudinary
app.post('/api/media/register', authMiddleware, async (req, res) => {
  try {
    const {
      url,
      title,
      description,
      hashtags,
      type,
      username,
      userPhotoURL,
      challengeId,
      challengeTitle,
    } = req.body;

    // Validar campos obligatorios
    if (!url || !title || !type || !username) {
      return res
        .status(400)
        .json({ error: 'Faltan campos obligatorios: url, title, type, username' });
    }

    // Crear nuevo documento Media con metadata
    const newMedia = new Media({
      mediaUrl: url,
      title,
      description,
      hashtags: Array.isArray(hashtags) ? hashtags : [],
      type,
      username,
      userPhotoURL,
      challengeId,
      challengeTitle,
      createdAt: new Date(),
      views: 0,
      likes: 0,
      comments: 0,
    });

    await newMedia.save();

    return res
      .status(201)
      .json({ message: 'Media registrada exitosamente', media: newMedia });
  } catch (error) {
    console.error('Error registrando media:', error);
    return res.status(500).json({ error: 'Error interno al registrar media' });
  }
});

// =======================
// Rutas para manejo de Media protegidas
// =======================

// Obtener media del usuario autenticado ordenadas por creación descendente
app.get('/api/media', authMiddleware, async (req, res) => {
  try {
    const media = await Media.find({ username: req.user.username }).sort({
      createdAt: -1,
    });
    res.json(media);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener media por ID restringido al propietario
app.get('/api/media/:id', authMiddleware, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ error: 'No encontrado' });

    if (media.username !== req.user.username)
      return res.status(403).json({ error: 'Sin permiso' });

    res.json(media);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
