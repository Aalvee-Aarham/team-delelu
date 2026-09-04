import type { IncomingMessage, ServerResponse } from "http";
import { app } from "../backend/src/app";
import { connectDb } from "../backend/src/db";

// Every /api/* request is rewritten here by vercel.json. Express does the
// routing; we only guarantee the DB handle is live before handing off.
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await connectDb();
  } catch (err) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Database unavailable", detail: err instanceof Error ? err.message : String(err) }));
    return;
  }
  return (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
