import { useState } from 'react';
import { connect, disconnect, push, pull, syncStatus } from '../lib/sync';
import { useProgress } from '../store/progress';

export default function SyncControls() {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [, force] = useState(0);
  const status = syncStatus();

  const refresh = () => force((n) => n + 1);

  const doConnect = async () => {
    if (!token.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const result = await connect(token.trim());
      setToken('');
      setMsg(result === 'pulled' ? 'Connected — pulled your cloud progress.' : 'Connected — uploaded this device.');
    } catch (e) {
      setMsg('Failed: ' + (e as Error).message);
    } finally {
      setBusy(false);
      refresh();
    }
  };

  const syncNow = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const remote = await pull();
      const remoteCount = remote ? Object.keys(remote.items).length : 0;
      if (remote && remoteCount > 0 && window.confirm('Pull the latest cloud copy into this device?')) {
        useProgress.setState({ items: remote.items as any, streak: remote.streak });
      } else {
        await push();
      }
      setMsg('Synced.');
    } catch (e) {
      setMsg('Failed: ' + (e as Error).message);
    } finally {
      setBusy(false);
      refresh();
    }
  };

  const btn = 'rounded-md border border-border px-2 py-1 text-xs text-muted transition hover:border-accent hover:text-accent';

  return (
    <>
      <button onClick={() => setOpen(true)} title="Sync progress across devices" className={btn}>
        ☁<span className="hidden sm:inline"> Sync{status.connected ? '' : ' off'}</span>
        <span className={`ml-1 inline-block h-1.5 w-1.5 rounded-full ${status.connected ? 'bg-good' : 'bg-border'}`} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md rounded-lg border border-border bg-panel p-5 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-base font-semibold text-text">Sync across devices</h3>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-text">
                ✕
              </button>
            </div>
            <p className="mb-3 text-xs text-muted">
              Progress is normally saved only in this browser. Connect a GitHub token to sync it to a private Gist that all
              your devices share.
            </p>

            {status.connected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-md border border-good/40 bg-good/10 px-3 py-2 text-good">
                  <span>● Connected</span>
                  {status.lastSyncedAt && (
                    <span className="ml-auto text-xs text-muted">
                      last synced {new Date(status.lastSyncedAt).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={syncNow} disabled={busy} className={`${btn} flex-1 py-1.5`}>
                    {busy ? 'Syncing…' : 'Sync now'}
                  </button>
                  <button
                    onClick={() => {
                      disconnect();
                      refresh();
                      setMsg('Disconnected on this device (your cloud copy is kept).');
                    }}
                    className={`${btn} flex-1 py-1.5 hover:border-red-400 hover:text-red-400`}
                  >
                    Disconnect
                  </button>
                </div>
                <p className="text-xs text-muted">Changes auto-sync a couple seconds after you make them.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <ol className="list-decimal space-y-1 pl-5 text-xs text-muted">
                  <li>
                    Open{' '}
                    <a
                      className="text-accent underline"
                      href="https://github.com/settings/tokens/new?scopes=gist&description=mastery-sheet-sync"
                      target="_blank"
                      rel="noreferrer"
                    >
                      github.com/settings/tokens/new
                    </a>{' '}
                    (a <b>classic</b> token).
                  </li>
                  <li>
                    Scope: tick only <b>gist</b>. Set an expiry. Generate, then copy it.
                  </li>
                  <li>Paste it below. Repeat on each device (same token is fine).</li>
                </ol>
                <input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  type="password"
                  placeholder="ghp_…  (paste your gist token)"
                  className="w-full rounded-md border border-border bg-bg px-2.5 py-1.5 text-text outline-none focus:border-accent"
                />
                <button onClick={doConnect} disabled={busy || !token.trim()} className={`${btn} w-full py-1.5 disabled:opacity-50`}>
                  {busy ? 'Connecting…' : 'Connect'}
                </button>
                <p className="text-[11px] text-muted">
                  The token stays in this browser only. Use only on devices you trust; you can revoke it anytime on GitHub.
                </p>
              </div>
            )}

            {msg && <div className="mt-3 rounded-md border border-border bg-bg px-3 py-2 text-xs text-text/90">{msg}</div>}
          </div>
        </div>
      )}
    </>
  );
}
