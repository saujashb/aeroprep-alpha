import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProgress } from "../store/ProgressContext";
import { computeGraphLayout } from "../lib/graphLayout";
import { Panel } from "../components/ui";
import type { NodeState } from "../types";

const stateColors: Record<NodeState, { fill: string; stroke: string; label: string }> = {
  locked: { fill: "#334155", stroke: "#475569", label: "Locked" },
  available: { fill: "#0c4a6e", stroke: "#38bdf8", label: "Available" },
  mastered: { fill: "#064e3b", stroke: "#34d399", label: "Mastered" },
};

export function KnowledgeRadarPage() {
  const { nodes, edges, nodeStates, categories } = useProgress();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);

  const layout = useMemo(
    () => computeGraphLayout(nodes, edges, categories.map((c) => c.id)),
    [nodes, edges, categories],
  );

  const highlightEdges = hovered
    ? edges.filter((e) => e.target === hovered || e.source === hovered)
    : edges;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Knowledge Radar</h1>
        <p className="text-sm text-ink-muted">Your interconnected pre-PPL concept map. Click a node to study it.</p>
      </div>

      <Panel>
        <div className="mb-3 flex flex-wrap gap-4 text-xs">
          {(Object.keys(stateColors) as NodeState[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-ink-muted">
              <span className="h-3 w-3 rounded-full border" style={{ background: stateColors[s].fill, borderColor: stateColors[s].stroke }} />
              {stateColors[s].label}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-ink-muted">
            <span className="h-3 w-3 rounded-full border border-dashed border-advisory" /> Custom concept
          </span>
        </div>
        <svg viewBox={`0 0 ${layout.width} ${layout.height}`} className="w-full rounded border border-panel-border bg-panel" role="img" aria-label="Knowledge graph">
          {highlightEdges.map((e, i) => (
            <line
              key={`${e.source}-${e.target}-${i}`}
              x1={layout.nodes.get(e.source)?.x ?? 0}
              y1={layout.nodes.get(e.source)?.y ?? 0}
              x2={layout.nodes.get(e.target)?.x ?? 0}
              y2={layout.nodes.get(e.target)?.y ?? 0}
              stroke={e.kind === "advanced" ? "#fbbf24" : hovered ? "#38bdf8" : "#1e2a44"}
              strokeWidth={hovered ? 2 : 1}
              strokeDasharray={e.kind === "advanced" ? "4 3" : undefined}
              className="transition-all duration-300"
            />
          ))}
          {nodes.map((node) => {
            const pos = layout.nodes.get(node.id);
            if (!pos) return null;
            const state = nodeStates[node.id];
            const colors = stateColors[state];
            const isHovered = hovered === node.id;
            return (
              <g
                key={node.id}
                className="cursor-pointer transition-all duration-300"
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => navigate(`/learn/${node.id}`)}
              >
                {isHovered && (
                  <circle cx={pos.x} cy={pos.y} r={18} fill="none" stroke="#38bdf8" strokeWidth={1} opacity={0.5}>
                    <animate attributeName="r" from="12" to="24" dur="1.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.6" to="0" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={node.custom ? 11 : 10}
                  fill={colors.fill}
                  stroke={node.custom ? "#fbbf24" : colors.stroke}
                  strokeWidth={node.custom ? 2 : 1.5}
                  strokeDasharray={node.custom ? "3 2" : undefined}
                />
                <text x={pos.x} y={pos.y + 22} textAnchor="middle" fill="#94a3b8" fontSize={9} className="select-none">
                  {node.title.length > 18 ? node.title.slice(0, 16) + "…" : node.title}
                </text>
              </g>
            );
          })}
        </svg>
      </Panel>
    </div>
  );
}
