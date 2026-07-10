import { Link } from "react-router-dom";
import { CheckCircle2, Circle, Radio, BookOpen } from "lucide-react";
import { useProgress } from "../store/ProgressContext";
import { Panel, AlertBadge } from "../components/ui";
import { orderForReview, shuffle } from "../lib/leitner";

export function DashboardPage() {
  const { readiness, categories, categoryStats, progress, flashcards, markDailyFlashcards, markDailyRadio } =
    useProgress();

  const { due } = orderForReview(flashcards, progress.flashcards);
  const dailyCards = shuffle(due.length ? due : flashcards).slice(0, 5);
  const checklist = progress.dailyChecklist;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Cockpit Dashboard</h1>
        <p className="text-sm text-ink-muted">Your daily pre-ground-school briefing.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Panel title="Readiness">
          <p className="font-mono-panel text-4xl font-bold text-hud">{readiness}%</p>
          <p className="mt-1 text-sm text-ink-muted">Overall pre-flight knowledge readiness</p>
        </Panel>
        <Panel title="Today's checklist">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              {checklist.flashcardsReviewed ? (
                <CheckCircle2 className="h-4 w-4 text-normal" />
              ) : (
                <Circle className="h-4 w-4 text-ink-muted" />
              )}
              <Link to="/flashcards" className="text-hud hover:underline" onClick={markDailyFlashcards}>
                Review flashcards
              </Link>
            </li>
            <li className="flex items-center gap-2">
              {checklist.radioCallPracticed ? (
                <CheckCircle2 className="h-4 w-4 text-normal" />
              ) : (
                <Circle className="h-4 w-4 text-ink-muted" />
              )}
              <Link to="/lab" className="text-hud hover:underline" onClick={markDailyRadio}>
                Practice one ATC radio call
              </Link>
            </li>
          </ul>
        </Panel>
        <Panel title="Quick actions">
          <div className="flex flex-wrap gap-2">
            <Link
              to="/learn"
              className="inline-flex items-center gap-1 rounded border border-panel-border px-3 py-1.5 text-sm text-ink transition-all duration-300 hover:border-hud hover:text-hud"
            >
              <BookOpen className="h-4 w-4" /> Learning Path
            </Link>
            <Link
              to="/lab"
              className="inline-flex items-center gap-1 rounded border border-panel-border px-3 py-1.5 text-sm text-ink transition-all duration-300 hover:border-hud hover:text-hud"
            >
              <Radio className="h-4 w-4" /> Simulator Lab
            </Link>
          </div>
        </Panel>
      </div>

      <Panel title="Category progress">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const stats = categoryStats(cat.id);
            return (
              <div
                key={cat.id}
                className="rounded border border-panel-border bg-panel p-3 transition-all duration-300 hover:border-hud/40"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink">{cat.label}</p>
                  <AlertBadge kind={stats.percent >= 80 ? "normal" : stats.percent >= 40 ? "advisory" : "info"}>
                    {stats.percent}%
                  </AlertBadge>
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  {stats.mastered} / {stats.total} mastered
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel-border">
                  <div className="h-full bg-hud transition-all duration-500" style={{ width: `${stats.percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {dailyCards.length > 0 && (
        <Panel title="Flashcard preview" action={<Link to="/flashcards" className="text-xs text-hud hover:underline">Start review →</Link>}>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {dailyCards.map((card) => (
              <div key={card.id} className="rounded border border-panel-border bg-panel p-3 text-sm">
                <p className="font-medium text-ink">{card.front}</p>
                <p className="mt-1 text-xs text-ink-muted line-clamp-2">{card.back}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
