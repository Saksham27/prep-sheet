import bundle from '../data/content.json';
import type { ContentBundle, Problem, Topic, Track, Concept, Story } from '../types';

export const content = bundle as unknown as ContentBundle;

export const tracks: Track[] = [...content.tracks].sort((a, b) => a.order - b.order);

export function track(id: string): Track | undefined {
  return content.tracks.find((t) => t.id === id);
}

export function topic(id: string): Topic | undefined {
  return content.topics[id];
}

export function problem(id: string): Problem | undefined {
  return content.problems[id];
}

export function concept(id: string): Concept | undefined {
  return content.concepts[id];
}

export function story(id: string): Story | undefined {
  return content.stories[id];
}

export function topicsForTrack(trackId: string): Topic[] {
  const t = track(trackId);
  if (!t) return [];
  return t.topicIds
    .map((id) => content.topics[id])
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
}

export function problemsForTopic(topicId: string): Problem[] {
  const t = content.topics[topicId];
  if (!t) return [];
  return t.problemIds.map((id) => content.problems[id]).filter(Boolean);
}

export function conceptsForTopic(topicId: string): Concept[] {
  const t = content.topics[topicId];
  if (!t) return [];
  return t.conceptIds.map((id) => content.concepts[id]).filter(Boolean);
}

export function storiesForTopic(topicId: string): Story[] {
  const t = content.topics[topicId];
  if (!t) return [];
  return t.storyIds.map((id) => content.stories[id]).filter(Boolean);
}

export function allProblems(): Problem[] {
  return Object.values(content.problems);
}

export function allConcepts(): Concept[] {
  return Object.values(content.concepts);
}

export function allStories(): Story[] {
  return Object.values(content.stories);
}

/** Items that count toward a topic's progress denominator. */
export function topicCount(t: Topic): number {
  if (t.itemKind === 'problem') return t.problemIds.length;
  if (t.itemKind === 'concept') return t.conceptIds.length;
  return t.storyIds.length;
}

// ── Full-text search ────────────────────────────────────────────────────────
export interface SearchHit {
  kind: 'problem' | 'concept' | 'story';
  id: string;
  topicId: string;
  trackId: string;
  title: string;
  snippet: string;
}

export function search(query: string): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const hits: SearchHit[] = [];
  const test = (hay: string) => hay.toLowerCase().includes(q);
  const snippet = (text: string) => {
    const i = text.toLowerCase().indexOf(q);
    if (i < 0) return text.slice(0, 120);
    return (i > 30 ? '…' : '') + text.slice(Math.max(0, i - 30), i + 90);
  };

  for (const p of allProblems()) {
    const blob = [p.title, p.insight, p.approach, p.complexity, p.watch, p.note, p.solution]
      .filter(Boolean)
      .join(' ');
    if (test(blob)) hits.push({ kind: 'problem', id: p.id, topicId: p.topicId, trackId: p.trackId, title: p.title, snippet: snippet(blob) });
  }
  for (const c of allConcepts()) {
    const blob = [c.title, c.body, ...c.probes.flatMap((x) => [x.question, x.answer])].filter(Boolean).join(' ');
    if (test(blob)) hits.push({ kind: 'concept', id: c.id, topicId: c.topicId, trackId: c.trackId, title: c.title, snippet: snippet(blob) });
  }
  for (const s of allStories()) {
    const blob = [s.title, s.situation, s.task, s.action, s.result, s.body, s.signals.join(' ')].filter(Boolean).join(' ');
    if (test(blob)) hits.push({ kind: 'story', id: s.id, topicId: s.topicId, trackId: s.trackId, title: s.title, snippet: snippet(blob) });
  }
  return hits.slice(0, 60);
}
