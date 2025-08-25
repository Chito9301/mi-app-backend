const express = require("express");
const router = express.Router();

// Importar modelo Media (usa mayúscula M según convención)
const Media = require("../models/Media");

/**
 * POST /media/register
 * Registra un nuevo medio en la base de datos con metadata recibida.
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

    // Validaciones básicas
    if (!url || !userId || !title || !type) {
      return res.status(400).json({
        error: "Faltan campos obligatorios: url, userId, title, type",
      });
    }

    // Crear nuevo documento Media
    const newMedia = new Media({
      mediaUrl: url,       // Según el modelo el campo es mediaUrl
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

module.exports = router;

