import { Router } from "express";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { Types } from "mongoose";
import { ClaimModel } from "../models/Claim.js";
import { ItemModel } from "../models/Item.js";
import { requireAuth } from "../middleware/auth.js";

const claimRouter = Router();
const asyncRoute = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler => (req, res, next) => {
  void handler(req, res, next).catch(next);
};

claimRouter.use(requireAuth);

// A user sees the claims they submitted plus the claims made on items they logged.
claimRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    const ownItemIds = await ItemModel.find({ userId: req.userId }).distinct("_id");
    const claims = await ClaimModel.find({
      $or: [{ userId: req.userId }, { itemId: { $in: ownItemIds } }],
    }).sort({ createdAt: -1 });
    res.json(claims);
  }),
);

claimRouter.post(
  "/",
  asyncRoute(async (req, res) => {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      res.status(400).json({ message: "Request body must be a JSON object" });
      return;
    }
    const { itemId, claimantName, email } = req.body as Record<string, unknown>;
    if (typeof itemId !== "string" || !Types.ObjectId.isValid(itemId)) {
      res.status(400).json({ message: "Provide a valid item id" });
      return;
    }
    if (!(await ItemModel.exists({ _id: itemId }))) {
      res.status(404).json({ message: "Item not found" });
      return;
    }

    // status is not read from the body: every new claim starts as Pending.
    const claim = await ClaimModel.create({
      itemId: new Types.ObjectId(itemId),
      userId: new Types.ObjectId(req.userId),
      claimantName,
      email,
    });
    res.status(201).json(claim);
  }),
);

claimRouter.patch(
  "/:id",
  asyncRoute(async (req, res) => {
    const status = (req.body as Record<string, unknown> | undefined)?.status;
    if (status !== "Approved" && status !== "Rejected") {
      res.status(400).json({ message: "Status must be Approved or Rejected" });
      return;
    }

    const claim = await ClaimModel.findById(req.params.id);
    if (!claim) {
      res.status(404).json({ message: "Claim not found" });
      return;
    }
    // Only the user who logged the item can decide on claims for it.
    if (!(await ItemModel.exists({ _id: claim.itemId, userId: req.userId }))) {
      res.status(403).json({ message: "Only the item's owner can review this claim" });
      return;
    }
    if (claim.status !== "Pending") {
      res.status(409).json({ message: "This claim has already been reviewed" });
      return;
    }

    claim.status = status;
    await claim.save();
    res.json(claim);
  }),
);

export default claimRouter;
