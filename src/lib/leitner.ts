import type { Flashcard, FlashcardProgress, LeitnerBox } from "../types";

/** Days between reviews for each Leitner box (box 1 is always due). */
export const BOX_INTERVAL_DAYS: Record<LeitnerBox, number> = {
  1: 0,
  2: 1,
  3: 2,
  4: 4,
  5: 7,
};

export function isCardDue(progress: FlashcardProgress | undefined, now: Date = new Date()): boolean {
  if (!progress || progress.lastReviewedAt === null) return true;
  const interval = BOX_INTERVAL_DAYS[progress.box];
  if (interval === 0) return true;
  const last = new Date(progress.lastReviewedAt).getTime();
  return now.getTime() - last >= interval * 24 * 60 * 60 * 1000;
}

export function nextBox(box: LeitnerBox, knewIt: boolean): LeitnerBox {
  if (knewIt) return Math.min(5, box + 1) as LeitnerBox;
  return 1;
}

/** Due cards first (lowest box first), then not-yet-due as filler. */
export function orderForReview(
  cards: Flashcard[],
  progressMap: Record<string, FlashcardProgress>,
  now: Date = new Date(),
): { due: Flashcard[]; rest: Flashcard[] } {
  const due: Flashcard[] = [];
  const rest: Flashcard[] = [];
  for (const card of cards) {
    (isCardDue(progressMap[card.id], now) ? due : rest).push(card);
  }
  const boxOf = (c: Flashcard) => progressMap[c.id]?.box ?? 1;
  due.sort((a, b) => boxOf(a) - boxOf(b));
  return { due, rest };
}

/** Fisher–Yates shuffle (non-mutating). */
export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
