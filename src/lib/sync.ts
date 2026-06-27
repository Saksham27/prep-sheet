// Cross-device sync via a private GitHub Gist.
//
// Why this works on a static site: the browser calls the GitHub REST API directly
// (CORS-enabled) using *your* personal access token, which lives only in this browser's
// localStorage. Your progress is stored as one private gist that every device with the
// token reads/writes. No backend, no new account — you already have GitHub.
//
// Conflict policy: last-write-wins by timestamp for ongoing auto-sync; an explicit
// prompt on first connect if both sides already have data (so nothing is silently lost).
// The manual Export/Import remains as a safety net.

import { useProgress } from '../store/progress';

const META_KEY = 'prep-sync-v1';
const MARKER = 'mastery-sheet-progress [managed by the app — do not delete]';
const FILE = 'mastery-progress.json';
const API = 'https://api.github.com';

interface Meta {
  token?: string;
  gistId?: string;
  lastLocalChange?: string; // ISO; bumped on every progress edit
  lastSyncedAt?: string;
}

function getMeta(): Meta {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) || '{}');
  } catch {
    return {};
  }
}
function setMeta(patch: Meta) {
  localStorage.setItem(META_KEY, JSON.stringify({ ...getMeta(), ...patch }));
}

export function syncStatus() {
  const m = getMeta();
  return { connected: !!m.token, lastSyncedAt: m.lastSyncedAt };
}

async function gh(path: string, init?: RequestInit): Promise<Response> {
  const { token } = getMeta();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const body = (await res.text()).slice(0, 200);
    throw new Error(`GitHub ${res.status} — ${body}`);
  }
  return res;
}

function localPayload(): string {
  const { items, streak } = useProgress.getState();
  return JSON.stringify(
    { app: 'mastery-sheet', version: 1, updatedAt: getMeta().lastLocalChange || new Date().toISOString(), items, streak },
    null,
    2,
  );
}

let applyingRemote = false;
function adoptRemote(remote: { items: any; streak: any }) {
  applyingRemote = true;
  useProgress.setState({ items: remote.items, streak: remote.streak });
  applyingRemote = false;
  setMeta({ lastSyncedAt: new Date().toISOString() });
}

async function findOrCreateGist(): Promise<string> {
  const res = await gh('/gists?per_page=100');
  const gists = (await res.json()) as Array<{ id: string; description: string }>;
  const found = gists.find((g) => g.description === MARKER);
  if (found) return found.id;
  const create = await gh('/gists', {
    method: 'POST',
    body: JSON.stringify({ description: MARKER, public: false, files: { [FILE]: { content: localPayload() } } }),
  });
  return (await create.json()).id as string;
}

interface RemoteData {
  items: Record<string, unknown>;
  streak: { count: number; lastActive: string | null };
  updatedAt: string;
}

export async function pull(): Promise<RemoteData | null> {
  const { gistId } = getMeta();
  if (!gistId) return null;
  const res = await gh(`/gists/${gistId}`);
  const g = await res.json();
  const file = g.files?.[FILE];
  if (!file) return null;
  let content: string = file.content;
  if (file.truncated && file.raw_url) content = await (await fetch(file.raw_url)).text();
  const data = JSON.parse(content);
  return { items: data.items || {}, streak: data.streak || { count: 0, lastActive: null }, updatedAt: data.updatedAt || '' };
}

export async function push(): Promise<void> {
  const { token, gistId } = getMeta();
  if (!token || !gistId) return;
  await gh(`/gists/${gistId}`, { method: 'PATCH', body: JSON.stringify({ files: { [FILE]: { content: localPayload() } } }) });
  setMeta({ lastSyncedAt: new Date().toISOString() });
}

/** Connect a token, find/create the gist, and reconcile both sides safely. */
export async function connect(token: string): Promise<'pulled' | 'pushed'> {
  setMeta({ token });
  let gistId: string;
  try {
    gistId = await findOrCreateGist();
  } catch (e) {
    setMeta({ token: undefined });
    throw e;
  }
  setMeta({ gistId });

  const remote = await pull();
  const localCount = Object.keys(useProgress.getState().items).length;
  const remoteCount = remote ? Object.keys(remote.items).length : 0;

  if (remoteCount > 0 && localCount > 0) {
    // both have data → ask, never silently lose progress
    const useCloud = window.confirm(
      `This device has ${localCount} tracked items; the cloud backup has ${remoteCount}.\n\n` +
        `OK = use the CLOUD copy (replaces this device).\nCancel = keep THIS DEVICE (uploads it to the cloud).`,
    );
    if (useCloud) {
      adoptRemote(remote!);
      return 'pulled';
    }
    await push();
    return 'pushed';
  }

  if (remoteCount > 0) {
    adoptRemote(remote!);
    return 'pulled';
  }
  await push();
  return 'pushed';
}

export function disconnect() {
  setMeta({ token: undefined });
}

let debounce: ReturnType<typeof setTimeout> | undefined;

/** Wire auto-sync: timestamp local changes, debounce-push when connected, pull on load. */
export function initSync() {
  useProgress.subscribe((state, prev) => {
    if (state.items === prev.items && state.streak === prev.streak) return;
    if (applyingRemote) return; // don't echo a just-pulled state back
    setMeta({ lastLocalChange: new Date().toISOString() });
    if (!getMeta().token) return;
    clearTimeout(debounce);
    debounce = setTimeout(() => void push().catch(() => {}), 2500);
  });

  const m = getMeta();
  if (m.token && m.gistId) {
    void pull()
      .then((remote) => {
        if (!remote) return;
        const localChange = getMeta().lastLocalChange;
        // adopt remote only if it's strictly newer than our last local edit
        if (remote.updatedAt && (!localChange || remote.updatedAt > localChange)) adoptRemote(remote);
      })
      .catch(() => {});
  }
}
