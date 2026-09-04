import { env } from "./config/env";
import mongoose from "mongoose";
import { app } from "./app";
import { connectDb } from "./db";
import { runSeed } from "./seed";


async function start() {
  await connectDb();
  console.log("MongoDB connected");
  await runSeed();
  const server = app.listen(env.PORT, () => {
    console.log(`CampusOS backend listening on port ${env.PORT}`);
  });

  const shutdown = () => {
    server.close(() => {
      mongoose.connection.close(false).finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(0), 3000).unref();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
