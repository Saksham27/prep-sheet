import { useMemo } from 'react';
import { search, topic, track } from '../lib/content';

const KIND_CLS: Record<string, string> = {
  problem: 'text-good',
  concept: 'text-accent',
  story: 'text-warn',
};

export default function SearchResults({ query, onOpenTopic }: { query: string; onOpenTopic: (id: string) => void }) {
  const hits = useMemo(() => search(query), [query]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-6">
      <h2 className="text-lg font-semibold text-text">
        {hits.length} result{hits.length === 1 ? '' : 's'} for “{query}”
      </h2>
      <div className="mt-3 space-y-1.5">
        {hits.map((h) => (
          <button
            key={h.id}
            onClick={() => onOpenTopic(h.topicId)}
            className="block w-full rounded-md border border-border bg-panel px-3 py-2 text-left hover:border-muted"
          >
            <div className="flex items-center gap-2">
              <span className={`font-mono text-[10px] uppercase ${KIND_CLS[h.kind]}`}>{h.kind}</span>
              <span className="font-medium text-text">{h.title}</span>
              <span className="ml-auto truncate text-xs text-muted">
                {track(h.trackId)?.title} › {topic(h.topicId)?.title}
              </span>
            </div>
            <div className="mt-0.5 truncate text-xs text-muted">{h.snippet}</div>
          </button>
        ))}
        {hits.length === 0 && <p className="text-sm text-muted">No matches.</p>}
      </div>
    </div>
  );
}
