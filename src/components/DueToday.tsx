import { allProblems, allConcepts, topic } from '../lib/content';
import { useProgress } from '../store/progress';
import { review, isDue, type Grade } from '../lib/scheduler';

const GRADES: { g: Grade; label: string; cls: string }[] = [
  { g: 'again', label: 'Again', cls: 'hover:border-red-400 hover:text-red-400' },
  { g: 'hard', label: 'Hard', cls: 'hover:border-warn hover:text-warn' },
  { g: 'good', label: 'Good', cls: 'hover:border-good hover:text-good' },
  { g: 'easy', label: 'Easy', cls: 'hover:border-accent hover:text-accent' },
];

interface DueItem {
  id: string;
  title: string;
  topicId: string;
  kind: 'problem' | 'concept';
  revisit?: boolean;
}

export default function DueToday({ onOpenTopic }: { onOpenTopic: (id: string) => void }) {
  const items = useProgress((s) => s.items);
  const patch = useProgress((s) => s.patch);
  const today = new Date().toISOString().slice(0, 10);

  const due: DueItem[] = [];

  for (const p of allProblems()) {
    const prog = items[p.id];
    const dueNow = prog?.nextReview ? isDue(prog, today) : p.revisit && prog?.status !== 'cold';
    if (dueNow) due.push({ id: p.id, title: p.title, topicId: p.topicId, kind: 'problem', revisit: p.revisit });
  }
  for (const c of allConcepts()) {
    const prog = items[c.id];
    if (prog?.canExplain && prog?.nextReview && isDue(prog, today)) {
      due.push({ id: c.id, title: c.title.replace(/ — overview$/, ''), topicId: c.topicId, kind: 'concept' });
    }
  }

  const grade = (id: string, g: Grade) => patch(id, review(items[id] ?? {}, g));

  return (
    <div className="mx-auto max-w-3xl px-5 py-6">
      <h2 className="text-2xl font-bold tracking-tight text-text">Due today</h2>
      <p className="mt-1 text-sm text-muted">
        Spaced repetition (SM-2-lite) for 🔁/cold problems and concepts you can explain. Re-solve or re-explain, then grade
        it — the scheduler sets the next date.
      </p>

      {due.length === 0 ? (
        <div className="mt-8 rounded-lg border border-border bg-panel p-8 text-center text-muted shadow-card">
          Nothing due. 🎉 Bring 🔁 problems to <span className="text-cold">cold</span> and toggle{' '}
          <span className="text-good">“Can I explain this out loud?”</span> on concepts to seed the review queue.
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {due.map((it) => {
            const prog = items[it.id];
            return (
              <div key={it.id} className="rounded-lg border border-border bg-panel p-3 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button onClick={() => onOpenTopic(it.topicId)} className="min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase ${
                          it.kind === 'concept' ? 'bg-accent/15 text-accent' : 'bg-good/15 text-good'
                        }`}
                      >
                        {it.kind}
                      </span>
                      {it.revisit && <span title="spaced-repeat">🔁</span>}
                      <span className="truncate font-medium text-text hover:text-accent">{it.title}</span>
                    </div>
                    <div className="text-xs text-muted">
                      {topic(it.topicId)?.title}
                      {prog?.nextReview ? ` · due ${prog.nextReview}` : ' · new'}
                      {prog?.reps ? ` · rep ${prog.reps}` : ''}
                    </div>
                  </button>
                  <div className="flex shrink-0 gap-1">
                    {GRADES.map(({ g, label, cls }) => (
                      <button
                        key={g}
                        onClick={() => grade(it.id, g)}
                        className={`rounded-md border border-border px-2 py-1 text-xs text-muted transition ${cls}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
