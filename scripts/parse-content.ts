/**
 * parse-content.ts — converts the source markdown in /content into a single typed
 * JSON bundle at src/data/content.json. Re-runnable: it only rewrites content, never
 * progress (progress lives in localStorage keyed by the stable ids produced here).
 *
 * Run with: npm run parse
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { ContentBundle, Track, Topic, Problem, Concept, Story } from '../src/types';
import { parseDsa } from './parsers/dsa';
import { parseConceptFile } from './parsers/concepts';
import { parseBehavioral } from './parsers/behavioral';
import { parseCurriculum } from './parsers/curriculum';
import { parseAllSolutions } from './parsers/solutions';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'src', 'data');

function build(): ContentBundle {
  const topics: Record<string, Topic> = {};
  const problems: Record<string, Problem> = {};
  const concepts: Record<string, Concept> = {};
  const stories: Record<string, Story> = {};
  const tracks: Track[] = [];

  // --- Track 1: DSA ---
  const dsa = parseDsa();
  for (const t of dsa.topics) topics[t.id] = t;
  for (const p of dsa.problems) problems[p.id] = p;
  tracks.push({
    id: 'dsa',
    title: 'DSA — the coding gate',
    order: 0,
    kind: 'dsa',
    blurb: 'Every pattern with a reusable C# template; every problem dissected into Insight / Approach / Complexity / Watch.',
    topicIds: dsa.topics.map((t) => t.id),
  });

  // --- Track 2: System Design (HLD) ---
  const design = parseConceptFile({
    file: 'part2-system-design.md',
    trackId: 'design',
    topicLevel: 2,
    conceptLevel: 3,
  });
  for (const t of design.topics) topics[t.id] = t;
  for (const c of design.concepts) concepts[c.id] = c;
  tracks.push({
    id: 'design',
    title: 'System Design (HLD)',
    order: 1,
    kind: 'design',
    blurb: 'Estimation, the building blocks in depth, the interview framework, and fully worked designs.',
    topicIds: design.topics.map((t) => t.id),
  });

  // --- Track 3: LLD / OOD ---
  const lld = parseConceptFile({
    file: 'part4-lld-ood.md',
    trackId: 'lld',
    topicLevel: 1,
    conceptLevel: 2,
  });
  for (const t of lld.topics) topics[t.id] = t;
  for (const c of lld.concepts) concepts[c.id] = c;
  tracks.push({
    id: 'lld',
    title: 'LLD / OOD',
    order: 2,
    kind: 'lld',
    blurb: 'OOP judgment, SOLID as spot-the-violation drills, the patterns that actually appear, worked designs.',
    topicIds: lld.topics.map((t) => t.id),
  });

  // --- Track 4: CS Fundamentals ---
  const fund = parseConceptFile({
    file: 'part3-cs-fundamentals.md',
    trackId: 'fundamentals',
    topicLevel: 1,
    conceptLevel: 2,
  });
  for (const t of fund.topics) topics[t.id] = t;
  for (const c of fund.concepts) concepts[c.id] = c;
  tracks.push({
    id: 'fundamentals',
    title: 'CS Fundamentals',
    order: 3,
    kind: 'fundamentals',
    blurb: 'OS/concurrency, networking, DB internals, distributed systems, .NET/CLR — every PROBE answered.',
    topicIds: fund.topics.map((t) => t.id),
  });

  // --- Track 5: Behavioral ---
  const beh = parseBehavioral();
  for (const t of beh.topics) topics[t.id] = t;
  for (const c of beh.concepts) concepts[c.id] = c;
  for (const s of beh.stories) stories[s.id] = s;
  tracks.push({
    id: 'behavioral',
    title: 'Behavioral & Seniority',
    order: 4,
    kind: 'behavioral',
    blurb: 'STAR story bank (fill the [brackets] with your real numbers) + the framework and delivery mechanics.',
    topicIds: beh.topics.map((t) => t.id),
  });

  // --- Merge generated DSA solutions (kept in /content/generated, originals pristine) ---
  const solutions = parseAllSolutions();
  let merged = 0;
  const orphans: string[] = [];
  for (const [id, body] of Object.entries(solutions)) {
    const p = problems[id];
    if (!p) {
      orphans.push(id);
      continue;
    }
    p.solution = body;
    p.needsReview = true; // every AI-added solution must be verified
    merged++;
  }
  if (orphans.length) {
    console.warn(`⚠ ${orphans.length} solution id(s) matched no problem:`, orphans.join(', '));
  }
  (globalThis as any).__solMerged = merged;

  const { allocation } = parseCurriculum();

  return {
    generatedAt: new Date().toISOString(),
    tracks,
    topics,
    problems,
    concepts,
    stories,
    allocation,
    stats: {
      problems: Object.keys(problems).length,
      concepts: Object.keys(concepts).length,
      stories: Object.keys(stories).length,
    },
  };
}

function main() {
  const bundle = build();
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(resolve(OUT_DIR, 'content.json'), JSON.stringify(bundle, null, 2), 'utf8');

  console.log('Parsed content bundle:');
  console.log(`  tracks:   ${bundle.tracks.length}`);
  console.log(`  topics:   ${Object.keys(bundle.topics).length}`);
  console.log(`  problems: ${bundle.stats.problems}`);
  console.log(`  concepts: ${bundle.stats.concepts}`);
  console.log(`  stories:  ${bundle.stats.stories}`);
  console.log(`  allocation rows: ${bundle.allocation.length}`);
  const sols = Object.values(bundle.problems).filter((p) => p.solution).length;
  console.log(`  solutions merged: ${sols}/${bundle.stats.problems}`);
  console.log(`→ src/data/content.json`);
}

main();
