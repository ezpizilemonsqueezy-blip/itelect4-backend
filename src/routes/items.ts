import { Router } from "express";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { Types } from "mongoose";
import { ItemModel } from "../models/Item.js";
import { requireAuth } from "../middleware/auth.js";

const itemRouter = Router();
const asyncRoute = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler => (req, res, next) => {
  void handler(req, res, next).catch(next);
};

const itemFields = [
  "name",
  "category",
  "status",
  "location",
  "description",
  "estimatedValue",
  "foundAt",
] as const;

itemRouter.use(requireAuth);

itemRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    const items = await ItemModel.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(items);
  }),
);

itemRouter.get(
  "/:id",
  asyncRoute(async (req, res) => {
    const item = await ItemModel.findOne({ _id: req.params.id, userId: req.userId });
    if (!item) {
      res.status(404).json({ message: "Item not found" });
      return;
    }
    res.json(item);
  }),
);

itemRouter.post(
  "/",
  asyncRoute(async (req, res) => {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      res.status(400).json({ message: "Request body must be a JSON object" });
      return;
    }
    const input = req.body as Record<string, unknown>;
    const itemData = Object.fromEntries(
      itemFields.filter((field) => input[field] !== undefined).map((field) => [field, input[field]]),
    );
    const item = await ItemModel.create({ ...itemData, userId: new Types.ObjectId(req.userId) });
    res.status(201).json(item);
  }),
);

itemRouter.patch(
  "/:id",
  asyncRoute(async (req, res) => {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      res.status(400).json({ message: "Request body must be a JSON object" });
      return;
    }
    const input = req.body as Record<string, unknown>;
    const updates = Object.fromEntries(
      itemFields.filter((field) => input[field] !== undefined).map((field) => [field, input[field]]),
    );
    if (Object.keys(updates).length === 0) {
      res.status(400).json({ message: "Provide at least one item field to update" });
      return;
    }

    const item = await ItemModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: updates },
      { new: true, runValidators: true },
    );
    if (!item) {
      res.status(404).json({ message: "Item not found" });
      return;
    }
    res.json(item);
  }),
);

itemRouter.delete(
  "/:id",
  asyncRoute(async (req, res) => {
    const item = await ItemModel.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!item) {
      res.status(404).json({ message: "Item not found" });
      return;
    }
    res.status(204).end();
  }),
);

export default itemRouter;