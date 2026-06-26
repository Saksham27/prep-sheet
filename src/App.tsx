import { useState } from 'react';
import { tracks, topicsForTrack, topic as getTopic } from './lib/content';
import Sidebar from './components/Sidebar';
import ProgressHeader from './components/ProgressHeader';
import TopicView from './components/TopicView';

export default function App() {
  const firstTopic = tracks.length ? topicsForTrack(tracks[0].id)[0]?.id ?? null : null;
  const [selected, setSelected] = useState<string | null>(firstTopic);

  const current = selected ? getTopic(selected) : undefined;

  return (
    <div className="flex h-full">
      <Sidebar selected={selected} onSelect={setSelected} />
      <main className="flex min-w-0 flex-1 flex-col">
        <ProgressHeader />
        <div className="flex-1 overflow-y-auto">
          {current ? (
            <TopicView topic={current} />
          ) : (
            <div className="p-10 text-muted">Select a topic to begin.</div>
          )}
        </div>
      </main>
    </div>
  );
}
