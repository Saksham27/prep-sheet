// Shared content types. The parser (scripts/) emits JSON matching these, and the
// app (src/) consumes it. CONTENT ONLY — no progress/notes live here; those are a
// separate localStorage store keyed by the stable `id`s below, so reparsing content
// never touches the user's progress.

export type TrackKind = 'dsa' | 'design' | 'fundamentals' | 'lld' | 'behavioral';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Source = 'original' | 'generated';

export interface Template {
  label: string;
  code: string;
  lang: string;
}

export interface Problem {
  id: string;
  trackId: string;
  topicId: string;
  title: string;
  difficulty: Difficulty;
  core: boolean; // the ⭐ set
  revisit: boolean; // the 🔁 set (spaced repetition)
  pattern?: string;
  insight?: string;
  approach?: string;
  complexity?: string;
  watch?: string;
  note?: string; // free-form trailing text for cross-listed / pointer-only problems
  template?: string; // the topic template, snapshotted for convenience
  solution?: string; // full C# solution (added in expansion phase)
  source: Source;
  needsReview?: boolean;
}

export interface Topic {
  id: string;
  trackId: string;
  order: number;
  title: string;
  coreIdea?: string;
  recognitionSignals: string[];
  masteryBar?: string;
  templates: Template[];
  problemIds: string[];
}

export interface ProbeQA {
  question: string;
  answer: string;
}

export interface Concept {
  id: string;
  trackId: string;
  section: string; // e.g. "1.5"
  title: string;
  body: string; // markdown
  probe?: ProbeQA;
  followups: ProbeQA[];
  source: Source;
  needsReview?: boolean;
}

export interface Story {
  id: string;
  trackId: string;
  order: number;
  title: string;
  signals: string[];
  situation?: string;
  task?: string;
  action?: string;
  result?: string;
  body?: string; // for guidance-only stories (conflict/failure frames)
  placeholders: string[]; // unique [bracketed] tokens the user must fill in
  source: Source;
}

export interface Track {
  id: string;
  title: string;
  order: number;
  kind: TrackKind;
  blurb?: string;
  topicIds: string[]; // for dsa/concept tracks: section groups
}

// A daily-plan allocation row (from the master curriculum table).
export interface AllocationRow {
  track: string;
  phase1Pct: number; // weeks 1-10
  phase2Pct: number; // weeks 11-26
}

export interface ContentBundle {
  generatedAt: string;
  tracks: Track[];
  topics: Record<string, Topic>;
  problems: Record<string, Problem>;
  concepts: Record<string, Concept>;
  stories: Record<string, Story>;
  allocation: AllocationRow[];
  stats: {
    problems: number;
    concepts: number;
    stories: number;
  };
}
