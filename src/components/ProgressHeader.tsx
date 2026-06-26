import { allProblems } from '../lib/content';
import { useProgress } from '../store/progress';

export default function ProgressHeader() {
  const items = useProgress((s) => s.items);
  const streak = useProgress((s) => s.streak);

  const probs = allProblems();
  const total = probs.length;
  const by = (s: string) => probs.filter((p) => items[p.id]?.status === s).length;
  const cold = by('cold');
  const solved = by('solved');
  const read = by('read');
  const starred = probs.filter((p) => items[p.id]?.starred).length;
  const pct = total ? Math.round((cold / total) * 100) : 0;

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg/90 px-5 py-2.5 backdrop-blur">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text">{pct}% cold</span>
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-panel2">
            <div className="h-full rounded-full bg-cold transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <Stat label="cold" value={cold} cls="text-cold" />
        <Stat label="solved" value={solved} cls="text-good" />
        <Stat label="read" value={read} cls="text-accent" />
        <Stat label="starred" value={starred} cls="text-warn" />
        <Stat label="total" value={total} cls="text-muted" />
        <div className="ml-auto flex items-center gap-1 text-sm">
          <span title="day streak">🔥</span>
          <span className="font-semibold text-text">{streak.count}</span>
          <span className="text-muted">day streak</span>
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className="flex items-baseline gap-1 text-sm">
      <span className={`font-semibold ${cls}`}>{value}</span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}
