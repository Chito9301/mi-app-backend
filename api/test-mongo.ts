import mongoose from 'mongoose';
import express from 'express';

const app = express();

app.get('/api/test-mongo', async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    res.json({ status: '✅ MongoDB conectado' });
  } catch (err) {
    res.status(500).json({ status: '❌ Error MongoDB', error: err });
  }
});

export default app;
