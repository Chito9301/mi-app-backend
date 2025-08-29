// index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const Media = require('./models/Media');
const User = require('./models/User');

const app = express();
app.use(cors());
app.use(express.json());

// =======================
// Configuración Cloudinary
// =======================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =======================
// Conexión MongoDB
// =======================
mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Conectado a MongoDB correctamente'));

// =======================
// Multer para archivos
// =======================
const storage = multer.memoryStorage();
const upload = multer({ storage });

// =======================
// JWT Middleware
// =======================
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  jwt.verify(token, process.env.JWT_SECRET || 'secretkey', (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
}

// =======================
// Funciones para gráficas
// =======================
const width = 600;
const height = 300;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

async function generateChart(labels, data, label, type = 'line', color = 'blue') {
  const config = {
    type,
    data: {
      labels,
      datasets: [
        {
          label,
          data,
          borderColor: color,
          backgroundColor: type === 'line' ? 'rgba(59,130,246,0.2)' : color,
        },
      ],
    },
    options: { responsive: true, plugins: { legend: { display: true } } },
  };
  return chartJSNodeCanvas.renderToDataURL(config);
}

async function generateUserChart() {
  const labels = ['6 días', '5 días', '4 días', '3 días', '2 días', 'Ayer', 'Hoy'];
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const count = await User.countDocuments({
      createdAt: { $gte: new Date(date.setHours(0,0,0)), $lt: new Date(date.setHours(23,59,59)) }
    });
    data.push(count);
  }
  return generateChart(labels, data, 'Usuarios registrados');
}

async function generateMediaChart() {
  const labels = ['6 días', '5 días', '4 días', '3 días', '2 días', 'Ayer', 'Hoy'];
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const count = await Media.countDocuments({
      createdAt: { $gte: new Date(date.setHours(0,0,0)), $lt: new Date(date.setHours(23,59,59)) }
    });
    data.push(count);
  }
  return generateChart(labels, data, 'Archivos subidos', 'bar', 'orange');
}

// =======================
// Endpoint JSON para datos dinámicos
// =======================
app.get('/api/status', async (req, res) => {
  let mongoStatus = 'Desconectada ❌';
  let cloudStatus = 'Desconectado ❌';
  let userCount = 0;
  let mediaCount = 0;

  try {
    mongoStatus = mongoose.connection.readyState === 1 ? 'Conectada ✅' : 'No conectada ❌';
    userCount = await User.countDocuments();
    mediaCount = await Media.countDocuments();
  } catch (err) {
    mongoStatus = 'Error ❌';
  }

  try {
    await cloudinary.api.resources({ max_results: 1 });
    cloudStatus = 'Conectado ✅';
  } catch (err) {
    cloudStatus = 'Error ❌';
  }

  res.json({
    mongoStatus,
    cloudStatus,
    frontendUrl: process.env.NEXT_PUBLIC_API_URL || 'No configurado',
    userCount,
    mediaCount,
    lastDeployment: new Date().toLocaleString(),
  });
});

// =======================
// Dashboard moderno HTML
// =======================
app.get('/', async (req, res) => {
  const userChartUrl = await generateUserChart();
  const mediaChartUrl = await generateMediaChart();

  const html = `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Backend Moderno</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@3.4.17/dist/tailwind.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/feather-icons"></script>
  </head>
  <body class="bg-gray-100">
    <div class="max-w-7xl mx-auto p-6">
      <h1 class="text-3xl font-bold text-center text-gray-800 mb-6">🚀 Dashboard Interactivo Backend</h1>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div class="bg-white rounded-xl p-4 shadow hover:shadow-lg transition duration-300">
          <h2 class="text-xl font-semibold mb-2">MongoDB</h2>
          <p id="mongoStatus" class="text-red-600 font-bold">Cargando...</p>
        </div>
        <div class="bg-white rounded-xl p-4 shadow hover:shadow-lg transition duration-300">
          <h2 class="text-xl font-semibold mb-2">Cloudinary</h2>
          <p id="cloudStatus" class="text-red-600 font-bold">Cargando...</p>
        </div>
        <div class="bg-white rounded-xl p-4 shadow hover:shadow-lg transition duration-300">
          <h2 class="text-xl font-semibold mb-2">Frontend</h2>
          <p id="frontendUrl" class="text-blue-600 font-bold">Cargando...</p>
        </div>
        <div class="bg-white rounded-xl p-4 shadow hover:shadow-lg transition duration-300">
          <h2 class="text-xl font-semibold mb-2">Estadísticas Totales</h2>
          <p>Usuarios: <span id="userCount" class="font-bold">0</span></p>
          <p>Archivos: <span id="mediaCount" class="font-bold">0</span></p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl p-4 shadow hover:shadow-lg transition duration-300 text-center">
          <h3 class="text-lg font-semibold mb-2">Usuarios últimos 7 días</h3>
          <img src="${userChartUrl}" alt="Usuarios últimos 7 días" class="mx-auto"/>
        </div>
        <div class="bg-white rounded-xl p-4 shadow hover:shadow-lg transition duration-300 text-center">
          <h3 class="text-lg font-semibold mb-2">Archivos últimos 7 días</h3>
          <img src="${mediaChartUrl}" alt="Archivos últimos 7 días" class="mx-auto"/>
        </div>
      </div>

      <p class="text-center text-gray-500 mt-6">Último despliegue: <span id="lastDeployment">Cargando...</span></p>
      <p class="text-center text-gray-400 text-sm mt-2">Backend version 1.0.0</p>
    </div>

    <script>
      async function updateStatus() {
        try {
          const res = await fetch('/api/status');
          const data = await res.json();

          document.getElementById('mongoStatus').textContent = data.mongoStatus;
          document.getElementById('mongoStatus').className = data.mongoStatus.includes('✅') ? 'text-green-600 font-bold' : 'text-red-600 font-bold';

          document.getElementById('cloudStatus').textContent = data.cloudStatus;
          document.getElementById('cloudStatus').className = data.cloudStatus.includes('✅') ? 'text-green-600 font-bold' : 'text-red-600 font-bold';

          document.getElementById('frontendUrl').textContent = data.frontendUrl;

          document.getElementById('userCount').textContent = data.userCount;
          document.getElementById('mediaCount').textContent = data.mediaCount;

          document.getElementById('lastDeployment').textContent = data.lastDeployment;
        } catch (err) {
          console.error('Error actualizando status:', err);
        }
      }
      setInterval(updateStatus, 10000);
      updateStatus();
    </script>
    <script>feather.replace()</script>
  </body>
  </html>
  `;

  res.send(html);
});

// =======================
// Iniciar servidor
// =======================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));
