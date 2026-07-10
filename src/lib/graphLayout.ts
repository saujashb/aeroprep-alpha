import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import type { ConceptNode, GraphEdge } from "../types";

export interface LayoutNode extends SimulationNodeDatum {
  id: string;
  x: number;
  y: number;
}

export interface LayoutEdge {
  source: string;
  target: string;
  kind: GraphEdge["kind"];
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface GraphLayout {
  nodes: Map<string, LayoutNode>;
  edges: LayoutEdge[];
  width: number;
  height: number;
}

/**
 * Runs a d3-force simulation synchronously and returns settled positions.
 * Category clustering is encouraged with per-category x/y anchors so the
 * radar reads as loose "constellations" per subject area.
 */
export function computeGraphLayout(
  nodes: ConceptNode[],
  edges: GraphEdge[],
  categoryIds: string[],
  width = 1000,
  height = 640,
): GraphLayout {
  const anchors = new Map<string, { x: number; y: number }>();
  const n = Math.max(categoryIds.length, 1);
  categoryIds.forEach((cat, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    anchors.set(cat, {
      x: width / 2 + Math.cos(angle) * width * 0.28,
      y: height / 2 + Math.sin(angle) * height * 0.28,
    });
  });

  const simNodes: (LayoutNode & { category: string })[] = nodes.map((node, i) => {
    const anchor = anchors.get(node.category) ?? { x: width / 2, y: height / 2 };
    // Deterministic jitter so layout is stable across renders.
    const jitter = ((i * 2654435761) % 97) / 97;
    return {
      id: node.id,
      category: node.category,
      x: anchor.x + Math.cos(jitter * Math.PI * 2) * 40,
      y: anchor.y + Math.sin(jitter * Math.PI * 2) * 40,
    };
  });

  const idSet = new Set(simNodes.map((sn) => sn.id));
  const simLinks: SimulationLinkDatum<LayoutNode>[] = edges
    .filter((e) => idSet.has(e.source) && idSet.has(e.target))
    .map((e) => ({ source: e.source, target: e.target }));

  const sim = forceSimulation(simNodes)
    .force("charge", forceManyBody().strength(-320))
    .force(
      "link",
      forceLink<LayoutNode, SimulationLinkDatum<LayoutNode>>(simLinks)
        .id((d) => d.id)
        .distance(95)
        .strength(0.55),
    )
    .force("center", forceCenter(width / 2, height / 2))
    .force("collide", forceCollide(34))
    .force("catX", forceX<LayoutNode & { category: string }>((d) => anchors.get(d.category)?.x ?? width / 2).strength(0.08))
    .force("catY", forceY<LayoutNode & { category: string }>((d) => anchors.get(d.category)?.y ?? height / 2).strength(0.08))
    .stop();

  for (let i = 0; i < 300; i++) sim.tick();

  const pad = 48;
  const nodeMap = new Map<string, LayoutNode>();
  for (const sn of simNodes) {
    sn.x = Math.max(pad, Math.min(width - pad, sn.x));
    sn.y = Math.max(pad, Math.min(height - pad, sn.y));
    nodeMap.set(sn.id, sn);
  }

  const layoutEdges: LayoutEdge[] = [];
  for (const e of edges) {
    const s = nodeMap.get(e.source);
    const t = nodeMap.get(e.target);
    if (!s || !t) continue;
    layoutEdges.push({ source: e.source, target: e.target, kind: e.kind, x1: s.x, y1: s.y, x2: t.x, y2: t.y });
  }

  return { nodes: nodeMap, edges: layoutEdges, width, height };
}
