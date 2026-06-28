import { useProgress } from '../store/progress';

// The "AI-added — verify" badge, now clickable: tap to mark the item verified once
// you've confirmed it (e.g. ran the solution on LeetCode). Verified state syncs/exports.
export default function VerifyBadge({ id }: { id: string }) {
  const verified = useProgress((s) => !!s.items[id]?.verified);
  const toggle = useProgress((s) => s.toggleVerified);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      title={verified ? 'Marked verified — tap to undo' : 'AI-added — tap to mark verified once you trust it'}
      className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold transition ${
        verified
          ? 'border-good/50 bg-good/10 text-good'
          : 'border-gen/50 bg-gen/10 text-gen hover:border-gen'
      }`}
    >
      {verified ? '✓ verified' : 'AI-added — verify'}
    </button>
  );
}
