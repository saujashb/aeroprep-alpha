import { Router } from "express";
import { getOverlay, getProgress, putOverlay, putProgress } from "../db.js";
import { parseBody, requireUser } from "../http.js";
import { importSchema } from "../schemas.js";
import type { ExportBundle, Overlay, Progress } from "../types.js";

export const transferRouter = Router();
transferRouter.use(requireUser);

/** Full user data export — mirrors the frontend's overlay export shape. */
transferRouter.get("/export", (req, res) => {
  const bundle: ExportBundle = {
    version: 1,
    exportedAt: new Date().toISOString(),
    user: req.user,
    progress: getProgress(req.user.id),
    overlay: getOverlay(req.user.id),
  };
  res.json(bundle);
});

/**
 * Import progress and/or overlay, replacing the stored sections. Accepts a
 * bundle produced by GET /api/export or a bare { progress?, overlay? } pair.
 */
transferRouter.post("/import", (req, res) => {
  const body = parseBody(importSchema, req.body);
  const imported: string[] = [];
  if (body.progress) {
    putProgress(req.user.id, body.progress as Progress);
    imported.push("progress");
  }
  if (body.overlay) {
    putOverlay(req.user.id, body.overlay as Overlay);
    imported.push("overlay");
  }
  res.json({ imported });
});
