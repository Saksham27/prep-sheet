import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { CONTENT_DIR } from './util';

/**
 * Parse a generated-solutions markdown file into a map of problemId → solution markdown.
 *
 * Format (keeps your original corpus pristine — these live in /content/generated):
 *
 *   ### id: arrays-and-hashing-two-sum
 *   <markdown: prose + ```csharp fenced solution ```>
 *
 *   ### id: arrays-and-hashing-contains-duplicate
 *   …
 *
 * Everything from one `### id:` marker until the next becomes that problem's solution.
 * The orchestrator merges these onto problems and flags them generated/needs-review.
 */
export function parseSolutions(file: string): Record<string, string> {
  const path = resolve(CONTENT_DIR, 'generated', file);
  if (!existsSync(path)) return {};
  const md = readFileSync(path, 'utf8');
  const lines = md.split(/\r?\n/);

  const out: Record<string, string> = {};
  let id: string | null = null;
  let buf: string[] = [];
  const flush = () => {
    if (id) out[id] = buf.join('\n').trim();
    buf = [];
  };
  for (const line of lines) {
    const m = line.match(/^###\s+id:\s*([a-z0-9-]+)\s*$/i);
    if (m) {
      flush();
      id = m[1].trim();
      continue;
    }
    if (id) buf.push(line);
  }
  flush();
  return out;
}
