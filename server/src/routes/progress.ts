import { randomUUID } from "node:crypto";
import { Router } from "express";
import { getProgress, putProgress, updateProgress } from "../db.js";
import { parseBody, requireUser } from "../http.js";
import {
  flashcardStateSchema,
  newQuizResultSchema,
  progressSchema,
} from "../schemas.js";
import type { Progress, QuizResult } from "../types.js";

export const progressRouter = Router();
progressRouter.use(requireUser);

/** Fetch the user's full progress blob. */
progressRouter.get("/", (req, res) => {
  res.json(getProgress(req.user.id));
});

/** Replace the user's full progress blob (full sync from the client store). */
progressRouter.put("/", (req, res) => {
  const progress = parseBody(progressSchema, req.body) as Progress;
  putProgress(req.user.id, progress);
  res.json(progress);
});

/** Append one quiz result. Server fills id/timestamp when omitted. */
progressRouter.post("/quiz-results", (req, res) => {
  const body = parseBody(newQuizResultSchema, req.body);
  const result: QuizResult = {
    ...body,
    id: body.id ?? randomUUID(),
    timestamp: body.timestamp ?? new Date().toISOString(),
  };
  updateProgress(req.user.id, (progress) => {
    progress.quizResults.push(result);
  });
  res.status(201).json(result);
});

/** Upsert the Leitner state of one flashcard (seed or custom). */
progressRouter.put("/flashcards/:cardId", (req, res) => {
  const state = parseBody(flashcardStateSchema, req.body);
  const cardId = req.params.cardId;
  updateProgress(req.user.id, (progress) => {
    progress.flashcards[cardId] = state;
  });
  res.json({ cardId, ...state });
});
