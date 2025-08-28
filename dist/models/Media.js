import mongoose, { Schema, Types } from "mongoose";
const MediaSchema = new Schema({
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String }, // image | video | raw
    format: { type: String },
    bytes: { type: Number },
    createdBy: { type: Types.ObjectId, ref: "User" }
}, { timestamps: true });
export default mongoose.models.Media || mongoose.model("Media", MediaSchema);
