import mongoose from "mongoose";
import { env } from "./config/env";

// Serverless invocations reuse a warm container, so cache the connection
// promise on the module scope to avoid opening a socket per request.
let connectPromise: Promise<typeof mongoose> | null = null;

export function connectDb() {
  if (!connectPromise) {
    connectPromise = mongoose
      .connect(env.MONGODB_URI, { dbName: "campusos", serverSelectionTimeoutMS: 10000 })
      .catch((err) => {
        connectPromise = null;
        throw err;
      });
  }
  return connectPromise;
}
