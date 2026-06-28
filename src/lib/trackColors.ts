// A distinct accent per track, shared by the sidebar and topic-view headers.
export const TRACK_COLOR: Record<string, string> = {
  'start-here': '#3fb950',
  'cs-core': '#58a6ff',
  dsa: '#f0883e',
  design: '#d2a8ff',
  lld: '#56d364',
  fundamentals: '#79c0ff',
  security: '#f85149',
  behavioral: '#e3b341',
  tech: '#39c5cf',
  frontend: '#ff7b72',
  ai: '#bc8cff',
  sql: '#db61a2',
  practice: '#d29922',
};

export function trackColor(trackId: string | undefined): string {
  return (trackId && TRACK_COLOR[trackId]) || '#6cb1ff';
}
