import { useRef } from "react";
import { useProgress } from "../store/ProgressContext";
import { Panel, AlertBadge } from "../components/ui";
import type { LeitnerBox, OverlayExport } from "../types";

const BOX_LABELS: Record<LeitnerBox, string> = {
  1: "Daily review",
  2: "Every 1 day",
  3: "Every 2 days",
  4: "Every 4 days",
  5: "Every 7 days",
};

export function ProgressProfilePage() {
  const { progress, flashcards, nodes, categories, categoryStats, exportData, importData, resetAll } =
    useProgress();
  const fileRef = useRef<HTMLInputElement>(null);

  const totalAttempts = progress.quizHistory.length;
  const passedAttempts = progress.quizHistory.filter((r) => r.passed).length;
  const avgScore =
    totalAttempts > 0
      ? Math.round(
          (progress.quizHistory.reduce((s, r) => s + r.correct / r.total, 0) / totalAttempts) * 100,
        )
      : 0;

  const boxCounts: Record<LeitnerBox, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const card of flashcards) {
    const box = progress.flashcards[card.id]?.box ?? 1;
    boxCounts[box]++;
  }

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aeroprep-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as OverlayExport;
        importData(data);
        alert("Import successful!");
      } catch (e) {
        alert(`Import failed: ${e instanceof Error ? e.message : "Invalid file"}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Progress Profile</h1>
        <p className="text-sm text-ink-muted">Quiz stats, flashcard mastery, and data backup.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Panel title="Quiz stats">
          <p className="font-mono-panel text-3xl font-bold text-hud">{avgScore}%</p>
          <p className="text-sm text-ink-muted">Average quiz score</p>
          <p className="mt-2 text-xs text-ink-muted">
            {passedAttempts} passed / {totalAttempts} attempts
          </p>
        </Panel>
        <Panel title="Concepts mastered">
          <p className="font-mono-panel text-3xl font-bold text-normal">
            {nodes.filter((n) => progress.quizResults[n.id]?.passed).length}
          </p>
          <p className="text-sm text-ink-muted">of {nodes.length} total concepts</p>
        </Panel>
        <Panel title="Flashcards">
          <p className="font-mono-panel text-3xl font-bold text-advisory">{flashcards.length}</p>
          <p className="text-sm text-ink-muted">cards in your decks</p>
        </Panel>
      </div>

      <Panel title="Leitner box distribution">
        <div className="grid gap-2 sm:grid-cols-5">
          {([1, 2, 3, 4, 5] as LeitnerBox[]).map((box) => (
            <div key={box} className="rounded border border-panel-border bg-panel p-3 text-center">
              <p className="font-mono-panel text-2xl font-bold text-ink">{boxCounts[box]}</p>
              <p className="text-[10px] text-ink-muted">Box {box}</p>
              <p className="text-[10px] text-ink-muted">{BOX_LABELS[box]}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Per-category completion">
        <div className="space-y-2">
          {categories.map((cat) => {
            const stats = categoryStats(cat.id);
            return (
              <div key={cat.id} className="flex items-center gap-3">
                <span className="w-40 text-sm text-ink">{cat.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-panel-border">
                  <div className="h-full bg-normal transition-all duration-500" style={{ width: `${stats.percent}%` }} />
                </div>
                <AlertBadge kind={stats.percent >= 80 ? "normal" : "info"}>{stats.percent}%</AlertBadge>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Import / Export">
        <p className="mb-3 text-sm text-ink-muted">
          Back up your notes, custom concepts, flashcards, and progress. Import on another device or before migrating to a backend.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="rounded border border-hud bg-hud/10 px-4 py-2 text-sm text-hud transition-all duration-300 hover:bg-hud/20"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded border border-panel-border px-4 py-2 text-sm text-ink transition-all duration-300 hover:border-hud"
          >
            Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (confirm("Reset all progress and custom content? This cannot be undone.")) resetAll();
            }}
            className="rounded border border-warning/40 px-4 py-2 text-sm text-warning transition-all duration-300 hover:bg-warning/10"
          >
            Reset all data
          </button>
        </div>
      </Panel>
    </div>
  );
}
