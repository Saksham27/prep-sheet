import { tracks, topicsForTrack, topicCount, dsaProblems } from '../lib/content';
import type { Topic } from '../types';
import { useProgress, type ItemProgress } from '../store/progress';

function doneCount(t: Topic, items: Record<string, ItemProgress>): number {
  if (t.itemKind === 'problem') return t.problemIds.filter((id) => items[id]?.status === 'cold').length;
  if (t.itemKind === 'concept') return t.conceptIds.filter((id) => items[id]?.canExplain).length;
  return t.storyIds.filter((id) => items[id]?.canExplain).length;
}

export default function Dashboard({ onOpenTopic }: { onOpenTopic: (id: string) => void }) {
  const items = useProgress((s) => s.items);
  const streak = useProgress((s) => s.streak);

  const probs = dsaProblems();
  const byStatus = (s: string) => probs.filter((p) => items[p.id]?.status === s).length;
  const cold = byStatus('cold');
  const solved = byStatus('solved');
  const read = byStatus('read');
  const todo = probs.length - cold - solved - read;

  return (
    <div className="mx-auto max-w-5xl px-5 py-6">
      <h2 className="text-xl font-semibold text-text">Dashboard</h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat big={`${probs.length ? Math.round((cold / probs.length) * 100) : 0}%`} label="DSA cold (the real done)" cls="text-cold" />
        <Stat big={`${streak.count}`} label="🔥 day streak" cls="text-warn" />
        <Stat big={`${cold + solved}`} label={`solved+ of ${probs.length}`} cls="text-good" />
        <Stat big={`${probs.filter((p) => items[p.id]?.starred).length}`} label="starred for revision" cls="text-accent" />
      </div>

      {/* status distribution */}
      <div className="mt-4 rounded-lg border border-border bg-panel p-4">
        <div className="mb-2 text-sm font-medium text-text">DSA status distribution</div>
        <div className="flex h-3 overflow-hidden rounded-full bg-panel2">
          <Seg n={cold} total={probs.length} cls="bg-cold" />
          <Seg n={solved} total={probs.length} cls="bg-good" />
          <Seg n={read} total={probs.length} cls="bg-accent" />
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
          <Legend cls="bg-cold" label={`cold ${cold}`} />
          <Legend cls="bg-good" label={`solved ${solved}`} />
          <Legend cls="bg-accent" label={`read ${read}`} />
          <Legend cls="bg-panel2" label={`todo ${todo}`} />
        </div>
      </div>

      {/* per-track + per-topic */}
      <div className="mt-4 space-y-4">
        {tracks.map((tr) => {
          const topics = topicsForTrack(tr.id);
          const total = topics.reduce((a, t) => a + topicCount(t), 0);
          const done = topics.reduce((a, t) => a + doneCount(t, items), 0);
          const pct = total ? Math.round((done / total) * 100) : 0;
          const itemKinds = new Set(topics.map((t) => t.itemKind));
          const unit =
            itemKinds.size === 1 && itemKinds.has('problem')
              ? 'cold'
              : itemKinds.has('story')
                ? 'drill-ready'
                : 'can explain';
          return (
            <div key={tr.id} className="rounded-lg border border-border bg-panel p-4">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="font-medium text-text">{tr.title}</span>
                <span className="text-xs text-muted">
                  {done}/{total} {unit} · {pct}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-panel2">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {topics.map((t) => {
                  const tt = topicCount(t);
                  const td = doneCount(t, items);
                  const tp = tt ? Math.round((td / tt) * 100) : 0;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onOpenTopic(t.id)}
                      className="flex items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-panel2"
                    >
                      <span className="w-44 truncate text-text/80">{t.title}</span>
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-panel2">
                        <div className="h-full bg-good" style={{ width: `${tp}%` }} />
                      </div>
                      <span className="w-10 text-right font-mono text-muted">
                        {td}/{tt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ big, label, cls }: { big: string; label: string; cls: string }) {
  return (
    <div className="rounded-lg border border-border bg-panel p-4">
      <div className={`text-2xl font-bold ${cls}`}>{big}</div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
    </div>
  );
}
function Seg({ n, total, cls }: { n: number; total: number; cls: string }) {
  if (!total || !n) return null;
  return <div className={cls} style={{ width: `${(n / total) * 100}%` }} />;
}
function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-2.5 w-2.5 rounded-sm ${cls}`} />
      {label}
    </span>
  );
}
