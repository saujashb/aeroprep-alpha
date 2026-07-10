import seedGraph from "../data/knowledge_graph.json";
import seedQuizzes from "../data/quizzes.json";
import seedFlashcards from "../data/flashcards.json";
import type {
  Category,
  ConceptNode,
  Flashcard,
  GraphEdge,
  KnowledgeGraph,
  NodeState,
  ProgressState,
  QuizQuestion,
  UserOverlay,
} from "../types";

const PASS_THRESHOLD = 0.8;

export function getSeedGraph(): KnowledgeGraph {
  return seedGraph as KnowledgeGraph;
}

export function getSeedQuizzes(): QuizQuestion[] {
  return seedQuizzes as QuizQuestion[];
}

export function getSeedFlashcards(): Flashcard[] {
  return seedFlashcards as Flashcard[];
}

export function mergeConcepts(overlay: UserOverlay): ConceptNode[] {
  const seed = getSeedGraph().nodes;
  const custom = overlay.customConcepts.map((c) => ({ ...c, custom: true }));
  return [...seed, ...custom];
}

export function mergeQuizzes(overlay: UserOverlay): QuizQuestion[] {
  const custom = overlay.customQuizQuestions.map((q) => ({ ...q, custom: true }));
  return [...getSeedQuizzes(), ...custom];
}

export function mergeFlashcards(overlay: UserOverlay): Flashcard[] {
  const custom = overlay.customFlashcards.map((f) => ({ ...f, custom: true }));
  return [...getSeedFlashcards(), ...custom];
}

export function getNodeState(
  nodeId: string,
  nodes: ConceptNode[],
  progress: ProgressState,
): NodeState {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return "locked";
  if (progress.quizResults[nodeId]?.passed) return "mastered";
  const prereqs = node.prerequisites ?? [];
  if (prereqs.length === 0) return "available";
  const allMet = prereqs.every((pid) => progress.quizResults[pid]?.passed);
  return allMet ? "available" : "locked";
}

export function buildNodeStateMap(
  nodes: ConceptNode[],
  progress: ProgressState,
): Record<string, NodeState> {
  const map: Record<string, NodeState> = {};
  for (const node of nodes) {
    map[node.id] = getNodeState(node.id, nodes, progress);
  }
  return map;
}

export function buildGraphEdges(nodes: ConceptNode[], progress: ProgressState): GraphEdge[] {
  const edges: GraphEdge[] = [];
  for (const node of nodes) {
    for (const pid of node.prerequisites ?? []) {
      edges.push({ source: pid, target: node.id, kind: "prerequisite" });
    }
    if (progress.quizResults[node.id]?.passed) {
      for (const rid of node.advanced_related ?? []) {
        edges.push({ source: node.id, target: rid, kind: "advanced" });
      }
    }
  }
  return edges;
}

export function quizzesForNode(nodeId: string, overlay: UserOverlay): QuizQuestion[] {
  return mergeQuizzes(overlay).filter((q) => q.nodeId === nodeId);
}

export function computeReadiness(nodes: ConceptNode[], progress: ProgressState): number {
  if (nodes.length === 0) return 0;
  const mastered = nodes.filter((n) => progress.quizResults[n.id]?.passed).length;
  return Math.round((mastered / nodes.length) * 100);
}

export function categoryProgress(
  category: Category,
  nodes: ConceptNode[],
  progress: ProgressState,
): { total: number; mastered: number; percent: number } {
  const inCat = nodes.filter((n) => n.category === category);
  const mastered = inCat.filter((n) => progress.quizResults[n.id]?.passed).length;
  return {
    total: inCat.length,
    mastered,
    percent: inCat.length ? Math.round((mastered / inCat.length) * 100) : 0,
  };
}

export function gradeQuiz(correct: number, total: number): boolean {
  return total > 0 && correct / total >= PASS_THRESHOLD;
}

export function relatedConcepts(node: ConceptNode, nodes: ConceptNode[]): ConceptNode[] {
  const ids = new Set<string>();
  for (const pid of node.prerequisites) ids.add(pid);
  for (const rid of node.advanced_related ?? []) ids.add(rid);
  for (const n of nodes) {
    if (n.prerequisites.includes(node.id)) ids.add(n.id);
  }
  ids.delete(node.id);
  return nodes.filter((n) => ids.has(n.id));
}
