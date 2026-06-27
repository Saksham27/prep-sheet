import { topic as getTopic } from '../lib/content';
import { useProgress } from '../store/progress';

// Per-topic notes. Stored in the progress store under the topic's own id, so they
// persist, export, and sync (gist) exactly like the rest of your progress.
export default function NotesPanel({ topicId, onClose }: { topicId: string | null; onClose: () => void }) {
  const t = topicId ? getTopic(topicId) : undefined;
  const note = useProgress((s) => (topicId ? (s.items[topicId]?.notes ?? '') : ''));
  const setNotes = useProgress((s) => s.setNotes);

  return (
    <aside className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <div className="font-mono text-[11px] uppercase tracking-wide text-muted">Notes</div>
          <div className="truncate text-sm font-semibold text-text">{t?.title ?? 'No topic selected'}</div>
        </div>
        <button onClick={onClose} className="shrink-0 text-muted hover:text-text" title="Hide notes">
          ✕
        </button>
      </div>

      {t ? (
        <textarea
          value={note}
          onChange={(e) => setNotes(topicId!, e.target.value)}
          placeholder={`Your notes on ${t.title}…\n\nGotchas, your own templates, links, mistakes to avoid. Markdown is fine.`}
          className="flex-1 resize-none bg-bg p-4 text-sm leading-relaxed text-text outline-none placeholder:text-muted/60"
          spellCheck={false}
        />
      ) : (
        <div className="flex-1 p-4 text-sm text-muted">Open a topic from the left to take notes.</div>
      )}

      <div className="border-t border-border px-4 py-2 text-[11px] text-muted">
        Saved automatically · syncs &amp; exports with your progress
      </div>
    </aside>
  );
}
