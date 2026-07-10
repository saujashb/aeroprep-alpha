/**
 * Shared domain types for AeroPrep Alpha.
 *
 * The data layer (src/data, src/store) and the UI both code against these
 * types. Nothing in here depends on React or on any persistence mechanism.
 */

/* ------------------------------------------------------------------ */
/* Knowledge graph                                                     */
/* ------------------------------------------------------------------ */

export type Category =
  | "atc-communications"
  | "aircraft-systems"
  | "airspace-weather"
  | "navigation"
  | "protocols-safety";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface JargonTerm {
  term: string;
  definition: string;
}

export interface ConceptNode {
  id: string;
  title: string;
  category: Category;
  difficulty: Difficulty;
  /** One/two-sentence hook. Always visible, even when the node is locked. */
  summary: string;
  /** Full beginner lesson. Visible once the node is available. */
  deep_dive: string;
  /**
   * Third content layer: regulatory detail, edge cases, and memory aids.
   * Unlocks (and the node visually "deepens") when the node is mastered.
   */
  advanced: string;
  jargon_terms: JargonTerm[];
  /** Node ids that must be mastered before this node becomes available. */
  prerequisites: string[];
  /**
   * Extra "related concept" edges revealed only after this node is
   * mastered — the graph literally grows as the learner does.
   */
  advanced_related?: string[];
  /** True for user-authored concepts merged in from the overlay. */
  custom?: boolean;
}

export interface CategoryInfo {
  id: Category;
  label: string;
}

export interface KnowledgeGraph {
  version: number;
  categories: CategoryInfo[];
  nodes: ConceptNode[];
}

/** A directed edge in the merged graph, for the Knowledge Radar view. */
export interface GraphEdge {
  source: string;
  target: string;
  kind: "prerequisite" | "advanced";
}

/* ------------------------------------------------------------------ */
/* Quizzes & flashcards                                                */
/* ------------------------------------------------------------------ */

export interface QuizQuestion {
  id: string;
  nodeId: string;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  /** True for user-authored questions merged in from the overlay. */
  custom?: boolean;
}

export interface Flashcard {
  id: string;
  category: Category;
  front: string;
  back: string;
  /** True for user-authored cards merged in from the overlay. */
  custom?: boolean;
}

/* ------------------------------------------------------------------ */
/* Progress                                                            */
/* ------------------------------------------------------------------ */

export type NodeState = "locked" | "available" | "mastered";

export type LeitnerBox = 1 | 2 | 3 | 4 | 5;

export interface QuizResult {
  nodeId: string;
  correct: number;
  total: number;
  passed: boolean;
  /** ISO timestamp. */
  completedAt: string;
}

export interface FlashcardProgress {
  box: LeitnerBox;
  /** ISO timestamp of the last review, or null if never reviewed. */
  lastReviewedAt: string | null;
}

export interface DailyChecklist {
  /** Local date key, e.g. "2026-07-10". Checklist resets when it changes. */
  date: string;
  flashcardsReviewed: boolean;
  radioCallPracticed: boolean;
}

export interface ProgressState {
  /** Best quiz result per node id. Passing one marks the node mastered. */
  quizResults: Record<string, QuizResult>;
  /** Every attempt ever made, newest last, for the Progress Profile stats. */
  quizHistory: QuizResult[];
  /** Leitner progress per flashcard id. Absent = box 1, never reviewed. */
  flashcards: Record<string, FlashcardProgress>;
  dailyChecklist: DailyChecklist;
}

/* ------------------------------------------------------------------ */
/* User-authored growth (the content overlay)                          */
/* ------------------------------------------------------------------ */

export interface ConceptNote {
  nodeId: string;
  text: string;
  /** ISO timestamp. */
  updatedAt: string;
}

/**
 * Everything the user has added on top of the seed content. Persisted via
 * the swappable ProgressStore and merged with the seed by contentService.
 */
export interface UserOverlay {
  version: number;
  /** Personal notes, keyed by concept node id. */
  notes: Record<string, ConceptNote>;
  /** User-created concepts (custom: true), full graph citizens. */
  customConcepts: ConceptNode[];
  customFlashcards: Flashcard[];
  customQuizQuestions: QuizQuestion[];
}

/** Shape of the exported/imported backup JSON. */
export interface OverlayExport {
  app: "aeroprep-alpha";
  version: number;
  exportedAt: string;
  overlay: UserOverlay;
  progress: ProgressState;
}

/* ------------------------------------------------------------------ */
/* ATC Comm Sandbox data                                               */
/* ------------------------------------------------------------------ */

export interface AtcAircraft {
  id: string;
  /** e.g. "Cessna 172" */
  type: string;
  /** Registration, e.g. "N738GB" */
  tailNumber: string;
  /** Spoken callsign, e.g. "Cessna seven tree eight golf bravo" */
  spokenCallsign: string;
  /** Abbreviated spoken callsign, e.g. "eight golf bravo" */
  shortCallsign: string;
}

export interface AtcAirport {
  id: string;
  icao: string;
  name: string;
  towered: boolean;
  /** Facility name used on the radio, e.g. "Portland" or "Aurora traffic". */
  facilityName: string;
  groundFreq?: string;
  towerFreq?: string;
  ctafFreq?: string;
  runways: string[];
}

export interface AtcPosition {
  id: string;
  label: string;
  /** Phrase slotted into the WHERE part of the call, e.g. "at the main ramp". */
  phrase: string;
  /** Which situations this position makes sense for. */
  context: "ground" | "air";
}

/**
 * An intention the user can select. Templates use placeholders that the UI
 * substitutes: {facility} {callsign} {shortCallsign} {position} {atis}
 * {runway} {airport}
 */
export interface AtcIntention {
  id: string;
  label: string;
  /** Facility addressed: tower-controlled ground/tower, or CTAF broadcast. */
  facility: "ground" | "tower" | "ctaf";
  /** Positions (by context) that pair sensibly with this intention. */
  positionContext: "ground" | "air";
  /** The full correct pilot transmission. */
  pilotTemplate: string;
  /** The simulated controller (or pattern-traffic) response. */
  atcTemplate: string;
  /** The correct pilot readback of that response ("" when none is needed). */
  readbackTemplate: string;
  /** Beginner-facing note on why the call is phrased this way. */
  explanation: string;
}

export interface AtcScenarioData {
  aircraft: AtcAircraft[];
  airports: AtcAirport[];
  positions: AtcPosition[];
  intentions: AtcIntention[];
  /** Pool of ATIS information letters for towered scenarios. */
  atisLetters: string[];
}

/* ------------------------------------------------------------------ */
/* METAR decoder reference data                                        */
/* ------------------------------------------------------------------ */

/**
 * One recognizable METAR token category. `regex` is applied (anchored,
 * whole-token) to each whitespace-separated token in order; the first
 * matching pattern wins. `template` may reference capture groups as
 * $1..$9 to build the human-readable decode.
 */
export interface MetarTokenPattern {
  id: string;
  label: string;
  regex: string;
  template: string;
  /** Longer beginner explanation shown in the tooltip/expanded view. */
  explanation: string;
}

export interface MetarReference {
  patterns: MetarTokenPattern[];
  /** Lookup tables the decoder can substitute into templates. */
  weatherCodes: Record<string, string>;
  cloudCodes: Record<string, string>;
  examples: { raw: string; note: string }[];
}
