import { z } from "zod";

/**
 * Validation schemas for request bodies.
 *
 * Domain objects use `.loose()` so extra fields the frontend attaches
 * (per-answer detail, tags, ...) pass through and round-trip intact —
 * matching the "flexible JSON blob" storage model.
 */

const isoDate = z.string().min(1);

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "name must be a non-empty string").max(200),
});

// --- Progress ---------------------------------------------------------------

export const quizResultSchema = z
  .object({
    id: z.string().min(1),
    quizId: z.string().min(1),
    score: z.number().int().min(0),
    total: z.number().int().min(1),
    timestamp: isoDate,
  })
  .loose();

/** Body for POST /api/progress/quiz-results: id/timestamp default server-side. */
export const newQuizResultSchema = z
  .object({
    id: z.string().min(1).optional(),
    quizId: z.string().min(1),
    score: z.number().int().min(0),
    total: z.number().int().min(1),
    timestamp: isoDate.optional(),
  })
  .loose();

export const flashcardStateSchema = z
  .object({
    box: z.number().int().min(1),
    lastReviewedAt: isoDate.optional(),
  })
  .loose();

export const dailyChecklistSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
    completedItemIds: z.array(z.string()),
  })
  .loose();

export const progressSchema = z.object({
  masteredNodeIds: z.array(z.string()),
  quizResults: z.array(quizResultSchema),
  flashcards: z.record(z.string(), flashcardStateSchema),
  dailyChecklist: dailyChecklistSchema.nullable(),
});

// --- Overlay ----------------------------------------------------------------

export const conceptNoteSchema = z
  .object({
    conceptId: z.string().min(1),
    text: z.string(),
    updatedAt: isoDate,
  })
  .loose();

/** Body for POST /api/overlay/notes: updatedAt defaults server-side. */
export const newNoteSchema = z
  .object({
    conceptId: z.string().min(1),
    text: z.string(),
    updatedAt: isoDate.optional(),
  })
  .loose();

export const customConceptSchema = z
  .object({
    id: z.string().min(1).optional(),
    title: z.string().min(1),
    category: z.string().min(1),
    difficulty: z.string().optional(),
    summary: z.string().optional(),
  })
  .loose();

export const customFlashcardSchema = z
  .object({
    id: z.string().min(1).optional(),
    front: z.string().min(1),
    back: z.string().min(1),
    conceptId: z.string().optional(),
  })
  .loose();

export const customQuizQuestionSchema = z
  .object({
    id: z.string().min(1).optional(),
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(2),
    correctIndex: z.number().int().min(0),
    conceptId: z.string().optional(),
  })
  .loose();

export const overlaySchema = z.object({
  notes: z.record(z.string(), conceptNoteSchema),
  customConcepts: z.array(customConceptSchema.extend({ id: z.string().min(1) })),
  customFlashcards: z.array(customFlashcardSchema.extend({ id: z.string().min(1) })),
  customQuizQuestions: z.array(
    customQuizQuestionSchema.extend({ id: z.string().min(1) })
  ),
});

// --- Import -----------------------------------------------------------------

/**
 * POST /api/import accepts either a raw { progress?, overlay? } pair or a
 * full bundle previously produced by GET /api/export (extra fields like
 * version/exportedAt/user are ignored).
 */
export const importSchema = z
  .object({
    progress: progressSchema.optional(),
    overlay: overlaySchema.optional(),
  })
  .loose()
  .refine((value) => value.progress !== undefined || value.overlay !== undefined, {
    message: "Provide at least one of 'progress' or 'overlay'.",
  });
