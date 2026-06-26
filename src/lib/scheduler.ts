// SM-2-lite spaced-repetition scheduler.
//
// A trimmed SuperMemo-2: each reviewable item carries an ease factor, an interval
// (days), and a repetition count. A review is graded "again | hard | good | easy";
// the next interval and ease are derived from that grade. `🔁` problems and any
// problem brought to "cold" feed this scheduler so they resurface on `nextReview`.

import type { ItemProgress } from '../store/progress';

export type Grade = 'again' | 'hard' | 'good' | 'easy';

const MIN_EASE = 1.3;

export function review(prev: ItemProgress, grade: Grade, now = new Date()): Partial<ItemProgress> {
  let ease = prev.ease ?? 2.5;
  let interval = prev.interval ?? 0;
  let reps = prev.reps ?? 0;

  if (grade === 'again') {
    reps = 0;
    interval = 0; // due again today / tomorrow
    ease = Math.max(MIN_EASE, ease - 0.2);
  } else {
    const q = grade === 'hard' ? -0.15 : grade === 'easy' ? 0.15 : 0;
    ease = Math.max(MIN_EASE, ease + q);
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = grade === 'hard' ? 3 : 6;
    else interval = Math.round(interval * (grade === 'hard' ? ease - 0.15 : ease));
  }

  const next = new Date(now);
  next.setDate(next.getDate() + Math.max(1, interval || (grade === 'again' ? 1 : interval)));

  return {
    ease,
    interval,
    reps,
    lastReviewed: now.toISOString().slice(0, 10),
    nextReview: next.toISOString().slice(0, 10),
  };
}

export function isDue(p: ItemProgress, today = new Date().toISOString().slice(0, 10)): boolean {
  return !!p.nextReview && p.nextReview <= today;
}
