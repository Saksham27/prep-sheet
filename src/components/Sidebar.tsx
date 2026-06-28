import { useState } from 'react';
import { tracks, topicsForTrack, topicCount, topic as getTopic } from '../lib/content';
import { TRACK_COLOR } from '../lib/trackColors';
import type { Topic } from '../types';
import { useProgress, type ItemProgress } from '../store/progress';

const EXPAND_KEY = 'prep-sidebar-expanded';

function doneCount(t: Topic, items: Record<string, ItemProgress>): number {
  if (t.itemKind === 'problem') return t.problemIds.filter((id) => items[id]?.status === 'cold').length;
  if (t.itemKind === 'concept') return t.conceptIds.filter((id) => items[id]?.canExplain).length;
  return t.storyIds.filter((id) => items[id]?.canExplain).length;
}

interface Props {
  selected: string | null;
  onSelect: (topicId: string) => void;
}

export default function Sidebar({ selected, onSelect }: Props) {
  const items = useProgress((s) => s.items);
  const activeTrackId = selected ? getTopic(selected)?.trackId : tracks[0]?.id;
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(EXPAND_KEY) || 'null');
      if (Array.isArray(saved)) return new Set(saved);
    } catch {
      /* ignore */
    }
    return new Set(activeTrackId ? [activeTrackId] : []);
  });

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      localStorage.setItem(EXPAND_KEY, JSON.stringify([...n]));
      return n;
    });

  return (
    <aside className="flex h-full w-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <div className="text-sm font-semibold text-text">Mastery Sheet</div>
        <div className="text-xs text-muted">interview prep · local</div>
      </div>
      <nav className="flex-1 overflow-y-auto py-1.5">
        {tracks.map((track) => {
          const topics = topicsForTrack(track.id);
          const total = topics.reduce((a, t) => a + topicCount(t), 0);
          const done = topics.reduce((a, t) => a + doneCount(t, items), 0);
          const pct = total ? (done / total) * 100 : 0;
          const color = TRACK_COLOR[track.id] ?? '#58a6ff';
          const isOpen = expanded.has(track.id);
          const isActiveTrack = activeTrackId === track.id;

          return (
            <div key={track.id} className="px-1.5">
              <button
                onClick={() => toggle(track.id)}
                className={`group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition hover:bg-panel2 ${
                  isActiveTrack && !isOpen ? 'bg-panel2/60' : ''
                }`}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
                <span
                  className={`flex-1 truncate text-[11px] font-semibold uppercase tracking-wide ${
                    isActiveTrack ? 'text-text' : 'text-muted'
                  } group-hover:text-text`}
                >
                  {track.title}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-muted">
                  {done}/{total}
                </span>
                <span className={`shrink-0 text-muted transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
              </button>

              {isOpen && (
                <ul className="mb-1 ml-3.5 mt-0.5 space-y-px border-l border-border pl-1.5">
                  {topics.map((t) => {
                    const tot = topicCount(t);
                    const dn = doneCount(t, items);
                    const complete = tot > 0 && dn === tot;
                    const active = selected === t.id;
                    return (
                      <li key={t.id}>
                        <button
                          onClick={() => onSelect(t.id)}
                          className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] transition ${
                            active ? 'font-medium' : 'text-text/70 hover:bg-panel2 hover:text-text'
                          }`}
                          style={active ? { background: `${color}22`, color } : undefined}
                        >
                          <span className="truncate">{t.title}</span>
                          <span
                            className={`shrink-0 font-mono text-[10px] ${complete ? 'text-good' : 'text-muted'}`}
                          >
                            {dn}/{tot}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* thin track progress bar under the header */}
              {!isOpen && pct > 0 && (
                <div className="mx-2.5 mb-1 h-0.5 overflow-hidden rounded-full bg-panel2">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
