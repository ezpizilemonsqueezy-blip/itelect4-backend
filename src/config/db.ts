import mongoose from "mongoose";

let connectionAttempt: Promise<void> | null = null;

export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  if (mongoose.connection.readyState === 2 && connectionAttempt) return connectionAttempt;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  connectionAttempt = mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
    .then(() => { console.info("Connected to MongoDB"); })
    .catch((error: unknown) => {
      connectionAttempt = null;
      throw error;
    });
  return connectionAttempt;
}
