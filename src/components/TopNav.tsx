import BackupControls from './BackupControls';
import SyncControls from './SyncControls';
import ThemePicker from './ThemePicker';

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
  onMenu: () => void;
  notesOpen: boolean;
  onNotes: () => void;
}

export default function TopNav({ view, onView, query, onQuery, onMenu, notesOpen, onNotes }: Props) {
  return (
    <div className="relative z-50 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-panel/95 px-3 py-2 shadow-card backdrop-blur">
      <div className="flex items-center gap-2">
        <button
          onClick={onMenu}
          aria-label="Toggle menu"
          className="rounded-md border border-border p-1.5 text-muted transition hover:text-text md:hidden"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-text">Mastery Sheet</span>
      </div>

      <nav className="flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.v}
            onClick={() => onView(t.v)}
            className={`whitespace-nowrap rounded-md px-2.5 py-1 text-sm transition ${
              view === t.v && !query ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-panel2 hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onNotes}
          title="Topic notes"
          className={`rounded-md border px-2 py-1 text-xs transition ${
            notesOpen ? 'border-accent text-accent' : 'border-border text-muted hover:border-accent hover:text-accent'
          }`}
        >
          📝<span className="hidden sm:inline"> Notes</span>
        </button>
        <ThemePicker />
        <SyncControls />
        <BackupControls />
        <div className="flex items-center">
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search…"
            className="w-28 rounded-md border border-border bg-bg px-2.5 py-1 text-sm text-text outline-none transition focus:w-56 focus:border-accent sm:w-44"
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
