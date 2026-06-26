import type { Topic, Concept, Story } from '../../src/types';
import { read, slugify, clean, findPlaceholders } from './util';

const TRACK_ID = 'behavioral';

interface Result {
  topics: Topic[];
  concepts: Concept[];
  stories: Story[];
}

/**
 * Parse part5-behavioral.md into:
 *  - a "Story bank" topic of STAR stories (`## Story N — Title`), with [bracketed]
 *    placeholders surfaced so the UI can render them as editable fields, and
 *  - a "Framework & delivery" topic of read-only concept cards (the `# N` sections).
 */
export function parseBehavioral(): Result {
  const md = read('part5-behavioral.md');
  const lines = md.split(/\r?\n/);

  const storyTopic: Topic = {
    id: 'behavioral-story-bank',
    trackId: TRACK_ID,
    order: 0,
    title: 'Story bank (STAR)',
    itemKind: 'story',
    recognitionSignals: [],
    templates: [],
    problemIds: [],
    conceptIds: [],
    storyIds: [],
  };
  const frameworkTopic: Topic = {
    id: 'behavioral-framework',
    trackId: TRACK_ID,
    order: 1,
    title: 'Framework & delivery',
    itemKind: 'concept',
    recognitionSignals: [],
    templates: [],
    problemIds: [],
    conceptIds: [],
    storyIds: [],
  };

  const stories: Story[] = [];
  const concepts: Concept[] = [];

  let inStoryBank = false;
  let story: Story | null = null;
  let storyBuf: string[] = [];

  let fwTitle = '';
  let fwSection = '';
  let fwBuf: string[] = [];
  let collectingFw = false;
  let storyOrder = 0;
  let conceptOrder = 0;

  const flushStory = () => {
    if (!story) return;
    const raw = storyBuf.join('\n');
    story.placeholders = findPlaceholders(raw);
    // if no STAR fields were captured, treat the whole block as guidance body
    if (!story.situation && !story.task && !story.action && !story.result) {
      story.body = clean(raw.replace(/^\s*>\s?/gm, '')) || undefined;
    }
    stories.push(story);
    storyTopic.storyIds.push(story.id);
    story = null;
    storyBuf = [];
  };

  const flushFw = () => {
    if (!collectingFw) return;
    const body = fwBuf.join('\n').trim();
    fwBuf = [];
    collectingFw = false;
    if (!body || body.replace(/\s/g, '').length < 12) return;
    const id = slugify(`fw-${fwSection || fwTitle}-${conceptOrder}`);
    concepts.push({
      id,
      trackId: TRACK_ID,
      topicId: frameworkTopic.id,
      section: fwSection,
      title: fwTitle,
      body,
      probes: [],
      followups: [],
      source: 'original',
    });
    frameworkTopic.conceptIds.push(id);
    conceptOrder++;
  };

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+?)\s*$/);
    const h2 = line.match(/^##\s+(.+?)\s*$/);

    if (h1) {
      const text = clean(h1[1]);
      if (/^part\s+\d/i.test(text)) continue; // doc title
      flushStory();
      flushFw();
      if (/your story bank/i.test(text)) {
        inStoryBank = true;
        continue;
      }
      inStoryBank = false;
      // start a framework concept section
      const m = text.match(/^(\d+)\.?\s*(.+)$/);
      fwSection = m ? m[1] : '';
      fwTitle = m ? clean(m[2]) : text;
      collectingFw = true;
      continue;
    }

    if (h2 && inStoryBank) {
      const sm = line.match(/^##\s+Story\s+(\d+)\s*[—-]\s*(.+?)\s*$/i);
      if (sm) {
        flushStory();
        story = {
          id: slugify(`story-${sm[1]}-${sm[2]}`),
          trackId: TRACK_ID,
          topicId: storyTopic.id,
          order: storyOrder++,
          title: clean(sm[2]).replace(/^\*+|\*+$/g, '').trim(),
          signals: [],
          placeholders: [],
          source: 'original',
        };
        storyBuf = [];
        continue;
      }
    }

    if (story) {
      storyBuf.push(line);
      // signals line
      const sig = line.match(/^\s*\*Signals?:\s*(.+?)\*\s*$/i);
      if (sig) {
        story.signals = clean(sig[1])
          .split(/\s*[·,]\s*/)
          .map((s) => s.trim())
          .filter(Boolean);
        continue;
      }
      // STAR bullets: - **S:** ... (and **S/T/A/R** variants)
      const star = line.match(/^\s*-\s*\*\*([STAR])(?:\s*[—-][^:]*)?:\*\*\s*(.+)$/);
      if (star) {
        const val = clean(star[2]);
        if (star[1] === 'S') story.situation = val;
        else if (star[1] === 'T') story.task = val;
        else if (star[1] === 'A') story.action = val;
        else if (star[1] === 'R') story.result = val;
      }
      continue;
    }

    if (collectingFw) fwBuf.push(line);
  }
  flushStory();
  flushFw();

  const topics = [storyTopic, frameworkTopic].filter((t) => t.storyIds.length || t.conceptIds.length);
  return { topics, concepts, stories };
}
