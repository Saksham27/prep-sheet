import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative base so the build works on GitHub Pages project sites
  // (served from /<repo>/) without hardcoding the repo name. The app has no
  // client-side router, so relative asset paths are sufficient.
  base: './',
  plugins: [react()],
  server: { port: 5173, open: true },
});
