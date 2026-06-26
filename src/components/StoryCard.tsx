import type { Story } from '../types';
import { useProgress } from '../store/progress';
import InlineMd from './InlineMd';

const STAR: { key: keyof Story; label: string }[] = [
  { key: 'situation', label: 'S' },
  { key: 'task', label: 'T' },
  { key: 'action', label: 'A' },
  { key: 'result', label: 'R' },
];

export default function StoryCard({ story }: { story: Story }) {
  const prog = useProgress((s) => s.items[story.id]);
  const setField = useProgress((s) => s.setField);
  const toggleStar = useProgress((s) => s.toggleStar);
  const toggleCanExplain = useProgress((s) => s.toggleCanExplain);

  const filled = story.placeholders.filter((t) => (prog?.fields?.[t] ?? '').trim()).length;
  const ready = !!prog?.canExplain;

  return (
    <div className="rounded-lg border border-border bg-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted">Story {story.order + 1}</span>
            <h4 className="font-semibold text-text">{story.title}</h4>
          </div>
          {story.signals.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {story.signals.map((s, i) => (
                <span key={i} className="rounded-full bg-panel2 px-2 py-0.5 text-[10px] text-muted">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => toggleStar(story.id)}
          className={`shrink-0 text-lg leading-none transition ${prog?.starred ? 'text-warn' : 'text-border hover:text-muted'}`}
        >
          ★
        </button>
      </div>

      {story.body ? (
        <div className="mt-3 rounded-md border-l-2 border-warn/60 bg-panel2/40 px-3 py-2">
          <InlineMd>{story.body}</InlineMd>
        </div>
      ) : (
        <div className="mt-3 space-y-1.5">
          {STAR.map(({ key, label }) => {
            const val = story[key] as string | undefined;
            if (!val) return null;
            return (
              <div key={label} className="flex gap-2 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent/15 font-mono text-[11px] font-bold text-accent">
                  {label}
                </span>
                <span className="min-w-0 flex-1">
                  <InlineMd className="!text-text/90">{val}</InlineMd>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {story.placeholders.length > 0 && (
        <div className="mt-3 rounded-md border border-border bg-bg/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-xs text-warn">
              fill your real numbers ({filled}/{story.placeholders.length})
            </span>
          </div>
          <div className="space-y-2">
            {story.placeholders.map((token) => (
              <label key={token} className="block">
                <span className="mb-0.5 block text-xs text-muted">{token}</span>
                <input
                  value={prog?.fields?.[token] ?? ''}
                  onChange={(e) => setField(story.id, token, e.target.value)}
                  placeholder="your real value…"
                  className="w-full rounded border border-border bg-bg px-2 py-1 text-sm text-text outline-none focus:border-accent"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3">
        <button
          onClick={() => toggleCanExplain(story.id)}
          className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition ${
            ready ? 'border-good bg-good/15 text-good' : 'border-border text-muted hover:border-muted hover:text-text'
          }`}
        >
          <span className="text-base leading-none">{ready ? '✓' : '○'}</span>
          Can I tell this in ≤2 min, out loud?
        </button>
      </div>
    </div>
  );
}
