import BackupControls from './BackupControls';

export type View = 'browse' | 'due' | 'dashboard' | 'plan';

const TABS: { v: View; label: string }[] = [
  { v: 'browse', label: 'Browse' },
  { v: 'due', label: 'Due today' },
  { v: 'dashboard', label: 'Dashboard' },
  { v: 'plan', label: 'Daily plan' },
];

interface Props {
  view: View;
  onView: (v: View) => void;
  query: string;
  onQuery: (q: string) => void;
}

export default function TopNav({ view, onView, query, onQuery }: Props) {
  return (
    <div className="flex items-center gap-4 border-b border-border bg-panel px-4 py-2">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-semibold text-text">Mastery Sheet</span>
        <span className="hidden text-xs text-muted sm:inline">interview-prep · local</span>
      </div>
      <nav className="flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.v}
            onClick={() => onView(t.v)}
            className={`rounded-md px-2.5 py-1 text-sm transition ${
              view === t.v && !query ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-panel2 hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <BackupControls />
        <div className="flex items-center">
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search all content…"
            className="w-44 rounded-md border border-border bg-bg px-2.5 py-1 text-sm text-text outline-none transition focus:w-64 focus:border-accent"
          />
          {query && (
            <button onClick={() => onQuery('')} className="ml-1 text-muted hover:text-text" title="clear search">
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
