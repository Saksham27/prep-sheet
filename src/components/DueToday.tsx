import { allProblems, topic } from '../lib/content';
import { useProgress } from '../store/progress';
import { review, isDue, type Grade } from '../lib/scheduler';

const GRADES: { g: Grade; label: string; cls: string }[] = [
  { g: 'again', label: 'Again', cls: 'hover:border-red-400 hover:text-red-400' },
  { g: 'hard', label: 'Hard', cls: 'hover:border-warn hover:text-warn' },
  { g: 'good', label: 'Good', cls: 'hover:border-good hover:text-good' },
  { g: 'easy', label: 'Easy', cls: 'hover:border-accent hover:text-accent' },
];

export default function DueToday({ onOpenTopic }: { onOpenTopic: (id: string) => void }) {
  const items = useProgress((s) => s.items);
  const patch = useProgress((s) => s.patch);
  const today = new Date().toISOString().slice(0, 10);

  // Due = scheduled-and-due, plus 🔁 items not yet brought to cold and never reviewed.
  const due = allProblems().filter((p) => {
    const prog = items[p.id];
    if (prog?.nextReview) return isDue(prog, today);
    return p.revisit && prog?.status !== 'cold';
  });

  const grade = (id: string, g: Grade) => patch(id, review(items[id] ?? {}, g));

  return (
    <div className="mx-auto max-w-3xl px-5 py-6">
      <h2 className="text-xl font-semibold text-text">Due today</h2>
      <p className="mt-1 text-sm text-muted">
        Spaced repetition for 🔁 and cold items. Grade each re-solve — the scheduler (SM-2-lite) sets the next date.
      </p>

      {due.length === 0 ? (
        <div className="mt-8 rounded-lg border border-border bg-panel p-8 text-center text-muted">
          Nothing due. 🎉 Bring more 🔁 problems to <span className="text-cold">cold</span> to seed the queue.
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {due.map((p) => {
            const prog = items[p.id];
            return (
              <div key={p.id} className="rounded-lg border border-border bg-panel p-3">
                <div className="flex items-center justify-between gap-3">
                  <button onClick={() => onOpenTopic(p.topicId)} className="min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      {p.revisit && <span title="spaced-repeat">🔁</span>}
                      <span className="truncate font-medium text-text hover:text-accent">{p.title}</span>
                    </div>
                    <div className="text-xs text-muted">
                      {topic(p.topicId)?.title}
                      {prog?.nextReview ? ` · due ${prog.nextReview}` : ' · new'}
                      {prog?.reps ? ` · rep ${prog.reps}` : ''}
                    </div>
                  </button>
                  <div className="flex shrink-0 gap-1">
                    {GRADES.map(({ g, label, cls }) => (
                      <button
                        key={g}
                        onClick={() => grade(p.id, g)}
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
