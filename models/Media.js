// models/Media.js
import mongoose, { Schema, Types } from "mongoose";

const MediaSchema = new Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  resourceType: { type: String }, // image | video | raw
  format: { type: String },
  bytes: { type: Number },
  createdBy: { type: Types.ObjectId, ref: "User" },
  title: { type: String },
  description: { type: String },
  hashtags: [String],
  type: { type: String }, // media type: image, video, audio, etc.
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  userPhotoURL: { type: String },
  challengeId: { type: String },
  challengeTitle: { type: String }
}, { timestamps: true });

export default mongoose.models.Media || mongoose.model("Media", MediaSchema);
