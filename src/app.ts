import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRouter from "./routes/auth.js";
import itemRouter from "./routes/items.js";
import aiRouter from "./routes/ai.js";
import { connectDB } from "./config/db.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Vercel invokes the exported Express app without running server.ts. Connect
// lazily for API requests and reuse the warm function's MongoDB connection.
app.use((_req, _res, next) => {
  void connectDB().then(() => next()).catch(next);
});

app.use("/api/auth", authRouter);
app.use("/api/items", itemRouter);
app.use("/api/ai", aiRouter);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({ message: "Validation failed", errors: Object.values(error.errors).map((issue) => issue.message) });
    return;
  }
  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json({ message: "Invalid identifier or field value" });
    return;
  }
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ message: "Malformed JSON request body" });
    return;
  }

  console.error(error);
  res.status(500).json({ message: "Internal server error" });
};

app.use(errorHandler);

export default app;
