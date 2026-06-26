import { readFileSync, existsSync, readdirSync } from 'node:fs';
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
 */
function parseOne(path: string): Record<string, string> {
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

/** Merge every `*.md` solutions file under content/generated into one id → solution map. */
export function parseAllSolutions(): Record<string, string> {
  const dir = resolve(CONTENT_DIR, 'generated');
  if (!existsSync(dir)) return {};
  const out: Record<string, string> = {};
  for (const f of readdirSync(dir).sort()) {
    if (!f.endsWith('.md')) continue;
    Object.assign(out, parseOne(resolve(dir, f)));
  }
  return out;
}
