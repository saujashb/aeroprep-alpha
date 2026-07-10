import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Category,
  ConceptNode,
  Flashcard,
  FlashcardProgress,
  GraphEdge,
  LeitnerBox,
  NodeState,
  OverlayExport,
  ProgressState,
  QuizQuestion,
  QuizResult,
  UserOverlay,
} from "../types";
import {
  buildGraphEdges,
  buildNodeStateMap,
  categoryProgress,
  computeReadiness,
  getSeedGraph,
  gradeQuiz,
  mergeConcepts,
  mergeFlashcards,
  mergeQuizzes,
} from "./contentService";
import { defaultStore } from "./localStorageProgressStore";
import type { ProgressStore } from "./progressStore";
import { EMPTY_OVERLAY, emptyProgress } from "./progressStore";
import { nextBox } from "../lib/leitner";

interface ProgressContextValue {
  store: ProgressStore;
  progress: ProgressState;
  overlay: UserOverlay;
  nodes: ConceptNode[];
  categories: { id: Category; label: string }[];
  nodeStates: Record<string, NodeState>;
  edges: GraphEdge[];
  readiness: number;
  categoryStats: (cat: Category) => { total: number; mastered: number; percent: number };
  flashcards: Flashcard[];
  quizzes: QuizQuestion[];
  submitQuiz: (nodeId: string, correct: number, total: number) => void;
  reviewFlashcard: (cardId: string, knewIt: boolean) => void;
  setNote: (nodeId: string, text: string) => void;
  addCustomConcept: (concept: ConceptNode) => void;
  addCustomFlashcard: (card: Flashcard) => void;
  addCustomQuiz: (quiz: QuizQuestion) => void;
  markDailyFlashcards: () => void;
  markDailyRadio: () => void;
  exportData: () => OverlayExport;
  importData: (data: OverlayExport) => void;
  resetAll: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

function ensureDailyChecklist(progress: ProgressState): ProgressState {
  const today = new Date().toISOString().slice(0, 10);
  if (progress.dailyChecklist.date === today) return progress;
  return {
    ...progress,
    dailyChecklist: { date: today, flashcardsReviewed: false, radioCallPracticed: false },
  };
}

export function ProgressProvider({
  children,
  store = defaultStore,
}: {
  children: ReactNode;
  store?: ProgressStore;
}) {
  const [progress, setProgress] = useState(() => ensureDailyChecklist(store.getProgress()));
  const [overlay, setOverlay] = useState(() => store.getOverlay());

  const persistProgress = useCallback(
    (next: ProgressState) => {
      const checked = ensureDailyChecklist(next);
      setProgress(checked);
      store.saveProgress(checked);
    },
    [store],
  );

  const persistOverlay = useCallback(
    (next: UserOverlay) => {
      setOverlay(next);
      store.saveOverlay(next);
    },
    [store],
  );

  const nodes = useMemo(() => mergeConcepts(overlay), [overlay]);
  const categories = getSeedGraph().categories as { id: Category; label: string }[];
  const nodeStates = useMemo(() => buildNodeStateMap(nodes, progress), [nodes, progress]);
  const edges = useMemo(() => buildGraphEdges(nodes, progress), [nodes, progress]);
  const readiness = useMemo(() => computeReadiness(nodes, progress), [nodes, progress]);
  const flashcards = useMemo(() => mergeFlashcards(overlay), [overlay]);
  const quizzes = useMemo(() => mergeQuizzes(overlay), [overlay]);

  const submitQuiz = useCallback(
    (nodeId: string, correct: number, total: number) => {
      const passed = gradeQuiz(correct, total);
      const result: QuizResult = {
        nodeId,
        correct,
        total,
        passed,
        completedAt: new Date().toISOString(),
      };
      const prev = progress.quizResults[nodeId];
      const keep = !prev || (passed && !prev.passed) || correct > prev.correct;
      persistProgress({
        ...progress,
        quizResults: keep ? { ...progress.quizResults, [nodeId]: result } : progress.quizResults,
        quizHistory: [...progress.quizHistory, result],
      });
    },
    [progress, persistProgress],
  );

  const reviewFlashcard = useCallback(
    (cardId: string, knewIt: boolean) => {
      const current = progress.flashcards[cardId] ?? { box: 1 as LeitnerBox, lastReviewedAt: null };
      const box = nextBox(current.box, knewIt);
      const next: FlashcardProgress = { box, lastReviewedAt: new Date().toISOString() };
      persistProgress({
        ...progress,
        flashcards: { ...progress.flashcards, [cardId]: next },
      });
    },
    [progress, persistProgress],
  );

  const setNote = useCallback(
    (nodeId: string, text: string) => {
      const notes = { ...overlay.notes };
      if (text.trim()) {
        notes[nodeId] = { nodeId, text: text.trim(), updatedAt: new Date().toISOString() };
      } else {
        delete notes[nodeId];
      }
      persistOverlay({ ...overlay, notes });
    },
    [overlay, persistOverlay],
  );

  const addCustomConcept = useCallback(
    (concept: ConceptNode) => {
      persistOverlay({
        ...overlay,
        customConcepts: [...overlay.customConcepts, { ...concept, custom: true }],
      });
    },
    [overlay, persistOverlay],
  );

  const addCustomFlashcard = useCallback(
    (card: Flashcard) => {
      persistOverlay({
        ...overlay,
        customFlashcards: [...overlay.customFlashcards, { ...card, custom: true }],
      });
    },
    [overlay, persistOverlay],
  );

  const addCustomQuiz = useCallback(
    (quiz: QuizQuestion) => {
      persistOverlay({
        ...overlay,
        customQuizQuestions: [...overlay.customQuizQuestions, { ...quiz, custom: true }],
      });
    },
    [overlay, persistOverlay],
  );

  const markDailyFlashcards = useCallback(() => {
    persistProgress({
      ...progress,
      dailyChecklist: { ...progress.dailyChecklist, flashcardsReviewed: true },
    });
  }, [progress, persistProgress]);

  const markDailyRadio = useCallback(() => {
    persistProgress({
      ...progress,
      dailyChecklist: { ...progress.dailyChecklist, radioCallPracticed: true },
    });
  }, [progress, persistProgress]);

  const exportData = useCallback(() => store.exportAll(), [store]);

  const importData = useCallback(
    (data: OverlayExport) => {
      store.importAll(data);
      setProgress(ensureDailyChecklist(store.getProgress()));
      setOverlay(store.getOverlay());
    },
    [store],
  );

  const resetAll = useCallback(() => {
    store.resetAll();
    setProgress(emptyProgress());
    setOverlay({ ...EMPTY_OVERLAY });
  }, [store]);

  const value: ProgressContextValue = {
    store,
    progress,
    overlay,
    nodes,
    categories,
    nodeStates,
    edges,
    readiness,
    categoryStats: (cat) => categoryProgress(cat, nodes, progress),
    flashcards,
    quizzes,
    submitQuiz,
    reviewFlashcard,
    setNote,
    addCustomConcept,
    addCustomFlashcard,
    addCustomQuiz,
    markDailyFlashcards,
    markDailyRadio,
    exportData,
    importData,
    resetAll,
  };

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
