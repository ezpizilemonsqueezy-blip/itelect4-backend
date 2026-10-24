import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const port = Number(process.env.PORT ?? 4000);

try {
  await connectDB();
  app.listen(port, () => {
    console.info(`API listening on port ${port}`);
  });
} catch (error) {
  console.error("Failed to start API", error);
  process.exitCode = 1;
}