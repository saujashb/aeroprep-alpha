import type { OverlayExport, ProgressState, UserOverlay } from "../types";

export interface ProgressStore {
  getProgress(): ProgressState;
  saveProgress(state: ProgressState): void;
  getOverlay(): UserOverlay;
  saveOverlay(overlay: UserOverlay): void;
  exportAll(): OverlayExport;
  importAll(data: OverlayExport): void;
  resetAll(): void;
}

export const EMPTY_OVERLAY: UserOverlay = {
  version: 1,
  notes: {},
  customConcepts: [],
  customFlashcards: [],
  customQuizQuestions: [],
};

export function emptyProgress(): ProgressState {
  const today = new Date().toISOString().slice(0, 10);
  return {
    quizResults: {},
    quizHistory: [],
    flashcards: {},
    dailyChecklist: {
      date: today,
      flashcardsReviewed: false,
      radioCallPracticed: false,
    },
  };
}
