import { topicsForTrack, track } from './content';

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
 *  - Depth tracks rotate alongside; CS Fundamentals is back-loaded into phase 2
 *    (weeks ~11-26), matching the allocation table.
 *  - Phase boundary mirrors the curriculum's "switch-ready" (≈ first 38%) vs
 *    "FAANG-ready + depth" split.
 */
export function generatePlan(weeks: number): PlanWeek[] {
  const dsaTopics = topicsForTrack('dsa');
  const dsaWeeks = Math.max(1, Math.round(weeks * 0.75));
  const perWeek = dsaTopics.length / dsaWeeks;
  const phaseBoundary = Math.max(1, Math.round(weeks * 0.38));

  const phase1Focus = ['design', 'lld', 'design', 'behavioral'];
  const phase2Focus = ['fundamentals', 'design', 'fundamentals', 'behavioral'];

  const out: PlanWeek[] = [];
  for (let w = 0; w < weeks; w++) {
    const phase: 1 | 2 = w < phaseBoundary ? 1 : 2;
    const start = Math.floor(w * perWeek);
    const end = Math.floor((w + 1) * perWeek);
    const dsa = w < dsaWeeks ? dsaTopics.slice(start, end).map((t) => t.title) : [];
    if (w >= dsaWeeks || dsa.length === 0) dsa.push('Spaced repetition · mixed mediums/hards');

    const focusTrackId = (phase === 1 ? phase1Focus : phase2Focus)[w % 4];
    out.push({
      week: w + 1,
      phase,
      dsa,
      focusTrackId,
      focusTitle: track(focusTrackId)?.title ?? focusTrackId,
    });
  }
  return out;
}
