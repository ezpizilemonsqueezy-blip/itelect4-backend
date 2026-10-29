import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { CategoryModel } from "../models/Category.js";
import type { Category } from "../types/index.js";

const categories: Category[] = [
  { name: "Electronics", description: "Phones, chargers, cables, earphones and other devices." },
  { name: "Accessories", description: "Bags, umbrellas, jewelry, eyewear and similar accessories." },
  { name: "Documents", description: "IDs, cards, notebooks, papers and other documents." },
  { name: "Personal", description: "Water bottles, clothing and other everyday belongings." },
];

try {
  await connectDB();
  // Upsert by name so the script can be run again without creating duplicates.
  for (const category of categories) {
    await CategoryModel.updateOne({ name: category.name }, { $set: category }, { upsert: true });
  }
  console.info(`Seeded ${categories.length} categories`);
} catch (error) {
  console.error("Seeding failed", error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
