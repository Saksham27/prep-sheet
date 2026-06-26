import { useState } from 'react';
import type { Problem } from '../types';
import { useProgress, type ProblemStatus } from '../store/progress';
import InlineMd from './InlineMd';

const STATUSES: { key: ProblemStatus; label: string; cls: string; help: string }[] = [
  { key: 'read', label: 'Read', cls: 'data-[on=true]:bg-accent data-[on=true]:text-bg', help: 'understood the editorial' },
  { key: 'solved', label: 'Solved', cls: 'data-[on=true]:bg-good data-[on=true]:text-bg', help: 'solved it (maybe with hints)' },
  { key: 'cold', label: 'Cold', cls: 'data-[on=true]:bg-cold data-[on=true]:text-bg', help: 're-solved from a blank editor — the real done' },
];

const DIFF_CLS: Record<string, string> = {
  Easy: 'text-good border-good/40',
  Medium: 'text-warn border-warn/40',
  Hard: 'text-red-400 border-red-400/40',
};

export default function ProblemCard({ problem }: { problem: Problem }) {
  const prog = useProgress((s) => s.items[problem.id]);
  const setStatus = useProgress((s) => s.setStatus);
  const toggleStar = useProgress((s) => s.toggleStar);
  const setNotes = useProgress((s) => s.setNotes);
  const [notesOpen, setNotesOpen] = useState(false);

  const status = prog?.status;
  const starred = !!prog?.starred;

  return (
    <div className="rounded-lg border border-border bg-panel p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${DIFF_CLS[problem.difficulty]}`}>
            {problem.difficulty[0]}
          </span>
          <h4 className="font-medium text-text">{problem.title}</h4>
          {problem.core && <span title="core (non-negotiable)" className="text-xs text-warn">⭐</span>}
          {problem.revisit && <span title="spaced-repeat weekly" className="text-xs">🔁</span>}
          {problem.source === 'generated' && (
            <span
              title="AI-added — verify before trusting"
              className="rounded border border-gen/50 bg-gen/10 px-1.5 py-0.5 text-[10px] font-semibold text-gen"
            >
              AI-added — verify
            </span>
          )}
        </div>
        <button
          onClick={() => toggleStar(problem.id)}
          title="star for revision"
          className={`shrink-0 text-lg leading-none transition ${starred ? 'text-warn' : 'text-border hover:text-muted'}`}
        >
          ★
        </button>
      </div>

      <div className="mt-2 space-y-1.5">
        {problem.insight && <Field label="Insight" value={problem.insight} />}
        {problem.approach && <Field label="Approach" value={problem.approach} />}
        {problem.complexity && <Field label="Complexity" value={problem.complexity} />}
        {problem.watch && <Field label="Watch" value={problem.watch} accent="warn" />}
        {problem.note && !problem.insight && <Field label="Note" value={problem.note} />}
      </div>

      {problem.solution && (
        <details className="mt-2 rounded border border-border bg-panel2/40">
          <summary className="cursor-pointer px-3 py-1.5 text-xs text-accent">C# solution</summary>
          <div className="px-3 pb-2">
            <InlineMd>{problem.solution}</InlineMd>
          </div>
        </details>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.key}
            data-on={status === s.key}
            title={s.help}
            onClick={() => setStatus(problem.id, status === s.key ? 'todo' : s.key)}
            className={`rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted transition hover:border-muted ${s.cls}`}
          >
            {s.label}
          </button>
        ))}
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
          onChange={(e) => setNotes(problem.id, e.target.value)}
          placeholder="Your notes — gotchas, your own approach, links…"
          className="mt-2 h-20 w-full resize-y rounded-md border border-border bg-bg p-2 text-sm text-text outline-none focus:border-accent"
        />
      )}
    </div>
  );
}

function Field({ label, value, accent }: { label: string; value: string; accent?: 'warn' }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className={`shrink-0 font-mono text-xs ${accent === 'warn' ? 'text-warn' : 'text-muted'}`}>{label}</span>
      <span className="min-w-0 flex-1">
        <InlineMd className="!text-text/90">{value}</InlineMd>
      </span>
    </div>
  );
}
