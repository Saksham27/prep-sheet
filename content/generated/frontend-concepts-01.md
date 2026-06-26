# Frontend & Web

> AI-added — verify. The full-stack frontend half: how the browser renders, React
> internals, web performance, and CSS/layout. (Core JavaScript — event loop, closures,
> `this`, promises, TS — lives in Tech Deep-Dives → JavaScript.) Terse + a probe each.

@track id=frontend | title=Frontend & Web | kind=fundamentals | order=5.5 | blurb=The full-stack frontend round — browser rendering pipeline, React internals (virtual DOM, hooks, reconciliation), web performance (bundling, caching, Core Web Vitals), and CSS/layout.

@topic id=frontend-browser | track=frontend | title=Browser & rendering

### concept: The critical rendering path (HTML → pixels)
The browser turns bytes into pixels in stages: parse HTML into the **DOM** tree, parse CSS into the **CSSOM**, combine them into the **render tree** (visible nodes + styles), compute geometry in **layout/reflow** (where/how big each box is), **paint** pixels into layers, and **composite** the layers to the screen. **CSS is render-blocking** (the render tree needs the CSSOM) and a plain `<script>` blocks parsing. Optimizing this path — minimize/inline critical CSS, defer non-critical JS, reduce DOM size — is what makes a page render fast.

#### probe: What happens between receiving HTML and seeing pixels?
The browser parses HTML → **DOM** and CSS → **CSSOM**, merges them into a **render tree** of visible styled nodes, runs **layout** to compute each box's position/size, **paints** them into layers, and **composites** to screen. CSS blocks rendering (you can't build the render tree without the CSSOM) and synchronous scripts block parsing, so the levers are: ship less/critical CSS first, load JS non-blocking (`defer`/`async`), and keep the DOM small. Knowing CSS is render-blocking and JS can be parser-blocking is the key insight.

### concept: Reflow vs repaint
**Reflow (layout)** recomputes element geometry — positions and sizes — and is **expensive** because changing one element can cascade to its descendants and siblings. **Repaint** redraws pixels without changing layout (e.g. a color change) — cheaper. Operations that read layout (`offsetHeight`, `getBoundingClientRect`) force a **synchronous reflow** ("layout thrashing") if interleaved with writes in a loop. Minimize reflows: batch DOM reads then writes, animate with `transform`/`opacity` (compositor-only, skip layout), change classes instead of inline styles in loops, and avoid touching layout properties repeatedly.

#### probe: Reflow vs repaint — and how do you minimize reflows?
A **reflow** recalculates layout geometry (sizes/positions) and can cascade through the tree — costly; a **repaint** just redraws pixels for a visual change like color — cheaper; some changes (`transform`, `opacity`) skip both and run on the **compositor**. Minimize reflows by batching reads then writes (avoid read-write-read "layout thrashing"), animating with `transform`/`opacity` instead of `top`/`width`/`left`, toggling classes rather than many inline-style writes, and reading layout values sparingly. The headline: prefer compositor-only properties for animation, and don't interleave layout reads with writes.

### concept: Loading scripts — async vs defer
A plain `<script>` **blocks HTML parsing** while it downloads and executes — bad for load time. **`defer`** downloads in parallel and runs **after** the HTML is parsed, in **order** — the right default for app scripts that touch the DOM. **`async`** downloads in parallel and runs **as soon as it's ready**, **out of order**, possibly mid-parse — good for independent third-party scripts (analytics) that don't depend on the DOM or each other. Modules (`<script type="module">`) are deferred by default. Placement and these attributes are the simplest render-performance win.

#### probe: `async` vs `defer` on a script tag?
Both download the script in parallel without blocking the parser; they differ in *when they execute*. **`defer`** waits until parsing is done and preserves **document order** — use it for your app code that depends on the DOM or other scripts. **`async`** executes the moment it finishes downloading, possibly interrupting parsing and in **no guaranteed order** — use it for independent third-party scripts (analytics) with no DOM/ordering dependencies. A bare `<script>` blocks parsing entirely, so prefer `defer` for app bundles.

@topic id=frontend-react | track=frontend | title=React internals

### concept: Virtual DOM and reconciliation
React keeps a lightweight in-memory tree (the **virtual DOM**). On a state/prop change it **re-renders** components to a new virtual tree, **diffs** it against the previous one (**reconciliation**), and applies the **minimal set of real DOM updates** — because direct DOM mutation is slow and manual diffing is error-prone. The diff is heuristic and O(n): it assumes different element types produce different trees and uses **keys** to match list items across renders. "Re-render" means React ran your component function and diffed — it does **not** necessarily mean the real DOM changed.

#### probe: What is the virtual DOM and reconciliation?
The virtual DOM is React's in-memory representation of the UI. When state changes, React re-renders to a new virtual tree and **reconciles** — diffs new vs old — then commits only the minimal real DOM mutations needed, avoiding expensive full-DOM rewrites and hand-written diffing. The diffing is a fast heuristic (same-type elements reconcile in place; different types remount; lists use keys). The nuance worth stating: a re-render is React recomputing and diffing — cheap if nothing changed — not automatically a DOM write.

### concept: Why keys matter in lists
When rendering a list, React uses each item's **`key`** to match elements between the previous and next render, so it can move/keep/remove the right DOM nodes and component state instead of rebuilding them. A **stable, unique** key (an id) is correct. Using the **array index** as a key breaks on reorder/insert/delete — React mismatches items, causing wrong state, lost input focus, and subtle bugs. Keys must be unique among siblings, not globally. This is the single most common React list bug.

#### probe: Why does React need keys, and why is the array index a bad key?
Keys let reconciliation identify which list items are the same across renders, so React preserves the correct DOM nodes and component state and only moves/updates what changed. With a **stable unique id**, reorders and insertions are handled correctly. The **array index** breaks this: when the list reorders or you insert/remove, indices shift, so React pairs new data with old elements — producing wrong content, stale state, and lost focus in inputs. Use a real identifier; reserve index keys for static, never-reordered lists.

### concept: Hooks — rules, useState, useEffect
**Rules of hooks:** call them only at the **top level** (never in conditions/loops) and only from React functions — React tracks hook state by **call order**, so conditional calls corrupt it. **`useState`** holds state across renders and triggers a re-render on update. **`useEffect`** runs side effects *after* render; its **dependency array** controls when it re-runs (`[]` = once on mount; `[x]` = when `x` changes; omitted = every render). Return a **cleanup** function for subscriptions/timers. The classic bug is a missing/wrong dependency causing a **stale closure** (the effect captures an old value).

#### probe: What are the rules of hooks, and what does useEffect's dependency array do?
Hooks must be called unconditionally at the top level of a React function, in the same order every render — React associates state with call order, so branching or looping over hook calls breaks it. `useEffect` runs a side effect after the commit, and its **dependency array** declares what it depends on: `[]` runs once on mount (cleanup on unmount), `[a, b]` re-runs whenever those change, and omitting it runs after every render. Get the deps wrong and you get either missed updates or a **stale closure** capturing old state — which is why the lint rule for exhaustive deps exists.

### concept: useMemo, useCallback, and when NOT to optimize
**`useMemo`** caches a computed **value** and **`useCallback`** caches a **function reference** across renders, recomputing only when their dependencies change. Their real purpose is **referential stability** — keeping props stable so a `React.memo` child doesn't needlessly re-render, or avoiding a genuinely expensive recompute each render. But they aren't free (memory + dependency checks), and **premature memoization adds complexity for no gain**. Reach for them when you've measured a real re-render/compute cost; don't wrap everything by reflex.

#### probe: When would you use useMemo/useCallback — and when not?
Use **useMemo** to avoid re-running an expensive calculation every render, and **useCallback** to keep a function's identity stable so memoized children (or effect dependencies) don't churn. The trigger is a *measured* problem: an expensive computation, or a `React.memo` child re-rendering because a prop reference changes each render. Don't memoize trivial values or every callback by default — the bookkeeping and dependency arrays cost readability and a little memory for no benefit. Optimize on evidence (profiler), not reflex.

@topic id=frontend-performance | track=frontend | title=Web performance

### concept: Reducing initial load — bundling, splitting, lazy loading
Big JS bundles delay interactivity. **Code splitting** breaks the bundle so users download only what a route/feature needs; **lazy loading** (`React.lazy` + dynamic `import()`) defers off-screen/below-the-fold code and components until needed. **Tree shaking** drops unused exports at build time; minification shrinks the rest. Also: **lazy-load images** (`loading="lazy"`), compress and serve modern image formats (WebP/AVIF) at the right size, and preload truly critical resources. The goal is a small **critical** payload to first paint/interactive, with everything else deferred.

#### probe: How do you reduce initial page load time?
Ship less critical JS: **code-split** by route/feature so the first load only pulls what's needed, **lazy-load** off-screen components and routes via dynamic `import()`, and let the bundler **tree-shake** unused code and minify. Optimize images (modern formats, correct dimensions, `loading="lazy"`), inline/critical-path the essential CSS and `defer` non-critical JS, and use a CDN + caching for static assets. Preload only what's truly critical. The principle: minimize the bytes and work required to reach first meaningful paint and interactivity, defer the rest.

### concept: Caching layers and CDNs
Multiple layers cut repeat-load cost. The **browser HTTP cache** (via `Cache-Control`/`ETag`) avoids re-downloading unchanged assets — fingerprint filenames (`app.3f9c.js`) so you can cache aggressively *and* bust on change. A **CDN** serves static assets (and cacheable responses) from edges near the user, cutting latency and origin load. **Service workers** enable offline/precaching and fine-grained cache strategies (PWAs). Server-side, add response caching and compression (gzip/brotli). Each layer absorbs load before the next — the same "cache close to the user" idea as backend caching.

#### probe: How does browser caching work, and how do you bust the cache on a deploy?
The server sends `Cache-Control` (max-age, immutable) and validators like `ETag`/`Last-Modified`; the browser reuses cached assets until they expire, then revalidates cheaply with a conditional request (304 if unchanged). To cache aggressively yet ship updates, **fingerprint** asset filenames with a content hash (`main.ab12.js`) — a new build produces a new filename, so the browser fetches the new file while old long-lived caches are simply never requested again. Pair with a CDN at the edge and brotli/gzip compression.

### concept: Core Web Vitals
Google's user-centric performance metrics, also an SEO factor. **LCP (Largest Contentful Paint)** — loading: time for the largest visible element to render (target < 2.5s); improve via faster assets, CDN, critical CSS, image optimization. **CLS (Cumulative Layout Shift)** — visual stability: how much content jumps unexpectedly (target < 0.1); fix by reserving space for images/ads (set dimensions). **INP (Interaction to Next Paint)** — responsiveness: how quickly the UI responds to input (replaced FID); improve by reducing main-thread JS work, breaking up long tasks. They quantify *perceived* speed, not just raw load.

#### probe: What are the Core Web Vitals and what do they measure?
Three user-centric metrics: **LCP** measures loading (when the largest content element paints, target <2.5s), **CLS** measures visual stability (unexpected layout shift, target <0.1), and **INP** measures responsiveness (how fast the page reacts to interactions, the successor to FID). You improve LCP with faster/optimized critical assets and a CDN, CLS by reserving space (explicit image/embed dimensions) so nothing jumps, and INP by cutting main-thread JS and chunking long tasks. They capture *perceived* performance, which is why they matter for UX and SEO.

@topic id=frontend-css | track=frontend | title=CSS & layout

### concept: The box model and box-sizing
Every element is a box: **content**, **padding**, **border**, **margin** (outermost). By default (`box-sizing: content-box`), `width`/`height` size only the **content**, so padding and border *add* to the rendered size — a frequent source of "why is my 100% box overflowing." Setting **`box-sizing: border-box`** makes `width`/`height` include padding and border, so the box is exactly the size you set — which is why most resets apply `border-box` globally. Margins are outside the box and **collapse** vertically between adjacent block elements.

#### probe: What does `box-sizing: border-box` change?
By default (`content-box`), an element's `width`/`height` apply to the **content only**, and padding + border are added on top — so a `width: 200px` element with padding renders wider than 200px, which causes overflow surprises. **`border-box`** makes `width`/`height` include padding and border, so the element's rendered size equals the value you set and layouts become predictable. That predictability is why a global `* { box-sizing: border-box }` reset is near-universal. (Margins sit outside the box either way and collapse vertically.)

### concept: Flexbox vs Grid
Both are modern layout systems. **Flexbox** is **one-dimensional** — it distributes items along a single axis (row or column) and is ideal for components: nav bars, toolbars, centering, evenly spacing a set of items, content-driven sizing. **Grid** is **two-dimensional** — rows *and* columns together — ideal for page/section layouts and anything needing alignment in both directions (dashboards, card galleries, the overall page skeleton). They compose: a Grid page with Flexbox inside each cell. Rule of thumb: **Flexbox for content flow in one direction, Grid for true 2D structure.**

#### probe: Flexbox vs Grid — when do you use each?
**Flexbox** is one-dimensional: lay out items along a single axis with flexible sizing/spacing — perfect for components like nav bars, button groups, centering, and distributing items in a row or column. **Grid** is two-dimensional: define rows *and* columns at once — perfect for page layouts, dashboards, and card grids where you need alignment in both axes. They're complementary, not competitors: often a Grid defines the macro layout and Flexbox arranges content within each area. Pick by dimensionality: one axis → Flexbox, two axes → Grid.

### concept: Specificity and the cascade
When multiple rules target an element, CSS resolves conflicts by the **cascade**: **specificity** first, then **source order** (last wins on a tie). Specificity is roughly a tuple — **inline styles** > **IDs** > **classes/attributes/pseudo-classes** > **elements** — so `#nav .link` beats `.link`. **`!important`** overrides normal specificity (a last resort that starts override wars). Understanding this prevents the "my style isn't applying" thrash: usually a more specific selector is winning. Keep specificity **low and flat** (prefer classes, avoid ID selectors and deep nesting) so styles stay predictable and overridable.

#### probe: How does CSS decide which rule wins?
By the **cascade**: it compares **specificity** — inline > ID > class/attribute/pseudo-class > element — and the more specific selector wins; on equal specificity, the **later** rule in source order wins. `!important` trumps normal specificity (and should be avoided). So "my CSS isn't applying" almost always means a higher-specificity selector elsewhere is overriding you — the fix is to match/raise specificity or, better, reduce everyone's specificity (favor single classes, avoid IDs and deep nesting) so the cascade stays predictable.
