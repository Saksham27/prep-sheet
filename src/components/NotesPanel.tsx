import { useEffect, useState } from 'react';
import { topic as getTopic } from '../lib/content';
import { useProgress } from '../store/progress';
import InlineMd from './InlineMd';

// Per-topic notes with an Edit / Preview toggle. Preview renders markdown (headings,
// lists, fenced code) so pasted content reads cleanly. Stored under the topic's id in
// the progress store, so notes persist, export, and sync like everything else.
export default function NotesPanel({ topicId, onClose }: { topicId: string | null; onClose: () => void }) {
  const t = topicId ? getTopic(topicId) : undefined;
  const note = useProgress((s) => (topicId ? (s.items[topicId]?.notes ?? '') : ''));
  const setNotes = useProgress((s) => s.setNotes);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  // default to preview when a topic with existing notes is opened
  useEffect(() => {
    setMode(note.trim() ? 'preview' : 'edit');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  const tab = (m: 'edit' | 'preview') =>
    `rounded px-2 py-0.5 text-xs transition ${mode === m ? 'bg-panel2 text-text' : 'text-muted hover:text-text'}`;

  return (
    <aside className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <div className="font-mono text-[11px] uppercase tracking-wide text-muted">Notes</div>
          <div className="truncate text-sm font-semibold text-text">{t?.title ?? 'No topic selected'}</div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {t && (
            <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
              <button className={tab('edit')} onClick={() => setMode('edit')}>
                Edit
              </button>
              <button className={tab('preview')} onClick={() => setMode('preview')}>
                Preview
              </button>
            </div>
          )}
          <button onClick={onClose} className="text-muted hover:text-text" title="Hide notes">
            ✕
          </button>
        </div>
      </div>

      {!t ? (
        <div className="flex-1 p-4 text-sm text-muted">Open a topic from the left to take notes.</div>
      ) : mode === 'edit' ? (
        <textarea
          value={note}
          onChange={(e) => setNotes(topicId!, e.target.value)}
          placeholder={`Your notes on ${t.title}…\n\nMarkdown works: # headings, - lists, **bold**, and \`\`\` fenced code \`\`\`. Switch to Preview to see it rendered.`}
          className="flex-1 resize-none bg-bg p-4 text-sm leading-relaxed text-text outline-none placeholder:text-muted/60"
          spellCheck={false}
        />
      ) : note.trim() ? (
        <div className="flex-1 overflow-y-auto p-4">
          <InlineMd>{note}</InlineMd>
        </div>
      ) : (
        <div className="flex-1 p-4 text-sm text-muted">No notes yet — switch to Edit to add some.</div>
      )}

      <div className="border-t border-border px-4 py-2 text-[11px] text-muted">
        Saved automatically · syncs &amp; exports with your progress
      </div>
    </aside>
  );
}
