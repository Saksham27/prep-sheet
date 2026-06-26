import { tracks, topicsForTrack, problemsForTopic } from '../lib/content';
import { useProgress } from '../store/progress';

interface Props {
  selected: string | null;
  onSelect: (topicId: string) => void;
}

export default function Sidebar({ selected, onSelect }: Props) {
  const items = useProgress((s) => s.items);

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-border bg-panel/50">
      <div className="border-b border-border px-4 py-3">
        <div className="text-sm font-semibold text-text">Mastery Sheet</div>
        <div className="text-xs text-muted">interview-prep · local</div>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {tracks.map((track) => {
          const topics = topicsForTrack(track.id);
          return (
            <div key={track.id} className="mb-2">
              <div className="px-4 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
                {track.title}
              </div>
              <ul>
                {topics.map((t) => {
                  const probs = problemsForTopic(t.id);
                  const cold = probs.filter((p) => items[p.id]?.status === 'cold').length;
                  const active = selected === t.id;
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => onSelect(t.id)}
                        className={`flex w-full items-center justify-between gap-2 px-4 py-1.5 text-left text-sm transition ${
                          active ? 'bg-accent/15 text-accent' : 'text-text/80 hover:bg-panel2'
                        }`}
                      >
                        <span className="truncate">{t.title}</span>
                        <span className="shrink-0 font-mono text-[10px] text-muted">
                          {cold}/{probs.length}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
