# Mastery Sheet — interview-prep app

A local-first, single-user interview-prep web app generated from a personal corpus.
Browse a track → topic → item tree (DSA, System Design, LLD, CS Fundamentals, Security,
Behavioral, Tech Deep-Dives, Frontend, AI/LLM, SQL, Coding Practice, and a beginner
on-ramp), track status (Read → Solved → **Cold**), toggle "Can I explain this out loud?"
on concepts, fill your real numbers into STAR stories, search everything, follow a Daily
Plan, and review due items with a spaced-repetition scheduler. Progress persists in the
browser (`localStorage`).

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
```

## Content is data, not code

The source markdown lives in `/content`. A re-runnable parser converts it to typed JSON:

```bash
npm run parse    # /content/*.md  ->  src/data/content.json
```

- **Original corpus** is in the root/`content/` markdown.
- **AI-added material** (solutions, extra problems, follow-up probes, new tracks) lives in
  `content/generated/*.md` and is merged by the parser — it's tagged `source: generated`
  and shows an **"AI-added — verify"** badge in the UI.
- Editing markdown and re-running `npm run parse` updates the app **without wiping your
  progress** (progress is keyed by stable id in a separate `localStorage` store).

## Build

```bash
npm run build    # type-check + Vite production build -> dist/
npm run preview  # serve the production build locally
```

## Deploy (GitHub Pages)

This is a static SPA — no backend. A GitHub Actions workflow
(`.github/workflows/deploy.yml`) builds and deploys to Pages on every push to
`main`/`master`. One-time setup: in the repo, **Settings → Pages → Source → GitHub
Actions**. The site publishes at `https://<user>.github.io/<repo>/`.

> Note: progress is stored per-browser in `localStorage`, so it doesn't sync across
> devices. (A progress export/import is a planned addition.)

## Tech

Vite · React · TypeScript · Tailwind · zustand (persisted) · react-markdown +
react-syntax-highlighter. No backend, no auth, no external services.
