import { tracks, topicsForTrack, topicCount } from '../lib/content';
import type { Topic } from '../types';
import { useProgress } from '../store/progress';
import type { ItemProgress } from '../store/progress';

interface Props {
  selected: string | null;
  onSelect: (topicId: string) => void;
}

function doneCount(t: Topic, items: Record<string, ItemProgress>): number {
  if (t.itemKind === 'problem') return t.problemIds.filter((id) => items[id]?.status === 'cold').length;
  if (t.itemKind === 'concept') return t.conceptIds.filter((id) => items[id]?.canExplain).length;
  return t.storyIds.filter((id) => items[id]?.canExplain).length;
}

export default function Sidebar({ selected, onSelect }: Props) {
  const items = useProgress((s) => s.items);

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-border bg-panel/50">
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
                  const total = topicCount(t);
                  const done = doneCount(t, items);
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
                          {done}/{total}
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
