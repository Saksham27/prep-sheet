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
import { parseCurriculum } from './parsers/curriculum';

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

  // (depth tracks + behavioral are added in the next milestone)

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
  console.log(`→ src/data/content.json`);
}

main();
