import { model, Schema } from "mongoose";
import { ITEM_CATEGORIES, type Category } from "../types/index.js";

const categorySchema = new Schema<Category>(
  {
    name: { type: String, enum: ITEM_CATEGORIES, required: true, unique: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 200 },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_document, result) => {
        const json = result as Record<string, unknown>;
        json.id = String(json._id);
        delete json._id;
        delete json.__v;
        return json;
      },
    },
  },
);

export const CategoryModel = model<Category>("Category", categorySchema);
