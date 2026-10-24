import { Router } from "express";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/User.js";
import { USER_ROLES, type UserRole } from "../types/index.js";

const authRouter = Router();
const asyncRoute = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler => (req, res, next) => {
  void handler(req, res, next).catch(next);
};

authRouter.post(
  "/register",
  asyncRoute(async (req, res) => {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      res.status(400).json({ message: "Request body must be a JSON object" });
      return;
    }
    const { name, email, password } = req.body as Record<string, unknown>;

    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      res.status(400).json({
        message: "Provide a name (at least 2 characters), valid email, and password (at least 8 characters)",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await UserModel.exists({ email: normalizedEmail });
    if (existing) {
      res.status(409).json({ message: "An account with this email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    try {
      const user = await UserModel.create({
        name: name.trim(),
        email: normalizedEmail,
        password: passwordHash,
        role: USER_ROLES[0] satisfies UserRole,
      });
      res.status(201).json({ user: user.toJSON() });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
        res.status(409).json({ message: "An account with this email already exists" });
        return;
      }
      throw error;
    }
  }),
);

authRouter.post(
  "/login",
  asyncRoute(async (req, res) => {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      res.status(400).json({ message: "Request body must be a JSON object" });
      return;
    }
    const { email, password } = req.body as Record<string, unknown>;
    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await UserModel.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ message: "Authentication is not configured" });
      return;
    }

    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: "2h" });
    res.json({ token, user: user.toJSON() });
  }),
);

export default authRouter;