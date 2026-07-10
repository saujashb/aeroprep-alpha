import cors from "cors";
import express from "express";
import { errorHandler, HttpError } from "./http.js";
import { overlayRouter } from "./routes/overlay.js";
import { progressRouter } from "./routes/progress.js";
import { transferRouter } from "./routes/transfer.js";
import { usersRouter } from "./routes/users.js";

export function createApp(): express.Express {
  const app = express();
  app.disable("x-powered-by");

  const corsOrigin = process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()) ?? [
    "http://localhost:5173", // Vite dev server default
    "http://127.0.0.1:5173",
  ];
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  app.use("/api/users", usersRouter);
  app.use("/api/progress", progressRouter);
  app.use("/api/overlay", overlayRouter);
  app.use("/api", transferRouter); // /api/export, /api/import

  app.use((req, _res) => {
    throw new HttpError(404, "not_found", `No route for ${req.method} ${req.path}.`);
  });

  app.use(errorHandler);
  return app;
}
