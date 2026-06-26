import type { Problem, Topic, Template } from '../../src/types';
import { read, slugify, clean, difficulty, splitLabeledFields, stripLeadConnective, leetcodeUrl } from './util';
import { parseCurriculum, normalizeTitle } from './curriculum';

const TRACK_ID = 'dsa';

interface DsaResult {
  topics: Topic[];
  problems: Problem[];
}

/**
 * Parse content/dsa-detailed.md into topics + problems.
 *
 * Structure assumptions (verified against the source):
 *  - Each top-level topic is a `## N. Title` heading (N = 0..20). `### N.x` subsections
 *    roll up into their parent topic.
 *  - `**Core idea.**` / `**Recognition signals.**` paragraphs give topic metadata.
 *  - Fenced ```csharp blocks are templates; their label is the nearest preceding
 *    bold-only line (e.g. `**Template — merge:**`).
 *  - Problems are bullets: `- <tags> **[E|M|H] Title** (opt paren) — *Insight:* … *Approach:* …`
 *    ⭐ marks core, 🔁 marks revisit/spaced-repeat.
 */
export function parseDsa(): DsaResult {
  const md = read('dsa-detailed.md');
  const lines = md.split(/\r?\n/);
  const { topicMeta } = parseCurriculum();

  const topics: Topic[] = [];
  const problems: Problem[] = [];

  let topic: Topic | null = null;
  let order = 0;
  let pendingLabel = ''; // last bold-only line, candidate template label
  let inFence = false;
  let fenceLang = '';
  let fenceLabel = '';
  let fenceBuf: string[] = [];

  const finishTopic = () => {
    if (topic) {
      // enrich from curriculum
      const meta = topicMeta[normalizeTitle(topic.title)];
      if (meta?.masteryBar) topic.masteryBar = meta.masteryBar;
      if (!topic.coreIdea && meta?.coreIdea) topic.coreIdea = meta.coreIdea;
      topics.push(topic);
    }
  };

  for (const raw of lines) {
    const line = raw; // keep indentation for fences

    // fenced code blocks
    const fence = line.match(/^```(\w+)?\s*$/);
    if (fence) {
      if (!inFence) {
        inFence = true;
        fenceLang = fence[1] ?? 'text';
        fenceLabel = pendingLabel || 'Template';
        fenceBuf = [];
      } else {
        // closing fence
        inFence = false;
        if (topic) {
          const tmpl: Template = {
            label: fenceLabel,
            code: fenceBuf.join('\n').replace(/\s+$/, ''),
            lang: fenceLang,
          };
          topic.templates.push(tmpl);
        }
      }
      continue;
    }
    if (inFence) {
      fenceBuf.push(line);
      continue;
    }

    // top-level topic heading
    const h2 = line.match(/^##\s+(\d+)\.\s+(.+?)\s*$/);
    if (h2) {
      finishTopic();
      const title = clean(h2[2]);
      topic = {
        id: slugify(title),
        trackId: TRACK_ID,
        order: order++,
        title,
        itemKind: 'problem',
        coreIdea: undefined,
        recognitionSignals: [],
        masteryBar: undefined,
        templates: [],
        problemIds: [],
        conceptIds: [],
        storyIds: [],
      };
      pendingLabel = '';
      continue;
    }

    if (!topic) continue;

    // bold-only line => candidate template label (e.g. "**Template — merge:**")
    const boldOnly = line.match(/^\s*\*\*(.+?)\*\*\s*$/);
    if (boldOnly) {
      pendingLabel = clean(boldOnly[1]).replace(/:$/, '');
      continue;
    }

    // core idea / recognition signals
    const core = line.match(/^\s*\*\*Core idea\.?\*\*\.?\s*(.+)$/i);
    if (core && !topic.coreIdea) {
      topic.coreIdea = clean(core[1]);
      continue;
    }
    const rec = line.match(/^\s*\*\*Recognition signals\.?\*\*\.?\s*(.+)$/i);
    if (rec) {
      topic.recognitionSignals = clean(rec[1])
        .split(/[;.]\s+/)
        .map((s) => s.replace(/\.$/, '').trim())
        .filter(Boolean);
      continue;
    }

    // problem bullet
    const prob = line.match(/^-\s+(.*?)\*\*\[([EMH])\]\s+(.+?)\*\*(.*)$/);
    if (prob) {
      const tags = prob[1];
      const diff = difficulty(prob[2]);
      const title = clean(prob[3]);
      const remainder = prob[4];
      const { paren, rest } = stripLeadConnective(remainder);
      const { lead, fields } = splitLabeledFields(rest);

      const fullTitle = paren ? `${title} (${paren})` : title;
      const approachParts = [fields['approach'], fields['state'], fields['transition']]
        .filter(Boolean)
        .join(' ');

      const id = slugify(`${topic.id}-${title}`);
      const problem: Problem = {
        id,
        trackId: TRACK_ID,
        topicId: topic.id,
        title: fullTitle,
        difficulty: diff,
        core: tags.includes('⭐'),
        revisit: tags.includes('🔁'),
        insight: fields['insight'] || undefined,
        approach: approachParts || undefined,
        complexity: fields['complexity'] || undefined,
        watch: fields['watch'] || undefined,
        note: lead || undefined,
        url: leetcodeUrl(title),
        source: 'original',
      };
      problems.push(problem);
      topic.problemIds.push(id);
      pendingLabel = '';
      continue;
    }
  }

  finishTopic();
  return { topics, problems };
}
