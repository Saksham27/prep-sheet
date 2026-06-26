import { useMemo, useState } from 'react';
import { content } from '../lib/content';
import { generatePlan } from '../lib/plan';

const TRACK_CLS: Record<string, string> = {
  design: 'text-accent',
  lld: 'text-good',
  fundamentals: 'text-cold',
  behavioral: 'text-warn',
};

export default function DailyPlan() {
  const [weeks, setWeeks] = useState(26);
  const plan = useMemo(() => generatePlan(weeks), [weeks]);
  const alloc = content.allocation;

  return (
    <div className="mx-auto max-w-4xl px-5 py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold text-text">Daily plan</h2>
        <label className="flex items-center gap-2 text-sm text-muted">
          timeline
          <select
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
            className="rounded border border-border bg-panel px-2 py-1 text-text outline-none"
          >
            <option value={8}>8 weeks (switch-ready)</option>
            <option value={13}>13 weeks (~3 months)</option>
            <option value={26}>26 weeks (~6 months, default)</option>
            <option value={39}>39 weeks</option>
          </select>
        </label>
      </div>

      <p className="mt-1 text-sm text-muted">
        DSA is the daily spine, front-loaded; CS Fundamentals back-loads into phase 2. Sequencing follows the master
        curriculum's allocation and ordering rules.
      </p>

      {/* allocation table */}
      <div className="mt-4 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-panel2 text-muted">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Track</th>
              <th className="px-3 py-2 text-right font-medium">Phase 1 (wk 1–10)</th>
              <th className="px-3 py-2 text-right font-medium">Phase 2 (wk 11–26)</th>
            </tr>
          </thead>
          <tbody>
            {alloc.map((row) => (
              <tr key={row.track} className="border-t border-border">
                <td className="px-3 py-1.5 text-text/90">{row.track}</td>
                <td className="px-3 py-1.5 text-right font-mono text-muted">{row.phase1Pct}%</td>
                <td className="px-3 py-1.5 text-right font-mono text-muted">{row.phase2Pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* week-by-week */}
      <div className="mt-4 space-y-1.5">
        {plan.map((wk) => (
          <div
            key={wk.week}
            className="flex items-center gap-3 rounded-md border border-border bg-panel px-3 py-2 text-sm"
          >
            <div className="flex w-16 shrink-0 flex-col">
              <span className="font-mono text-text">wk {wk.week}</span>
              <span className={`text-[10px] ${wk.phase === 1 ? 'text-accent' : 'text-cold'}`}>
                phase {wk.phase}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-text/90">
                <span className="font-mono text-xs text-muted">DSA </span>
                {wk.dsa.join(' · ')}
              </div>
            </div>
            <div className={`shrink-0 text-xs font-medium ${TRACK_CLS[wk.focusTrackId] ?? 'text-muted'}`}>
              + {wk.focusTitle}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
