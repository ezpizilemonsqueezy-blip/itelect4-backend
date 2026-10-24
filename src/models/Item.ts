import { model, Schema } from "mongoose";
import {
  ITEM_CATEGORIES,
  ITEM_STATUSES,
  type Item,
} from "../types/index.js";

const itemSchema = new Schema<Item>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    category: { type: String, enum: ITEM_CATEGORIES, required: true },
    status: { type: String, enum: ITEM_STATUSES, required: true, default: "Recovered" },
    location: { type: String, required: true, trim: true, minlength: 1, maxlength: 160 },
    description: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },
    estimatedValue: { type: Number, min: 0, max: 100000, default: 0 },
    foundAt: { type: Date, required: true, default: Date.now },
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

export const ItemModel = model<Item>("Item", itemSchema);