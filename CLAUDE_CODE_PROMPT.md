# Claude Code Prompt — Build my interactive interview-prep app

> Paste everything below the line into Claude Code, with all 6 markdown files
> (`master-curriculum.md`, `dsa-detailed.md`, `part2-system-design.md`,
> `part3-cs-fundamentals.md`, `part4-lld-ood.md`, `part5-behavioral.md`) in the same folder.

---

You are building me a **local, single-user, interactive interview-prep web app** — like takeuforward / Striver's sheet, but mine, generated from my own material and running entirely on my machine with progress that persists locally.

## Inputs
I'm giving you 6 markdown files that form a complete interview-prep corpus I wrote:
- `master-curriculum.md` — the overall plan, the 5 tracks, sequencing/time-allocation, and an **appendix with a data schema** for problems/topics. Read this first; it's the map.
- `dsa-detailed.md` — DSA: per-topic Core idea / Recognition signals / Mastery bar, reusable **C# templates**, and per-problem **Insight / Approach / Complexity / Watch**, tagged `⭐` (core) and `🔁` (spaced-repeat).
- `part2-system-design.md`, `part3-cs-fundamentals.md`, `part4-lld-ood.md`, `part5-behavioral.md` — the depth tracks. Fundamentals contains **PROBE** questions with answers. LLD/SysDesign contain worked designs with code.

**Start by reading all 6 files**, then propose (a) the project structure and (b) the parsed JSON schema, then build.

## What the app must do
A local web app where I can:
1. Browse the corpus as a **track → topic → item** tree (DSA topics, plus System Design / Fundamentals / LLD / Behavioral).
2. For each **DSA problem**: see Insight / Approach / Complexity / Watch + the topic's C# template; set status **Read → Solved → Cold** (Cold = re-solved from blank, the real "done"); **star** for revision; add **personal notes**.
3. For **depth-track concepts** (SysDesign/Fundamentals/LLD): read the concept + any PROBE Q&A, and toggle a **"Can I explain this out loud?"** boolean per concept — that boolean is the honest progress metric, make it prominent.
4. **Spaced repetition** for `🔁` and `Cold` items: an SM-2-lite scheduler that resurfaces items on a `nextReview` date; a "Due today" view.
5. **Filter** by track/topic/difficulty/status/starred and **full-text search** across all content.
6. **Dashboards**: overall %, per-track %, per-topic %, a daily **streak**, and counts by status. Charts are welcome but optional.
7. A **Daily Plan** view that sequences all tracks across a configurable timeline (default 6 months) using the allocation table + ordering rules in `master-curriculum.md`.
8. **Persist everything locally** — survives refresh and app restart.

## Tech + architecture
- **Vite + React + TypeScript + Tailwind.** No backend, no external services, no auth.
- Runs with `npm install && npm run dev`. Print run instructions when scaffolded.
- **Content is data, not hardcode.** Keep a `/content` folder holding the source markdown, and a re-runnable parser script (`scripts/parse-content.ts`, runnable via an npm script) that converts the markdown into typed JSON in `/src/data`. When I edit or add markdown and re-run the parser, the app updates — **without wiping my progress.**
- **Persistence** via `localStorage` (or IndexedDB if cleaner for the volume) — store **only progress/notes/scheduler state**, keyed by stable item `id`, in a separate store from content. Reparsing content must never erase progress.
- Render markdown with `react-markdown`; render code blocks with **syntax highlighting** (the C# templates and solutions must look good) and a **copy button**.

## Data schema (from the master-curriculum appendix — extend as needed)
- `problem`: `{ id, track, topic, title, difficulty, core, revisit, pattern, insight, approach, complexity, watch, template, solution?, status:'todo'|'read'|'solved'|'cold', starred, notes, lastReviewed, nextReview, source:'original'|'generated' }`
- `topic`: `{ id, track, order, title, coreIdea, recognitionSignals[], masteryBar, template?, problems[] }`
- `concept`: `{ id, track, section, title, body, probe?:{question,answer}, followups?:[{question,answer}], canExplain, notes, source }`
- `track`: `{ id, title, order, children[] }`
- Store **progress separately** keyed by `id` so content reparsing is non-destructive.

## YOUR MANDATE TO EXPAND THE MATERIAL (do this — carefully)
Beyond parsing, **add real value** to the corpus. Do these in order, committing after each so I can review diffs:
1. **DSA full solutions:** for **every** problem, add a complete, correct, idiomatic **C# solution** with inline reasoning and final complexity (the source files give insight/approach but not full code). Put it in the `solution` field.
2. **DSA coverage:** add **3–6 more problems per topic** to round the sheet toward ~250–300 problems total, in the exact Insight/Approach/Complexity/Watch format, marking core appropriately.
3. **Fundamentals depth:** for each PROBE, add **1–2 follow-up probes with answers** (interviewers drill deeper).
4. **More worked designs:** add **2–3 designs each** to System Design and LLD, matching the existing depth and format.
5. **Scheduler:** implement the SM-2-lite spaced-repetition logic described above.
6. **Daily-plan generator:** implement the timeline sequencer from the master curriculum.

**Rules for added material (strict):**
- **Technical accuracy is non-negotiable.** If you're not confident in an addition, set `source:'generated'` **and** a `needsReview:true` flag rather than guessing.
- Tag **every** generated addition `source:'generated'` and show a small **"AI-added — verify"** badge in the UI, so I can trust-check it. Original parsed content is `source:'original'`.
- **Do not fabricate or alter my personal behavioral stories in Part 5.** You may parse and structure them, but never invent specifics or numbers; render my `[bracketed]` placeholders as **editable fields** in the UI so I fill my real metrics.
- **Preserve all original content** — only add/expand; never delete, summarize away, or water down.

## UX
Clean, fast, dark-by-default developer-tool feel; keyboard-friendly; one-click status/star controls; collapsible topic sections; sticky progress header; per-problem card layout. Prioritize **structure and correctness over visual polish** — I'll restyle later.

## Process
- **Scaffold first**, then get **one DSA topic** working end-to-end (parse → render → status/notes → persist) so we validate the pipeline, **then** parse the rest, **then** do the expansions.
- Use **git**: `git init`, commit the scaffold, and commit after each expansion step so I can review changes as diffs.
- Work incrementally and tell me what you completed at each milestone. If an expansion step is large (e.g. all C# solutions), do it topic-by-topic and tell me to say "continue" for the next.

Begin by reading the 6 files and proposing the structure and schema.
