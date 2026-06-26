import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { CONTENT_DIR, slugify, clean, difficulty } from './util';
import type { Track, Topic, Concept, Problem, ProbeQA, TrackKind } from '../../src/types';

const GEN_DIR = resolve(CONTENT_DIR, 'generated');

function readGen(pattern: RegExp): string[] {
  if (!existsSync(GEN_DIR)) return [];
  return readdirSync(GEN_DIR)
    .filter((f) => pattern.test(f))
    .sort()
    .map((f) => readFileSync(resolve(GEN_DIR, f), 'utf8'));
}

// ── Follow-up probes (step 3) ────────────────────────────────────────────────
// Files: content/generated/*-followups.md
//   ### concept: <existingConceptId>
//   #### Q: <question>
//   <answer markdown…>
export function parseFollowups(): Record<string, ProbeQA[]> {
  const out: Record<string, ProbeQA[]> = {};
  for (const text of readGen(/followups\.md$/)) {
    const lines = text.split(/\r?\n/);
    let id: string | null = null;
    let q: string | null = null;
    let buf: string[] = [];
    const flushQ = () => {
      if (id && q) (out[id] ??= []).push({ question: q, answer: buf.join('\n').trim() });
      q = null;
      buf = [];
    };
    for (const line of lines) {
      const cm = line.match(/^###\s+concept:\s*([a-z0-9-]+)\s*$/i);
      if (cm) {
        flushQ();
        id = cm[1];
        continue;
      }
      const qm = line.match(/^####\s+Q:\s*(.+)$/i);
      if (qm) {
        flushQ();
        q = clean(qm[1]);
        continue;
      }
      if (q) buf.push(line);
    }
    flushQ();
  }
  return out;
}

// ── Generated topics/tracks/concepts (step 4 + new tech track) ────────────────
// Files: content/generated/*-concepts.md
//   @track id=tech | title=… | kind=fundamentals | order=5 | blurb=…
//   @topic id=tech-rabbitmq | track=tech | title=RabbitMQ
//   ### concept: <Title>
//   <body markdown, incl ```code```>
//   #### probe: <question>
//   <answer markdown…>
export interface GeneratedContent {
  tracks: Track[];
  topics: Topic[];
  concepts: Concept[];
  problems: Problem[];
}

function parseDirective(line: string): Record<string, string> {
  const body = line.replace(/^@\w+\s*/, '');
  const out: Record<string, string> = {};
  for (const part of body.split('|')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    out[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }
  return out;
}

export function parseGeneratedConcepts(): GeneratedContent {
  const tracks: Track[] = [];
  const topics: Topic[] = [];
  const concepts: Concept[] = [];
  const problems: Problem[] = [];

  for (const text of readGen(/concepts.*\.md$/)) {
    const lines = text.split(/\r?\n/);
    let topic: Topic | null = null;
    let concept: Concept | null = null;
    let problem: Problem | null = null; // exercise-style problem (prompt + hidden solution)
    let body: string[] = []; // concept body OR exercise prompt
    let solBuf: string[] = []; // exercise solution
    let inSolution = false;
    let probeQ: string | null = null;
    let probeBuf: string[] = [];
    let idx = 0;

    const flushProbe = () => {
      if (concept && probeQ) concept.probes.push({ question: probeQ, answer: probeBuf.join('\n').trim() });
      probeQ = null;
      probeBuf = [];
    };
    const flushItem = () => {
      flushProbe();
      if (concept) {
        concept.body = body.join('\n').trim();
        concepts.push(concept);
        topic?.conceptIds.push(concept.id);
      }
      if (problem) {
        problem.prompt = body.join('\n').trim();
        problem.solution = solBuf.join('\n').trim() || undefined;
        problems.push(problem);
        topic?.problemIds.push(problem.id);
      }
      concept = null;
      problem = null;
      body = [];
      solBuf = [];
      inSolution = false;
    };

    for (const line of lines) {
      if (line.startsWith('@track')) {
        flushItem();
        const d = parseDirective(line);
        tracks.push({
          id: d.id,
          title: d.title,
          order: Number(d.order ?? 99),
          kind: (d.kind as TrackKind) ?? 'fundamentals',
          blurb: d.blurb,
          topicIds: [],
        });
        continue;
      }
      if (line.startsWith('@topic')) {
        flushItem();
        const d = parseDirective(line);
        const id = d.id ?? slugify(`${d.track}-${d.title}`);
        topic = {
          id,
          trackId: d.track,
          order: Number(d.order ?? 0),
          title: d.title,
          itemKind: d.kind === 'problem' ? 'problem' : 'concept',
          recognitionSignals: [],
          templates: [],
          problemIds: [],
          conceptIds: [],
          storyIds: [],
        };
        topics.push(topic);
        idx = 0;
        const tr = tracks.find((t) => t.id === d.track);
        if (tr && !tr.topicIds.includes(id)) tr.topicIds.push(id);
        continue;
      }
      const cm = line.match(/^###\s+concept:\s*(.+)$/i);
      if (cm && topic) {
        flushItem();
        const title = clean(cm[1]);
        concept = {
          id: slugify(`${topic.id}-${title}-${idx++}`),
          trackId: topic.trackId,
          topicId: topic.id,
          section: '',
          title,
          body: '',
          probes: [],
          followups: [],
          source: 'generated',
          needsReview: true,
        };
        continue;
      }
      const em = line.match(/^###\s+exercise:\s*(?:\[([EMH])\]\s*)?(.+)$/i);
      if (em && topic) {
        flushItem();
        const title = clean(em[2]);
        problem = {
          id: slugify(`${topic.id}-${title}-${idx++}`),
          trackId: topic.trackId,
          topicId: topic.id,
          title,
          difficulty: difficulty(em[1] ?? 'M'),
          core: false,
          revisit: false,
          source: 'generated',
          needsReview: true,
        };
        continue;
      }
      const sm = line.match(/^####\s+solution:\s*$/i);
      if (sm && problem) {
        inSolution = true;
        continue;
      }
      const pm = line.match(/^####\s+probe:\s*(.+)$/i);
      if (pm && concept) {
        flushProbe();
        probeQ = clean(pm[1]);
        continue;
      }
      if (probeQ) {
        probeBuf.push(line);
        continue;
      }
      if (inSolution) {
        solBuf.push(line);
        continue;
      }
      if (concept || problem) body.push(line);
    }
    flushItem();
  }
  return { tracks, topics, concepts, problems };
}
