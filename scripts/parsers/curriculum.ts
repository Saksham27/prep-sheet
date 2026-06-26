import type { AllocationRow } from '../../src/types';
import { read, clean } from './util';

/** Per-DSA-topic enrichment pulled from the master curriculum (mastery bar, etc.). */
export interface CurriculumTopicMeta {
  masteryBar?: string;
  coreIdea?: string;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Parse the master curriculum for:
 *  - the time-allocation table (drives the Daily Plan), and
 *  - per-topic mastery bars / core ideas keyed by normalized topic title.
 */
export function parseCurriculum(): {
  allocation: AllocationRow[];
  topicMeta: Record<string, CurriculumTopicMeta>;
} {
  const md = read('mastery-curriculum.md');
  const lines = md.split(/\r?\n/);

  // --- allocation table ---
  const allocation: AllocationRow[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (/\| *Track *\|/i.test(lines[i]) && /Weeks 1/.test(lines[i])) {
      // header found; data rows follow after the separator row
      for (let j = i + 2; j < lines.length; j++) {
        const row = lines[j];
        if (!row.trim().startsWith('|')) break;
        const cells = row.split('|').map((c) => c.trim()).filter(Boolean);
        if (cells.length < 3) continue;
        const p1 = parseInt(cells[1].replace('%', ''), 10);
        const p2 = parseInt(cells[2].replace('%', ''), 10);
        if (Number.isNaN(p1) || Number.isNaN(p2)) continue;
        allocation.push({ track: cells[0], phase1Pct: p1, phase2Pct: p2 });
      }
      break;
    }
  }

  // --- per-topic mastery bar / core idea ---
  const topicMeta: Record<string, CurriculumTopicMeta> = {};
  let current: string | null = null;
  for (const line of lines) {
    const h = line.match(/^##\s+\d+\.\s+(.+?)\s*$/);
    if (h) {
      current = norm(h[1]);
      topicMeta[current] = topicMeta[current] ?? {};
      continue;
    }
    if (!current) continue;
    const mb = line.match(/^\s*-\s*\*\*Mastery bar:\*\*\s*(.+)$/);
    if (mb) topicMeta[current].masteryBar = clean(mb[1]);
    const ci = line.match(/^\s*-\s*\*\*Core idea:\*\*\s*(.+)$/);
    if (ci && !topicMeta[current].coreIdea) topicMeta[current].coreIdea = clean(ci[1]);
  }

  return { allocation, topicMeta };
}

export const normalizeTitle = norm;
