import bundle from '../data/content.json';
import type { ContentBundle, Problem, Topic, Track } from '../types';

export const content = bundle as unknown as ContentBundle;

export const tracks: Track[] = content.tracks;

export function topic(id: string): Topic | undefined {
  return content.topics[id];
}

export function problem(id: string): Problem | undefined {
  return content.problems[id];
}

export function topicsForTrack(trackId: string): Topic[] {
  const t = content.tracks.find((x) => x.id === trackId);
  if (!t) return [];
  return t.topicIds.map((id) => content.topics[id]).filter(Boolean).sort((a, b) => a.order - b.order);
}

export function problemsForTopic(topicId: string): Problem[] {
  const t = content.topics[topicId];
  if (!t) return [];
  return t.problemIds.map((id) => content.problems[id]).filter(Boolean);
}

export function allProblems(): Problem[] {
  return Object.values(content.problems);
}
