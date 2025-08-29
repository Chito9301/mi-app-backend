// routes/mediaRoutes.js
import express from "express";
import Media from "../models/Media.js";

const router = express.Router();

/**
 * POST /api/media/register
 * Registrar un nuevo medio
 */
router.post("/register", async (req, res) => {
  try {
    const {
      url,
      userId,
      username,
      userPhotoURL,
      title,
      description,
      type,
      hashtags,
      challengeId,
      challengeTitle,
    } = req.body;

    if (!url || !userId || !title || !type) {
      return res.status(400).json({
        error: "Faltan campos obligatorios: url, userId, title, type",
      });
    }

    const newMedia = new Media({
      mediaUrl: url,
      userId,
      username,
      userPhotoURL,
      title,
      description,
      type,
      hashtags,
      challengeId,
      challengeTitle,
      createdAt: new Date(),
      views: 0,
      likes: 0,
      comments: 0,
    });

    await newMedia.save();

    return res.status(201).json({
      message: "Media registrada exitosamente",
      media: newMedia,
    });
  } catch (error) {
    console.error("Error registrando media:", error);
    return res.status(500).json({
      error: "Error interno al registrar media",
    });
  }
});

export default router;

