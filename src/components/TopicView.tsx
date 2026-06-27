import { useMemo, useState } from 'react';
import type { Topic, Difficulty } from '../types';
import { problemsForTopic, conceptsForTopic, storiesForTopic } from '../lib/content';
import { useProgress, type ProblemStatus } from '../store/progress';
import ProblemCard from './ProblemCard';
import ConceptCard from './ConceptCard';
import StoryCard from './StoryCard';
import CodeBlock from './CodeBlock';
import InlineMd from './InlineMd';

export default function TopicView({ topic }: { topic: Topic }) {
  if (topic.itemKind === 'concept') return <ConceptTopic topic={topic} />;
  if (topic.itemKind === 'story') return <StoryTopic topic={topic} />;
  return <ProblemTopic topic={topic} />;
}

// ── Problem topics (DSA) ─────────────────────────────────────────────────────
const DIFFS: Difficulty[] = ['Easy', 'Medium', 'Hard'];
const STATUS_FILTERS: (ProblemStatus | 'todo')[] = ['todo', 'read', 'solved', 'cold'];

function ProblemTopic({ topic }: { topic: Topic }) {
  const problems = problemsForTopic(topic.id);
  const items = useProgress((s) => s.items);
  const [diff, setDiff] = useState<Set<Difficulty>>(new Set());
  const [stat, setStat] = useState<Set<string>>(new Set());
  const [starOnly, setStarOnly] = useState(false);

  const filtered = useMemo(
    () =>
      problems.filter((p) => {
        if (diff.size && !diff.has(p.difficulty)) return false;
        const st = items[p.id]?.status ?? 'todo';
        if (stat.size && !stat.has(st)) return false;
        if (starOnly && !items[p.id]?.starred) return false;
        return true;
      }),
    [problems, diff, stat, starOnly, items],
  );

  const done = problems.filter((p) => items[p.id]?.status === 'cold').length;
  const solved = problems.filter((p) => ['solved', 'cold'].includes(items[p.id]?.status ?? '')).length;
  const toggle = <T,>(set: Set<T>, v: T, fn: (s: Set<T>) => void) => {
    const n = new Set(set);
    n.has(v) ? n.delete(v) : n.add(v);
    fn(n);
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-6">
      <Header title={topic.title} sub={`${done}/${problems.length} cold · ${solved} solved`} />

      {topic.coreIdea && (
        <div className="mt-2 rounded-md border-l-2 border-accent bg-panel/60 px-3 py-2 text-sm">
          <span className="font-mono text-xs text-accent">core idea </span>
          <InlineMd className="inline">{topic.coreIdea}</InlineMd>
        </div>
      )}
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {topic.recognitionSignals.length > 0 && (
          <Box label="recognition signals">{topic.recognitionSignals.join(' · ')}</Box>
        )}
        {topic.masteryBar && <Box label="mastery bar">{topic.masteryBar}</Box>}
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

      {/* filters */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs">
        {DIFFS.map((d) => (
          <Chip key={d} on={diff.has(d)} onClick={() => toggle(diff, d, setDiff)}>
            {d}
          </Chip>
        ))}
        <span className="mx-1 text-border">|</span>
        {STATUS_FILTERS.map((s) => (
          <Chip key={s} on={stat.has(s)} onClick={() => toggle(stat, s, setStat)}>
            {s}
          </Chip>
        ))}
        <span className="mx-1 text-border">|</span>
        <Chip on={starOnly} onClick={() => setStarOnly((v) => !v)}>
          ★ starred
        </Chip>
        {(diff.size > 0 || stat.size > 0 || starOnly) && (
          <button
            onClick={() => {
              setDiff(new Set());
              setStat(new Set());
              setStarOnly(false);
            }}
            className="ml-1 text-muted hover:text-text"
          >
            clear
          </button>
        )}
        <span className="ml-auto text-muted">
          {filtered.length}/{problems.length}
        </span>
      </div>

      <div className="mt-3 space-y-2.5">
        {filtered.map((p) => (
          <ProblemCard key={p.id} problem={p} />
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted">No problems match the filters.</p>}
      </div>
    </div>
  );
}

// ── Concept topics (depth tracks) ────────────────────────────────────────────
function ConceptTopic({ topic }: { topic: Topic }) {
  const concepts = conceptsForTopic(topic.id);
  const exercises = problemsForTopic(topic.id); // a concept topic may carry trailing exercises
  const items = useProgress((s) => s.items);
  const explained = concepts.filter((c) => items[c.id]?.canExplain).length;
  const exSub = exercises.length ? ` · ${exercises.length} exercise${exercises.length > 1 ? 's' : ''}` : '';

  return (
    <div className="mx-auto max-w-4xl px-5 py-6">
      <Header title={topic.title} sub={`${explained}/${concepts.length} can explain out loud${exSub}`} />
      <div className="mt-4 space-y-3">
        {concepts.map((c) => (
          <ConceptCard key={c.id} concept={c} anchor />
        ))}
        {exercises.map((p) => (
          <ProblemCard key={p.id} problem={p} />
        ))}
      </div>
    </div>
  );
}

// ── Story topics (behavioral) ────────────────────────────────────────────────
function StoryTopic({ topic }: { topic: Topic }) {
  const stories = storiesForTopic(topic.id);
  const items = useProgress((s) => s.items);
  const ready = stories.filter((s) => items[s.id]?.canExplain).length;

  return (
    <div className="mx-auto max-w-4xl px-5 py-6">
      <Header title={topic.title} sub={`${ready}/${stories.length} drill-ready`} />
      <p className="mt-1 text-sm text-muted">
        Fill the bracketed fields with your real numbers — a story only lands if it's true and in your voice.
      </p>
      <div className="mt-4 space-y-3">
        {stories.map((s) => (
          <StoryCard key={s.id} story={s} />
        ))}
      </div>
    </div>
  );
}

// ── shared bits ──────────────────────────────────────────────────────────────
function Header({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h2 className="text-2xl font-bold tracking-tight text-text">{title}</h2>
      <span className="text-sm text-muted">{sub}</span>
    </div>
  );
}

function Box({ label, children }: { label: string; children: string }) {
  return (
    <div className="rounded-md border border-border bg-panel/40 px-3 py-2">
      <div className="font-mono text-xs text-muted">{label}</div>
      <InlineMd className="mt-0.5">{children}</InlineMd>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 transition ${
        on ? 'border-accent bg-accent/15 text-accent' : 'border-border text-muted hover:border-muted'
      }`}
    >
      {children}
    </button>
  );
}
