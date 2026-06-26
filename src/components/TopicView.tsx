import type { Topic } from '../types';
import { problemsForTopic } from '../lib/content';
import { useProgress } from '../store/progress';
import ProblemCard from './ProblemCard';
import CodeBlock from './CodeBlock';
import InlineMd from './InlineMd';

export default function TopicView({ topic }: { topic: Topic }) {
  const problems = problemsForTopic(topic.id);
  const items = useProgress((s) => s.items);

  const done = problems.filter((p) => items[p.id]?.status === 'cold').length;
  const solved = problems.filter((p) => {
    const st = items[p.id]?.status;
    return st === 'solved' || st === 'cold';
  }).length;

  return (
    <div className="mx-auto max-w-4xl px-5 py-6">
      <div className="mb-1 flex items-baseline gap-3">
        <h2 className="text-xl font-semibold text-text">{topic.title}</h2>
        <span className="text-sm text-muted">
          {done}/{problems.length} cold · {solved} solved
        </span>
      </div>

      {topic.coreIdea && (
        <p className="mt-2 rounded-md border-l-2 border-accent bg-panel/60 px-3 py-2 text-sm text-text/90">
          <span className="font-mono text-xs text-accent">core idea </span>
          <InlineMd className="inline">{topic.coreIdea}</InlineMd>
        </p>
      )}

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {topic.recognitionSignals.length > 0 && (
          <div className="rounded-md border border-border bg-panel/40 px-3 py-2">
            <div className="font-mono text-xs text-muted">recognition signals</div>
            <InlineMd className="mt-0.5">{topic.recognitionSignals.join(' · ')}</InlineMd>
          </div>
        )}
        {topic.masteryBar && (
          <div className="rounded-md border border-border bg-panel/40 px-3 py-2">
            <div className="font-mono text-xs text-muted">mastery bar</div>
            <InlineMd className="mt-0.5">{topic.masteryBar}</InlineMd>
          </div>
        )}
      </div>

      {topic.templates.length > 0 && (
        <details className="mt-3" open>
          <summary className="cursor-pointer text-sm font-medium text-accent">
            C# templates ({topic.templates.length})
          </summary>
          <div className="mt-2 space-y-2">
            {topic.templates.map((t, i) => (
              <CodeBlock key={i} code={t.code} lang={t.lang} label={t.label} />
            ))}
          </div>
        </details>
      )}

      <div className="mt-5 space-y-2.5">
        {problems.map((p) => (
          <ProblemCard key={p.id} problem={p} />
        ))}
        {problems.length === 0 && <p className="text-sm text-muted">No problems in this topic yet.</p>}
      </div>
    </div>
  );
}
