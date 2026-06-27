import { useState } from 'react';
import type { Concept } from '../types';
import { useProgress } from '../store/progress';
import InlineMd from './InlineMd';

export default function ConceptCard({ concept, anchor }: { concept: Concept; anchor?: boolean }) {
  const prog = useProgress((s) => s.items[concept.id]);
  const toggleCanExplain = useProgress((s) => s.toggleCanExplain);
  const toggleStar = useProgress((s) => s.toggleStar);
  const setNotes = useProgress((s) => s.setNotes);
  const [notesOpen, setNotesOpen] = useState(false);

  const canExplain = !!prog?.canExplain;

  return (
    <div id={anchor ? concept.id : undefined} className="rounded-lg border border-border bg-panel p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {concept.section && <span className="font-mono text-xs text-muted">{concept.section}</span>}
          <h4 className="font-semibold text-text">{concept.title.replace(/ — overview$/, '')}</h4>
          {concept.source === 'generated' && (
            <span className="rounded border border-gen/50 bg-gen/10 px-1.5 py-0.5 text-[10px] font-semibold text-gen">
              AI-added — verify
            </span>
          )}
        </div>
        <button
          onClick={() => toggleStar(concept.id)}
          title="star for revision"
          className={`shrink-0 text-lg leading-none transition ${prog?.starred ? 'text-warn' : 'text-border hover:text-muted'}`}
        >
          ★
        </button>
      </div>

      {concept.body && <InlineMd className="mt-2">{concept.body}</InlineMd>}

      {concept.probes.map((p, i) => (
        <Probe key={i} q={p.question} a={p.answer} />
      ))}
      {concept.followups.length > 0 && (
        <div className="mt-2">
          <div className="font-mono text-[11px] text-gen">follow-up probes (AI-added — verify)</div>
          {concept.followups.map((p, i) => (
            <Probe key={`f${i}`} q={p.question} a={p.answer} />
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3">
        <button
          onClick={() => toggleCanExplain(concept.id)}
          className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition ${
            canExplain
              ? 'border-good bg-good/15 text-good'
              : 'border-border text-muted hover:border-muted hover:text-text'
          }`}
        >
          <span className="text-base leading-none">{canExplain ? '✓' : '○'}</span>
          Can I explain this out loud?
        </button>
        <button
          onClick={() => setNotesOpen((v) => !v)}
          className="ml-auto rounded-md px-2 py-1 text-xs text-muted hover:text-text"
        >
          {prog?.notes ? '📝 notes' : '+ note'}
        </button>
      </div>

      {notesOpen && (
        <textarea
          value={prog?.notes ?? ''}
          onChange={(e) => setNotes(concept.id, e.target.value)}
          placeholder="Your notes…"
          className="mt-2 h-20 w-full resize-y rounded-md border border-border bg-bg p-2 text-sm text-text outline-none focus:border-accent"
        />
      )}
    </div>
  );
}

function Probe({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2 rounded-md border border-border bg-panel2/50">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-2 px-3 py-2 text-left"
      >
        <span className="shrink-0 rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-accent">
          PROBE
        </span>
        <span className="flex-1 text-sm font-medium text-text">{q}</span>
        <span className="shrink-0 text-xs text-muted">{open ? 'hide' : 'reveal'}</span>
      </button>
      {open && (
        <div className="border-t border-border px-3 py-2">
          <InlineMd>{a}</InlineMd>
        </div>
      )}
    </div>
  );
}
