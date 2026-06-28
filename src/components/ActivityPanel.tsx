import { useProgress } from '../store/progress';

const DAY_MS = 86400000;
const iso = (d: Date) => d.toISOString().slice(0, 10);

function buildWeeks(weeks = 26): Date[][] {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end.getTime() - (weeks * 7 - 1) * DAY_MS);
  start.setDate(start.getDate() - start.getDay()); // back to Sunday
  const cols: Date[][] = [];
  let week: Date[] = [];
  for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
    week.push(new Date(t));
    if (week.length === 7) {
      cols.push(week);
      week = [];
    }
  }
  if (week.length) cols.push(week);
  return cols;
}

function cellColor(count: number): string {
  if (count <= 0) return 'rgb(var(--c-panel2))';
  if (count === 1) return 'rgb(var(--c-good) / 0.3)';
  if (count <= 3) return 'rgb(var(--c-good) / 0.5)';
  if (count <= 6) return 'rgb(var(--c-good) / 0.75)';
  return 'rgb(var(--c-good))';
}

export default function ActivityPanel() {
  const activity = useProgress((s) => s.activity);
  const streak = useProgress((s) => s.streak);
  const goal = useProgress((s) => s.dailyGoal);
  const setGoal = useProgress((s) => s.setDailyGoal);

  const today = iso(new Date());
  const todayCount = activity[today] ?? 0;
  const weekStart = new Date(Date.now() - 6 * DAY_MS);
  let thisWeek = 0;
  for (let t = weekStart.getTime(); t <= Date.now(); t += DAY_MS) thisWeek += activity[iso(new Date(t))] ?? 0;
  const goalPct = Math.min(100, Math.round((todayCount / goal) * 100));

  const weeks = buildWeeks(26);

  return (
    <div className="rounded-lg border border-border bg-panel p-4 shadow-card">
      <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-3">
        {/* daily goal ring */}
        <div className="flex items-center gap-3">
          <Ring pct={goalPct} />
          <div>
            <div className="text-sm font-semibold text-text">
              {todayCount}/{goal} today
            </div>
            <div className="flex items-center gap-1 text-xs text-muted">
              daily goal
              <button onClick={() => setGoal(goal - 1)} className="ml-1 rounded border border-border px-1 leading-none hover:text-text">
                −
              </button>
              <button onClick={() => setGoal(goal + 1)} className="rounded border border-border px-1 leading-none hover:text-text">
                +
              </button>
            </div>
          </div>
        </div>
        <Stat value={streak.count} label="🔥 day streak" />
        <Stat value={thisWeek} label="actions this week" />
      </div>

      {/* heatmap */}
      <div className="overflow-x-auto">
        <div className="flex gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((d) => {
                const key = iso(d);
                const c = activity[key] ?? 0;
                const future = d.getTime() > Date.now();
                return (
                  <div
                    key={key}
                    title={`${key}: ${c} action${c === 1 ? '' : 's'}`}
                    className="h-2.5 w-2.5 rounded-[2px]"
                    style={{ background: future ? 'transparent' : cellColor(c) }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1 text-[10px] text-muted">
          <span>less</span>
          {[0, 1, 3, 6, 9].map((n) => (
            <span key={n} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: cellColor(n) }} />
          ))}
          <span>more</span>
          <span className="ml-auto">last 26 weeks</span>
        </div>
      </div>
    </div>
  );
}

function Ring({ pct }: { pct: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
      <circle cx="22" cy="22" r={r} fill="none" stroke="rgb(var(--c-panel2))" strokeWidth="5" />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke="rgb(var(--c-good))"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        style={{ transition: 'stroke-dashoffset 0.4s' }}
      />
    </svg>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-xl font-bold text-text">{value}</span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}
