import { Router } from "express";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { CategoryModel } from "../models/Category.js";

const categoryRouter = Router();
const asyncRoute = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler => (req, res, next) => {
  void handler(req, res, next).catch(next);
};

// Public reference data: the item form's category dropdown reads this list.
categoryRouter.get(
  "/",
  asyncRoute(async (_req, res) => {
    const categories = await CategoryModel.find().sort({ name: 1 });
    res.json(categories);
  }),
);

categoryRouter.get(
  "/:id",
  asyncRoute(async (req, res) => {
    const category = await CategoryModel.findById(req.params.id);
    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }
    res.json(category);
  }),
);

export default categoryRouter;
