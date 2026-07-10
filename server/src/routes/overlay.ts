import { randomUUID } from "node:crypto";
import { Router } from "express";
import { getOverlay, putOverlay, updateOverlay } from "../db.js";
import { parseBody, requireUser } from "../http.js";
import {
  customConceptSchema,
  customFlashcardSchema,
  newNoteSchema,
  overlaySchema,
} from "../schemas.js";
import type { ConceptNote, Overlay } from "../types.js";

export const overlayRouter = Router();
overlayRouter.use(requireUser);

/** Fetch the user's full content overlay. */
overlayRouter.get("/", (req, res) => {
  res.json(getOverlay(req.user.id));
});

/** Replace the user's full content overlay (full sync from the client store). */
overlayRouter.put("/", (req, res) => {
  const overlay = parseBody(overlaySchema, req.body) as Overlay;
  putOverlay(req.user.id, overlay);
  res.json(overlay);
});

/** Add a custom concept. Server assigns an id when omitted. */
overlayRouter.post("/concepts", (req, res) => {
  const body = parseBody(customConceptSchema, req.body);
  const concept = { ...body, id: body.id ?? `custom-${randomUUID()}` };
  updateOverlay(req.user.id, (overlay) => {
    // Upsert by id so retries don't duplicate.
    overlay.customConcepts = overlay.customConcepts.filter((c) => c.id !== concept.id);
    overlay.customConcepts.push(concept);
  });
  res.status(201).json(concept);
});

/** Add a custom flashcard. Server assigns an id when omitted. */
overlayRouter.post("/flashcards", (req, res) => {
  const body = parseBody(customFlashcardSchema, req.body);
  const card = { ...body, id: body.id ?? `custom-${randomUUID()}` };
  updateOverlay(req.user.id, (overlay) => {
    overlay.customFlashcards = overlay.customFlashcards.filter((c) => c.id !== card.id);
    overlay.customFlashcards.push(card);
  });
  res.status(201).json(card);
});

/** Upsert the personal note for a concept (one note per concept id). */
overlayRouter.post("/notes", (req, res) => {
  const body = parseBody(newNoteSchema, req.body);
  const note: ConceptNote = {
    ...body,
    updatedAt: body.updatedAt ?? new Date().toISOString(),
  };
  updateOverlay(req.user.id, (overlay) => {
    overlay.notes[note.conceptId] = note;
  });
  res.status(201).json(note);
});
