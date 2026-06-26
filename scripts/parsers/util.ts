import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const CONTENT_DIR = resolve(__dirname, '..', '..', 'content');

export function read(file: string): string {
  return readFileSync(resolve(CONTENT_DIR, file), 'utf8');
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[''’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Collapse whitespace and trim. */
export function clean(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

const DIFFICULTY: Record<string, 'Easy' | 'Medium' | 'Hard'> = {
  E: 'Easy',
  M: 'Medium',
  H: 'Hard',
};

export function difficulty(letter: string): 'Easy' | 'Medium' | 'Hard' {
  return DIFFICULTY[letter] ?? 'Medium';
}

/**
 * Split a problem's trailing text into its `*Label:*`-prefixed fields.
 * Returns the lead text (before the first label) plus a map of label→value.
 */
export function splitLabeledFields(text: string): { lead: string; fields: Record<string, string> } {
  const re = /\*([A-Za-z][A-Za-z ]*?):\*/g;
  const marks: { label: string; start: number; valueStart: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    marks.push({ label: m[1].toLowerCase().trim(), start: m.index, valueStart: m.index + m[0].length });
  }
  if (marks.length === 0) return { lead: clean(text), fields: {} };
  const lead = clean(text.slice(0, marks[0].start));
  const fields: Record<string, string> = {};
  for (let i = 0; i < marks.length; i++) {
    const end = i + 1 < marks.length ? marks[i + 1].start : text.length;
    fields[marks[i].label] = clean(text.slice(marks[i].valueStart, end));
  }
  return { lead, fields };
}

/** Strip a leading connective: optional "(parenthetical)" then an em/en dash. */
export function stripLeadConnective(text: string): { paren: string; rest: string } {
  let t = text.trim();
  let paren = '';
  const pm = t.match(/^\(([^)]*)\)\s*/);
  if (pm) {
    paren = pm[1].trim();
    t = t.slice(pm[0].length);
  }
  t = t.replace(/^[\s—–-]+/, '');
  return { paren, rest: t.trim() };
}

/** Best-effort LeetCode URL from a problem title (strip parentheticals, then slugify). */
export function leetcodeUrl(title: string): string {
  const base = title.replace(/\([^)]*\)/g, ' ');
  return `https://leetcode.com/problems/${slugify(base)}/`;
}

/** Find all unique [bracketed] placeholder tokens in a block of text. */
export function findPlaceholders(text: string): string[] {
  const out = new Set<string>();
  const re = /\[([^\]]+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const inner = m[1].trim();
    // ignore markdown links [text](url) and footnote-ish tokens
    if (!inner || /^https?:/.test(inner)) continue;
    if (text[m.index + m[0].length] === '(') continue;
    out.add(inner);
  }
  return [...out];
}
