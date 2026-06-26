import { topicsForTrack, tracks } from './content';

export interface PlanWeek {
  week: number;
  phase: 1 | 2;
  dsa: string[];
  focusTrackId: string;
  focusTitle: string;
}

/**
 * Generate a week-by-week study plan from the curriculum's rules:
 *  - DSA is the daily spine, front-loaded — all DSA topics are covered (in their
 *    fixed order) across the first ~75% of the timeline, then it shifts to spaced
 *    repetition + mixed mediums.
 *  - The weekly "focus" rotates through **every other track** in track order, so the
 *    foundational tracks (Start Here, CS Core — negative order) come first and every
 *    track is covered. Deriving the rotation from the live track list means new tracks
 *    are included automatically and the plan never goes stale.
 *  - Phase boundary mirrors "switch-ready" (≈ first 38%) vs "FAANG-ready + depth".
 */
export function generatePlan(weeks: number): PlanWeek[] {
  const dsaTopics = topicsForTrack('dsa');
  const dsaWeeks = Math.max(1, Math.round(weeks * 0.75));
  const perWeek = dsaTopics.length / dsaWeeks;
  const phaseBoundary = Math.max(1, Math.round(weeks * 0.38));

  // every track except DSA, in curriculum (sidebar) order
  const focusTracks = tracks.filter((t) => t.id !== 'dsa');

  const out: PlanWeek[] = [];
  for (let w = 0; w < weeks; w++) {
    const phase: 1 | 2 = w < phaseBoundary ? 1 : 2;
    const start = Math.floor(w * perWeek);
    const end = Math.floor((w + 1) * perWeek);
    const dsa = w < dsaWeeks ? dsaTopics.slice(start, end).map((t) => t.title) : [];
    if (w >= dsaWeeks || dsa.length === 0) dsa.push('Spaced repetition · mixed mediums/hards');

    const focus = focusTracks.length ? focusTracks[w % focusTracks.length] : undefined;
    out.push({
      week: w + 1,
      phase,
      dsa,
      focusTrackId: focus?.id ?? '',
      focusTitle: focus?.title ?? '—',
    });
  }
  return out;
}
