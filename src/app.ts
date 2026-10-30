import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRouter from "./routes/auth.js";
import itemRouter from "./routes/items.js";
import aiRouter from "./routes/ai.js";
import categoryRouter from "./routes/categories.js";
import claimRouter from "./routes/claims.js";
import { connectDB } from "./config/db.js";

const app = express();

// CORS_ORIGIN is a comma-separated list, e.g.
// "http://localhost:5173,https://my-frontend.vercel.app". Other origins are refused.
const allowedOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    name: "Itelect4 Backend API",
    status: "ok",
    health: "/api/health",
  });
});

// Health still answers when MongoDB is down, reporting db: false instead of a 500.
app.get("/api/health", async (_req, res) => {
  await connectDB().catch(() => undefined);
  res.json({ status: "ok", db: mongoose.connection.readyState === 1 });
});

// Vercel invokes the exported Express app without running server.ts. Connect
// lazily for API requests and reuse the warm function's MongoDB connection.
app.use((_req, _res, next) => {
  void connectDB().then(() => next()).catch(next);
});

app.use("/api/auth", authRouter);
app.use("/api/items", itemRouter);
app.use("/api/ai", aiRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/claims", claimRouter);

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
