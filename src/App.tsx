import { useState } from 'react';
import { tracks, topicsForTrack, topic as getTopic } from './lib/content';
import Sidebar from './components/Sidebar';
import ProgressHeader from './components/ProgressHeader';
import TopicView from './components/TopicView';
import TopNav, { type View } from './components/TopNav';
import Dashboard from './components/Dashboard';
import DueToday from './components/DueToday';
import DailyPlan from './components/DailyPlan';
import SearchResults from './components/SearchResults';
import NotesPanel from './components/NotesPanel';

export default function App() {
  const firstTopic = tracks.length ? topicsForTrack(tracks[0].id)[0]?.id ?? null : null;
  const [selected, setSelected] = useState<string | null>(firstTopic);
  const [view, setView] = useState<View>('browse');
  const [query, setQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [notesOpen, setNotesOpen] = useState(false); // right notes panel

  const openTopic = (id: string) => {
    setSelected(id);
    setView('browse');
    setQuery('');
    setSidebarOpen(false);
  };

  const current = selected ? getTopic(selected) : undefined;
  const searching = query.trim().length >= 2;

  return (
    <div className="flex h-full flex-col">
      <TopNav
        view={view}
        onView={(v) => {
          setView(v);
          setSidebarOpen(false);
        }}
        query={query}
        onQuery={setQuery}
        onMenu={() => setSidebarOpen((o) => !o)}
        notesOpen={notesOpen}
        onNotes={() => setNotesOpen((o) => !o)}
      />
      <div className="relative flex min-h-0 flex-1">
        {/* mobile backdrop */}
        {sidebarOpen && (
          <div className="absolute inset-0 z-30 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        {/* sidebar: static column on md+, slide-in drawer on mobile */}
        <div
          className={`absolute inset-y-0 left-0 z-40 w-72 border-r border-border bg-panel transition-transform duration-200 md:relative md:z-auto md:translate-x-0 ${
            sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:shadow-none'
          }`}
        >
          <Sidebar selected={selected} onSelect={openTopic} />
        </div>

        <main className="flex min-w-0 flex-1 flex-col">
          {searching ? (
            <div className="flex-1 overflow-y-auto">
              <SearchResults query={query} onOpenTopic={openTopic} />
            </div>
          ) : view === 'browse' ? (
            <>
              <ProgressHeader />
              <div className="flex-1 overflow-y-auto">
                {current ? <TopicView topic={current} /> : <div className="p-10 text-muted">Select a topic.</div>}
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {view === 'dashboard' && <Dashboard onOpenTopic={openTopic} />}
              {view === 'due' && <DueToday onOpenTopic={openTopic} />}
              {view === 'plan' && <DailyPlan />}
            </div>
          )}
        </main>

        {/* right notes panel: column on md+, overlay drawer on mobile */}
        {notesOpen && (
          <>
            <div className="absolute inset-0 z-30 bg-black/60 md:hidden" onClick={() => setNotesOpen(false)} />
            <div className="absolute inset-y-0 right-0 z-40 w-[88%] max-w-md border-l border-border bg-panel shadow-2xl md:relative md:z-auto md:w-[420px] md:max-w-none md:shadow-none">
              <NotesPanel topicId={selected} onClose={() => setNotesOpen(false)} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
