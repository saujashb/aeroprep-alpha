/**
 * Server-local copies of the AeroPrep Alpha domain types.
 *
 * These intentionally mirror the frontend's `src/types.ts` / `ProgressStore`
 * semantics (they are NOT imported across the package boundary). If the
 * frontend types evolve, update these to match. Sub-structures are stored as
 * JSON blobs in SQLite, so additive changes on the frontend are generally
 * forward-compatible without a migration.
 */

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  name: string;
  createdAt: string; // ISO 8601
}

/** Returned once, on user creation. The token is the bearer credential. */
export interface UserWithToken extends User {
  token: string;
}

// ---------------------------------------------------------------------------
// Progress (mirrors the frontend ProgressStore's progress surface)
// ---------------------------------------------------------------------------

/** One completed quiz attempt. */
export interface QuizResult {
  id: string;
  /** Which quiz (seed quiz id or custom quiz id). */
  quizId: string;
  /** Number of correct answers. */
  score: number;
  /** Number of questions in the attempt. */
  total: number;
  /** ISO 8601 timestamp of completion. */
  timestamp: string;
  /** Optional extras the frontend may attach (categoryId, per-answer detail, ...). */
  [extra: string]: unknown;
}

/** Leitner-box state for a single flashcard (seed or custom). */
export interface FlashcardState {
  /** Leitner box level, 1..n (1 = new/relearning). */
  box: number;
  /** ISO 8601 timestamp of the last review, if any. */
  lastReviewedAt?: string;
  [extra: string]: unknown;
}

/** Daily checklist state; keyed by date so a stale day naturally resets. */
export interface DailyChecklist {
  /** Local date the checklist applies to, YYYY-MM-DD. */
  date: string;
  /** Ids of checklist items completed on that date. */
  completedItemIds: string[];
  [extra: string]: unknown;
}

/** The user's full progress blob — what GET/PUT /api/progress round-trips. */
export interface Progress {
  /** Knowledge-graph node ids the user has marked mastered. */
  masteredNodeIds: string[];
  /** Completed quiz attempts, newest last. */
  quizResults: QuizResult[];
  /** Leitner state per flashcard id. */
  flashcards: Record<string, FlashcardState>;
  /** Today's checklist state (null if never touched). */
  dailyChecklist: DailyChecklist | null;
}

export const emptyProgress = (): Progress => ({
  masteredNodeIds: [],
  quizResults: [],
  flashcards: {},
  dailyChecklist: null,
});

// ---------------------------------------------------------------------------
// Content overlay (user-generated growth on top of the seed JSON content)
// ---------------------------------------------------------------------------

/** A personal note attached to a concept (seed or custom). */
export interface ConceptNote {
  conceptId: string;
  text: string;
  updatedAt: string; // ISO 8601
  [extra: string]: unknown;
}

/**
 * A user-created concept. Shape mirrors a seed knowledge-graph node
 * (src/data/knowledge_graph.json) so the frontend can merge seed + custom.
 */
export interface CustomConcept {
  id: string;
  title: string;
  category: string;
  difficulty?: string;
  summary?: string;
  [extra: string]: unknown;
}

/** A user-created flashcard. */
export interface CustomFlashcard {
  id: string;
  front: string;
  back: string;
  /** Concept the card belongs to, if any. */
  conceptId?: string;
  [extra: string]: unknown;
}

/** A user-created quiz question. */
export interface CustomQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  conceptId?: string;
  [extra: string]: unknown;
}

/** The user's full overlay blob — what GET/PUT /api/overlay round-trips. */
export interface Overlay {
  /** Personal notes keyed by concept id. */
  notes: Record<string, ConceptNote>;
  customConcepts: CustomConcept[];
  customFlashcards: CustomFlashcard[];
  customQuizQuestions: CustomQuizQuestion[];
}

export const emptyOverlay = (): Overlay => ({
  notes: {},
  customConcepts: [],
  customFlashcards: [],
  customQuizQuestions: [],
});

// ---------------------------------------------------------------------------
// Export / import envelope (mirrors the frontend's overlay import/export)
// ---------------------------------------------------------------------------

export interface ExportBundle {
  version: 1;
  exportedAt: string; // ISO 8601
  user: User;
  progress: Progress;
  overlay: Overlay;
}

/** Body accepted by POST /api/import — either or both sections. */
export interface ImportBundle {
  progress?: Progress;
  overlay?: Overlay;
}

// ---------------------------------------------------------------------------
// Error envelope — every non-2xx response uses this shape
// ---------------------------------------------------------------------------

export interface ApiError {
  error: {
    code: string; // e.g. "bad_request", "unauthorized", "not_found"
    message: string;
    details?: unknown; // e.g. zod issue list on validation failures
  };
}
