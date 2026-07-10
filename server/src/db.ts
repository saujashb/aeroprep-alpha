import Database from "better-sqlite3";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import {
  emptyOverlay,
  emptyProgress,
  type Overlay,
  type Progress,
  type User,
  type UserWithToken,
} from "./types.js";

const DB_PATH =
  process.env.DATABASE_PATH ??
  path.join(import.meta.dirname, "..", "data", "aeroprep.sqlite");

mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    token      TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  );

  -- One row per user; flexible sub-structures live in JSON columns.
  CREATE TABLE IF NOT EXISTS progress (
    user_id          TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    mastered_nodes   TEXT NOT NULL DEFAULT '[]',   -- JSON string[]
    quiz_results     TEXT NOT NULL DEFAULT '[]',   -- JSON QuizResult[]
    flashcards       TEXT NOT NULL DEFAULT '{}',   -- JSON Record<cardId, FlashcardState>
    daily_checklist  TEXT NOT NULL DEFAULT 'null', -- JSON DailyChecklist | null
    updated_at       TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS overlay (
    user_id               TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    notes                 TEXT NOT NULL DEFAULT '{}', -- JSON Record<conceptId, ConceptNote>
    custom_concepts       TEXT NOT NULL DEFAULT '[]', -- JSON CustomConcept[]
    custom_flashcards     TEXT NOT NULL DEFAULT '[]', -- JSON CustomFlashcard[]
    custom_quiz_questions TEXT NOT NULL DEFAULT '[]', -- JSON CustomQuizQuestion[]
    updated_at            TEXT NOT NULL
  );
`);

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

interface UserRow {
  id: string;
  name: string;
  token: string;
  created_at: string;
}

const toUser = (row: UserRow): User => ({
  id: row.id,
  name: row.name,
  createdAt: row.created_at,
});

export function createUser(name: string): UserWithToken {
  const id = randomUUID();
  const token = randomBytes(24).toString("base64url");
  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    db.prepare(
      "INSERT INTO users (id, name, token, created_at) VALUES (?, ?, ?, ?)"
    ).run(id, name, token, now);
    db.prepare("INSERT INTO progress (user_id, updated_at) VALUES (?, ?)").run(id, now);
    db.prepare("INSERT INTO overlay (user_id, updated_at) VALUES (?, ?)").run(id, now);
  });
  tx();
  return { id, name, createdAt: now, token };
}

export function findUserByToken(token: string): User | null {
  const row = db
    .prepare("SELECT * FROM users WHERE token = ?")
    .get(token) as UserRow | undefined;
  return row ? toUser(row) : null;
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

interface ProgressRow {
  mastered_nodes: string;
  quiz_results: string;
  flashcards: string;
  daily_checklist: string;
}

export function getProgress(userId: string): Progress {
  const row = db
    .prepare(
      "SELECT mastered_nodes, quiz_results, flashcards, daily_checklist FROM progress WHERE user_id = ?"
    )
    .get(userId) as ProgressRow | undefined;
  if (!row) return emptyProgress();
  return {
    masteredNodeIds: JSON.parse(row.mastered_nodes),
    quizResults: JSON.parse(row.quiz_results),
    flashcards: JSON.parse(row.flashcards),
    dailyChecklist: JSON.parse(row.daily_checklist),
  };
}

export function putProgress(userId: string, progress: Progress): void {
  db.prepare(
    `INSERT INTO progress (user_id, mastered_nodes, quiz_results, flashcards, daily_checklist, updated_at)
     VALUES (@userId, @masteredNodes, @quizResults, @flashcards, @dailyChecklist, @now)
     ON CONFLICT(user_id) DO UPDATE SET
       mastered_nodes = @masteredNodes,
       quiz_results = @quizResults,
       flashcards = @flashcards,
       daily_checklist = @dailyChecklist,
       updated_at = @now`
  ).run({
    userId,
    masteredNodes: JSON.stringify(progress.masteredNodeIds),
    quizResults: JSON.stringify(progress.quizResults),
    flashcards: JSON.stringify(progress.flashcards),
    dailyChecklist: JSON.stringify(progress.dailyChecklist),
    now: new Date().toISOString(),
  });
}

/** Read-modify-write helper for the granular progress endpoints. */
export function updateProgress(
  userId: string,
  mutate: (progress: Progress) => void
): Progress {
  const progress = getProgress(userId);
  mutate(progress);
  putProgress(userId, progress);
  return progress;
}

// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------

interface OverlayRow {
  notes: string;
  custom_concepts: string;
  custom_flashcards: string;
  custom_quiz_questions: string;
}

export function getOverlay(userId: string): Overlay {
  const row = db
    .prepare(
      "SELECT notes, custom_concepts, custom_flashcards, custom_quiz_questions FROM overlay WHERE user_id = ?"
    )
    .get(userId) as OverlayRow | undefined;
  if (!row) return emptyOverlay();
  return {
    notes: JSON.parse(row.notes),
    customConcepts: JSON.parse(row.custom_concepts),
    customFlashcards: JSON.parse(row.custom_flashcards),
    customQuizQuestions: JSON.parse(row.custom_quiz_questions),
  };
}

export function putOverlay(userId: string, overlay: Overlay): void {
  db.prepare(
    `INSERT INTO overlay (user_id, notes, custom_concepts, custom_flashcards, custom_quiz_questions, updated_at)
     VALUES (@userId, @notes, @concepts, @flashcards, @questions, @now)
     ON CONFLICT(user_id) DO UPDATE SET
       notes = @notes,
       custom_concepts = @concepts,
       custom_flashcards = @flashcards,
       custom_quiz_questions = @questions,
       updated_at = @now`
  ).run({
    userId,
    notes: JSON.stringify(overlay.notes),
    concepts: JSON.stringify(overlay.customConcepts),
    flashcards: JSON.stringify(overlay.customFlashcards),
    questions: JSON.stringify(overlay.customQuizQuestions),
    now: new Date().toISOString(),
  });
}

/** Read-modify-write helper for the granular overlay endpoints. */
export function updateOverlay(
  userId: string,
  mutate: (overlay: Overlay) => void
): Overlay {
  const overlay = getOverlay(userId);
  mutate(overlay);
  putOverlay(userId, overlay);
  return overlay;
}
