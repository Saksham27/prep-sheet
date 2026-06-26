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

export default function App() {
  const firstTopic = tracks.length ? topicsForTrack(tracks[0].id)[0]?.id ?? null : null;
  const [selected, setSelected] = useState<string | null>(firstTopic);
  const [view, setView] = useState<View>('browse');
  const [query, setQuery] = useState('');

  const openTopic = (id: string) => {
    setSelected(id);
    setView('browse');
    setQuery('');
  };

  const current = selected ? getTopic(selected) : undefined;
  const searching = query.trim().length >= 2;

  return (
    <div className="flex h-full flex-col">
      <TopNav view={view} onView={setView} query={query} onQuery={setQuery} />
      <div className="flex min-h-0 flex-1">
        <Sidebar selected={selected} onSelect={openTopic} />
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
      </div>
    </div>
  );
}
