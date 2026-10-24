import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "../types/index.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authorization = req.header("Authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    const payload = jwt.verify(token, secret);
    if (typeof payload === "string" || typeof payload.userId !== "string") {
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }

    req.userId = (payload as jwt.JwtPayload & JwtPayload).userId;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}