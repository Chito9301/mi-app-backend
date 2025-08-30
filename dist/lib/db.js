import mongoose from "mongoose";
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Missing MONGODB_URI");
const g = global;
g._mongoose ||= { conn: null, promise: null };
export async function dbConnect() {
  if (g._mongoose.conn) return g._mongoose.conn;
  if (!g._mongoose.promise) {
    g._mongoose.promise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB || undefined,
    });
  }
  g._mongoose.conn = await g._mongoose.promise;
  return g._mongoose.conn;
}
