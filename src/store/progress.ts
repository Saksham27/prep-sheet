import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Progress store ──────────────────────────────────────────────────────────
// This is the ONLY place user state lives. It is keyed by the stable content `id`
// and persisted to localStorage, completely separate from the generated content
// bundle. Re-running the parser rewrites content.json but never touches this — so
// progress survives content edits, refreshes, and app restarts.

export type ProblemStatus = 'todo' | 'read' | 'solved' | 'cold';

export interface ItemProgress {
  status?: ProblemStatus; // problems
  starred?: boolean;
  notes?: string;
  canExplain?: boolean; // depth-track concepts
  // SM-2-lite scheduler state (set when an item is reviewed)
  ease?: number;
  interval?: number; // days
  reps?: number;
  lastReviewed?: string; // ISO date
  nextReview?: string; // ISO date
  // behavioral story bracket fields: placeholder token -> user value
  fields?: Record<string, string>;
}

interface ProgressState {
  items: Record<string, ItemProgress>;
  streak: { count: number; lastActive: string | null };

  get: (id: string) => ItemProgress;
  patch: (id: string, p: Partial<ItemProgress>) => void;
  setStatus: (id: string, status: ProblemStatus) => void;
  toggleStar: (id: string) => void;
  setNotes: (id: string, notes: string) => void;
  toggleCanExplain: (id: string) => void;
  setField: (id: string, token: string, value: string) => void;
  reset: () => void;
}

const EMPTY: ItemProgress = {};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function bumpStreak(streak: { count: number; lastActive: string | null }) {
  const today = todayISO();
  if (streak.lastActive === today) return streak;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const count = streak.lastActive === yesterday ? streak.count + 1 : 1;
  return { count, lastActive: today };
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, getState) => ({
      items: {},
      streak: { count: 0, lastActive: null },

      get: (id) => getState().items[id] ?? EMPTY,

      patch: (id, p) =>
        set((s) => ({
          items: { ...s.items, [id]: { ...s.items[id], ...p } },
          streak: bumpStreak(s.streak),
        })),

      setStatus: (id, status) =>
        set((s) => ({
          items: { ...s.items, [id]: { ...s.items[id], status } },
          streak: bumpStreak(s.streak),
        })),

      toggleStar: (id) =>
        set((s) => ({
          items: { ...s.items, [id]: { ...s.items[id], starred: !s.items[id]?.starred } },
        })),

      setNotes: (id, notes) =>
        set((s) => ({
          items: { ...s.items, [id]: { ...s.items[id], notes } },
        })),

      toggleCanExplain: (id) =>
        set((s) => ({
          items: { ...s.items, [id]: { ...s.items[id], canExplain: !s.items[id]?.canExplain } },
          streak: bumpStreak(s.streak),
        })),

      setField: (id, token, value) =>
        set((s) => ({
          items: {
            ...s.items,
            [id]: { ...s.items[id], fields: { ...s.items[id]?.fields, [token]: value } },
          },
        })),

      reset: () => set({ items: {}, streak: { count: 0, lastActive: null } }),
    }),
    { name: 'prep-progress-v1' },
  ),
);
