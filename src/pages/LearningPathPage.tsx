import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Lock, Unlock, CheckCircle, Plus } from "lucide-react";
import { useProgress } from "../store/ProgressContext";
import { relatedConcepts, quizzesForNode } from "../store/contentService";
import { Panel, AlertBadge } from "../components/ui";
import type { Category, ConceptNode, Difficulty } from "../types";

const difficultyKind: Record<Difficulty, "info" | "advisory" | "warning"> = {
  beginner: "info",
  intermediate: "advisory",
  advanced: "warning",
};

function ConceptCard({
  node,
  state,
}: {
  node: ConceptNode;
  state: "locked" | "available" | "mastered";
}) {
  const icon =
    state === "mastered" ? (
      <CheckCircle className="h-4 w-4 text-normal" />
    ) : state === "available" ? (
      <Unlock className="h-4 w-4 text-hud" />
    ) : (
      <Lock className="h-4 w-4 text-ink-muted" />
    );

  const inner = (
    <div
      className={`rounded border p-3 transition-all duration-300 ${
        state === "locked"
          ? "border-panel-border bg-panel opacity-60"
          : "border-panel-border bg-panel-raised hover:border-hud/50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-sm font-medium text-ink">{node.title}</p>
        </div>
        {node.custom && <AlertBadge kind="advisory">Custom</AlertBadge>}
      </div>
      <p className="mt-1 text-xs text-ink-muted line-clamp-2">{node.summary}</p>
    </div>
  );

  if (state === "locked") return inner;
  return <Link to={`/learn/${node.id}`}>{inner}</Link>;
}

export function LearningPathPage() {
  const { nodes, categories, nodeStates } = useProgress();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Learning Path</h1>
        <p className="text-sm text-ink-muted">Structured curriculum across all six pre-PPL pillars.</p>
      </div>
      {categories.map((cat) => {
        const catNodes = nodes.filter((n) => n.category === cat.id);
        return (
          <Panel key={cat.id} title={cat.label}>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {catNodes.map((node) => (
                <ConceptCard key={node.id} node={node} state={nodeStates[node.id]} />
              ))}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

function QuizSection({ nodeId }: { nodeId: string }) {
  const { submitQuiz, overlay } = useProgress();
  const questions = quizzesForNode(nodeId, overlay);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (questions.length === 0) {
    return <p className="text-sm text-ink-muted">No quiz questions for this concept yet.</p>;
  }

  const correct = questions.filter((q) => answers[q.id] === q.correctIndex).length;

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => (
        <div key={q.id} className="rounded border border-panel-border bg-panel p-3">
          <p className="text-sm font-medium text-ink">
            {qi + 1}. {q.question}
          </p>
          <div className="mt-2 space-y-1">
            {q.choices.map((choice, ci) => {
              const selected = answers[q.id] === ci;
              const showResult = submitted;
              const isCorrect = ci === q.correctIndex;
              let cls = "border-panel-border hover:border-hud/50";
              if (showResult && isCorrect) cls = "border-normal bg-normal/10";
              else if (showResult && selected && !isCorrect) cls = "border-warning bg-warning/10";
              else if (selected) cls = "border-hud bg-hud/10";
              return (
                <button
                  key={ci}
                  type="button"
                  disabled={submitted}
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: ci }))}
                  className={`block w-full rounded border px-3 py-2 text-left text-sm transition-all duration-300 ${cls}`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
          {submitted && (
            <p className="mt-2 text-xs text-ink-muted">{q.explanation}</p>
          )}
        </div>
      ))}
      {!submitted ? (
        <button
          type="button"
          disabled={Object.keys(answers).length < questions.length}
          onClick={() => {
            setSubmitted(true);
            submitQuiz(nodeId, correct, questions.length);
          }}
          className="rounded bg-hud px-4 py-2 text-sm font-medium text-panel transition-all duration-300 hover:bg-hud/90 disabled:opacity-40"
        >
          Submit quiz
        </button>
      ) : (
        <AlertBadge kind={correct / questions.length >= 0.8 ? "normal" : "warning"}>
          Score: {correct}/{questions.length} — {correct / questions.length >= 0.8 ? "Mastered!" : "Review and retry (need 80%)"}
        </AlertBadge>
      )}
    </div>
  );
}

export function ConceptDetailPage() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const { nodes, nodeStates, overlay, setNote, addCustomConcept } = useProgress();
  const node = nodes.find((n) => n.id === nodeId);
  const [noteText, setNoteText] = useState(overlay.notes[nodeId ?? ""]?.text ?? "");
  const [showAddConcept, setShowAddConcept] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSummary, setNewSummary] = useState("");

  if (!node || !nodeId) {
    return <p className="text-ink-muted">Concept not found.</p>;
  }

  const state = nodeStates[nodeId];
  const related = relatedConcepts(node, nodes);
  const mastered = state === "mastered";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to="/learn" className="text-xs text-hud hover:underline">← Learning Path</Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold text-ink">{node.title}</h1>
          {node.custom && <AlertBadge kind="advisory">Custom</AlertBadge>}
          <AlertBadge kind={difficultyKind[node.difficulty]}>{node.difficulty}</AlertBadge>
          <AlertBadge kind={mastered ? "normal" : state === "available" ? "info" : "advisory"}>
            {state}
          </AlertBadge>
        </div>
      </div>

      <Panel title="Summary">
        <p className="text-sm leading-relaxed text-ink">{node.summary}</p>
      </Panel>

      {state !== "locked" && (
        <Panel title="Deep dive">
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{node.deep_dive}</p>
          {node.jargon_terms.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {node.jargon_terms.map((j) => (
                <span
                  key={j.term}
                  title={j.definition}
                  className="cursor-help rounded border border-panel-border bg-panel px-2 py-1 text-xs text-hud transition-all duration-300 hover:border-hud"
                >
                  {j.term}
                </span>
              ))}
            </div>
          )}
        </Panel>
      )}

      <Panel
        title="Advanced layer"
        action={
          mastered ? null : (
            <span className="flex items-center gap-1 text-xs text-ink-muted">
              <Lock className="h-3 w-3" /> Master the quiz to unlock
            </span>
          )
        }
      >
        {mastered ? (
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{node.advanced}</p>
        ) : (
          <p className="text-sm text-ink-muted">Pass the end-of-node quiz with 80% or higher to reveal advanced material.</p>
        )}
      </Panel>

      {related.length > 0 && (
        <Panel title="Related concepts">
          <div className="flex flex-wrap gap-2">
            {related.map((r) => (
              <Link
                key={r.id}
                to={`/learn/${r.id}`}
                className="rounded border border-panel-border px-2 py-1 text-xs text-hud transition-all duration-300 hover:border-hud"
              >
                {r.title}
              </Link>
            ))}
          </div>
        </Panel>
      )}

      <Panel title="Grow Knowledge — your notes">
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onBlur={() => setNote(nodeId, noteText)}
          rows={4}
          placeholder="Add personal notes, mnemonics, or questions from your own study…"
          className="w-full rounded border border-panel-border bg-panel p-3 text-sm text-ink outline-none transition-all duration-300 focus:border-hud"
        />
        <button
          type="button"
          onClick={() => setShowAddConcept(!showAddConcept)}
          className="mt-2 flex items-center gap-1 text-xs text-hud hover:underline"
        >
          <Plus className="h-3 w-3" /> Add a custom concept linked to this one
        </button>
        {showAddConcept && (
          <div className="mt-3 space-y-2 rounded border border-panel-border bg-panel p-3">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Concept title"
              className="w-full rounded border border-panel-border bg-panel-raised px-2 py-1 text-sm"
            />
            <textarea
              value={newSummary}
              onChange={(e) => setNewSummary(e.target.value)}
              placeholder="Summary"
              rows={2}
              className="w-full rounded border border-panel-border bg-panel-raised px-2 py-1 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                if (!newTitle.trim()) return;
                const id = `custom-${Date.now()}`;
                addCustomConcept({
                  id,
                  title: newTitle.trim(),
                  category: node.category as Category,
                  difficulty: "beginner",
                  summary: newSummary.trim() || "User-added concept.",
                  deep_dive: newSummary.trim(),
                  advanced: "",
                  jargon_terms: [],
                  prerequisites: [nodeId],
                });
                setNewTitle("");
                setNewSummary("");
                setShowAddConcept(false);
              }}
              className="rounded bg-hud px-3 py-1 text-xs text-panel"
            >
              Save custom concept
            </button>
          </div>
        )}
      </Panel>

      {state !== "locked" && (
        <Panel title="End-of-node quiz">
          <QuizSection nodeId={nodeId} />
        </Panel>
      )}
    </div>
  );
}
