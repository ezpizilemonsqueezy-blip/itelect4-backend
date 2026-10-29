import { model, Schema } from "mongoose";
import { CLAIM_STATUSES, type Claim } from "../types/index.js";

const claimSchema = new Schema<Claim>(
  {
    itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    claimantName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    status: { type: String, enum: CLAIM_STATUSES, required: true, default: "Pending" },
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

export const ClaimModel = model<Claim>("Claim", claimSchema);
