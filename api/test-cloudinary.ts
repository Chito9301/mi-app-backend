import { v2 as cloudinary } from 'cloudinary';
import express from 'express';

const app = express();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.get('/api/test-cloudinary', async (req, res) => {
  try {
    const result = await cloudinary.api.ping();
    res.json({ status: '✅ Cloudinary conectado', result });
  } catch (err) {
    res.status(500).json({ status: '❌ Error Cloudinary', error: err });
  }
});

export default app;
