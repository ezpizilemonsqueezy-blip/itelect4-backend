import { model, Schema } from "mongoose";
import { USER_ROLES, type User } from "../types/index.js";

const userSchema = new Schema<User>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    password: { type: String, required: true, select: false, minlength: 8 },
    role: { type: String, enum: USER_ROLES, default: "student", required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_document, result) => {
        const json = result as Record<string, unknown>;
        json.id = String(json._id);
        delete json._id;
        delete json.__v;
        delete json.password;
        return json;
      },
    },
  },
);

export const UserModel = model<User>("User", userSchema);