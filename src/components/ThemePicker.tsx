import { useEffect, useRef, useState } from 'react';

export const THEMES = [
  { id: 'midnight', name: 'Indigo Midnight', dot: '#8b7cff' },
  { id: 'tokyo', name: 'Tokyo Night', dot: '#7aa2f7' },
  { id: 'mocha', name: 'Catppuccin Mocha', dot: '#cba6f7' },
  { id: 'graphite', name: 'Graphite', dot: '#6cb1ff' },
  { id: 'obsidian', name: 'Obsidian (black)', dot: '#4cc4ff' },
] as const;

const KEY = 'prep-theme';

export function currentTheme(): string {
  return localStorage.getItem(KEY) || 'midnight';
}
export function applyTheme(id: string) {
  document.documentElement.setAttribute('data-theme', id);
  localStorage.setItem(KEY, id);
}

export default function ThemePicker() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(currentTheme());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (id: string) => {
    applyTheme(id);
    setTheme(id);
    setOpen(false);
  };

  const active = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Theme"
        className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted transition hover:border-accent hover:text-accent"
      >
        <span className="inline-block h-3 w-3 rounded-full" style={{ background: active.dot }} />
        <span className="hidden sm:inline">Theme</span>
      </button>
      {open && (
        <div className="absolute right-2 top-full z-50 mt-1 w-48 overflow-hidden rounded-md border border-border bg-panel shadow-card">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => pick(t.id)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-panel2 ${
                t.id === theme ? 'text-accent' : 'text-text/80'
              }`}
            >
              <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ background: t.dot }} />
              <span className="flex-1 truncate">{t.name}</span>
              {t.id === theme && <span className="text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
