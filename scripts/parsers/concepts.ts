import type { Topic, Concept, ProbeQA } from '../../src/types';
import { read, slugify, clean } from './util';

interface FileOpts {
  file: string;
  trackId: string;
  topicLevel: number; // heading level (#count) that starts a topic
  conceptLevel: number; // heading level that starts a concept
}

interface ParsedFile {
  topics: Topic[];
  concepts: Concept[];
}

const headingRe = /^(#{1,6})\s+(.+?)\s*$/;
const numbered = (t: string) => /^\d/.test(t.trim());
const sectionOf = (t: string) => {
  const m = t.match(/^([\dA-Z](?:\.\d+)*)[.\s—-]/);
  return m ? m[1] : '';
};
const titleOf = (t: string) => clean(t.replace(/^([\dA-Z](?:\.\d+)*)[.\s]+/, '').replace(/^[—-]\s*/, ''));

/**
 * Extract PROBE Q&A from a concept's raw lines. Handles both source styles:
 *   `**PROBE: question?** inline answer…`         (answer continues until a blank line)
 *   `**PROBE: question?**` then a `> blockquote`   (multi-line quoted answer)
 * Returns the cleaned body (probes removed) and the extracted probes.
 */
function extractProbes(lines: string[]): { body: string; probes: ProbeQA[] } {
  const probes: ProbeQA[] = [];
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(/^\s*\*\*PROBE:?\s*(.+?)\*\*\s*(.*)$/i);
    if (!m) {
      out.push(lines[i]);
      i++;
      continue;
    }
    const question = clean(m[1]).replace(/\*+$/, '');
    let answer = '';
    const inline = m[2]?.trim() ?? '';
    i++;
    if (inline) {
      const buf = [inline];
      while (i < lines.length && lines[i].trim() && !/^\s*>/.test(lines[i]) && !headingRe.test(lines[i])) {
        buf.push(lines[i].trim());
        i++;
      }
      answer = buf.join(' ');
    } else {
      // skip blank lines, then collect the blockquote
      while (i < lines.length && !lines[i].trim()) i++;
      const buf: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      answer = buf.join('\n').trim();
    }
    probes.push({ question, answer });
  }
  return { body: out.join('\n').trim(), probes };
}

export function parseConceptFile(opts: FileOpts): ParsedFile {
  const md = read(opts.file);
  const lines = md.split(/\r?\n/);

  const topics: Topic[] = [];
  const concepts: Concept[] = [];
  let topicOrder = 0;
  let conceptOrder = 0;

  let topic: Topic | null = null;
  let conceptTitle = '';
  let conceptSection = '';
  let conceptBuf: string[] = [];
  let collecting = false; // are we inside a topic accumulating concept body?

  const flushConcept = () => {
    if (!topic || !collecting) return;
    const raw = conceptBuf.join('\n').trim();
    conceptBuf = [];
    collecting = false;
    if (!raw && !conceptTitle) return;
    if (!raw && raw.length < 20) {
      // empty overview — skip
      if (!conceptTitle) return;
    }
    if (raw.replace(/\s/g, '').length < 12 && /overview$/i.test(conceptTitle)) return;
    const { body, probes } = extractProbes(raw.split('\n'));
    const id = slugify(`${topic.id}-${conceptSection || conceptTitle}-${conceptOrder}`);
    const concept: Concept = {
      id,
      trackId: opts.trackId,
      topicId: topic.id,
      section: conceptSection,
      title: conceptTitle,
      body,
      probes,
      followups: [],
      source: 'original',
    };
    concepts.push(concept);
    topic.conceptIds.push(id);
    conceptOrder++;
  };

  const startConcept = (title: string, section: string) => {
    flushConcept();
    conceptTitle = title;
    conceptSection = section;
    conceptBuf = [];
    collecting = true;
  };

  for (const line of lines) {
    const h = line.match(headingRe);
    if (h) {
      const level = h[1].length;
      const text = clean(h[2]);

      // doc title (e.g. "# Part 3 — …") or trailing "**Part N complete**" — ignore as structure
      if (level === 1 && /^part\s+\d/i.test(text)) continue;

      if (level === opts.topicLevel && numbered(text)) {
        flushConcept();
        const title = titleOf(text);
        topic = {
          id: slugify(`${opts.trackId}-${sectionOf(text)}-${title}`),
          trackId: opts.trackId,
          order: topicOrder++,
          title,
          itemKind: 'concept',
          recognitionSignals: [],
          templates: [],
          problemIds: [],
          conceptIds: [],
          storyIds: [],
        };
        topics.push(topic);
        // open an overview concept to gather body before the first sub-concept
        startConcept(`${title} — overview`, sectionOf(text));
        continue;
      }

      if (topic && level === opts.conceptLevel) {
        startConcept(titleOf(text), sectionOf(text));
        continue;
      }

      // deeper sub-heading inside a concept: keep as body markdown so it renders
      if (topic && collecting) conceptBuf.push(line);
      continue;
    }

    if (line.trim() === '---') {
      continue;
    }
    if (topic && collecting) conceptBuf.push(line);
  }
  flushConcept();

  return { topics, concepts };
}
