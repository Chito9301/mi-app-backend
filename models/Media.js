const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  hashtags: { type: [String], default: [] },
  type: { type: String, required: true }, // "image" | "video" | "audio" o string libre
  username: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Referencia a usuario
  userPhotoURL: { type: String },
  mediaUrl: { type: String, required: true },
  cloudinaryId: { type: String }, // Cloudinary public id (opcional)
  challengeId: { type: String },
  challengeTitle: { type: String },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
});

module.exports = mongoose.model('Media', MediaSchema);
