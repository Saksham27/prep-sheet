import { useRef } from 'react';
import { useProgress } from '../store/progress';

// Export/import the progress store as a JSON file. Progress lives in localStorage
// (per-browser), so this is how you move it between devices/browsers or back it up.
export default function BackupControls() {
  const fileRef = useRef<HTMLInputElement>(null);

  const exportData = () => {
    const { items, streak } = useProgress.getState();
    const payload = {
      app: 'mastery-sheet',
      version: 1,
      exportedAt: new Date().toISOString(),
      items,
      streak,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mastery-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || typeof data.items !== 'object') throw new Error('not a valid backup file');
      const current = Object.keys(useProgress.getState().items).length;
      const incoming = Object.keys(data.items).length;
      if (current > 0 && !window.confirm(`Replace your current progress (${current} items) with this backup (${incoming} items)?`)) {
        return;
      }
      useProgress.setState({
        items: data.items,
        streak: data.streak ?? { count: 0, lastActive: null },
      });
      window.alert(`Imported ${incoming} items.`);
    } catch (err) {
      window.alert('Import failed: ' + (err as Error).message);
    } finally {
      e.target.value = '';
    }
  };

  const btn =
    'rounded-md border border-border px-2 py-1 text-xs text-muted transition hover:border-accent hover:text-accent';

  return (
    <div className="flex items-center gap-1">
      <button onClick={exportData} title="Download your progress as a JSON backup" className={btn}>
        ⬇<span className="hidden sm:inline"> Export</span>
      </button>
      <button onClick={() => fileRef.current?.click()} title="Restore progress from a backup file" className={btn}>
        ⬆<span className="hidden sm:inline"> Import</span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        onChange={onFile}
        className="hidden"
      />
    </div>
  );
}
