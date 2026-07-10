import { useState } from "react";
import { Link } from "react-router-dom";
import { useProgress } from "../store/ProgressContext";
import { orderForReview, shuffle } from "../lib/leitner";
import { Panel } from "../components/ui";

export function FlashcardReviewPage() {
  const { flashcards, progress, reviewFlashcard, markDailyFlashcards } = useProgress();
  const { due, rest } = orderForReview(flashcards, progress.flashcards);
  const deck = shuffle([...due, ...rest]).slice(0, 10);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);

  if (flashcards.length === 0) {
    return (
      <div className="text-center">
        <p className="text-ink-muted">No flashcards available yet.</p>
        <Link to="/" className="text-hud hover:underline">Back to dashboard</Link>
      </div>
    );
  }

  if (done || index >= deck.length) {
    markDailyFlashcards();
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <h1 className="text-xl font-semibold text-ink">Review complete</h1>
        <p className="text-sm text-ink-muted">You reviewed {Math.min(index, deck.length)} cards.</p>
        <Link to="/" className="inline-block rounded bg-hud px-4 py-2 text-sm text-panel">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const card = deck[index];

  const answer = (knewIt: boolean) => {
    reviewFlashcard(card.id, knewIt);
    setFlipped(false);
    if (index + 1 >= deck.length) setDone(true);
    else setIndex((i) => i + 1);
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-xs text-hud hover:underline">← Dashboard</Link>
        <p className="text-xs text-ink-muted">
          Card {index + 1} of {deck.length}
        </p>
      </div>
      <Panel>
        <button
          type="button"
          onClick={() => setFlipped(!flipped)}
          className="flex min-h-48 w-full flex-col items-center justify-center rounded border border-panel-border bg-panel p-6 text-center transition-all duration-300 hover:border-hud"
        >
          <p className="text-lg font-medium text-ink">{flipped ? card.back : card.front}</p>
          <p className="mt-3 text-xs text-ink-muted">{flipped ? "Tap to flip back" : "Tap to reveal answer"}</p>
        </button>
        {flipped && (
          <div className="mt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => answer(false)}
              className="rounded border border-warning/40 px-4 py-2 text-sm text-warning transition-all duration-300 hover:bg-warning/10"
            >
              Didn't know
            </button>
            <button
              type="button"
              onClick={() => answer(true)}
              className="rounded border border-normal/40 px-4 py-2 text-sm text-normal transition-all duration-300 hover:bg-normal/10"
            >
              Knew it
            </button>
          </div>
        )}
      </Panel>
    </div>
  );
}
