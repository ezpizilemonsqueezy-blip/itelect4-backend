import type { Types } from "mongoose";

export const USER_ROLES = ["student", "admin", "instructor"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ITEM_CATEGORIES = [
  "Electronics",
  "Accessories",
  "Documents",
  "Personal",
] as const;
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export const ITEM_STATUSES = ["Recovered", "Claimed", "Awaiting Pickup"] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export interface User {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface Item {
  userId: Types.ObjectId;
  name: string;
  category: ItemCategory;
  status: ItemStatus;
  location: string;
  description: string;
  estimatedValue: number;
  foundAt: Date;
}

export interface JwtPayload {
  userId: string;
}