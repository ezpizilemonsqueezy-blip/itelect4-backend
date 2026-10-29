import "dotenv/config";
import app from "./app.js";

const port = Number(process.env.PORT ?? 4000);

// Locally this file starts the server. On Vercel the exported app is invoked
// directly, and the connect middleware in app.ts opens the MongoDB connection.
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.info(`API listening on port ${port}`);
  });
}

export default app;
