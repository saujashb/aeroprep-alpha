import { useProgress } from "../store/ProgressContext";

export function ReadinessBar() {
  const { readiness } = useProgress();
  const color =
    readiness >= 75 ? "bg-normal" : readiness >= 40 ? "bg-advisory" : "bg-hud";

  return (
    <header className="border-b border-panel-border bg-panel-raised px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs tracking-widest text-ink-muted uppercase">Pre-Flight Readiness</p>
          <p className="font-mono-panel text-2xl font-semibold text-ink">{readiness}%</p>
        </div>
        <div className="flex-1 max-w-xl">
          <div className="h-3 overflow-hidden rounded-full border border-panel-border bg-panel">
            <div
              className={`h-full rounded-full transition-all duration-500 ${color}`}
              style={{ width: `${readiness}%` }}
            />
          </div>
          <p className="mt-1 text-right text-[10px] text-ink-muted">
            Master concepts via quizzes to raise readiness
          </p>
        </div>
      </div>
    </header>
  );
}
